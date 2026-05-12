<?php
/**
 * PHP built-in sunucu için router.
 * Sadece geliştirme amaçlıdır — Apache/Nginx'te .htaccess kullanılır.
 *
 * Kullanım:
 *   php -S localhost:8000 router.php
 */

$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);

// 1. /api/... isteklerini api/index.php'ye yönlendir (.htaccess simülasyonu)
if (preg_match('#^/api/?(.*)$#', $uri, $m)) {
    $apiPath = $m[1];

    // Eğer gerçek bir dosyaya direkt isabet ediyorsa (örn. /api/install.php) onu servis et
    $direct = __DIR__ . '/api/' . $apiPath;
    if ($apiPath !== '' && is_file($direct)) {
        return false;
    }

    $_GET['path'] = $apiPath;
    require __DIR__ . '/api/index.php';
    return true;
}

// 2. Diğerleri için varsayılan dosya servisi
return false;
