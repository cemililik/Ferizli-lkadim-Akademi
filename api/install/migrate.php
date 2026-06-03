<?php
/**
 * Migration runner — hem CLI'den hem güvenli HTTP endpoint olarak çalışır.
 *
 * Davranış:
 *   1. Bootstrap modu: `_migrations` tablosu yoksa ilk kurulumdur →
 *      sql/schema.sql + sql/seed.sql uygulanır, sonra `_migrations` tablosu
 *      oluşturulur ve `000_bootstrap` kaydı atılır.
 *   2. Migration modu: `_migrations` varsa → sql/migrations/*.sql dosyaları
 *      isim sırasına göre çalıştırılır; daha önce uygulananlar atlanır.
 *      Bir dosya hata verirse transaction rollback olur ve süreç durur.
 *
 * Erişim:
 *   CLI:  docker compose exec -T web php api/install/migrate.php
 *         php api/install/migrate.php
 *   HTTP: curl -X POST \
 *              -H "X-Migration-Key: <MIGRATION_SECRET>" \
 *              https://siteniz.com/api/install/migrate.php
 *
 * HTTP erişimi `migration.secret` config değeriyle imzalı header gerektirir.
 * Yetkisiz istek 403 döner. .htaccess bu dosya için web erişimini özel olarak
 * açar; diğer api/install/ scriptleri hâlâ web'den engellenir.
 */

declare(strict_types=1);
require __DIR__ . '/../helpers.php';
require __DIR__ . '/../db.php';

$isCLI = php_sapi_name() === 'cli';
$cfg = get_config();

