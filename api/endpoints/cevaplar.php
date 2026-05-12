<?php
/**
 * /api/cevaplar?form=ID     GET    Bir formun cevapları (auth)
 * /api/cevaplar/:id         GET    Tek cevap (auth)
 * /api/cevaplar/:id         DELETE Sil (auth)
 * /api/cevaplar?form=ID     DELETE Form'un tüm cevaplarını sil (auth)
 */

// NOT: Bu endpoint tüm aktif admin/editor için cevapları listeler/siler. İleride form sahibi-bazlı ownership istenirse form_cevaplari'na sahip_id eklenmeli.

declare(strict_types=1);

auth_zorunlu();

$parcalar = $GLOBALS['_yol_parcalari'];
$id     = $parcalar[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function c_normalize(array $c): array {
    return [
        'id'       => $c['id'],
        'formId'   => $c['form_id'],
        'veriler'  => $c['veriler'] ? (json_decode($c['veriler'], true) ?: []) : [],
        'tarih'    => $c['tarih'],
        'okundu'   => (bool)$c['okundu'],
        'ipAdres'  => $c['ip_adres'] ?? '',
    ];
}

if ($id !== '') {
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM form_cevaplari WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $c = $stmt->fetch();
        if (!$c) json_hata('Cevap bulunamadı.', 404);
        json_cevap(['cevap' => c_normalize($c)]);
    }
    if ($method === 'DELETE') {
        $stmt = db()->prepare('DELETE FROM form_cevaplari WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) json_hata('Cevap bulunamadı.', 404);
        json_basari([], 'Cevap silindi.');
    }
    json_hata('Method not allowed.', 405);
}

$formId = (string)($_GET['form'] ?? '');

if ($method === 'GET') {
    if ($formId === '') json_hata('?form=ID parametresi gerekli.', 422);
    $stmt = db()->prepare('SELECT * FROM form_cevaplari WHERE form_id = ? ORDER BY tarih DESC');
    $stmt->execute([$formId]);
    $rows = $stmt->fetchAll();
    json_cevap(['cevaplar' => array_map('c_normalize', $rows)]);
}

if ($method === 'DELETE') {
    if ($formId === '') json_hata('?form=ID parametresi gerekli.', 422);
    $stmt = db()->prepare('DELETE FROM form_cevaplari WHERE form_id = ?');
    $stmt->execute([$formId]);
    json_basari(['silinen' => $stmt->rowCount()], 'Tüm cevaplar silindi.');
}

json_hata('Method not allowed.', 405);
