<?php
/**
 * API router — tüm /api/... istekleri buraya gelir.
 * .htaccess `path` parametresi ile rotayı geçirir.
 */

declare(strict_types=1);

require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';
require __DIR__ . '/auth.php';

// Hata raporlama
$cfg = get_config();
if (!empty($cfg['site']['gelistirme'])) {
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
} else {
    error_reporting(0);
    ini_set('display_errors', '0');
}

// OPTIONS preflight (CORS — şimdilik same-origin)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rota = trim((string)($_GET['path'] ?? ''), '/');
if ($rota === '') {
    json_basari([], 'İlk Adım Akademi API');
}

// "blog/lgs-yazisi" → ["blog", "lgs-yazisi"]
$parcalar = explode('/', $rota);
$endpoint = array_shift($parcalar);

// Mevcut endpoint dosyaları
$izinliEndpointler = [
    'auth', 'blog', 'uploads',
    'ayarlar', 'duyurular', 'programlar', 'kadro', 'galeri',
    'formlar', 'cevaplar', 'bildirimler', 'kullanicilar',
    'moduller',
];

if (!in_array($endpoint, $izinliEndpointler, true)) {
    json_hata("Rota bulunamadı: $endpoint", 404);
}

$dosya = __DIR__ . "/endpoints/{$endpoint}.php";
if (!file_exists($dosya)) {
    json_hata("Endpoint bulunamadı.", 404);
}

// Endpoint'e parça parametrelerini ver
$GLOBALS['_yol_parcalari'] = $parcalar;

require $dosya;
