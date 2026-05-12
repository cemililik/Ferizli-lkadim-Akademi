<?php
/**
 * /api/kullanicilar         GET    Liste (admin role)
 * /api/kullanicilar         POST   Yeni kullanıcı (admin role)
 * /api/kullanicilar/:id     GET    Tek kullanıcı (admin role)
 * /api/kullanicilar/:id     PUT    Güncelle (admin role) — şifre opsiyonel
 * /api/kullanicilar/:id     DELETE Sil (admin role)
 *
 * /api/kullanicilar/sifre-degistir  POST  Kendi şifresini değiştir (auth)
 */

declare(strict_types=1);

$mev = auth_zorunlu();

$parcalar = $GLOBALS['_yol_parcalari'];
$arg1 = $parcalar[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ---------- Kendi şifresini değiştirme ---------- */
if ($arg1 === 'sifre-degistir' && $method === 'POST') {
    $v = istek_govdesi();
    $eski = (string)($v['eskiSifre'] ?? '');
    $yeni = (string)($v['yeniSifre'] ?? '');
    if ($eski === '' || $yeni === '') json_hata('Eski ve yeni şifre zorunlu.', 422);
    if (strlen($yeni) < 8) json_hata('Yeni şifre en az 8 karakter olmalı.', 422);

    $stmt = db()->prepare('SELECT sifre_hash FROM admin_kullanicilar WHERE id = ?');
    $stmt->execute([$mev['id']]);
    $hash = $stmt->fetchColumn();
    if (!$hash || !password_verify($eski, $hash)) {
        json_hata('Eski şifre yanlış.', 401);
    }
    $yeniHash = password_hash($yeni, PASSWORD_DEFAULT);
    db()->prepare('UPDATE admin_kullanicilar SET sifre_hash = ? WHERE id = ?')
       ->execute([$yeniHash, $mev['id']]);
    json_basari([], 'Şifre değiştirildi.');
}

/* ---------- Kendi profilini güncelle (rol/aktif değil — sadece ad/eposta) ---------- */
if ($arg1 === 'profil' && $method === 'PUT') {
    $v = istek_govdesi();
    $sets = [];
    $params = [];
    if (array_key_exists('adSoyad', $v)) {
        $sets[] = 'ad_soyad = ?';
        $params[] = (string)$v['adSoyad'];
    }
    if (array_key_exists('eposta', $v)) {
        $sets[] = 'eposta = ?';
        $params[] = (string)$v['eposta'];
    }
    if (empty($sets)) json_hata('Güncellenecek alan yok.', 422);
    $params[] = $mev['id'];
    try {
        db()->prepare('UPDATE admin_kullanicilar SET ' . implode(', ', $sets) . ' WHERE id = ?')
           ->execute($params);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') json_hata('Bu e-posta başka bir kullanıcıda kayıtlı.', 409);
        throw $e;
    }
    json_basari([], 'Profil güncellendi.');
}

/* ---------- Bundan sonraki tüm işlemler admin rolü gerektirir ---------- */
if ($mev['rol'] !== 'admin') {
    json_hata('Bu işlem için yetkiniz yok (admin rolü gerekli).', 403);
}

function u_normalize(array $u): array {
    return [
        'id' => (int)$u['id'],
        'kullaniciAdi' => $u['kullanici_adi'],
        'eposta' => $u['eposta'] ?? '',
        'adSoyad' => $u['ad_soyad'] ?? '',
        'rol' => $u['rol'],
        'aktif' => (bool)$u['aktif'],
        'sonGiris' => $u['son_giris'],
        'olusturulma' => $u['olusturulma'],
    ];
}

if ($arg1 !== '') {
    $id = (int)$arg1;
    if ($method === 'GET') {
        $stmt = db()->prepare('SELECT * FROM admin_kullanicilar WHERE id = ?');
        $stmt->execute([$id]);
        $u = $stmt->fetch();
        if (!$u) json_hata('Kullanıcı bulunamadı.', 404);
        json_cevap(['kullanici' => u_normalize($u)]);
    }
    if ($method === 'PUT') {
        $v = istek_govdesi();
        $stmt = db()->prepare('SELECT * FROM admin_kullanicilar WHERE id = ?');
        $stmt->execute([$id]);
        $m = $stmt->fetch();
        if (!$m) json_hata('Kullanıcı bulunamadı.', 404);

        // Son admin'i silmesini/pasifleştirmesini engelle
        if ($mev['id'] === $id && (
            (isset($v['aktif']) && !$v['aktif']) ||
            (isset($v['rol']) && $v['rol'] !== 'admin')
        )) {
            $adminSayisi = (int)db()->query("SELECT COUNT(*) FROM admin_kullanicilar WHERE rol='admin' AND aktif=1")->fetchColumn();
            if ($adminSayisi <= 1) {
                json_hata('Son aktif admin kullanıcısı kendinizsiniz — pasifleştiremez veya rolünüzü değiştiremezsiniz.', 422);
            }
        }

        $sets = [];
        $params = [];
        $alanlar = [
            'kullanici_adi' => 'kullaniciAdi',
            'eposta'        => 'eposta',
            'ad_soyad'      => 'adSoyad',
            'rol'           => 'rol',
            'aktif'         => 'aktif',
        ];
        foreach ($alanlar as $kolon => $alan) {
            if (array_key_exists($alan, $v)) {
                $sets[] = "$kolon = ?";
                if ($alan === 'aktif') $params[] = (int)(bool)$v[$alan];
                elseif ($alan === 'rol' && !in_array($v[$alan], ['admin','editor'], true)) {
                    json_hata('Geçersiz rol.', 422);
                }
                else $params[] = $v[$alan];
            }
        }
        // Yeni şifre verildiyse
        if (!empty($v['yeniSifre'])) {
            if (strlen((string)$v['yeniSifre']) < 8) json_hata('Yeni şifre en az 8 karakter olmalı.', 422);
            $sets[] = 'sifre_hash = ?';
            $params[] = password_hash((string)$v['yeniSifre'], PASSWORD_DEFAULT);
        }
        if (empty($sets)) json_hata('Güncellenecek alan yok.', 422);
        $params[] = $id;

        try {
            db()->prepare('UPDATE admin_kullanicilar SET ' . implode(', ', $sets) . ' WHERE id = ?')
                ->execute($params);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') json_hata('Kullanıcı adı veya e-posta zaten kullanılıyor.', 409);
            throw $e;
        }
        json_basari(['id' => $id], 'Kullanıcı güncellendi.');
    }
    if ($method === 'DELETE') {
        if ($mev['id'] === $id) json_hata('Kendinizi silemezsiniz.', 422);
        $adminSayisi = (int)db()->query("SELECT COUNT(*) FROM admin_kullanicilar WHERE rol='admin' AND aktif=1")->fetchColumn();
        $hedef = db()->prepare('SELECT rol, aktif FROM admin_kullanicilar WHERE id = ?');
        $hedef->execute([$id]);
        $h = $hedef->fetch();
        if (!$h) json_hata('Kullanıcı bulunamadı.', 404);
        if ($h['rol'] === 'admin' && $h['aktif'] && $adminSayisi <= 1) {
            json_hata('Son aktif admin kullanıcısını silemezsiniz.', 422);
        }
        db()->prepare('DELETE FROM admin_kullanicilar WHERE id = ?')->execute([$id]);
        json_basari([], 'Kullanıcı silindi.');
    }
    json_hata('Method not allowed.', 405);
}

if ($method === 'GET') {
    $rows = db()->query(
        'SELECT id, kullanici_adi, eposta, ad_soyad, rol, aktif, son_giris, olusturulma
           FROM admin_kullanicilar
       ORDER BY olusturulma DESC'
    )->fetchAll();
    json_cevap(['kullanicilar' => array_map('u_normalize', $rows)]);
}

if ($method === 'POST') {
    $v = istek_govdesi();
    gerekli_alanlar($v, ['kullaniciAdi', 'sifre']);
    $kullaniciAdi = trim((string)$v['kullaniciAdi']);
    $sifre = (string)$v['sifre'];
    if (strlen($sifre) < 8) json_hata('Şifre en az 8 karakter olmalı.', 422);
    if (!preg_match('/^[a-zA-Z0-9_.-]{3,50}$/', $kullaniciAdi)) {
        json_hata('Kullanıcı adı 3-50 karakter, harf/rakam/_./- olmalı.', 422);
    }
    $rol = ($v['rol'] ?? 'editor');
    if (!in_array($rol, ['admin','editor'], true)) json_hata('Geçersiz rol.', 422);

    try {
        db()->prepare(
            'INSERT INTO admin_kullanicilar
                (kullanici_adi, eposta, sifre_hash, ad_soyad, rol, aktif)
             VALUES (?, ?, ?, ?, ?, 1)'
        )->execute([
            $kullaniciAdi,
            (string)($v['eposta'] ?? ''),
            password_hash($sifre, PASSWORD_DEFAULT),
            (string)($v['adSoyad'] ?? ''),
            $rol,
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') json_hata('Kullanıcı adı veya e-posta zaten kullanılıyor.', 409);
        throw $e;
    }
    json_basari(['id' => (int)db()->lastInsertId()], 'Kullanıcı eklendi.');
}

json_hata('Method not allowed.', 405);
