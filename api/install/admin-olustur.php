<?php
/**
 * ADMIN KULLANICI OLUŞTUR / PAROLA SIFIRLA
 *
 * Kullanım (yalnızca CLI):
 *   docker compose exec -T web php api/install/admin-olustur.php
 *   # veya doğrudan:
 *   php api/install/admin-olustur.php
 *
 * Web'den erişim 403 ile reddedilir (api/install/.htaccess + bu dosyadaki kontrol).
 *
 * Davranış:
 *   - Sorulan kullanıcı adı admin_kullanicilar tablosunda varsa → UPDATE
 *     (parola hash'i, e-posta ve ad soyad güncellenir, aktif=1)
 *   - Yoksa → INSERT (rol=admin, aktif=1)
 *
 * Parola bcrypt (PASSWORD_DEFAULT) ile hash'lenir. Düz parola hiçbir yere yazılmaz.
 */

declare(strict_types=1);

require __DIR__ . '/../helpers.php';
require __DIR__ . '/../db.php';

/* ------------------------------------------------------------
   1. CLI dışı erişimi sertçe reddet
------------------------------------------------------------ */
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Bu script yalnızca komut satırından çalıştırılır.\n";
    echo "Örn:  docker compose exec -T web php api/install/admin-olustur.php\n";
    exit;
}

/* ------------------------------------------------------------
   2. Yardımcı: terminalden satır oku (readline yoksa fallback)
------------------------------------------------------------ */
$soru = static function (string $etiket, bool $gizli = false): string {
    if ($gizli) {
        // Şifre — echo'yu kapat
        echo $etiket;
        if (stripos(PHP_OS, 'WIN') === 0) {
            // Windows: stty yok, basit fallback (görünür olur — uyar)
            $cevap = trim((string)fgets(STDIN));
        } else {
            system('stty -echo');
            $cevap = trim((string)fgets(STDIN));
            system('stty echo');
            echo PHP_EOL;
        }
        return $cevap;
    }
    if (function_exists('readline')) {
        $cevap = readline($etiket);
        return is_string($cevap) ? trim($cevap) : '';
    }
    echo $etiket;
    return trim((string)fgets(STDIN));
};

echo "============================================================\n";
echo "  Ferizli İlk Adım Akademi — Admin oluştur / parola sıfırla\n";
echo "============================================================\n\n";

/* ------------------------------------------------------------
   3. Bilgileri sor
------------------------------------------------------------ */
$kullanici_adi = $soru('Kullanıcı adı [admin]: ');
if ($kullanici_adi === '') $kullanici_adi = 'admin';

$eposta = $soru('E-posta: ');
if ($eposta === '' || !filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "HATA: Geçerli bir e-posta girin.\n");
    exit(1);
}

$ad_soyad = $soru('Ad Soyad: ');
if ($ad_soyad === '') $ad_soyad = 'Site Yöneticisi';

$sifre = $soru('Parola (en az 8 karakter): ', true);
if (strlen($sifre) < 8) {
    fwrite(STDERR, "HATA: Parola en az 8 karakter olmalı.\n");
    exit(1);
}
$sifre_tekrar = $soru('Parola (tekrar): ', true);
if ($sifre !== $sifre_tekrar) {
    fwrite(STDERR, "HATA: Parolalar uyuşmuyor.\n");
    exit(1);
}

$hash = password_hash($sifre, PASSWORD_DEFAULT);

// Düz şifreyi belleğe takılı bırakma
$sifre = null;
$sifre_tekrar = null;
unset($sifre, $sifre_tekrar);

/* ------------------------------------------------------------
   4. UPSERT
------------------------------------------------------------ */
try {
    $pdo = db();

    $sel = $pdo->prepare('SELECT id FROM admin_kullanicilar WHERE kullanici_adi = ? LIMIT 1');
    $sel->execute([$kullanici_adi]);
    $mevcut = $sel->fetchColumn();

    if ($mevcut) {
        $upd = $pdo->prepare(
            'UPDATE admin_kullanicilar
                SET sifre_hash = ?, eposta = ?, ad_soyad = ?, aktif = 1
              WHERE id = ?'
        );
        $upd->execute([$hash, $eposta, $ad_soyad, (int)$mevcut]);
        echo "\n✓ Mevcut kullanıcı GÜNCELLENDİ (id=$mevcut, kullanici_adi=$kullanici_adi).\n";
    } else {
        $ins = $pdo->prepare(
            'INSERT INTO admin_kullanicilar
                (kullanici_adi, eposta, sifre_hash, ad_soyad, rol, aktif)
             VALUES (?, ?, ?, ?, ?, 1)'
        );
        $ins->execute([$kullanici_adi, $eposta, $hash, $ad_soyad, 'admin']);
        echo "\n✓ Yeni admin kullanıcısı OLUŞTURULDU (kullanici_adi=$kullanici_adi).\n";
    }

    echo "  Artık /admin/ sayfasından giriş yapabilirsiniz.\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'HATA: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
