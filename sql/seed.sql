-- ============================================================
-- Başlangıç verisi
-- ============================================================

-- 1. Varsayılan admin kullanıcı
-- DİKKAT: Parola hash'i KASITLI olarak geçersiz (*locked*) bırakılmıştır.
-- Kurulumdan sonra mutlaka:
--   docker compose exec -T web php api/install/admin-olustur.php
-- komutuyla gerçek bir parola atayın. Hash geçersiz olduğu için bu satır
-- olduğu hâliyle giriş izni VERMEZ — yani seed.sql üzerinden parola sızdırma
-- senaryosu kapatılmıştır.
INSERT INTO admin_kullanicilar (kullanici_adi, eposta, sifre_hash, ad_soyad, rol, aktif)
VALUES (
  'admin',
  'admin@ilkadimakademi.com',
  '*locked*',
  'Site Yöneticisi',
  'admin',
  1
) ON DUPLICATE KEY UPDATE kullanici_adi=kullanici_adi;

-- 2. Modül ayarları
INSERT INTO ayarlar (anahtar, deger) VALUES
  ('blog_aktif', '0'),
  ('blog_baslik', 'Blog'),
  ('blog_aciklama', 'Eğitim, sınav hazırlığı ve öğrenci gelişimi üzerine yazılarımız.')
ON DUPLICATE KEY UPDATE deger=VALUES(deger);

-- 3. Örnek blog yazısı (taslak)
INSERT INTO blog_yazilar (
  id, slug, baslik, ozet, icerik, kategori, etiketler, yazar_adi, yayinda, yayin_tarihi
) VALUES (
  'ornek-yazi-1',
  'lgs-hazirlik-surecinde-3-altin-kural',
  'LGS Hazırlık Sürecinde 3 Altın Kural',
  '8. sınıf öğrencileri için verimli çalışmanın temellerini ele aldığımız bu yazımızda…',
  '<h2>Doğru planlama</h2><p>Sınav hazırlığında en kritik konu plandır. Haftalık ve günlük plan yapmak, hem öğrencinin hem velinin yol haritasını netleştirir.</p><blockquote><p>"Başarı, küçük çabaların günlük tekrarıdır." — Robert Collier</p></blockquote><h2>Düzenli deneme</h2><p>Konuyu öğrenmek bir aşama; o konuyu test ortamında uygulamak başka. Deneme sınavlarını ihmal etmemek gerek.</p>',
  'sınav-hazırlık',
  'LGS,çalışma,verimlilik',
  'Site Yöneticisi',
  0,
  NOW()
) ON DUPLICATE KEY UPDATE slug=slug;
