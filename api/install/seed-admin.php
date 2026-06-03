<?php
/**
 * Admin seed endpoint — ilk kurulumda admin parolasını HTTP üzerinden atar.
 *
 * Davranış:
 *   - sifre_hash = '*locked*' olan admin kaydını gerçek parola ile günceller.
 *   - Parola zaten ayarlanmışsa (hash != '*locked*') işlem yapılmaz → idempotent.
 *   - YALNIZCA ilk kurulumda (CI/CD seed adımında) çalışır; sonraki deploy'larda
 *     "zaten ayarlı" döner ve mevcut parolaya dokunmaz.
 *
 * Erişim (yalnızca POST):
 *   curl -sS -X POST \
 *        -H "X-Migration-Key: <MIGRATION_SECRET>" \
 *        -H "X-Admin-Password: <ADMIN_SEED_PASSWORD>" \
 *        https://siteniz.com/api/install/seed-admin.php
 *
 * Yanıt (JSON):
 *   {"ok": true, "durum": "guncellendi"}   — parola hash'i atandı
 *   {"ok": true, "durum": "zaten_ayarli"}  — hash zaten gerçek, dokunulmadı
 *   {"ok": false, "hata": "..."}           — hata
 */

declare(strict_types=1);
require __DIR__ . '/../helpers.php';
require __DIR__ . '/../db.php';

header('Content-Type: application/json; charset=utf-8');

/* ---------------------------------------------------------------
   1. Yalnızca HTTP — CLI'dan çalıştırılmaz
--------------------------------------------------------------- */
if (php_sapi_name() === 'cli') {
    fwrite(STDERR, "Bu script HTTP üzerinden çalışır.\n");
    exit(1);
}

/* ---------------------------------------------------------------
   2. Yalnızca POST
--------------------------------------------------------------- */
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['ok' => false, 'hata' => 'Sadece POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------------------------------------------------------------
   3. X-Migration-Key doğrula
--------------------------------------------------------------- */
$cfg            = get_config();
$beklenenAnahtar = (string)($cfg['migration']['secret'] ?? '');
$gelenAnahtar    = (string)($_SERVER['HTTP_X_MIGRATION_KEY'] ?? '');

if ($beklenenAnahtar === '' || $gelenAnahtar === ''
    || !hash_equals($beklenenAnahtar, $gelenAnahtar)) {
    http_response_code(403);
    echo json_encode([
        'ok'   => false,
        'hata' => 'Yetki yok. X-Migration-Key header eksik veya geçersiz.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------------------------------------------------------------
   4. POST body (JSON) üzerinden parolayı al
   Header yerine body kullanılıyor: bazı WAF/ModSecurity kurulumları
   "Password" içeren özel header'ları bloklar.
--------------------------------------------------------------- */
// Önce form POST ($_POST), yoksa JSON body — hosting uyumluluğu için form tercih edilir.
$sifre = (string)($_POST['password'] ?? '');
if ($sifre === '') {
    $body  = (string)file_get_contents('php://input');
    $input = $body !== '' ? json_decode($body, true) : null;
    $sifre = (string)($input['password'] ?? '');
}

if ($sifre === '' || strlen($sifre) < 8) {
    http_response_code(422);
    echo json_encode([
        'ok'   => false,
        'hata' => '"password" alanı eksik veya 8 karakterden kısa.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ---------------------------------------------------------------
   5. Admin kaydını kontrol et ve gerekirse güncelle
--------------------------------------------------------------- */
try {
    $pdo = db();

    $sel = $pdo->prepare(
        "SELECT id, sifre_hash FROM admin_kullanicilar WHERE kullanici_adi = 'admin' LIMIT 1"
    );
    $sel->execute();
    $kayit = $sel->fetch(PDO::FETCH_ASSOC);

    if (!$kayit) {
        http_response_code(404);
        echo json_encode([
            'ok'   => false,
            'hata' => "admin kullanıcısı bulunamadı. Önce migrate çalıştırın.",
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Parola zaten gerçek bir hash ise dokunma
    if ($kayit['sifre_hash'] !== '*locked*') {
        http_response_code(200);
        echo json_encode([
            'ok'    => true,
            'durum' => 'zaten_ayarli',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // *locked* → bcrypt hash ile güncelle
    $hash = password_hash($sifre, PASSWORD_DEFAULT);
    $upd  = $pdo->prepare(
        "UPDATE admin_kullanicilar SET sifre_hash = ?, aktif = 1 WHERE id = ?"
    );
    $upd->execute([$hash, (int)$kayit['id']]);

    http_response_code(200);
    echo json_encode([
        'ok'    => true,
        'durum' => 'guncellendi',
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok'   => false,
        'hata' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
