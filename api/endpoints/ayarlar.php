<?php
/**
 * /api/ayarlar       GET   Tüm ayarları döndürür (public — site temel bilgileri)
 * /api/ayarlar       PUT   Toplu ayar güncelleme (auth)
 *
 * Veri yapısı: anahtarlar nokta-yolu olabilir (örn. "iletisim.telefon")
 * Frontend bunu nested object olarak alır ve gönderir; DB'de düz key-value tutulur.
 */

declare(strict_types=1);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $rows = db()->query('SELECT anahtar, deger FROM ayarlar')->fetchAll();
    $obj = [];
    foreach ($rows as $r) {
        $deger = $r['deger'];
        // JSON görünen değerleri (liste/obje) decode et — istatistikler gibi diziler için
        if (is_string($deger) && $deger !== '' && ($deger[0] === '[' || $deger[0] === '{')) {
            $cozulmus = json_decode($deger, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $deger = $cozulmus;
            }
        }
        nokta_set($obj, $r['anahtar'], $deger);
    }
    json_cevap(['ayarlar' => $obj]);
}

if ($method === 'PUT') {
    auth_zorunlu();
    $v = istek_govdesi();
    if (!is_array($v)) json_hata('Geçersiz veri.', 422);

    $duzlestirilmis = [];
    nokta_duzlestir($v, '', $duzlestirilmis);

    $upsert = db()->prepare(
        'INSERT INTO ayarlar (anahtar, deger) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE deger = VALUES(deger)'
    );
    db()->beginTransaction();
    $sonAnahtar = null;
    try {
        foreach ($duzlestirilmis as $k => $val) {
            $sonAnahtar = $k;
            $upsert->execute([$k, is_scalar($val) || $val === null ? (string)$val : json_encode($val, JSON_UNESCAPED_UNICODE)]);
        }
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        json_hata(
            'Ayarlar kaydedilemedi (anahtar: ' . ($sonAnahtar ?? 'bilinmiyor') . '): ' . $e->getMessage(),
            500
        );
    }
    json_basari([], 'Ayarlar güncellendi.');
}

json_hata('Bu metot desteklenmiyor.', 405);

/* Yardımcılar: nokta_set() ve nokta_duzlestir() artık api/helpers.php'de tanımlı. */
