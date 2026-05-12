<?php
/**
 * JSON yardımcıları, doğrulama, slugify, vb.
 */

declare(strict_types=1);

/* ============================================================
   JSON Cevaplar
============================================================ */
function json_cevap(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_hata(string $mesaj, int $code = 400, array $ek = []): void {
    json_cevap(['hata' => $mesaj] + $ek, $code);
}

function json_basari(array $data = [], string $mesaj = ''): void {
    json_cevap(['ok' => true] + ($mesaj ? ['mesaj' => $mesaj] : []) + $data);
}

/* ============================================================
   İstek (request) gövdesini oku
============================================================ */
function istek_govdesi(): array {
    $ham = file_get_contents('php://input');
    // Boş body geçerli — POST'ta da bazen boş gelir
    if ($ham === '' || $ham === false) return [];
    $veri = json_decode($ham, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        json_hata('Geçersiz JSON.', 400);
    }
    if (!is_array($veri)) {
        json_hata('Geçersiz JSON.', 400);
    }
    return $veri;
}

/* ============================================================
   Yardımcılar
============================================================ */
function slugify(string $s): string {
    $s = mb_strtolower($s, 'UTF-8');
    $tr = ['ı'=>'i','ş'=>'s','ğ'=>'g','ü'=>'u','ö'=>'o','ç'=>'c','İ'=>'i'];
    $s = strtr($s, $tr);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-') ?: 'baslik';
}

function benzersiz_id(string $prefix = ''): string {
    // microtime'ı tamsayıya çevir (PHP 8.2+ base_convert ondalık string sevmez)
    $ms = (int)(microtime(true) * 1000);
    return ($prefix ? $prefix . '-' : '')
         . base_convert((string)$ms, 10, 36)
         . '-' . bin2hex(random_bytes(3));
}

function gerekli_alanlar(array $veri, array $alanlar): void {
    $eksik = [];
    foreach ($alanlar as $a) {
        if (!isset($veri[$a]) || (is_string($veri[$a]) && trim($veri[$a]) === '')) {
            $eksik[] = $a;
        }
    }
    if ($eksik) {
        json_hata('Zorunlu alanlar eksik: ' . implode(', ', $eksik), 422, ['eksik' => $eksik]);
    }
}

/* ============================================================
   Method kontrolü
============================================================ */
function metod_kontrol(string|array $izinli): string {
    $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $izinli = is_array($izinli) ? $izinli : [$izinli];
    if (!in_array($m, $izinli, true)) {
        header('Allow: ' . implode(', ', $izinli));
        json_hata('Bu metot desteklenmiyor.', 405);
    }
    return $m;
}

/* ============================================================
   Nokta-yolu yardımcıları (ayarlar tablosu vb.)
============================================================ */
if (!function_exists('nokta_set')) {
    function nokta_set(array &$obj, string $yol, $deger): void {
        $parcalar = explode('.', $yol);
        $cur = &$obj;
        foreach ($parcalar as $i => $p) {
            if ($i === count($parcalar) - 1) {
                $cur[$p] = $deger;
            } else {
                if (!isset($cur[$p]) || !is_array($cur[$p])) $cur[$p] = [];
                $cur = &$cur[$p];
            }
        }
    }
}

if (!function_exists('nokta_duzlestir')) {
    function nokta_duzlestir($veri, string $prefix, array &$cikti): void {
        if (is_array($veri) && !empty($veri) && array_keys($veri) !== range(0, count($veri) - 1)) {
            // Associative array → ilerle
            foreach ($veri as $k => $v) {
                $yeni = $prefix === '' ? (string)$k : "$prefix.$k";
                nokta_duzlestir($v, $yeni, $cikti);
            }
        } else {
            $cikti[$prefix] = $veri;
        }
    }
}

/* ============================================================
   Blog HTML temizleyici — whitelist'e dayalı sanitize
============================================================ */
function blog_html_temizle(string $html): string {
    if ($html === '') return '';

    // 1) <script>...</script> bloklarını tamamen kaldır (regex)
    $html = preg_replace('#<script\b[^>]*>.*?</script>#is', '', $html) ?? $html;
    // <style> da güvenli değil — kaldır
    $html = preg_replace('#<style\b[^>]*>.*?</style>#is', '', $html) ?? $html;

    $izinli = [
        'p','br','h2','h3','h4','strong','em','u','blockquote',
        'ul','ol','li','a','img','pre','code','span',
    ];
    $izinliAttr = [
        'a'    => ['href','title','target','rel'],
        'img'  => ['src','alt','title','width','height'],
        'span' => ['class'],
        'code' => ['class'],
        'pre'  => ['class'],
    ];

    libxml_use_internal_errors(true);
    $doc = new DOMDocument('1.0', 'UTF-8');
    // UTF-8 koruması için meta charset ile sar
    $sarmal = '<?xml encoding="UTF-8"?><div>' . $html . '</div>';
    $yuklendi = $doc->loadHTML($sarmal, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NONET);
    libxml_clear_errors();
    if (!$yuklendi) return '';

    $xpath = new DOMXPath($doc);

    // Tüm elementleri tara — tag whitelist + attribute temizliği
    $tumElementler = iterator_to_array($xpath->query('//*'));
    foreach ($tumElementler as $el) {
        if (!($el instanceof DOMElement)) continue;
        $tag = strtolower($el->nodeName);
        if ($tag === 'div' && $el->parentNode instanceof DOMDocument) {
            // En dış sarmal div — atla
            continue;
        }
        if (!in_array($tag, $izinli, true)) {
            // İzinli değil → çocukları taşıyıp kendisini kaldır
            while ($el->firstChild) {
                $el->parentNode->insertBefore($el->firstChild, $el);
            }
            $el->parentNode->removeChild($el);
            continue;
        }

        // Attribute temizliği
        $silinecek = [];
        foreach (iterator_to_array($el->attributes) as $attr) {
            $ad = strtolower($attr->nodeName);
            $deger = $attr->nodeValue;
            // on*= her zaman yasak
            if (str_starts_with($ad, 'on')) {
                $silinecek[] = $attr->nodeName;
                continue;
            }
            $izinliAttrTag = $izinliAttr[$tag] ?? [];
            if (!in_array($ad, $izinliAttrTag, true)) {
                $silinecek[] = $attr->nodeName;
                continue;
            }
            // href / src protokol kısıtları
            if ($tag === 'a' && $ad === 'href') {
                if (!preg_match('#^(https?:|mailto:|tel:|/)#i', $deger)) {
                    $silinecek[] = $attr->nodeName;
                }
            }
            if ($tag === 'img' && $ad === 'src') {
                if (!preg_match('#^(/assets/|https://)#i', $deger)) {
                    $silinecek[] = $attr->nodeName;
                }
            }
        }
        foreach ($silinecek as $ad) {
            $el->removeAttribute($ad);
        }
    }

    // En dış sarmal div'in içeriğini geri al
    $kok = $doc->getElementsByTagName('div')->item(0);
    if (!$kok) return '';
    $sonuc = '';
    foreach ($kok->childNodes as $c) {
        $sonuc .= $doc->saveHTML($c);
    }
    return trim($sonuc);
}
