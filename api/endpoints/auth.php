<?php
/**
 * /api/auth/login   POST  {kullaniciAdi|eposta, sifre}
 * /api/auth/logout  POST
 * /api/auth/me      GET
 */

declare(strict_types=1);

$alt = $GLOBALS['_yol_parcalari'][0] ?? '';

switch ($alt) {

    case 'login':
        metod_kontrol('POST');
        // Timing saldırılarını önlemek için her login dalında sabit gecikme uygula
        usleep(150000);
        $v = istek_govdesi();
        $kim  = trim((string)($v['kullaniciAdi'] ?? $v['eposta'] ?? ''));
        $sifre = (string)($v['sifre'] ?? '');
        if ($kim === '' || $sifre === '') {
            json_hata('Kullanıcı adı ve şifre zorunlu.', 422);
        }

        $stmt = db()->prepare(
            'SELECT id, kullanici_adi, eposta, ad_soyad, rol, sifre_hash, aktif
               FROM admin_kullanicilar
              WHERE (kullanici_adi = ? OR eposta = ?) LIMIT 1'
        );
        $stmt->execute([$kim, $kim]);
        $u = $stmt->fetch();

        if (!$u || !$u['aktif'] || !password_verify($sifre, $u['sifre_hash'])) {
            json_hata('Geçersiz kullanıcı adı veya şifre.', 401);
        }

        // Rehash gerekiyorsa güncelle (cost değiştiyse)
        if (password_needs_rehash($u['sifre_hash'], PASSWORD_DEFAULT)) {
            $yeniHash = password_hash($sifre, PASSWORD_DEFAULT);
            db()->prepare('UPDATE admin_kullanicilar SET sifre_hash = ? WHERE id = ?')
               ->execute([$yeniHash, $u['id']]);
        }

        db()->prepare('UPDATE admin_kullanicilar SET son_giris = NOW() WHERE id = ?')
           ->execute([$u['id']]);

        oturum_ac((int)$u['id']);

        unset($u['sifre_hash'], $u['aktif']);
        json_basari(['kullanici' => $u], 'Giriş başarılı.');
        break;

    case 'logout':
        metod_kontrol('POST');
        oturum_kapat();
        json_basari([], 'Çıkış yapıldı.');
        break;

    case 'me':
        metod_kontrol('GET');
        $u = mevcut_kullanici();
        if (!$u) json_cevap(['kullanici' => null]);
        json_cevap(['kullanici' => $u]);
        break;

    default:
        json_hata('Alt rota bulunamadı (login | logout | me).', 404);
}
