# PHP + MySQL Kurulum Rehberi

Site **tamamen PHP+MySQL backend** üzerinde çalışıyor:
- **Frontend:** Statik HTML/CSS/JS (admin paneli + ziyaretçi sayfaları)
- **Backend:** PHP REST API (`/api/...`)
- **Veritabanı:** MySQL 5.7+ veya MariaDB 10.3+

Tüm içerik (duyurular, programlar, kadro, galeri, formlar, cevaplar, blog, ayarlar) veritabanında tutulur. Eski JSON dosyaları geliştirme/yedek için kalır ama **artık kullanılmaz**.

---

## 🚀 Hızlı Başlangıç (Docker — en kolay yol)

Tek komutla **PHP + MariaDB + phpMyAdmin** ayağa kalkar. Şema otomatik içe aktarılır, örnek admin kullanıcı oluşur.

### Gereken
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (macOS / Windows / Linux)
- 5 dakika

### Adımlar

```bash
# 0. Ortam değişkenlerini hazırla (DB şifreleri vb.)
cp .env.example .env
# .env dosyasını aç, DB_ROOT_PASSWORD ve DB_PASSWORD değerlerini güçlü
# parolalarla değiştir. (.env GIT'E EKLENMEZ.)

# 1. Container'ları başlat (ilk çalıştırmada ~2 dakika sürer, image'lar indirilir)
docker compose up -d
# phpMyAdmin de istiyorsan (opsiyonel):
docker compose --profile dev up -d

# 2. Veritabanı hazır oldu mu kontrol et
docker compose logs db | grep "ready for connections"

# 3. İlk admin kullanıcıyı oluştur (seed.sql artık parola hash'i içermiyor)
docker compose exec -T web php api/install/admin-olustur.php

# 4. Tarayıcıdan aç
open http://localhost:8088         # Site
open http://localhost:8088/admin/  # Admin paneli
open http://localhost:8081         # phpMyAdmin (sadece --profile dev ile)
```

### Varsayılan giriş bilgileri
- **Admin paneli:** `admin-olustur.php` ile az önce belirlediğiniz kullanıcı adı + parola.
- **MySQL:** `.env` dosyasındaki `DB_USER` / `DB_PASSWORD`, DB `${DB_NAME}`.
- **phpMyAdmin root:** kullanıcı `root`, parola `.env` dosyasındaki `DB_ROOT_PASSWORD`.

> Not: `seed.sql` artık admin parola hash'i içermiyor (varsayılan satır `*locked*` ile devre dışı). İlk admin'i oluşturmak için yukarıdaki **3. adım** zorunludur.

### Yararlı komutlar

```bash
# Durdur (verileri korur)
docker compose down

# Sıfırla (DB dahil her şeyi temizler)
docker compose down -v

# Logları izle
docker compose logs -f web         # PHP error log
docker compose logs -f db          # MariaDB log

# Container içine gir (terminal)
docker compose exec web bash       # PHP container
docker compose exec db mariadb -u root -prootpass ilkadim_db

# Mevcut JSON verilerini DB'ye al (sadece CLI'dan — web'den 403)
docker compose exec -T web php api/install/import-json.php

# İlk admin kullanıcıyı yarat / parola sıfırla (sadece CLI'dan — web'den 403)
docker compose exec -T web php api/install/admin-olustur.php
```

### Port çakışmaları

Docker Compose şu portları kullanır — kullanımdaysa `docker-compose.yml`'i düzenle:
- `8088` → site (Apache)
- `8081` → phpMyAdmin
- `3307` → MariaDB (MAMP 8889 ile çakışmasın diye 3307)

Hangi servisin portu tuttuğunu görmek için:
```bash
lsof -i :8088    # macOS / Linux
```

---

## 🛠 Alternatif: Docker Olmadan Lokal Kurulum

Docker kullanmak istemiyorsanız MAMP/XAMPP ile de çalışır.

---

### macOS — MAMP ile

1. **MAMP'ı indir:** https://www.mamp.info/en/downloads/ (ücretsiz sürüm yeterli)
2. **Kur ve başlat.** MAMP penceresinde **"Start Servers"**.
3. **Document Root'u proje klasörüne yönlendir:**
   - MAMP → Preferences → Web Server → Document Root → "Choose..."
   - `/Users/dev/Documents/Projects/FerizliIlkadimDersane` seç
   - "OK" → MAMP otomatik yeniden başlatır.

