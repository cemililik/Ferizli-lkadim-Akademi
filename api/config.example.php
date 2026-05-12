<?php
/**
 * Veritabanı ve site konfigürasyonu.
 *
 * İki çalışma şekli:
 *
 * 1) DOCKER / ENV VARS (lokal geliştirme):
 *    docker-compose.yml zaten env vars geçiyor → bu dosya otomatik çalışır,
 *    config.php oluşturmaya gerek yok.
 *
 * 2) PRODUCTION HOSTING:
 *    Bu dosyayı `config.php` olarak kopyalayıp env() çağrılarını gerçek
 *    değerlerle değiştirin:
 *        cp api/config.example.php api/config.php
 *    `config.php` GIT'E EKLENMEZ (zaten .gitignore'da).
 */

// Env var okuma + varsayılan
$env = static function (string $anahtar, $varsayilan = null) {
    $deger = getenv($anahtar);
    if ($deger === false || $deger === '') return $varsayilan;
    return $deger;
};

return [
    'db' => [
        'host'    => $env('DB_HOST', 'localhost'),
        'port'    => (int)$env('DB_PORT', 3306),
        'name'    => $env('DB_NAME', 'ilkadim_db'),
        'user'    => $env('DB_USER', 'ilkadim_user'),
        'pass'    => $env('DB_PASS', 'sifre-buraya'),
        'charset' => 'utf8mb4',
    ],
    'site' => [
        'url'        => $env('SITE_URL', 'http://localhost:8080'),
        'site_adi'   => 'Ferizli İlk Adım Akademi',
        'gelistirme' => $env('GELISTIRME', 'false') === 'true',
    ],
    'session' => [
        'name'     => 'ilkadim_sid',
        'lifetime' => 60 * 60 * 8,           // 8 saat
        // HTTPS algılama: doğrudan TLS, proxy arkasındaki X-Forwarded-Proto,
        // SERVER_PORT=443 veya elle force etmek için SESSION_FORCE_SECURE=1.
        'secure'   => (
            ($_SERVER['HTTPS'] ?? '') === 'on'
            || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
            || ($_SERVER['SERVER_PORT'] ?? '') === '443'
            || getenv('SESSION_FORCE_SECURE') === '1'
        ),
        'httponly' => true,
        'samesite' => 'Lax',
    ],
    'upload' => [
        'max_size_mb'          => 8,
        'allowed_image_types'  => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        'klasor'               => __DIR__ . '/../assets/uploads',
        'web_yolu'             => '/assets/uploads',
        // Resize hedefleri
        'max_genislik'         => 1600,
        'max_yukseklik'        => 1600,
        'jpeg_kalite'          => 82,
    ],
];
