<?php
/**
 * BASE64 → DOSYA MIGRATION
 *
 * DB'deki `data:image/...;base64,...` URL'leri tarar, dosya sistemine yazar,
 * URL ile değiştirir.
 *
 * Etkilenen alanlar:
 *   duyurular.kapak_gorseli
 *   kadro.foto
 *   galeri_gorseller.src
 *   blog_yazilar.kapak_gorseli
 *   blog_yazilar.icerik       (HTML içindeki <img src="data:..."> de yakalanır)
 *
 * Kullanım:
 *   php api/install/migrate-base64-images.php          # gerçek migration
 *   php api/install/migrate-base64-images.php --kuru   # sadece tarama, yazma yok
 *
 * Docker:
 *   docker compose exec web php api/install/migrate-base64-images.php
 *
 * İdempotenttir — birden çok kez çalıştırılabilir; URL olanları atlar.
 */

declare(strict_types=1);

require __DIR__ . '/../helpers.php';
require __DIR__ . '/../db.php';

$kuruMod = in_array('--kuru', $argv ?? [], true);

$cfg = get_config();
$uploadKlasor = $cfg['upload']['klasor'];
$uploadWebYolu = $cfg['upload']['web_yolu'];

echo "Base64 → dosya migration başlıyor" . ($kuruMod ? " (KURU MOD — yazma yok)" : "") . "\n";
echo "------------------------------------------------------------\n";

$toplamTaranan = 0;
$toplamCikarilan = 0;
$toplamHata = 0;

/**
 * Bir data URL'i çıkarıp dosyaya yazar. Dosya web yolunu döner.
 */
function dataUrlYazil(string $dataUrl, string $altKlasor): ?string {
    global $uploadKlasor, $uploadWebYolu, $kuruMod;

    if (!preg_match('#^data:image/([a-z+]+);base64,(.+)$#i', $dataUrl, $m)) {
        return null;
    }
    $tip = strtolower($m[1]);
    $icerik = base64_decode($m[2], true);
    if ($icerik === false) return null;

    $uzantiHaritasi = [
        'jpeg' => 'jpg', 'jpg' => 'jpg', 'png' => 'png',
        'webp' => 'webp', 'gif' => 'gif', 'svg+xml' => 'svg'
    ];
    $uzanti = $uzantiHaritasi[$tip] ?? 'bin';

    $tarihKlasor = date('Y/m');
    $hedefKlasor = "$uploadKlasor/$altKlasor/$tarihKlasor";
    if (!$kuruMod && !is_dir($hedefKlasor)) {
        if (!@mkdir($hedefKlasor, 0775, true)) {
            echo "  ! Klasör oluşturulamadı: $hedefKlasor\n";
            return null;
        }
    }

    $dosyaAd = 'mig-' . bin2hex(random_bytes(6)) . '.' . $uzanti;
    $tamYol = "$hedefKlasor/$dosyaAd";

    if (!$kuruMod) {
        if (file_put_contents($tamYol, $icerik) === false) {
            echo "  ! Dosya yazılamadı: $tamYol\n";
            return null;
        }
    }

    return "$uploadWebYolu/$altKlasor/$tarihKlasor/$dosyaAd";
}

/**
 * Tek-alanlı tablolar için: kayıttaki tek bir kolonu base64 ise dosyaya çıkar.
 */
function tekAlanIsle(string $tablo, string $kolon, string $altKlasor): void {
    global $toplamTaranan, $toplamCikarilan, $toplamHata, $kuruMod;

    $stmt = db()->query("SELECT id, $kolon FROM $tablo WHERE $kolon LIKE 'data:image/%'");
    $rows = $stmt->fetchAll();

    echo "\n[$tablo.$kolon] " . count($rows) . " base64 görsel\n";

    foreach ($rows as $r) {
        $toplamTaranan++;
        $yeniUrl = dataUrlYazil($r[$kolon], $altKlasor);
        if (!$yeniUrl) { $toplamHata++; echo "  ✗ Atlandı: {$r['id']}\n"; continue; }

        if (!$kuruMod) {
            $upd = db()->prepare("UPDATE $tablo SET $kolon = ? WHERE id = ?");
            $upd->execute([$yeniUrl, $r['id']]);
        }
        $toplamCikarilan++;
        echo "  ✓ {$r['id']} → $yeniUrl\n";
    }
}

/**
 * Blog içerik HTML'inde tüm <img src="data:..."> taglerini bul, dosyaya çıkar.
 */
function blogIcerikIsle(): void {
    global $toplamTaranan, $toplamCikarilan, $toplamHata, $kuruMod;

    // İçinde data:image olan blog yazılarını al
    $stmt = db()->query("SELECT id, icerik FROM blog_yazilar WHERE icerik LIKE '%data:image/%'");
    $rows = $stmt->fetchAll();

    echo "\n[blog_yazilar.icerik] " . count($rows) . " yazıda inline base64 görsel\n";

    foreach ($rows as $r) {
        $orijinal = $r['icerik'];
        $degisti = 0;

        // <img src="data:..."> ve <img src='data:...'>
        $yeni = preg_replace_callback(
            '#(<img[^>]*\ssrc=)(["\'])(data:image/[^"\']+)\2#i',
            function ($m) use (&$degisti) {
                global $toplamTaranan, $toplamCikarilan, $toplamHata;
                $toplamTaranan++;
                $yeniUrl = dataUrlYazil($m[3], 'blog-icerik');
                if (!$yeniUrl) { $toplamHata++; return $m[0]; }
                $degisti++;
                $toplamCikarilan++;
                return $m[1] . $m[2] . htmlspecialchars($yeniUrl, ENT_QUOTES) . $m[2];
            },
            $orijinal
        );

        if ($degisti > 0) {
            echo "  ✓ {$r['id']}: $degisti görsel çıkarıldı\n";
            if (!$kuruMod) {
                db()->prepare('UPDATE blog_yazilar SET icerik = ? WHERE id = ?')
                   ->execute([$yeni, $r['id']]);
            }
        }
    }
}

// Çalıştır
tekAlanIsle('duyurular',         'kapak_gorseli', 'duyurular');
tekAlanIsle('kadro',             'foto',          'kadro');
tekAlanIsle('galeri_gorseller',  'src',           'galeri');
tekAlanIsle('blog_yazilar',      'kapak_gorseli', 'blog');
blogIcerikIsle();

echo "\n------------------------------------------------------------\n";
echo "ÖZET:\n";
echo "  Taranan : $toplamTaranan\n";
echo "  Çıkarılan: $toplamCikarilan\n";
echo "  Hata    : $toplamHata\n";
if ($kuruMod) echo "\n(KURU MOD — gerçek değişiklik yapılmadı. --kuru'yu kaldırıp tekrar çalıştırın.)\n";
echo "\n";