4. **MySQL bağlantı bilgilerini öğren:**
   - MAMP penceresinde "Open WebStart page" → bilgiler görünür
   - Varsayılan: host `localhost`, port `8889` (MAMP) ya da `3306`, kullanıcı `root`, şifre `root`

5. **phpMyAdmin'i aç:** WebStart sayfasında "phpMyAdmin" bağlantısı.
   - Sol üst "Yeni" → veritabanı adı: `ilkadim_db`
   - **Karakter seti:** `utf8mb4_unicode_ci` (önemli!)
   - "Oluştur"

6. **Şemayı içe aktar:**
   - phpMyAdmin'de `ilkadim_db` seçili → üst menü "İçe Aktar"
   - "Dosya Seç" → `sql/schema.sql`
   - Aşağıda "Git" → tablolar oluşur.
   - Tekrar "İçe Aktar" → `sql/seed.sql` (varsayılan admin kullanıcısı eklenir)

7. **`api/config.php` oluştur:**
   ```bash
   cp api/config.example.php api/config.php
   ```
   `api/config.php` dosyasını aç ve düzenle:
   ```php
   'db' => [
       'host'    => 'localhost',
       'port'    => 8889,           // MAMP varsayılanı
       'name'    => 'ilkadim_db',
       'user'    => 'root',
       'pass'    => 'root',
       'charset' => 'utf8mb4',
   ],
   ```

8. **Tarayıcıda aç:** http://localhost:8888 → site açılır, http://localhost:8888/api/ → "İlk Adım Akademi API" yazısı.

### Windows / Linux — XAMPP ile

