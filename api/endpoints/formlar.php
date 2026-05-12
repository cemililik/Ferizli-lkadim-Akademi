<?php
/**
 * /api/formlar              GET  yayında formlar (public); ?admin=1 → tümü (auth)
 * /api/formlar/:id          GET  tek form (yayındaysa public)
 * /api/formlar              POST yeni form (auth)
 * /api/formlar/:id          PUT  güncelle (auth)
 * /api/formlar/:id          DELETE sil (auth)
 *
 * /api/formlar/:id/gonder   POST  form CEVAP gönderimi (public)
 *                                 cevabı form_cevaplari tablosuna yazar
 *                                 + bildirimler tablosuna kayıt düşer
 */

declare(strict_types=1);

$parcalar = $GLOBALS['_yol_parcalari'];
$id       = $parcalar[0] ?? '';
$action   = $parcalar[1] ?? '';
$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function f_normalize(array $f): array {
    return [
        'id' => $f['id'],
        'ad' => $f['ad'],
        'aciklama' => $f['aciklama'] ?? '',
        'tesekkurMesaji' => $f['tesekkur_mesaji'] ?? '',
        'alanlar' => $f['alanlar'] ? (json_decode($f['alanlar'], true) ?: []) : [],
        'yayinda' => (bool)$f['yayinda'],
        'varsayilan' => (bool)$f['varsayilan'],
        'olusturulma' => $f['olusturulma'] ?? null,
    ];
}

/* ---------- Form cevap gönderimi (public) ---------- */
if ($id !== '' && $action === 'gonder' && $method === 'POST') {
    $stmt = db()->prepare('SELECT id, ad, alanlar, yayinda FROM formlar WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $f = $stmt->fetch();
    if (!$f || !$f['yayinda']) json_hata('Form bulunamadı veya yayında değil.', 404);

    $v = istek_govdesi();
    $veriler = $v['veriler'] ?? null;
    if (!is_array($veriler) || empty($veriler)) json_hata('Veri eksik.', 422);

    // Alanları doğrula (zorunlu olanlar boş gelmiş mi)
    $alanlar = json_decode($f['alanlar'], true) ?: [];
    foreach ($alanlar as $a) {
        if (empty($a['zorunlu']) || ($a['tip'] ?? '') === 'baslik') continue;
        $deger = $veriler[$a['id']] ?? null;
        $bos = ($deger === null || $deger === '' || (is_array($deger) && count($deger) === 0));
        if ($bos) json_hata('Zorunlu alan eksik: ' . ($a['etiket'] ?? $a['id']), 422);
    }

    $cevapId = benzersiz_id('cv');
    db()->prepare(
        'INSERT INTO form_cevaplari (id, form_id, veriler, ip_adres, user_agent)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([
        $cevapId,
        $id,
        json_encode($veriler, JSON_UNESCAPED_UNICODE),
        $_SERVER['REMOTE_ADDR'] ?? null,
        substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
    ]);

    // Bildirim oluştur
    $ozet = '';
    foreach ($veriler as $v) {
        if (is_string($v) && strlen($v) > 0 && strlen($v) < 60) {
            $ozet .= ($ozet ? ' • ' : '') . $v;
            if (strlen($ozet) > 80) break;
        }
    }
    $bildirimId = benzersiz_id('bd');
    db()->prepare(
        'INSERT INTO bildirimler (id, tur, baslik, mesaj, link, okundu)
         VALUES (?, ?, ?, ?, ?, 0)'
    )->execute([
        $bildirimId,
        'form-cevap',
        'Yeni form cevabı: ' . $f['ad'],
        $ozet ?: 'Yeni bir form gönderildi.',
        '/admin/cevaplar.html?form=' . urlencode($id) . '#' . $cevapId,
    ]);

    json_basari(['id' => $cevapId], 'Başvurunuz alındı.');
}

/* ---------- /api/formlar/:id ---------- */
if ($id !== '' && $action === '') {
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM formlar WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $f = $stmt->fetch();
        if (!$f) json_hata('Form bulunamadı.', 404);
        if (!$f['yayinda'] && !mevcut_kullanici()) {
            json_hata('Form yayında değil.', 404);
        }
        json_cevap(['form' => f_normalize($f)]);
    }
    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        $stmt = db()->prepare('SELECT * FROM formlar WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $m = $stmt->fetch();
        if (!$m) json_hata('Form bulunamadı.', 404);

        // Varsayılan teklik
        $yeniVarsayilan = isset($v['varsayilan']) ? (int)(bool)$v['varsayilan'] : (int)$m['varsayilan'];

        db()->beginTransaction();
        try {
            if ($yeniVarsayilan && !$m['varsayilan']) {
                db()->exec('UPDATE formlar SET varsayilan = 0');
            }
            db()->prepare(
                'UPDATE formlar SET ad=?, aciklama=?, tesekkur_mesaji=?, alanlar=?, yayinda=?, varsayilan=? WHERE id=?'
            )->execute([
                (string)($v['ad'] ?? $m['ad']),
                (string)($v['aciklama'] ?? $m['aciklama'] ?? ''),
                (string)($v['tesekkurMesaji'] ?? $m['tesekkur_mesaji'] ?? ''),
                isset($v['alanlar']) && is_array($v['alanlar'])
                    ? json_encode($v['alanlar'], JSON_UNESCAPED_UNICODE)
                    : $m['alanlar'],
                isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : (int)$m['yayinda'],
                $yeniVarsayilan,
                $id,
            ]);
            db()->commit();
        } catch (Throwable $e) {
            db()->rollBack();
            throw $e;
        }
        json_basari(['id' => $id], 'Form güncellendi.');
    }
    if ($method === 'DELETE') {
        auth_zorunlu();
        $stmt = db()->prepare('DELETE FROM formlar WHERE id = ?');
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) json_hata('Form bulunamadı.', 404);
        json_basari([], 'Form silindi.');
    }
    json_hata('Method not allowed.', 405);
}

/* ---------- /api/formlar (kök) ---------- */
if ($id === '' && $method === 'GET') {
    $adminGoruntu = !empty($_GET['admin']);
    if ($adminGoruntu) auth_zorunlu();
    $sql = 'SELECT * FROM formlar';
    if (!$adminGoruntu) $sql .= ' WHERE yayinda = 1';
    $sql .= ' ORDER BY varsayilan DESC, olusturulma DESC';
    $rows = db()->query($sql)->fetchAll();
    json_cevap(['formlar' => array_map('f_normalize', $rows)]);
}

if ($id === '' && $method === 'POST') {
    auth_zorunlu();
    $v = istek_govdesi();
    gerekli_alanlar($v, ['ad']);

    $newId = !empty($v['id']) ? slugify((string)$v['id']) : slugify((string)$v['ad']);
    $yeniVarsayilan = !empty($v['varsayilan']) ? 1 : 0;

    db()->beginTransaction();
    try {
        if ($yeniVarsayilan) db()->exec('UPDATE formlar SET varsayilan = 0');
        db()->prepare(
            'INSERT INTO formlar (id, ad, aciklama, tesekkur_mesaji, alanlar, yayinda, varsayilan)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $newId,
            (string)$v['ad'],
            (string)($v['aciklama'] ?? ''),
            (string)($v['tesekkurMesaji'] ?? ''),
            json_encode($v['alanlar'] ?? [], JSON_UNESCAPED_UNICODE),
            !empty($v['yayinda']) ? 1 : 0,
            $yeniVarsayilan,
        ]);
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
    json_basari(['id' => $newId], 'Form oluşturuldu.');
}

json_hata('Method not allowed.', 405);
