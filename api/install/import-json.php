<?php
/**
 * MEVCUT JSON VERİLERİNİ DB'YE AKTAR
 *
 * Kullanım (komut satırından):
 *   cd /yol/proje && php api/install/import-json.php
 *
 * Veya tarayıcıdan (sadece geliştirme modunda, gelistirme=true ise):
 *   http://localhost/api/install/import-json.php
 *
 * Mevcut veriler ÜZERİNE YAZILMAZ — INSERT IGNORE ile sadece eksikleri ekler.
 * Tekrar çalıştırılması güvenlidir (idempotent).
 */

declare(strict_types=1);

require __DIR__ . '/../helpers.php';
require __DIR__ . '/../db.php';

$cfg = get_config();
$cliMi = (php_sapi_name() === 'cli');

if (!$cliMi && empty($cfg['site']['gelistirme'])) {
    http_response_code(403);
    exit('Bu script production modunda tarayıcı üzerinden çalıştırılamaz. SSH ile: php api/install/import-json.php');
}

$kok = realpath(__DIR__ . '/../..');
$dataDir = $kok . '/data';

$log = [];
$ekle = function ($mesaj) use (&$log, $cliMi) {
    $log[] = $mesaj;
    if ($cliMi) echo $mesaj . PHP_EOL;
};

$json_oku = function ($yol) {
    if (!file_exists($yol)) return null;
    $i = file_get_contents($yol);
    return json_decode($i, true);
};

/* ---------- Ayarlar ---------- */
$ayarlar = $json_oku("$dataDir/ayarlar.json");
if (is_array($ayarlar)) {
    $upsert = db()->prepare(
        "INSERT INTO ayarlar (anahtar, deger) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE deger = VALUES(deger)"
    );
    $duzlestir = function ($veri, $prefix = '') use (&$duzlestir, &$cikti) {
        if (is_array($veri) && !empty($veri) && array_keys($veri) !== range(0, count($veri) - 1)) {
            foreach ($veri as $k => $v) $duzlestir($v, $prefix === '' ? $k : "$prefix.$k");
        } else {
            $cikti[$prefix] = $veri;
        }
    };
    $cikti = [];
    $duzlestir($ayarlar);
    $sayac = 0;
    foreach ($cikti as $k => $v) {
        $upsert->execute([$k, is_scalar($v) || $v === null ? (string)$v : json_encode($v, JSON_UNESCAPED_UNICODE)]);
        $sayac++;
    }
    $ekle("✓ Ayarlar: $sayac kayıt");
}

