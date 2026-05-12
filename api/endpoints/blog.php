<?php
/**
 * /api/blog                GET    Yayında yazıları listele (public)
 * /api/blog?admin=1        GET    Tüm yazılar (auth gerekli)
 * /api/blog/:slug          GET    Tek yazı (yayında ise public, değilse auth)
 * /api/blog                POST   Yeni yazı (auth)
 * /api/blog/:id            PUT    Güncelle (auth)
 * /api/blog/:id            DELETE Sil (auth)
 *
 * /api/blog/durum          GET    Blog modülü aktif mi? (ayarlar tablosundan)
 * /api/blog/durum          PUT    Blog aktif/deaktif toggle (auth)
 */

declare(strict_types=1);

$parcalar = $GLOBALS['_yol_parcalari'];
$alt = $parcalar[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/* ============================================================
   ALT: durum (blog aktif mi)
============================================================ */
if ($alt === 'durum') {
    if ($method === 'GET') {
        $stmt = db()->prepare("SELECT deger FROM ayarlar WHERE anahtar='blog_aktif' LIMIT 1");
        $stmt->execute();
        $deger = (string)($stmt->fetchColumn() ?? '0');
        json_cevap(['aktif' => $deger === '1']);
    }
    if ($method === 'PUT') {
        auth_zorunlu();
        $v = istek_govdesi();
        $aktif = !empty($v['aktif']) ? '1' : '0';
        db()->prepare(
            "INSERT INTO ayarlar (anahtar, deger) VALUES ('blog_aktif', ?)
             ON DUPLICATE KEY UPDATE deger = VALUES(deger)"
        )->execute([$aktif]);
        json_basari(['aktif' => $aktif === '1'], 'Blog durumu güncellendi.');
    }
    json_hata('Bu metot desteklenmiyor.', 405);
}

/* ============================================================
   ALT: tekil yazı (slug ya da id) veya CRUD
============================================================ */

if ($alt !== '') {
    // /api/blog/:slug veya /api/blog/:id
    if ($method === 'GET') {
        $stmt = db()->prepare(
            "SELECT b.*,
                    COALESCE(u.ad_soyad, u.kullanici_adi, b.yazar_adi) AS yazar,
                    u.kullanici_adi AS yazar_kullanici_adi
               FROM blog_yazilar b
          LEFT JOIN admin_kullanicilar u ON u.id = b.yazar_id
              WHERE b.slug = ? OR b.id = ? LIMIT 1"
        );
        $stmt->execute([$alt, $alt]);
        $y = $stmt->fetch();
        if (!$y) json_hata('Yazı bulunamadı.', 404);

        $u = mevcut_kullanici();
        if (!$y['yayinda'] && !$u) {
            json_hata('Bu yazı yayında değil.', 404);
        }

        // Okunma sayısını artır (sadece public görüntülemede)
        if ($y['yayinda'] && !$u) {
            db()->prepare('UPDATE blog_yazilar SET okunma_sayisi = okunma_sayisi + 1 WHERE id = ?')
               ->execute([$y['id']]);
            $y['okunma_sayisi'] = (int)$y['okunma_sayisi'] + 1;
        }

        $y['yayinda'] = (bool)$y['yayinda'];
        $y['one_cikan'] = (bool)$y['one_cikan'];
        $y['etiketler'] = $y['etiketler'] ? array_values(array_filter(array_map('trim', explode(',', $y['etiketler'])))) : [];
        // yazar_adi'yi dinamik join sonucuyla değiştir
        $y['yazar_adi'] = $y['yazar'] ?? $y['yazar_adi'];
        unset($y['yazar']);

        // Önceki / sonraki yayında yazılar (gezinmek için)
        $oncekiStmt = db()->prepare(
            "SELECT slug, baslik FROM blog_yazilar
              WHERE yayinda = 1 AND yayin_tarihi < ?
           ORDER BY yayin_tarihi DESC LIMIT 1"
        );
        $oncekiStmt->execute([$y['yayin_tarihi']]);
        $onceki = $oncekiStmt->fetch();

        $sonrakiStmt = db()->prepare(
            "SELECT slug, baslik FROM blog_yazilar
              WHERE yayinda = 1 AND yayin_tarihi > ?
           ORDER BY yayin_tarihi ASC LIMIT 1"
        );
        $sonrakiStmt->execute([$y['yayin_tarihi']]);
        $sonraki = $sonrakiStmt->fetch();

        json_cevap([
            'yazi'    => $y,
            'onceki'  => $onceki ?: null,
            'sonraki' => $sonraki ?: null,
        ]);
    }

    if ($method === 'PUT') {
        $kul = auth_zorunlu();
        $v = istek_govdesi();
        $id = $alt;

        $stmt = db()->prepare('SELECT * FROM blog_yazilar WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $mevcut = $stmt->fetch();
        if (!$mevcut) json_hata('Yazı bulunamadı.', 404);

        // Yazar değiştirme: sadece admin rolü
        $yeniYazarId = $mevcut['yazar_id'];
        $yeniYazarAdi = $mevcut['yazar_adi'];
        if (array_key_exists('yazarId', $v) && $kul['rol'] === 'admin') {
            $yId = $v['yazarId'] !== null && $v['yazarId'] !== '' ? (int)$v['yazarId'] : null;
            if ($yId) {
                $stmt2 = db()->prepare('SELECT id, ad_soyad, kullanici_adi FROM admin_kullanicilar WHERE id = ?');
                $stmt2->execute([$yId]);
                $yenu = $stmt2->fetch();
                if (!$yenu) json_hata('Yazar olarak seçilen kullanıcı bulunamadı.', 422);
                $yeniYazarId = (int)$yenu['id'];
                $yeniYazarAdi = $yenu['ad_soyad'] ?: $yenu['kullanici_adi'];
            } else {
                $yeniYazarId = null;
                $yeniYazarAdi = $mevcut['yazar_adi'];
            }
        }

        $baslik = trim((string)($v['baslik'] ?? $mevcut['baslik']));
        $slug = trim((string)($v['slug'] ?? $mevcut['slug'])) ?: slugify($baslik);
        // Slug çakışmasını engelle
        if ($slug !== $mevcut['slug']) {
            $c = db()->prepare('SELECT 1 FROM blog_yazilar WHERE slug = ? AND id != ?');
            $c->execute([$slug, $id]);
            if ($c->fetchColumn()) $slug = $slug . '-' . substr($id, -4);
        }

        $etiketler = isset($v['etiketler'])
            ? (is_array($v['etiketler']) ? implode(',', array_map('trim', $v['etiketler'])) : (string)$v['etiketler'])
            : $mevcut['etiketler'];

        $yayindaYeni = isset($v['yayinda']) ? (int)(bool)$v['yayinda'] : (int)$mevcut['yayinda'];
        // Yayın tarihi: yeni yayına alındıysa DB'nin NOW()'unu kullan (timezone tutarlılığı)
        $yayinTarihiSet = (!$mevcut['yayinda'] && $yayindaYeni) ? 'NOW()' : '?';

        $sql = "UPDATE blog_yazilar SET
                    slug=?, baslik=?, ozet=?, icerik=?, kapak_gorseli=?,
                    kategori=?, etiketler=?, yayinda=?, one_cikan=?,
                    yazar_id=?, yazar_adi=?,
                    yayin_tarihi=$yayinTarihiSet
                  WHERE id=?";
        $icerikYeni = array_key_exists('icerik', $v)
            ? blog_html_temizle((string)$v['icerik'])
            : (string)($mevcut['icerik'] ?? '');
        $params = [
            $slug,
            $baslik,
            (string)($v['ozet'] ?? $mevcut['ozet'] ?? ''),
            $icerikYeni,
            (string)($v['kapakGorseli'] ?? $v['kapak_gorseli'] ?? $mevcut['kapak_gorseli'] ?? ''),
            (string)($v['kategori'] ?? $mevcut['kategori'] ?? ''),
            $etiketler,
            $yayindaYeni,
            isset($v['oneCikan']) ? (int)(bool)$v['oneCikan'] : (int)$mevcut['one_cikan'],
            $yeniYazarId,
            $yeniYazarAdi,
        ];
        if ($yayinTarihiSet === '?') $params[] = $mevcut['yayin_tarihi'];
        $params[] = $id;

        db()->prepare($sql)->execute($params);

        json_basari(['id' => $id, 'slug' => $slug], 'Yazı güncellendi.');
    }

    if ($method === 'DELETE') {
        auth_zorunlu();
        $stmt = db()->prepare('DELETE FROM blog_yazilar WHERE id = ?');
        $stmt->execute([$alt]);
        if ($stmt->rowCount() === 0) json_hata('Yazı bulunamadı.', 404);
        json_basari([], 'Yazı silindi.');
    }

    json_hata('Bu metot desteklenmiyor.', 405);
}

/* ============================================================
   Kök: liste veya yeni yazı oluştur
============================================================ */

if ($method === 'GET') {
    $adminGoruntu = !empty($_GET['admin']);
    $sayfa = max(1, (int)($_GET['sayfa'] ?? 1));
    $sayfaBoyutu = min(50, max(1, (int)($_GET['boyut'] ?? 20)));
    $offset = ($sayfa - 1) * $sayfaBoyutu;

    if ($adminGoruntu) {
        auth_zorunlu();
        $sql = "SELECT b.id, b.slug, b.baslik, b.ozet, b.kategori, b.etiketler,
                       b.yayinda, b.one_cikan, b.yayin_tarihi, b.olusturulma, b.guncelleme,
                       b.okunma_sayisi, b.yazar_id,
                       COALESCE(u.ad_soyad, u.kullanici_adi, b.yazar_adi) AS yazar_adi,
                       u.kullanici_adi AS yazar_kullanici_adi
                  FROM blog_yazilar b
             LEFT JOIN admin_kullanicilar u ON u.id = b.yazar_id
              ORDER BY b.guncelleme DESC
                 LIMIT :limit OFFSET :offset";
        $stmt = db()->prepare($sql);
        $stmt->bindValue(':limit', $sayfaBoyutu, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
    } else {
        // Public filtreler
        $where = ['b.yayinda = 1'];
        $params = [];

        $etiket = trim((string)($_GET['etiket'] ?? ''));
        if ($etiket !== '') {
            $where[] = "FIND_IN_SET(?, b.etiketler) > 0";
            $params[] = $etiket;
        }
        $yazar = trim((string)($_GET['yazar'] ?? ''));
        if ($yazar !== '') {
            // Yazar kullanıcı adı veya ad_soyad ile arama
            $where[] = "(u.kullanici_adi = ? OR u.ad_soyad = ? OR b.yazar_adi = ?)";
            array_push($params, $yazar, $yazar, $yazar);
        }
        $arama = trim((string)($_GET['q'] ?? ''));
        if ($arama !== '') {
            $where[] = "(b.baslik LIKE ? OR b.ozet LIKE ? OR b.icerik LIKE ?)";
            $like = '%' . $arama . '%';
            array_push($params, $like, $like, $like);
        }
        $kategori = trim((string)($_GET['kategori'] ?? ''));
        if ($kategori !== '') {
            $where[] = 'b.kategori = ?';
            $params[] = $kategori;
        }

        $whereSql = implode(' AND ', $where);
        $sql = "SELECT b.id, b.slug, b.baslik, b.ozet, b.kapak_gorseli, b.kategori, b.etiketler,
                       COALESCE(u.ad_soyad, u.kullanici_adi, b.yazar_adi) AS yazar_adi,
                       u.kullanici_adi AS yazar_kullanici_adi,
                       b.yayin_tarihi, b.okunma_sayisi
                  FROM blog_yazilar b
             LEFT JOIN admin_kullanicilar u ON u.id = b.yazar_id
                 WHERE $whereSql
              ORDER BY b.one_cikan DESC, b.yayin_tarihi DESC, b.olusturulma DESC
                 LIMIT :limit OFFSET :offset";
        $stmt = db()->prepare($sql);
        foreach ($params as $i => $p) {
            $stmt->bindValue($i + 1, $p);
        }
        $stmt->bindValue(':limit', $sayfaBoyutu, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
    }
    $liste = $stmt->fetchAll();
    foreach ($liste as &$y) {
        if (isset($y['yayinda'])) $y['yayinda'] = (bool)$y['yayinda'];
        if (isset($y['one_cikan'])) $y['one_cikan'] = (bool)$y['one_cikan'];
        $y['etiketler'] = $y['etiketler']
            ? array_values(array_filter(array_map('trim', explode(',', $y['etiketler']))))
            : [];
    }

    // Toplam sayı (filtreyle uyumlu)
    if ($adminGoruntu) {
        $toplam = (int)db()->query('SELECT COUNT(*) FROM blog_yazilar')->fetchColumn();
    } else {
        $countSql = "SELECT COUNT(*) FROM blog_yazilar b
                      LEFT JOIN admin_kullanicilar u ON u.id = b.yazar_id
                      WHERE " . ($whereSql ?? 'b.yayinda = 1');
        $cstmt = db()->prepare($countSql);
        $cstmt->execute($params ?? []);
        $toplam = (int)$cstmt->fetchColumn();
    }

    json_cevap([
        'yazilar' => $liste,
        'toplam'  => $toplam,
        'sayfa'   => $sayfa,
        'boyut'   => $sayfaBoyutu,
    ]);
}

if ($method === 'POST') {
    $u = auth_zorunlu();
    $v = istek_govdesi();
    gerekli_alanlar($v, ['baslik']);

    $baslik = trim((string)$v['baslik']);
    $slugBase = trim((string)($v['slug'] ?? '')) ?: slugify($baslik);
    // Slug benzersiz olsun
    $slug = $slugBase;
    $sayac = 1;
    do {
        $c = db()->prepare('SELECT 1 FROM blog_yazilar WHERE slug = ?');
        $c->execute([$slug]);
        if (!$c->fetchColumn()) break;
        $slug = $slugBase . '-' . (++$sayac);
    } while (true);

    $id = benzersiz_id('blog');
    $etiketler = isset($v['etiketler'])
        ? (is_array($v['etiketler']) ? implode(',', array_map('trim', $v['etiketler'])) : (string)$v['etiketler'])
        : '';
    $yayinda = !empty($v['yayinda']) ? 1 : 0;
    $yayinTarihiSet = $yayinda ? 'NOW()' : 'NULL';

    // Yazar: admin role başka birini atayabilir, editor kendi adına
    $yazarId = (int)$u['id'];
    $yazarAdi = (string)($u['ad_soyad'] ?? $u['kullanici_adi']);
    if (!empty($v['yazarId']) && $u['rol'] === 'admin') {
        $stmt = db()->prepare('SELECT id, ad_soyad, kullanici_adi FROM admin_kullanicilar WHERE id = ?');
        $stmt->execute([(int)$v['yazarId']]);
        $yenu = $stmt->fetch();
        if (!$yenu) json_hata('Yazar olarak seçilen kullanıcı bulunamadı.', 422);
        $yazarId = (int)$yenu['id'];
        $yazarAdi = $yenu['ad_soyad'] ?: $yenu['kullanici_adi'];
    }

    $sql = "INSERT INTO blog_yazilar
                (id, slug, baslik, ozet, icerik, kapak_gorseli, kategori, etiketler,
                 yazar_id, yazar_adi, yayinda, one_cikan, yayin_tarihi)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, $yayinTarihiSet)";

    $icerikTemiz = blog_html_temizle((string)($v['icerik'] ?? ''));
    $insParams = function($slugArg) use ($id, $baslik, $v, $etiketler, $yazarId, $yazarAdi, $yayinda, $icerikTemiz) {
        return [
            $id, $slugArg, $baslik,
            (string)($v['ozet'] ?? ''),
            $icerikTemiz,
            (string)($v['kapakGorseli'] ?? $v['kapak_gorseli'] ?? ''),
            (string)($v['kategori'] ?? ''),
            $etiketler,
            $yazarId,
            $yazarAdi,
            $yayinda,
            !empty($v['oneCikan']) ? 1 : 0,
        ];
    };

    try {
        db()->prepare($sql)->execute($insParams($slug));
    } catch (PDOException $e) {
        // Duplicate key (slug çakışması) — 1 kez random suffix ile retry
        if ($e->getCode() === '23000') {
            $slug = $slugBase . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
            db()->prepare($sql)->execute($insParams($slug));
        } else {
            throw $e;
        }
    }

    json_basari(['id' => $id, 'slug' => $slug], 'Yazı oluşturuldu.');
}

json_hata('Bu metot desteklenmiyor.', 405);
