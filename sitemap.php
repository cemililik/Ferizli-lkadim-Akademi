<?php
require __DIR__ . '/api/helpers.php';
require __DIR__ . '/api/db.php';
header('Content-Type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
$statik = ['', '/hakkimizda.html','/programlar.html','/kadro.html',
           '/duyurular.html','/galeri.html','/basarilarimiz.html',
           '/iletisim.html','/basvuru.html','/blog.html','/kvkk.html'];
$cfg = function_exists('get_config') ? get_config() : [];
// Base URL: config'de explicit ve localhost değilse onu kullan; aksi halde request'ten türet.
// Production'da SITE_URL set edilmemişse veya hâlâ localhost'sa, ferizliilkadim.com gibi
// gerçek domain otomatik kullanılır — sitemap localhost URL'leriyle indekslenmez.
$configured = $cfg['site']['url'] ?? '';
if ($configured && !preg_match('#://(localhost|127\.0\.0\.1|0\.0\.0\.0)#i', $configured)) {
    $base = rtrim($configured, '/');
} else {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['SERVER_PORT'] ?? '') == '443')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $base = ($isHttps ? 'https' : 'http') . '://' . $host;
}
foreach ($statik as $p) echo "<url><loc>".htmlspecialchars($base.$p)."</loc></url>";
try {
  $stmt = db()->query("SELECT slug, guncelleme FROM blog_yazilar WHERE yayinda=1");
  foreach ($stmt as $y) {
    echo "<url><loc>".htmlspecialchars($base."/blog/yazi.html?slug=".$y['slug'])."</loc>"
       . "<lastmod>".substr($y['guncelleme'],0,10)."</lastmod></url>";
  }
} catch (Throwable $e) { /* sessiz */ }
echo '</urlset>';
