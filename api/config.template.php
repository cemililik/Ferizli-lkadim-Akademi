<?php
/**
 * CI/CD üretim config şablonu.
 *
 * Bu dosya .github/workflows/deploy.yml tarafından okunup, içindeki
 * <PLACEHOLDER> stringleri GitHub secrets/variables ile değiştirilir.
 * Sonuç `api/config.php` olarak sunucuya yüklenir.
 *
 * Bu dosyayı doğrudan kullanmayın — config.example.php (dev) veya
 * üretilen config.php (prod) bağlanır.
 */

return [
    'db' => [
        'host'    => '__DB_HOST__',
        'port'    => __DB_PORT__,
        'name'    => '__DB_NAME__',
        'user'    => '__DB_USER__',
        'pass'    => '__DB_PASS__',
        'charset' => 'utf8mb4',
    ],
    'site' => [
        'url'        => '__SITE_URL__',
        'site_adi'   => 'Ferizli İlk Adım Akademi',
        'gelistirme' => false,
    ],
    'session' => [
        'name'     => 'ilkadim_sid',
        'lifetime' => 60 * 60 * 8,
        'secure'   => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ],
    'upload' => [
        'max_size_mb'         => 8,
        'allowed_image_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        'klasor'              => __DIR__ . '/../assets/uploads',
        'web_yolu'            => '/assets/uploads',
        'max_genislik'        => 1600,
        'max_yukseklik'       => 1600,
        'jpeg_kalite'         => 82,
    ],
    'migration' => [
        'secret' => '__MIGRATION_SECRET__',
    ],
];