1. **XAMPP'ı indir:** https://www.apachefriends.org/
2. **Kur, başlat.** Control Panel'de Apache + MySQL → "Start"
3. **Document Root:** Genelde `c:\xampp\htdocs\` (Windows). Proje klasörünü oraya kopyala veya symlink at.
4. **phpMyAdmin:** http://localhost/phpmyadmin
5. Yukarıdaki MAMP adımlarının (5)–(8). adımlarını aynen uygula. **Tek fark:** XAMPP'ta port `3306`, şifre genelde boş (`''`).

### Doğrulama

Tarayıcıdan:
- http://localhost/ → site açılıyor mu?
- http://localhost/api/ → JSON `{"ok": true, "mesaj": "İlk Adım Akademi API"}` görüyor musun?
- http://localhost/admin/ → admin paneli açılıyor mu?

**Hata alıyorsan:**
- `api/config.php` doğru mu?
- DB bağlantısı çalışıyor mu? phpMyAdmin'den `ilkadim_db.admin_kullanicilar` tablosunda bir kayıt görüyor musun?
- Apache `mod_rewrite` aktif mi? (XAMPP/MAMP'ta varsayılan aktif)

---

## 2. Canlı Hosting (cPanel + PHP+MySQL)

Türk hosting şirketlerinin (Natro, Turhost, Sadecehosting, Hosting Türkiye vb.) **shared PHP+MySQL** paketleri yıllık 100–400₺ aralığında. PHP 7.4 / 8.x ve MySQL 5.7+ / MariaDB 10.3+ destekleyen herhangi biri yeterli.

### Adım 1 — Hostingi al ve domain'i bağla

- Hosting paketi al
- Alan adını (örn. `ferizliilkadimakademi.com`) hosting paneline yönlendir
- Hosting paneli **cPanel** olmalı (en yaygın)

### Adım 2 — Veritabanı oluştur

cPanel'de:
1. **"MySQL Veritabanları"** → yeni veritabanı: `kullanici_ilkadim` (cPanel kullanıcı adını otomatik prefix yapar)
2. **Yeni kullanıcı** oluştur: `kullanici_ilkadim_user`, güçlü bir şifre belirle
3. **"Kullanıcıyı veritabanına ekle"** → "ALL PRIVILEGES" işaretle → "Make Changes"

Bilgileri bir yere not et:
- Host: `localhost`
- Veritabanı adı: `kullanici_ilkadim`
- Kullanıcı: `kullanici_ilkadim_user`
- Şifre: belirlediğin şifre

### Adım 3 — Şemayı yükle

cPanel'de:
1. **phpMyAdmin** → `kullanici_ilkadim` seç → "İçe Aktar"
2. `sql/schema.sql` yükle
3. `sql/seed.sql` yükle

### Adım 4 — Dosyaları yükle

İki yöntem:

**Yöntem A — Git ile (önerilen):**
- cPanel → **Git Version Control** → repo'yu bağla
- Yeni push otomatik deploy olur

**Yöntem B — FTP/File Manager:**
- Tüm proje klasörünü hosting'in `public_html/` (veya domain klasörü) içine yükle
- `api/config.php` dosyasını **hosting paneli üzerinde** oluştur (git'e girmemeli)

### Adım 5 — config.php'yi düzenle

cPanel → File Manager → `api/config.example.php`'i kopyala → `api/config.php` olarak adlandır → düzenle:

```php
'db' => [
    'host' => 'localhost',
    'port' => 3306,
    'name' => 'kullanici_ilkadim',
    'user' => 'kullanici_ilkadim_user',
    'pass' => 'belirlediğin-şifre',
    'charset' => 'utf8mb4',
],
'site' => [
    'url' => 'https://ferizliilkadimakademi.com',
    'gelistirme' => false,        // ← production'da false!
],
'session' => [
    'secure' => true,             // ← HTTPS varsa true (Let's Encrypt cPanel'de 1-tık)
    ...
],
```

### Adım 6 — Test

- https://ferizliilkadimakademi.com → site açılıyor mu?
- https://ferizliilkadimakademi.com/api/ → JSON cevap geliyor mu?
- https://ferizliilkadimakademi.com/admin/ → admin login açılıyor mu?
- Giriş: kullanıcı adı `admin`, şifre `ilkadim2026` (sonra mutlaka değiştir — bkz. Bölüm 3)

**Hata:** "500 Internal Server Error"
→ `api/config.php` yok ya da DB bilgileri yanlış. cPanel → Error Logs ile detay.

**Hata:** ".htaccess çalışmıyor"
→ Apache `mod_rewrite` aktif değil. Hosting destek ekibine sor (genelde varsayılan açık).

---

## 3. Admin Şifresini Değiştir

**İlk girişten sonra mutlaka değiştirin.** Varsayılan şifre `ilkadim2026` ve seed.sql ile herkes biliyor.

**Önerilen yol (UI üzerinden):**
1. `/admin/` adresine giriş yapın
2. Sağ üstte **Kullanıcılar** menüsüne tıklayın
3. **🔑 Şifremi Değiştir** düğmesine basın
4. Mevcut şifre + yeni şifre (min 8 karakter) ile değiştirin

**Acil yol (UI'a erişilemiyorsa):**

phpMyAdmin'de SSH ile yeni hash üret:
```bash
php -r "echo password_hash('YENI_SIFRE', PASSWORD_DEFAULT) . PHP_EOL;"
```
Çıkan hash'i kopyala (`$2y$12$...` ile başlar) → phpMyAdmin → `admin_kullanicilar.sifre_hash` kolonuna yapıştır.

---

## 4. Yedekleme

**Düzenli yedek almanız ŞART** — yazı/cevap/görsel birikince geri dönüş yok.

**İki şeyi birlikte yedekleyin:**
1. **Veritabanı** (`mysqldump`) — tüm içerik metadata'sı
2. **`assets/uploads/`** — yüklenen tüm görseller (kullanıcı verisi!)

Yalnızca DB yedekleyip görsel klasörünü atlarsanız: restore sonrası tüm görsellerin yerinde **kırık ikon** çıkar.

### Komut satırından — Tam yedek (önerilen)

```bash
# /opt/yedek/2026-05-12/ gibi tarihli klasör oluştur ve hem DB hem görselleri at
TARIH=$(date +%Y-%m-%d)
mkdir -p yedek-$TARIH

# 1) Veritabanı
mysqldump -u USER -p ilkadim_db --single-transaction --quick \
  | gzip > yedek-$TARIH/db.sql.gz