/* --------------------------------------------------------------
   HTTP modunda yetki kontrolü
-------------------------------------------------------------- */
if (!$isCLI) {
    header('Content-Type: application/json; charset=utf-8');
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

    // Sadece POST'a izin ver (yanlışlıkla GET'le tetiklenmesin)
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        echo json_encode(['ok' => false, 'hata' => 'Sadece POST.'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/* --------------------------------------------------------------
   Yardımcılar
-------------------------------------------------------------- */
$log = function (string $msg) use ($isCLI): void {
    if ($isCLI) echo "  $msg\n";
};

/**
 * Basit SQL splitter — schema.sql/seed.sql/migrations dosyalarımız için yeterli.
 * Satır-sonu yorumlarını (`-- ...`) ve blok yorumlarını (`/* ... *​/`) atar,
 * sonra `;\n` üzerinden böler. (String literal içinde noktalı virgül
 * kullanmayan dosyalar için güvenli.)
 */
$splitSql = function (string $sql): array {
    // Blok yorumları kaldır
    $sql = preg_replace('#/\*.*?\*/#s', '', $sql) ?? $sql;
    // Satır yorumlarını ayıkla
    $lines = preg_split('/\r?\n/', $sql) ?: [];
    $clean = [];
    foreach ($lines as $line) {
        $stripped = trim($line);
        if ($stripped === '' || str_starts_with($stripped, '--')) continue;
        $clean[] = $line;
    }
    $sqlClean = implode("\n", $clean);
    // ;\n veya ;\s*\n üzerinden böl
    $parts = preg_split('/;\s*$/m', $sqlClean) ?: [];
    return array_values(array_filter(array_map('trim', $parts), fn ($s) => $s !== ''));
};

$execFile = function (string $yol, callable $log) use ($splitSql): void {
    if (!file_exists($yol)) {
        throw new Exception("SQL dosyası bulunamadı: $yol");
    }
    $sql = file_get_contents($yol);
    if ($sql === false) throw new Exception("Okunamadı: $yol");
    $statements = $splitSql($sql);
    $log("  → " . count($statements) . " statement");
    foreach ($statements as $stmt) {
        db()->exec($stmt);
    }
};

/* --------------------------------------------------------------
   Çalıştır
-------------------------------------------------------------- */
$basaril = [];
$hatalar = [];

try {
    $pdo  = db();
    $kok  = realpath(__DIR__ . '/../..');
    $sqlDizini = $kok . '/sql';
    $migrationDizini = $sqlDizini . '/migrations';

    // _migrations tablosu var mı?
    $rows = $pdo->query("SHOW TABLES LIKE '_migrations'")->fetchAll();
    $migrationTabloVar = !empty($rows);

    /* ---------- 1) Bootstrap ---------- */
    if (!$migrationTabloVar) {
        $log("Bootstrap modu — _migrations tablosu yok, ilk kurulum yapılıyor");

        $schemaYolu = $sqlDizini . '/schema.sql';
        $seedYolu   = $sqlDizini . '/seed.sql';

        $log("schema.sql uygulanıyor…");
        $execFile($schemaYolu, $log);
        $basaril[] = 'schema.sql';

        if (file_exists($seedYolu)) {
            $log("seed.sql uygulanıyor…");
            $execFile($seedYolu, $log);
            $basaril[] = 'seed.sql';
        }

        // _migrations tablosunu oluştur
        $pdo->exec(
            "CREATE TABLE _migrations (
                ad VARCHAR(255) PRIMARY KEY,
                uygulama_zamani DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
             ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );
        $pdo->exec("INSERT INTO _migrations (ad) VALUES ('000_bootstrap')");
        $log("✓ _migrations tablosu kuruldu");
    }

    /* ---------- 2) Artımlı migration'lar ---------- */
    if (is_dir($migrationDizini)) {
        $dosyalar = glob($migrationDizini . '/*.sql') ?: [];
        sort($dosyalar);   // isim sırası

        // Uygulanmış migration'ları çek
        $uygulanmis = [];
        $stmt = $pdo->query("SELECT ad FROM _migrations");
        foreach ($stmt as $r) $uygulanmis[$r['ad']] = true;

        foreach ($dosyalar as $yol) {
            $ad = basename($yol);
            if (isset($uygulanmis[$ad])) {
                $log("· $ad (zaten uygulanmış, atlanıyor)");
                continue;
            }
            $log("→ $ad uygulanıyor…");
            try {
                $pdo->beginTransaction();
                $execFile($yol, $log);
                $ins = $pdo->prepare("INSERT INTO _migrations (ad) VALUES (?)");
                $ins->execute([$ad]);
                // DDL deyimleri (CREATE INDEX, ALTER TABLE vb.) MariaDB'de
                // implicit commit tetikler — transaction zaten kapandıysa commit() hata verir.
                if ($pdo->inTransaction()) $pdo->commit();
                $basaril[] = $ad;
                $log("✓ $ad");
            } catch (Throwable $e) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                $hatalar[] = ['dosya' => $ad, 'mesaj' => $e->getMessage()];
                $log("✗ $ad HATA: " . $e->getMessage());
                break;   // hatalar zincirlemesin
            }
        }
    } else {
        $log("ℹ sql/migrations/ klasörü yok — ek migration uygulanmadı.");
    }

    /* ---------- 3) Cevap ---------- */
    if ($isCLI) {
        echo "\n";
        echo "Başarılı: " . count($basaril) . "\n";
        echo "Hatalı  : " . count($hatalar) . "\n";
        foreach ($hatalar as $h) echo "  ✗ {$h['dosya']}: {$h['mesaj']}\n";
        exit(empty($hatalar) ? 0 : 1);
    } else {
        http_response_code(empty($hatalar) ? 200 : 500);
        echo json_encode([
            'ok'       => empty($hatalar),
            'basaril'  => $basaril,
            'hatalar'  => $hatalar,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
} catch (Throwable $e) {
    if ($isCLI) {
        fwrite(STDERR, "FATAL: " . $e->getMessage() . "\n");
        exit(1);
    } else {
        http_response_code(500);
        echo json_encode([
            'ok'   => false,
            'hata' => $e->getMessage(),
        ], JSON_UNESCAPED_UNICODE);
    }
}
