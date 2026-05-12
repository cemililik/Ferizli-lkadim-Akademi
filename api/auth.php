<?php
/**
 * Oturum yardımcıları.
 * PHP native session — file-based (varsayılan), production'da DB-based'e
 * geçilebilir.
 */

declare(strict_types=1);

function oturum_baslat(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;

    $cfg = get_config();
    $s = $cfg['session'];

    session_name($s['name']);
    session_set_cookie_params([
        'lifetime' => $s['lifetime'],
        'path'     => '/',
        'domain'   => '',
        'secure'   => (bool)$s['secure'],
        'httponly' => (bool)$s['httponly'],
        'samesite' => $s['samesite'],
    ]);
    session_start();
}

function mevcut_kullanici(): ?array {
    oturum_baslat();
    if (empty($_SESSION['kullanici_id'])) return null;

    $stmt = db()->prepare('SELECT id, kullanici_adi, eposta, ad_soyad, rol, aktif FROM admin_kullanicilar WHERE id = ? LIMIT 1');
    $stmt->execute([$_SESSION['kullanici_id']]);
    $u = $stmt->fetch();
    if (!$u || !$u['aktif']) {
        oturum_kapat();
        return null;
    }
    unset($u['aktif']);
    return $u;
}

function auth_zorunlu(): array {
    $u = mevcut_kullanici();
    if (!$u) json_hata('Giriş gerekli.', 401);
    return $u;
}

function oturum_ac(int $kullaniciId): void {
    oturum_baslat();
    // Session fixation önlemi
    session_regenerate_id(true);
    $_SESSION['kullanici_id'] = $kullaniciId;
    $_SESSION['oturum_baslangic'] = time();
}

function oturum_kapat(): void {
    oturum_baslat();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}