# 2) Görseller (tar+gzip)
tar czf yedek-$TARIH/uploads.tar.gz assets/uploads/

# 3) Boyut kontrolü
du -sh yedek-$TARIH/*
```

### Geri yükleme

```bash
# DB
gunzip < yedek-2026-05-12/db.sql.gz | mysql -u USER -p ilkadim_db

# Görseller
tar xzf yedek-2026-05-12/uploads.tar.gz -C /yol/proje/
```

### Docker ile (lokal geliştirme)

```bash
# Yedek al
docker compose exec -T db mariadb-dump -u root -prootpass ilkadim_db \
  | gzip > yedek-db.sql.gz
tar czf yedek-uploads.tar.gz assets/uploads/

# Geri yükle
gunzip < yedek-db.sql.gz | docker compose exec -T db mariadb -u root -prootpass ilkadim_db
tar xzf yedek-uploads.tar.gz
```

### cPanel'den

- **MySQL kısmı:** cPanel → **Backup** → "Download a MySQL Database Backup"
- **Görsel kısmı:** File Manager → `assets/uploads/` klasörünü → "Compress" → indir
- **Veya:** cPanel → Backup Wizard → "Full Account Backup" (hem DB hem dosyalar)

### Otomatik günlük yedek (cron)

```bash
# crontab -e
# Her gece 03:00'da yedek al, 30 günden eski olanları sil
0 3 * * * cd /home/USER/public_html && \
  TARIH=$(date +\%F) && mkdir -p yedek/$TARIH && \
  mysqldump -u USER -pSIFRE ilkadim_db | gzip > yedek/$TARIH/db.sql.gz && \
  tar czf yedek/$TARIH/uploads.tar.gz assets/uploads/ && \
  find yedek -mindepth 1 -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \;
```

### Yedek nereye gitsin?

- **Same-host:** kabul edilebilir ama hosting çökerse hepsi gider
- **Önerilen:** S3 / Backblaze B2 / Google Drive / kendi başka sunucu → günlük rsync
- En azından: ayda bir manuel olarak yerel bilgisayara indir

---

## 5. Mevcut JSON Verilerini DB'ye Aktarma

Eski `data/*.json` dosyalarındaki içerikleri otomatik DB'ye alabilirsiniz:

**Komut satırından (önerilen):**
```bash
php api/install/import-json.php
```

**Tarayıcıdan (sadece geliştirme modunda):**
```
http://localhost/api/install/import-json.php
```

Script idempotenttir — tekrar çalıştırılması güvenli, mevcut kayıtların üzerine yazmaz.

## 6. Kullanıcı Yönetimi

**Varsayılan giriş bilgileri:**
- Kullanıcı adı: `admin`
- Şifre: `ilkadim2026`

**İlk girişten sonra:**
1. `/admin/` → giriş yap
2. **Kullanıcılar** menüsüne git
3. **🔑 Şifremi Değiştir** ile şifrenizi güncelleyin (en az 8 karakter)
4. Yeni admin/editör kullanıcılar eklemek için **+ Yeni Kullanıcı**

**Roller:**
- **Yönetici (admin):** Tüm yetki + kullanıcı ekleme/silme
- **Editör (editor):** İçerik düzenleme (duyuru, blog, kadro vb.) — kullanıcı yönetimine erişemez

Sistem **son aktif admin kullanıcısının silinmesini engeller** (kilitlenmeyi önler).

---

## 6. Sık Karşılaşılan Sorunlar

**"Sunucuya ulaşılamıyor" (admin'de)**
→ `api/config.php` yok veya DB bilgileri hatalı

**"PDO yüklü değil"**
→ Hosting'de PHP `pdo_mysql` extension'ı kapalı; hosting destek

**Türkçe karakterler bozuk**
→ DB karakter seti `utf8mb4_unicode_ci` olmalı; `SET NAMES utf8mb4` config'de var

**"too many connections"**
→ DB bağlantısı düzgün kapanmıyor olabilir; production'da `gelistirme: false` yapın

**Quill editör yüklenmiyor**
→ Internet bağlantısı yok ya da CDN engellenmiş. Quill'i hosting'e kopyalamak gerekir (`assets/vendor/quill/`).
