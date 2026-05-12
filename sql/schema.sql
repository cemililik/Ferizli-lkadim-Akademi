-- ============================================================
-- Ferizli İlk Adım Akademi — Veritabanı Şeması
-- Hedef: MySQL 5.7+ veya MariaDB 10.3+
-- Karakter seti: utf8mb4 (tam Türkçe + emoji desteği)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- AYARLAR (key-value)
-- Site geneli konfigürasyon: tel, adres, sosyal medya vb.
-- ============================================================
CREATE TABLE IF NOT EXISTS ayarlar (
  anahtar     VARCHAR(100) PRIMARY KEY,
  deger       LONGTEXT,
  guncelleme  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ADMIN KULLANICILAR
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_kullanicilar (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  kullanici_adi   VARCHAR(50)  NOT NULL UNIQUE,
  eposta          VARCHAR(120) UNIQUE,
  sifre_hash      VARCHAR(255) NOT NULL,
  ad_soyad        VARCHAR(120),
  rol             ENUM('admin','editor') NOT NULL DEFAULT 'admin',
  son_giris       DATETIME,
  aktif           TINYINT(1) NOT NULL DEFAULT 1,
  olusturulma     DATETIME DEFAULT CURRENT_TIMESTAMP,
  guncelleme      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_admin_son_giris (son_giris)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BLOG YAZILARI
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_yazilar (
  id              VARCHAR(40) PRIMARY KEY,
  slug            VARCHAR(220) NOT NULL UNIQUE,
  baslik          VARCHAR(255) NOT NULL,
  ozet            TEXT,
  icerik          LONGTEXT,         -- HTML (Quill output) veya JSON (editor.js)
  kapak_gorseli   LONGTEXT,         -- data URL (base64) veya dosya yolu
  kategori        VARCHAR(80),
  etiketler       VARCHAR(255),     -- virgülle ayrılmış
  yazar_id        INT,
  yazar_adi       VARCHAR(120),     -- yazarın o anki adının snapshot'ı
  yayinda         TINYINT(1) NOT NULL DEFAULT 0,
  one_cikan       TINYINT(1) NOT NULL DEFAULT 0,
  yayin_tarihi    DATETIME,
  okunma_sayisi   INT NOT NULL DEFAULT 0,
  olusturulma     DATETIME DEFAULT CURRENT_TIMESTAMP,
  guncelleme      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blog_slug (slug),
  INDEX idx_blog_yayin (yayinda, yayin_tarihi),
  INDEX idx_blog_kategori (kategori),
  FOREIGN KEY (yazar_id) REFERENCES admin_kullanicilar(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DUYURULAR (mevcut JSON yapısının migrate edileceği yer — şimdilik unused)
-- ============================================================
CREATE TABLE IF NOT EXISTS duyurular (
  id              VARCHAR(40) PRIMARY KEY,
  baslik          VARCHAR(255) NOT NULL,
  ozet            TEXT,
  icerik          LONGTEXT,
  kategori        VARCHAR(50)  DEFAULT 'genel',
  tarih           DATE         NOT NULL,
  kapak_gorseli   LONGTEXT,
  onemli          TINYINT(1)   NOT NULL DEFAULT 0,
  bagli_form_id   VARCHAR(40),
  yayinda         TINYINT(1)   NOT NULL DEFAULT 1,
  olusturulma     DATETIME DEFAULT CURRENT_TIMESTAMP,
  guncelleme      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_duy_tarih (tarih),
  INDEX idx_duy_kategori (kategori),
  INDEX idx_duy_yayinda (yayinda, tarih)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PROGRAMLAR
-- ============================================================
CREATE TABLE IF NOT EXISTS programlar (
  id              VARCHAR(40) PRIMARY KEY,
  ad              VARCHAR(255) NOT NULL,
  hedef_kitle     VARCHAR(255),
  kisa_aciklama   TEXT,
  ozellikler      JSON,
  ikon            VARCHAR(10),
  sira            INT NOT NULL DEFAULT 0,
  yayinda         TINYINT(1) NOT NULL DEFAULT 1,
  olusturulma     DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prog_sira (sira),
  INDEX idx_prog_yayinda (yayinda, sira)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- KADRO
-- ============================================================
CREATE TABLE IF NOT EXISTS kadro (
  id              VARCHAR(40) PRIMARY KEY,
  ad              VARCHAR(120) NOT NULL,
  brans           VARCHAR(120),
  unvan           VARCHAR(80) DEFAULT 'Branş Öğretmeni',
  mezuniyet       VARCHAR(255),
  deneyim_yil     INT,
  motto           TEXT,
  foto            LONGTEXT,
  sira            INT NOT NULL DEFAULT 0,
  yayinda         TINYINT(1) NOT NULL DEFAULT 1,
  olusturulma     DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_kadro_sira (sira),
  INDEX idx_kadro_yayinda (yayinda, sira)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- GALERİ
-- ============================================================
CREATE TABLE IF NOT EXISTS galeri_albumler (
  id          VARCHAR(40) PRIMARY KEY,
  ad          VARCHAR(120) NOT NULL,
  sira        INT NOT NULL DEFAULT 0,
  olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS galeri_gorseller (
  id          VARCHAR(40) PRIMARY KEY,
  album_id    VARCHAR(40),
  baslik      VARCHAR(255),
  src         LONGTEXT,
  tarih       DATE,
  sira        INT NOT NULL DEFAULT 0,
  olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES galeri_albumler(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- FORMLAR
-- ============================================================
CREATE TABLE IF NOT EXISTS formlar (
  id              VARCHAR(40) PRIMARY KEY,
  ad              VARCHAR(255) NOT NULL,
  aciklama        TEXT,
  tesekkur_mesaji TEXT,
  alanlar         JSON NOT NULL,
  yayinda         TINYINT(1) NOT NULL DEFAULT 0,
  varsayilan      TINYINT(1) NOT NULL DEFAULT 0,
  olusturulma     DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_cevaplari (
  id          VARCHAR(40) PRIMARY KEY,
  form_id     VARCHAR(40) NOT NULL,
  veriler     JSON NOT NULL,
  ip_adres    VARCHAR(45),
  user_agent  TEXT,
  okundu      TINYINT(1) NOT NULL DEFAULT 0,
  tarih       DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cevap_form (form_id),
  INDEX idx_cevap_tarih (tarih),
  INDEX idx_cevap_okundu (okundu, tarih),
  FOREIGN KEY (form_id) REFERENCES formlar(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- BİLDİRİMLER
-- ============================================================
CREATE TABLE IF NOT EXISTS bildirimler (
  id          VARCHAR(40) PRIMARY KEY,
  tur         VARCHAR(50) NOT NULL DEFAULT 'bilgi',
  baslik      VARCHAR(255),
  mesaj       TEXT,
  link        VARCHAR(500),
  okundu      TINYINT(1) NOT NULL DEFAULT 0,
  olusturulma DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bil_okundu (okundu),
  INDEX idx_bil_tarih (olusturulma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- İLİŞKİSEL KISITLAMALAR (sonradan eklenir — duyurular ↔ formlar arasında
-- döngüsel bağımlılık yaratmamak için CREATE TABLE içine değil, en sona alındı)
-- ============================================================
ALTER TABLE duyurular
  ADD CONSTRAINT fk_duy_bagli_form
  FOREIGN KEY (bagli_form_id) REFERENCES formlar(id) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;
