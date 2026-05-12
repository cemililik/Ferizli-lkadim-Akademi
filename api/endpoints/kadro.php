<?php
declare(strict_types=1);

$parcalar = $GLOBALS['_yol_parcalari'];
$alt = $parcalar[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function k_normalize(array $k): array {
    return [
        'id' => $k['id'],
        'ad' => $k['ad'],
        'brans' => $k['brans'] ?? '',
        'unvan' => $k['unvan'] ?? 'Branş Öğretmeni',
        'mezuniyet' => $k['mezuniyet'] ?? '',
        'deneyimYil' => $k['deneyim_yil'] !== null ? (int)$k['deneyim_yil'] : null,
        'motto' => $k['motto'] ?? '',
        'foto' => $k['foto'] ?? '',
        'sira' => (int)($k['sira'] ?? 0),
        'yayinda' => (bool)$k['yayinda'],
    ];
}

if ($alt !== '') {
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM kadro WHERE id = ? LIMIT 1');
        $stmt->execute([$alt]);
        $k = $stmt->fetch();
        if (!$k) json_hata('Bulunamadı.', 404);
        json_cevap(['ogretmen' => k_normalize($k)]);
    }
    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        $stmt = db()->prepare('SELECT * FROM kadro WHERE id = ? LIMIT 1');
        $stmt->execute([$alt]);
        $m = $stmt->fetch();
        if (!$m) json_hata('Bulunamadı.', 404);

        db()->prepare(
            'UPDATE kadro SET ad=?, brans=?, unvan=?, mezuniyet=?, deneyim_yil=?, motto=?, foto=?, sira=?, yayinda=? WHERE id=?'
        )->execute([
            (string)($v['ad'] ?? $m['ad']),
            (string)($v['brans'] ?? $m['brans'] ?? ''),
            (string)($v['unvan'] ?? $m['unvan'] ?? 'Branş Öğretmeni'),
            (string)($v['mezuniyet'] ?? $m['mezuniyet'] ?? ''),
            isset($v['deneyimYil']) ? (int)$v['deneyimYil'] : $m['deneyim_yil'],
            (string)($v['motto'] ?? $m['motto'] ?? ''),
            (string)($v['foto'] ?? $m['foto'] ?? ''),
            isset($v['sira']) ? (int)$v['sira'] : (int)$m['sira'],
            isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : (int)$m['yayinda'],
            $alt,
        ]);
        json_basari(['id' => $alt], 'Öğretmen güncellendi.');
    }
    if ($method === 'DELETE') {
        auth_zorunlu();
        $stmt = db()->prepare('DELETE FROM kadro WHERE id = ?');
        $stmt->execute([$alt]);
        if ($stmt->rowCount() === 0) json_hata('Bulunamadı.', 404);
        json_basari([], 'Öğretmen silindi.');
    }
    json_hata('Bu metot desteklenmiyor.', 405);
}

if ($method === 'GET') {
    $adminGoruntu = !empty($_GET['admin']);
    if ($adminGoruntu) auth_zorunlu();
    $sql = 'SELECT * FROM kadro';
    if (!$adminGoruntu) $sql .= ' WHERE yayinda = 1';
    $sql .= ' ORDER BY sira ASC, ad ASC';
    $rows = db()->query($sql)->fetchAll();
    json_cevap(['kadro' => array_map('k_normalize', $rows)]);
}

if ($method === 'POST') {
    auth_zorunlu();
    $v = istek_govdesi();
    gerekli_alanlar($v, ['ad']);

    $id = !empty($v['id']) ? (string)$v['id'] : benzersiz_id('ogr');

    db()->prepare(
        'INSERT INTO kadro (id, ad, brans, unvan, mezuniyet, deneyim_yil, motto, foto, sira, yayinda)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $id,
        (string)$v['ad'],
        (string)($v['brans'] ?? ''),
        (string)($v['unvan'] ?? 'Branş Öğretmeni'),
        (string)($v['mezuniyet'] ?? ''),
        isset($v['deneyimYil']) ? (int)$v['deneyimYil'] : null,
        (string)($v['motto'] ?? ''),
        (string)($v['foto'] ?? ''),
        (int)($v['sira'] ?? 0),
        isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : 1,
    ]);
    json_basari(['id' => $id], 'Öğretmen eklendi.');
}

json_hata('Bu metot desteklenmiyor.', 405);
