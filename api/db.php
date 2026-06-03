<?php
/**
 * PDO bağlantısı — singleton.
 */

declare(strict_types=1);

/**
 * Konfigürasyonu yükler.
 * Önce config.php (varsa) → yoksa config.example.php (env vars + varsayılan).
 */
function get_config(): array {
    static $cfg = null;
    if ($cfg !== null) return $cfg;

    $userConfig = __DIR__ . '/config.php';
    $exampleConfig = __DIR__ . '/config.example.php';

    if (file_exists($userConfig)) {
        $cfg = require $userConfig;
    } elseif (file_exists($exampleConfig)) {
        // Docker / env vars senaryosu — kullanıcı config.php yazmamış
        $cfg = require $exampleConfig;
    } else {
        throw new Exception('Config bulunamadı: api/config.php oluşturun.');
    }
    return $cfg;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $cfg = get_config();
    $d = $cfg['db'];

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s;connect_timeout=10',
        $d['host'], (int)$d['port'], $d['name'], $d['charset']
    );

    try {
        $pdo = new PDO($dsn, $d['user'], $d['pass'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'hata' => 'Veritabanına bağlanılamadı.',
            'detay' => $cfg['site']['gelistirme'] ? $e->getMessage() : null,
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    return $pdo;
}
