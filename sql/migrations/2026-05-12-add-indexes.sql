-- ============================================================
-- Migration: 2026-05-12-add-indexes
--
-- Amaç:
--   - Sık çalışan WHERE/ORDER BY sorgularını hızlandıracak compound index'ler
--     ve son_giris üzerine tekil index ekler.
--
-- Bağlam:
--   - schema.sql (fresh kurulum yapan) bu index'leri zaten CREATE TABLE
--     içine almıştır. Bu dosya, schema'yı önceden uygulamış MEVCUT
--     kurulumlar için "tek seferlik bakım scripti"dir.
--
-- Uygulama:
--   docker compose exec -T db mariadb -u root -p"$DB_ROOT_PASSWORD" "$DB_NAME" \
--       < sql/migrations/2026-05-12-add-indexes.sql
--
-- DİKKAT:
--   - MariaDB "CREATE INDEX IF NOT EXISTS" destekler; o yüzden idempotent.
--   - MySQL 5.7 IF NOT EXISTS desteklemez — orada zaten varsa hata
--     verir (yok sayabilirsiniz).
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_duy_yayinda      ON duyurular           (yayinda, tarih);
CREATE INDEX IF NOT EXISTS idx_prog_yayinda     ON programlar          (yayinda, sira);
CREATE INDEX IF NOT EXISTS idx_kadro_yayinda    ON kadro               (yayinda, sira);
CREATE INDEX IF NOT EXISTS idx_cevap_okundu     ON form_cevaplari      (okundu, tarih);
CREATE INDEX IF NOT EXISTS idx_admin_son_giris  ON admin_kullanicilar  (son_giris);
