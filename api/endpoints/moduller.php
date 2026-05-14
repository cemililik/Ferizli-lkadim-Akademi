<?php
/**
 * /api/moduller/durum?ad=<modul>    GET   Tek modülün durumu (public)
 * /api/moduller/durum               PUT   Modül aç/kapa (auth)
 *
 * Modüller `ayarlar` tablosunda `moduller.<ad>` anahtarıyla saklanır.
 * Hem Site Ayarları sayfası hem her modülün kendi admin sayfası bu endpoint'i
 * kullanır → tek veri kaynağı, otomatik senkron.
 *
 * Güvenlik: ad parametresi beyaz listeyle sınırlı (sql injection / random key yazımı engellenir).
 */

declare(strict_types=1);

$parcalar = $GLOBALS['_yol_parcalari'] ?? [];
$alt = $parcalar[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ============================================================
   /api/moduller/durum — tek modül durum sorgu/güncelleme
============================================================ */
if ($alt === 'durum') {
    // Yönetilen modüllerin beyaz listesi
    $izinli = ['hakkimizda', 'programlar', 'kadro', 'duyurular', 'galeri', 'blog'];

    if ($method === 'GET') {
        $ad = trim((string)($_GET['ad'] ?? ''));
        if (!in_array($ad, $izinli, true)) {
            json_hata('Bilinmeyen modül adı.', 400);
        }
        $stmt = db()->prepare('SELECT deger FROM ayarlar WHERE anahtar = ? LIMIT 1');
        $stmt->execute(['moduller.' . $ad]);
        $deger = $stmt->fetchColumn();
        // Kayıt yoksa varsayılan: blog kapalı, diğerleri açık
        if ($deger === false) {
            $varsayilan = ($ad === 'blog') ? '0' : '1';
            json_cevap(['ad' => $ad, 'aktif' => $varsayilan === '1']);
        }
        json_cevap(['ad' => $ad, 'aktif' => (string)$deger === '1']);
    }

    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        $ad = trim((string)($v['ad'] ?? ''));
        if (!in_array($ad, $izinli, true)) {
            json_hata('Bilinmeyen modül adı.', 400);
        }
        $aktif = !empty($v['aktif']) ? '1' : '0';
        db()->prepare(
            "INSERT INTO ayarlar (anahtar, deger) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE deger = VALUES(deger)"
        )->execute(['moduller.' . $ad, $aktif]);
        json_basari(
            ['ad' => $ad, 'aktif' => $aktif === '1'],
            $aktif === '1' ? 'Modül yayına alındı.' : 'Modül gizlendi.'
        );
    }

    json_hata('Bu metot desteklenmiyor.', 405);
}

/* ============================================================
   /api/moduller — tüm modül durumlarını tek seferde döndür (public)
============================================================ */
if ($alt === '') {
    if ($method !== 'GET') json_hata('Bu metot desteklenmiyor.', 405);

    $stmt = db()->query(
        "SELECT anahtar, deger FROM ayarlar WHERE anahtar LIKE 'moduller.%'"
    );
    $sonuc = [];
    foreach ($stmt as $r) {
        $ad = substr($r['anahtar'], strlen('moduller.'));
        $sonuc[$ad] = (string)$r['deger'] === '1';
    }
    // Varsayılan değerleri ekle (kayıt yoksa)
    $varsayilanlar = [
        'hakkimizda' => true, 'programlar' => true, 'kadro' => true,
        'duyurular' => true, 'galeri' => true, 'blog' => false,
    ];
    foreach ($varsayilanlar as $ad => $varsayilan) {
        if (!isset($sonuc[$ad])) $sonuc[$ad] = $varsayilan;
    }
    json_cevap(['moduller' => $sonuc]);
}

json_hata('Endpoint bulunamadı.', 404);
