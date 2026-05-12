<?php
/**
 * /api/galeri                        GET  albümler + görseller (public)
 * /api/galeri/albumler               POST yeni albüm (auth)
 * /api/galeri/albumler/:id           PUT  güncelle (auth)
 * /api/galeri/albumler/:id           DELETE sil (auth)
 * /api/galeri/gorseller              POST yeni görsel (auth)
 * /api/galeri/gorseller/:id          PUT  güncelle (auth)
 * /api/galeri/gorseller/:id          DELETE sil (auth)
 */

declare(strict_types=1);

$parcalar = $GLOBALS['_yol_parcalari'];
$kategori = $parcalar[0] ?? '';   // "albumler" / "gorseller" / ""
$id       = $parcalar[1] ?? '';
$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ---------- Root: tümü ---------- */
if ($kategori === '' && $method === 'GET') {
    $albumler  = db()->query('SELECT id, ad, sira FROM galeri_albumler ORDER BY sira, ad')->fetchAll();
    $gorseller = db()->query('SELECT id, album_id AS album, baslik, src, tarih, sira FROM galeri_gorseller ORDER BY sira, tarih DESC')->fetchAll();
    json_cevap([
        'albumler'  => array_map(fn($a) => ['id'=>$a['id'],'ad'=>$a['ad'],'sira'=>(int)$a['sira']], $albumler),
        'gorseller' => array_map(fn($g) => [
            'id'=>$g['id'],'album'=>$g['album'],'baslik'=>$g['baslik']??'',
            'src'=>$g['src']??'','tarih'=>$g['tarih'],'sira'=>(int)$g['sira']
        ], $gorseller),
    ]);
}

/* ---------- Albümler ---------- */
if ($kategori === 'albumler') {
    if ($id === '') {
        if ($method === 'POST') {
            auth_zorunlu();
            $v = istek_govdesi();
            gerekli_alanlar($v, ['ad']);
            $newId = !empty($v['id']) ? slugify((string)$v['id']) : slugify((string)$v['ad']);
            db()->prepare('INSERT INTO galeri_albumler (id, ad, sira) VALUES (?, ?, ?)')
               ->execute([$newId, (string)$v['ad'], (int)($v['sira'] ?? 0)]);
            json_basari(['id'=>$newId], 'Albüm eklendi.');
        }
        json_hata('Method not allowed.', 405);
    }
    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        $stmt = db()->prepare('UPDATE galeri_albumler SET ad = COALESCE(?, ad), sira = COALESCE(?, sira) WHERE id = ?');
        $stmt->execute([$v['ad'] ?? null, $v['sira'] ?? null, $id]);
        json_basari([], 'Albüm güncellendi.');
    }
    if ($method === 'DELETE') {
        auth_zorunlu();
        db()->prepare('DELETE FROM galeri_albumler WHERE id = ?')->execute([$id]);
        json_basari([], 'Albüm silindi.');
    }
    json_hata('Method not allowed.', 405);
}

/* ---------- Görseller ---------- */
if ($kategori === 'gorseller') {
    if ($id === '') {
        if ($method === 'POST') {
            auth_zorunlu();
            $v = istek_govdesi();
            gerekli_alanlar($v, ['src', 'album']);
            $newId = !empty($v['id']) ? (string)$v['id'] : benzersiz_id('img');
            db()->prepare(
                'INSERT INTO galeri_gorseller (id, album_id, baslik, src, tarih, sira)
                 VALUES (?, ?, ?, ?, ?, ?)'
            )->execute([
                $newId,
                (string)$v['album'],
                (string)($v['baslik'] ?? ''),
                (string)$v['src'],
                (string)($v['tarih'] ?? date('Y-m-d')),
                (int)($v['sira'] ?? 0),
            ]);
            json_basari(['id' => $newId], 'Görsel eklendi.');
        }
        json_hata('Method not allowed.', 405);
    }
    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        db()->prepare(
            'UPDATE galeri_gorseller
                SET baslik = COALESCE(?, baslik),
                    album_id = COALESCE(?, album_id),
                    src    = COALESCE(?, src),
                    sira   = COALESCE(?, sira)
              WHERE id = ?'
        )->execute([
            $v['baslik'] ?? null,
            $v['album']  ?? null,
            $v['src']    ?? null,
            $v['sira']   ?? null,
            $id,
        ]);
        json_basari([], 'Görsel güncellendi.');
    }
    if ($method === 'DELETE') {
        auth_zorunlu();
        db()->prepare('DELETE FROM galeri_gorseller WHERE id = ?')->execute([$id]);
        json_basari([], 'Görsel silindi.');
    }
    json_hata('Method not allowed.', 405);
}

json_hata('Rota bulunamadı.', 404);
