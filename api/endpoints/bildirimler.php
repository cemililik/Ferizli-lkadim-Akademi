<?php
/**
 * /api/bildirimler              GET     Tümü (auth)
 * /api/bildirimler/sayim        GET     {okunmamis: 3} (auth)
 * /api/bildirimler/:id/okundu   PUT     Tek okundu işaretle (auth)
 * /api/bildirimler/tumu-okundu  PUT     Tümünü okundu işaretle (auth)
 * /api/bildirimler/:id          DELETE  Sil (auth)
 * /api/bildirimler              DELETE  Tümünü sil (auth)
 */

// NOT: Bu endpoint tüm aktif admin/editor için cevapları listeler/siler. İleride form sahibi-bazlı ownership istenirse form_cevaplari'na sahip_id eklenmeli.

declare(strict_types=1);

auth_zorunlu();

$parcalar = $GLOBALS['_yol_parcalari'];
$arg1 = $parcalar[0] ?? '';
$arg2 = $parcalar[1] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($arg1 === 'sayim' && $method === 'GET') {
    $okunmamis = (int)db()->query('SELECT COUNT(*) FROM bildirimler WHERE okundu = 0')->fetchColumn();
    json_cevap(['okunmamis' => $okunmamis]);
}

if ($arg1 === 'tumu-okundu' && $method === 'PUT') {
    db()->exec('UPDATE bildirimler SET okundu = 1 WHERE okundu = 0');
    json_basari([], 'Tüm bildirimler okundu olarak işaretlendi.');
}

if ($arg1 !== '' && $arg2 === 'okundu' && $method === 'PUT') {
    db()->prepare('UPDATE bildirimler SET okundu = 1 WHERE id = ?')->execute([$arg1]);
    json_basari([], 'Okundu işaretlendi.');
}

if ($arg1 !== '' && $arg2 === '') {
    if ($method === 'DELETE') {
        $stmt = db()->prepare('DELETE FROM bildirimler WHERE id = ?');
        $stmt->execute([$arg1]);
        json_basari([], 'Bildirim silindi.');
    }
    json_hata('Method not allowed.', 405);
}

if ($arg1 === '' && $method === 'GET') {
    $rows = db()->query(
        'SELECT id, tur, baslik, mesaj, link, okundu, olusturulma AS tarih
           FROM bildirimler
       ORDER BY olusturulma DESC
          LIMIT 200'
    )->fetchAll();
    foreach ($rows as &$r) $r['okundu'] = (bool)$r['okundu'];
    json_cevap(['bildirimler' => $rows]);
}

if ($arg1 === '' && $method === 'DELETE') {
    db()->exec('DELETE FROM bildirimler');
    json_basari([], 'Tüm bildirimler silindi.');
}

json_hata('Rota bulunamadı.', 404);
