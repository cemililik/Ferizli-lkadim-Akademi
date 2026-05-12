<?php
/**
 * /api/uploads        POST  multipart/form-data → görsel yükle (auth)
 *                          Field: "dosya"
 *                          Optional: "klasor" (örn: "kadro", "duyurular", "blog")
 *                          Optional: "max" (max kenar px, varsayılan 1600)
 *                          Response: { url: "/assets/uploads/2026/05/abc.jpg", boyutKB: 124 }
 *
 * /api/uploads/sil    POST  body: { url: "/assets/uploads/..." } (auth)
 *                          Sadece /assets/uploads/ altındaki dosyaları siler.
 */

declare(strict_types=1);

auth_zorunlu();

$cfg    = get_config();
$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
$parcalar = $GLOBALS['_yol_parcalari'];
$alt    = $parcalar[0] ?? '';

if ($method !== 'POST') json_hata('Sadece POST.', 405);

/* ============================================================
   ALT: sil
============================================================ */
if ($alt === 'sil') {
    $v = istek_govdesi();
    $url = (string)($v['url'] ?? '');
    if (!str_starts_with($url, $cfg['upload']['web_yolu'] . '/')) {
        json_hata('Geçersiz URL.', 422);
    }
    $rel = substr($url, strlen($cfg['upload']['web_yolu']) + 1);
    if (str_contains($rel, '..')) json_hata('Geçersiz dosya yolu.', 422);
    $tam = $cfg['upload']['klasor'] . '/' . $rel;
    $real = realpath($tam);
    $izinli = realpath($cfg['upload']['klasor']);
    if (!$real || !$izinli || strpos($real, $izinli) !== 0) json_hata('Geçersiz yol.', 422);
    if (file_exists($real)) @unlink($real);
    json_basari([], 'Silindi.');
}

/* ============================================================
   Kök: yükleme
============================================================ */
if (empty($_FILES['dosya'])) json_hata('"dosya" alanı eksik.', 422);

$file = $_FILES['dosya'];
if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
    json_hata('Yükleme hatası: ' . ($file['error'] ?? 'bilinmiyor'), 422);
}

$maxByte = (int)$cfg['upload']['max_size_mb'] * 1024 * 1024;
if ($file['size'] > $maxByte) {
    json_hata('Dosya çok büyük. En fazla ' . $cfg['upload']['max_size_mb'] . ' MB.', 422);
}

// MIME doğrulama (finfo ile gerçek tipini al — sadece extension yetmez)
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);
if (!in_array($mime, $cfg['upload']['allowed_image_types'], true)) {
    json_hata('Sadece JPG, PNG, WEBP veya GIF yükleyebilirsiniz.', 422);
}

// Resize parametreleri
$maxKenar = (int)($_POST['max'] ?? $cfg['upload']['max_genislik']);
$maxKenar = max(200, min(4000, $maxKenar));
$kalite   = (int)$cfg['upload']['jpeg_kalite'];

// Hedef klasör
$altKlasor = preg_replace('/[^a-z0-9_-]/', '', (string)($_POST['klasor'] ?? 'genel')) ?: 'genel';
$tarihKlasor = date('Y/m');
$hedefKlasor = $cfg['upload']['klasor'] . "/$altKlasor/$tarihKlasor";
if (!is_dir($hedefKlasor) && !@mkdir($hedefKlasor, 0775, true)) {
    json_hata('Yükleme klasörü oluşturulamadı (izinler).', 500);
}

// Görsel oku (GD ile)
$img = null;
switch ($mime) {
    case 'image/jpeg': $img = @imagecreatefromjpeg($file['tmp_name']); break;
    case 'image/png':  $img = @imagecreatefrompng($file['tmp_name']);  break;
    case 'image/webp': $img = @imagecreatefromwebp($file['tmp_name']); break;
    case 'image/gif':  $img = @imagecreatefromgif($file['tmp_name']);  break;
}
if (!$img) json_hata('Görsel okunamadı.', 422);

// Boyut ayarla (orijinalden büyütme yapma)
$ow = imagesx($img);
$oh = imagesy($img);
$oran = min($maxKenar / $ow, $maxKenar / $oh, 1.0);
$nw = (int)round($ow * $oran);
$nh = (int)round($oh * $oran);

if ($oran < 1) {
    $yeni = imagecreatetruecolor($nw, $nh);
    // Beyaz arka plan (alfa kanalı olan png/gif için)
    imagefilledrectangle($yeni, 0, 0, $nw, $nh, imagecolorallocate($yeni, 255, 255, 255));
    imagecopyresampled($yeni, $img, 0, 0, 0, 0, $nw, $nh, $ow, $oh);
    imagedestroy($img);
    $img = $yeni;
}

// JPEG olarak kaydet (tek tip + sıkıştırma)
$uzanti = 'jpg';
$dosyaAd = bin2hex(random_bytes(8)) . '.' . $uzanti;
$tamYol  = "$hedefKlasor/$dosyaAd";
$webYol  = $cfg['upload']['web_yolu'] . "/$altKlasor/$tarihKlasor/$dosyaAd";

if (!imagejpeg($img, $tamYol, $kalite)) {
    imagedestroy($img);
    json_hata('Görsel kaydedilemedi.', 500);
}
imagedestroy($img);

clearstatcache(true, $tamYol);
$boyutKB = (int)round(filesize($tamYol) / 1024);

json_basari([
    'url'     => $webYol,
    'boyutKB' => $boyutKB,
    'genislik'=> $nw,
    'yukseklik'=> $nh,
], 'Yüklendi.');
