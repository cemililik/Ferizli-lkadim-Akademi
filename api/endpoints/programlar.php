<?php
declare(strict_types=1);

$parcalar = $GLOBALS['_yol_parcalari'];
$alt = $parcalar[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function p_normalize(array $p): array {
    return [
        'id' => $p['id'],
        'ad' => $p['ad'],
        'hedefKitle' => $p['hedef_kitle'] ?? '',
        'kisaAciklama' => $p['kisa_aciklama'] ?? '',
        'ozellikler' => $p['ozellikler'] ? (json_decode($p['ozellikler'], true) ?: []) : [],
        'ikon' => $p['ikon'] ?? '📘',
        'sira' => (int)($p['sira'] ?? 0),
        'yayinda' => (bool)$p['yayinda'],
    ];
}

if ($alt !== '') {
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM programlar WHERE id = ? LIMIT 1');
        $stmt->execute([$alt]);
        $p = $stmt->fetch();
        if (!$p) json_hata('Program bulunamadı.', 404);
        json_cevap(['program' => p_normalize($p)]);
    }
    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        $stmt = db()->prepare('SELECT * FROM programlar WHERE id = ? LIMIT 1');
        $stmt->execute([$alt]);
        $m = $stmt->fetch();
        if (!$m) json_hata('Program bulunamadı.', 404);

        $ozellikler = $v['ozellikler'] ?? null;
        if (is_array($ozellikler)) $ozellikler = json_encode(array_values(array_filter($ozellikler, 'is_string')), JSON_UNESCAPED_UNICODE);
        else $ozellikler = $m['ozellikler'];

        db()->prepare(
            'UPDATE programlar SET ad=?, hedef_kitle=?, kisa_aciklama=?, ozellikler=?, ikon=?, sira=?, yayinda=? WHERE id=?'
        )->execute([
            (string)($v['ad'] ?? $m['ad']),
            (string)($v['hedefKitle'] ?? $m['hedef_kitle'] ?? ''),
            (string)($v['kisaAciklama'] ?? $m['kisa_aciklama'] ?? ''),
            $ozellikler,
            (string)($v['ikon'] ?? $m['ikon'] ?? '📘'),
            isset($v['sira']) ? (int)$v['sira'] : (int)$m['sira'],
            isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : (int)$m['yayinda'],
            $alt,
        ]);
        json_basari(['id' => $alt], 'Program güncellendi.');
    }
    if ($method === 'DELETE') {
        auth_zorunlu();
        $stmt = db()->prepare('DELETE FROM programlar WHERE id = ?');
        $stmt->execute([$alt]);
        if ($stmt->rowCount() === 0) json_hata('Program bulunamadı.', 404);
        json_basari([], 'Program silindi.');
    }
    json_hata('Bu metot desteklenmiyor.', 405);
}

if ($method === 'GET') {
    $adminGoruntu = !empty($_GET['admin']);
    if ($adminGoruntu) auth_zorunlu();
    $sql = 'SELECT * FROM programlar';
    if (!$adminGoruntu) $sql .= ' WHERE yayinda = 1';
    $sql .= ' ORDER BY sira ASC, ad ASC';
    $rows = db()->query($sql)->fetchAll();
    json_cevap(['programlar' => array_map('p_normalize', $rows)]);
}

if ($method === 'POST') {
    auth_zorunlu();
    $v = istek_govdesi();
    gerekli_alanlar($v, ['ad']);

    $id = !empty($v['id']) ? slugify((string)$v['id']) : slugify((string)$v['ad']);
    $ozellikler = isset($v['ozellikler']) && is_array($v['ozellikler'])
        ? json_encode(array_values(array_filter($v['ozellikler'], 'is_string')), JSON_UNESCAPED_UNICODE)
        : '[]';

    db()->prepare(
        'INSERT INTO programlar (id, ad, hedef_kitle, kisa_aciklama, ozellikler, ikon, sira, yayinda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $id,
        (string)$v['ad'],
        (string)($v['hedefKitle'] ?? ''),
        (string)($v['kisaAciklama'] ?? ''),
        $ozellikler,
        (string)($v['ikon'] ?? '📘'),
        (int)($v['sira'] ?? 0),
        isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : 1,
    ]);
    json_basari(['id' => $id], 'Program eklendi.');
}

json_hata('Bu metot desteklenmiyor.', 405);
