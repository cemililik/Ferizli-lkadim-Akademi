-- ============================================================
-- 001 — Modül aç/kapa ayarları + Hakkımızda içerik alanları
-- ============================================================
-- moduller.<X> anahtarları: hakkımızda, programlar, kadro, duyurular, galeri
-- → varsayılan tümü AÇIK (1). Kullanıcı admin'den kapatabilir.
-- hakkimizda.<X> anahtarları: sayfa içeriği (kuruluş hikâyesi, misyon,
-- vizyon, değerler, kurucu mesajı, imza) — admin/ayarlar üzerinden düzenlenir.
-- ============================================================

INSERT INTO ayarlar (anahtar, deger) VALUES
  ('moduller.hakkimizda', '1'),
  ('moduller.programlar', '1'),
  ('moduller.kadro',      '1'),
  ('moduller.duyurular',  '1'),
  ('moduller.galeri',     '1'),
  ('moduller.blog',       '0'),

  ('hakkimizda.hikayeMetni1',
   '<strong>Özel Ferizli İlk Adım Akademi</strong>, 2023 yılında Ferizli''de kurulmuş bir özel öğretim kursudur. Ortaokul ve lise düzeyindeki öğrencilerimize sınav hazırlık, takviye ve etüt programları sunuyoruz.'),
  ('hakkimizda.hikayeMetni2',
   'Akademik programımız ve eğitim kadromuzla, öğrencilerimizin sadece sınav başarısına değil, hayata hazırlanmasına da katkı sağlamayı hedefliyoruz. Modern eğitim anlayışı ile sıcak bir kurum kültürünü birleştirerek, her bir öğrencimizin potansiyelinin zirvesine ulaşması için çalışıyoruz.'),
  ('hakkimizda.misyon',
   'Her öğrenciyi potansiyelinin zirvesine taşımak. Akademik başarının yanında, karakter gelişimine ve sorumluluk duygusuna katkı sağlamak.'),
  ('hakkimizda.vizyon',
   'Ferizli ve çevresinde adı güvenle anılan, mezunlarının gururla andığı, sürekli kendini yenileyen bir eğitim kurumu olmak.'),
  ('hakkimizda.degerler',
   'Disiplinli çalışma ortamı, samimi öğretmen-öğrenci ilişkisi, veliye karşı şeffaflık ve sürekli iyileştirme anlayışı.'),
  ('hakkimizda.kurucuMesajiBaslik',
   'Eğitim, doğru adımlarla başlar.'),
  ('hakkimizda.kurucuMesajiMetni',
   'Sevgili veliler ve öğrenciler, kurumumuzun ilk gününden bugüne kadar hedefimiz hep aynı oldu: her bir öğrencimizin akademik ve kişisel gelişimine destek olmak. Modern eğitim anlayışı ile sıcak bir kurum kültürünü birleştirerek, sizleri en iyi şekilde geleceğe hazırlamak için buradayız.'),
  ('hakkimizda.kurucuImza', 'Kurum Yönetimi'),
  ('hakkimizda.kurucuFoto', '')
ON DUPLICATE KEY UPDATE anahtar = anahtar;

-- Eski blog_aktif anahtarındaki değeri (varsa) yeni moduller.blog'a aktar.
-- ON DUPLICATE KEY UPDATE deger = VALUES(deger) burada kasıtlı — kullanıcının
-- mevcut tercihini korumak için eski değer öncelikli olur.
INSERT INTO ayarlar (anahtar, deger)
SELECT 'moduller.blog', deger FROM ayarlar WHERE anahtar = 'blog_aktif'
ON DUPLICATE KEY UPDATE deger = VALUES(deger);
