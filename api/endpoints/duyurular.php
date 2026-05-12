<?php
/**
 * /api/duyurular            GET    Yayında duyuruları (public), ?admin=1 (auth) tümü
 * /api/duyurular/:id        GET    Tek duyuru
 * /api/duyurular            POST   Yeni (auth)
 * /api/duyurular/:id        PUT    Güncelle (auth)
 * /api/duyurular/:id        DELETE Sil (auth)
 */

declare(strict_types=1);

$parcalar = $GLOBALS['_yol_parcalari'];
$alt = $parcalar[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($alt !== '') {
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM duyurular WHERE id = ? LIMIT 1');
        $stmt->execute([$alt]);
        $d = $stmt->fetch();
        if (!$d) json_hata('Duyuru bulunamadı.', 404);
        json_cevap(['duyuru' => duyuru_normalize($d)]);
    }
    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        $stmt = db()->prepare('SELECT * FROM duyurular WHERE id = ? LIMIT 1');
        $stmt->execute([$alt]);
        $mev = $stmt->fetch();
        if (!$mev) json_hata('Duyuru bulunamadı.', 404);

        db()->prepare(
            'UPDATE duyurular SET
                baslik=?, ozet=?, icerik=?, kategori=?, tarih=?,
                kapak_gorseli=?, onemli=?, bagli_form_id=?, yayinda=?
              WHERE id=?'
        )->execute([
            (string)($v['baslik'] ?? $mev['baslik']),
            (string)($v['ozet'] ?? $mev['ozet'] ?? ''),
            (string)($v['icerik'] ?? $mev['icerik'] ?? ''),
            (string)($v['kategori'] ?? $mev['kategori'] ?? 'genel'),
            (string)($v['tarih'] ?? $mev['tarih']),
            (string)($v['kapakGorseli'] ?? $v['kapak_gorseli'] ?? $mev['kapak_gorseli'] ?? ''),
            !empty($v['onemli']) ? 1 : 0,
            isset($v['bagliForm']) ? (string)$v['bagliForm'] : ($v['bagli_form_id'] ?? $mev['bagli_form_id']),
            isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : (int)$mev['yayinda'],
            $alt,
        ]);
        json_basari(['id' => $alt], 'Duyuru güncellendi.');
    }
    if ($method === 'DELETE') {
        auth_zorunlu();
        $stmt = db()->prepare('DELETE FROM duyurular WHERE id = ?');
        $stmt->execute([$alt]);
        if ($stmt->rowCount() === 0) json_hata('Duyuru bulunamadı.', 404);
        json_basari([], 'Duyuru silindi.');
    }
    json_hata('Bu metot desteklenmiyor.', 405);
}

if ($method === 'GET') {
    $adminGoruntu = !empty($_GET['admin']);
    if ($adminGoruntu) auth_zorunlu();

    $sql = 'SELECT * FROM duyurular';
    if (!$adminGoruntu) $sql .= ' WHERE yayinda = 1';
    $sql .= ' ORDER BY onemli DESC, tarih DESC';

    $rows = db()->query($sql)->fetchAll();
    $kategoriler = [
        'genel' => 'Genel', 'kayit' => 'Kayıt', 'sinav' => 'Sınav', 'etkinlik' => 'Etkinlik'
    ];
    json_cevap([
        'duyurular' => array_map('duyuru_normalize', $rows),
        'kategoriler' => $kategoriler,
    ]);
}

if ($method === 'POST') {
    auth_zorunlu();
    $v = istek_govdesi();
    gerekli_alanlar($v, ['baslik', 'tarih']);

    $id = !empty($v['id']) ? (string)$v['id'] : benzersiz_id('duy');

    db()->prepare(
        'INSERT INTO duyurular
            (id, baslik, ozet, icerik, kategori, tarih, kapak_gorseli, onemli, bagli_form_id, yayinda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $id,
        (string)$v['baslik'],
        (string)($v['ozet'] ?? ''),
        (string)($v['icerik'] ?? ''),
        (string)($v['kategori'] ?? 'genel'),
        (string)$v['tarih'],
        (string)($v['kapakGorseli'] ?? $v['kapak_gorseli'] ?? ''),
        !empty($v['onemli']) ? 1 : 0,
        (string)($v['bagliForm'] ?? ''),
        isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : 1,
    ]);

    json_basari(['id' => $id], 'Duyuru oluşturuldu.');
}

json_hata('Bu metot desteklenmiyor.', 405);

function duyuru_normalize(array $d): array {
    return [
        'id' => $d['id'],
        'baslik' => $d['baslik'],
        'ozet' => $d['ozet'],
        'icerik' => $d['icerik'],
        'kategori' => $d['kategori'],
        'tarih' => $d['tarih'],
        'kapakGorseli' => $d['kapak_gorseli'] ?? '',
        'onemli' => (bool)$d['onemli'],
        'bagliForm' => $d['bagli_form_id'] ?? '',
        'yayinda' => (bool)$d['yayinda'],
    ];
}