/* ---------- Duyurular ---------- */
$duy = $json_oku("$dataDir/duyurular.json");
if (is_array($duy) && !empty($duy['duyurular'])) {
    $ins = db()->prepare(
        'INSERT IGNORE INTO duyurular
            (id, baslik, ozet, icerik, kategori, tarih, kapak_gorseli, onemli, bagli_form_id, yayinda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $sayac = 0;
    foreach ($duy['duyurular'] as $d) {
        $ins->execute([
            (string)$d['id'],
            (string)($d['baslik'] ?? ''),
            (string)($d['ozet'] ?? ''),
            (string)($d['icerik'] ?? ''),
            (string)($d['kategori'] ?? 'genel'),
            (string)($d['tarih'] ?? date('Y-m-d')),
            (string)($d['kapakGorseli'] ?? ''),
            !empty($d['onemli']) ? 1 : 0,
            !empty($d['bagliForm']) ? (string)$d['bagliForm'] : null,
            isset($d['yayinda']) ? (int)(bool)$d['yayinda'] : 1,
        ]);
        if ($ins->rowCount()) $sayac++;
    }
    $ekle("✓ Duyurular: $sayac yeni kayıt");
}

/* ---------- Programlar ---------- */
$prog = $json_oku("$dataDir/programlar.json");
if (is_array($prog) && !empty($prog['programlar'])) {
    $ins = db()->prepare(
        'INSERT IGNORE INTO programlar (id, ad, hedef_kitle, kisa_aciklama, ozellikler, ikon, sira, yayinda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $sayac = 0;
    foreach ($prog['programlar'] as $i => $p) {
        $ins->execute([
            (string)$p['id'],
            (string)($p['ad'] ?? ''),
            (string)($p['hedefKitle'] ?? ''),
            (string)($p['kisaAciklama'] ?? ''),
            json_encode($p['ozellikler'] ?? [], JSON_UNESCAPED_UNICODE),
            (string)($p['ikon'] ?? '📘'),
            (int)($p['sira'] ?? $i),
            1,
        ]);
        if ($ins->rowCount()) $sayac++;
    }
    $ekle("✓ Programlar: $sayac yeni kayıt");
}

/* ---------- Kadro ---------- */
$kad = $json_oku("$dataDir/kadro.json");
if (is_array($kad) && !empty($kad['kadro'])) {
    $ins = db()->prepare(
        'INSERT IGNORE INTO kadro (id, ad, brans, unvan, mezuniyet, deneyim_yil, motto, foto, sira, yayinda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $sayac = 0;
    foreach ($kad['kadro'] as $i => $k) {
        $ins->execute([
            (string)$k['id'],
            (string)($k['ad'] ?? ''),
            (string)($k['brans'] ?? ''),
            (string)($k['unvan'] ?? 'Branş Öğretmeni'),
            (string)($k['mezuniyet'] ?? ''),
            $k['deneyimYil'] !== null ? (int)($k['deneyimYil'] ?? 0) : null,
            (string)($k['motto'] ?? ''),
            (string)($k['foto'] ?? ''),
            (int)($k['sira'] ?? $i),
            1,
        ]);
        if ($ins->rowCount()) $sayac++;
    }
    $ekle("✓ Kadro: $sayac yeni kayıt");
}

/* ---------- Galeri ---------- */
$gal = $json_oku("$dataDir/galeri.json");
if (is_array($gal)) {
    if (!empty($gal['albumler'])) {
        $ins = db()->prepare('INSERT IGNORE INTO galeri_albumler (id, ad, sira) VALUES (?, ?, ?)');
        $sayac = 0;
        foreach ($gal['albumler'] as $i => $a) {
            $ins->execute([(string)$a['id'], (string)$a['ad'], (int)($a['sira'] ?? $i)]);
            if ($ins->rowCount()) $sayac++;
        }
        $ekle("✓ Galeri albümleri: $sayac yeni kayıt");
    }
    if (!empty($gal['gorseller'])) {
        $ins = db()->prepare(
            'INSERT IGNORE INTO galeri_gorseller (id, album_id, baslik, src, tarih, sira)
             VALUES (?, ?, ?, ?, ?, ?)'
        );
        $sayac = 0;
        foreach ($gal['gorseller'] as $i => $g) {
            $ins->execute([
                (string)$g['id'],
                (string)($g['album'] ?? ''),
                (string)($g['baslik'] ?? ''),
                (string)($g['src'] ?? ''),
                (string)($g['tarih'] ?? date('Y-m-d')),
                $i,
            ]);
            if ($ins->rowCount()) $sayac++;
        }
        $ekle("✓ Galeri görselleri: $sayac yeni kayıt");
    }
}

/* ---------- Formlar ---------- */
$frm = $json_oku("$dataDir/formlar.json");
if (is_array($frm) && !empty($frm['formlar'])) {
    $ins = db()->prepare(
        'INSERT IGNORE INTO formlar (id, ad, aciklama, tesekkur_mesaji, alanlar, yayinda, varsayilan)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $sayac = 0;
    foreach ($frm['formlar'] as $f) {
        $ins->execute([
            (string)$f['id'],
            (string)($f['ad'] ?? ''),
            (string)($f['aciklama'] ?? ''),
            (string)($f['tesekkurMesaji'] ?? ''),
            json_encode($f['alanlar'] ?? [], JSON_UNESCAPED_UNICODE),
            !empty($f['yayinda']) ? 1 : 0,
            !empty($f['varsayilan']) ? 1 : 0,
        ]);
        if ($ins->rowCount()) $sayac++;
    }
    $ekle("✓ Formlar: $sayac yeni kayıt");
}

$ekle('');
$ekle('İçe aktarma tamamlandı.');

if (!$cliMi) {
    header('Content-Type: text/plain; charset=utf-8');
    echo implode("\n", $log);
}
