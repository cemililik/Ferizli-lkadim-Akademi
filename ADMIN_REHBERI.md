# Yönetim Paneli Kullanım Rehberi

Bu doküman iki bölümden oluşur:

- **Bölüm A — Kurum Personeli için:** Günlük kullanım (duyuru ekle, ayar değiştir).
  Teknik bilgi gerektirmez.
- **Bölüm B — Geliştirici için:** PHP backend, kullanıcı yönetimi, sorun giderme.

Kuruma WhatsApp'la yalnızca **Bölüm A**'yı gönderebilirsin.

> **Önemli mimari notu:** Sistem **PHP + MySQL backend** üzerinde çalışıyor.
> Yapılan tüm değişiklikler **doğrudan** veritabanına yazılır ve **anında**
> sitede yayınlanır. Daha önce kullanılan "Dosyayı İndir → Geliştiriciye İlet"
> akışı **tamamen kaldırıldı**. Kaydet düğmesine basmak = yayınla.

---

# A) KURUM PERSONELİ REHBERİ

## A.1. Panel Nedir?

Web sitenizin içeriğini (duyurular, telefon, adres vb.) bilgisayar başında
kolayca güncelleyebileceğiniz görsel arayüzdür. Site adresinizin sonuna
`/admin` ekleyerek erişirsiniz:

```
www.kurumadiniz.com/admin
```

## A.2. Giriş Yapma

1. Tarayıcınızdan `/admin` adresine gidin.
2. **Kullanıcı adı (veya e-posta)** ve **şifrenizi** girin.
3. **Giriş Yap** düğmesine basın.

> 🔐 **İlk giriş bilgileri** geliştiriciniz tarafından size teslim edilecektir.
> İlk girişten sonra **Kullanıcılar → 🔑 Şifremi Değiştir** ile şifrenizi
> mutlaka değiştirin. Tarayıcınızı kapattığınızda oturum 8 saat sonra
> otomatik kapanır.

## A.3. Panel Yapısı

Giriş yaptıktan sonra üst menüde aşağıdaki bölümler bulunur:

| Menü | Ne için? |
|---|---|
| **Panel** | Ana ekran — kısayollar |
| **Duyurular** | Etkinlik, kayıt, sınav duyurularını yönetin (kapak görseli + form bağlama) |
| **Programlar** | Eğitim programlarını düzenleyin |
| **Kadro** | Öğretmen ekleyin, fotoğraf yükleyin |
| **Galeri** | Kurum/etkinlik fotoğrafları, albümler |
| **Formlar** | Başvuru ve anket formları tasarlayın |
| **Cevaplar** | Gelen form cevaplarını görüntüleyin, CSV/PDF/JSON indirin |
| **Blog** | Yazı oluşturun (zengin metin editörü), modülü aç/kapat |
| **Kullanıcılar** | Admin/editör hesaplarını yönetin (sadece yönetici rolü) |
| **Ayarlar** | Telefon, adres, sosyal medya, çalışma saatleri |

Sağ üst köşede 🔔 **Bildirimler** simgesi (yeni cevap geldiğinde kırmızı sayı
görünür) ve **Çıkış** düğmesi vardır.

---

## A.4. Duyuru Eklemek

1. Üst menüden **Duyurular**'a tıklayın.
2. Sağ üstteki **+ Yeni Duyuru** düğmesine basın. Solda yeni bir öğe açılır,
   sağda düzenleme formu görünür.
3. Formdaki alanları doldurun:

   | Alan | Açıklama |
   |---|---|
   | **Başlık** | Duyurunun adı. Zorunlu. |
   | **Tarih** | Duyurunun yayın tarihi. Zorunlu. |
   | **Kategori** | Genel / Kayıt / Sınav / Etkinlik. Zorunlu. |
   | **Özet** | Listede görünecek 1-2 cümlelik kısa açıklama. |
   | **Detaylı İçerik** | Duyurunun açıldığında görünecek tam metni. |
   | **Kapak Görseli** | Liste ve detay sayfalarında üstte gözüken görsel. Yatay (manzara) çekim önerilir. |
   | **Bağlı Form** | Opsiyonel — yayında bir form seçerseniz duyurunun altında "📝 Formu Doldur" düğmesi gösterilir. |
   | **Önemli** | İşaretlerseniz duyuru sarı bir vurgu ile öne çıkar. |

4. **Görsel eklemek için:** "Görsel Seç / Değiştir" düğmesine basın, dosya
   seçin. Görseliniz otomatik olarak küçültülür (uygun boyuta indirilir).
5. Aşağıdaki **Kaydet** düğmesine basın.

### Şu çok önemli:
**Kaydet düğmesi, değişikliği "taslak" olarak kaydeder.** Yani sadece sizin
bilgisayarınızın hafızasında durur. Diğer ziyaretçiler henüz göremez.

Yayınlamak için aşağıdaki **A.7** adımını mutlaka yapın.

---

## A.5. Duyuruyu Düzenlemek

1. **Duyurular** sayfasında sol listeden düzenlemek istediğinizi seçin.
2. Sağdaki formu güncelleyin.
3. **Kaydet** düğmesine basın.

## A.6. Duyuruyu Silmek

1. Sol listeden silmek istediğinizi seçin.
2. Formun altındaki kırmızı **🗑 Sil** düğmesine basın.
3. Onay verin.

---

## A.7. Değişiklikler Anında Yayınlanır

Sistem artık **PHP + MySQL backend** üzerinde çalışıyor. **Kaydet** düğmesine
basmanız yeterli — değişiklik veritabanına yazılır ve site **anında**
güncellenir. "Dosyayı İndir / Geliştiriciye İlet" adımı **tamamen kalktı**.

### Yedekleme

Sistem yöneticisi (geliştirici) düzenli olarak veritabanı yedeği almakla
yükümlüdür. Yine de **önemli toplu değişikliklerden önce** kendisine haber
verirseniz, sürüm öncesi anlık yedek alabilir.

### Birden çok admin aynı anda mı çalışabilir?

Evet, ama **aynı kaydı aynı anda düzenlemekten kaçının**. Son kaydeden
yazar. Pratikte, görev paylaşımı yaparak (örn. "Sen Duyurular'ı, ben Kadro'yu
düzenliyorum") çakışmayı önleyebilirsiniz.

---

## A.8. Programları Yönetmek (LGS, YKS vb.)

1. Üst menüden **Programlar**'a gidin.
2. **+ Yeni Program** veya soldan mevcut bir programa tıklayın.
3. Alanlar:

   | Alan | Açıklama |
   |---|---|
   | **Kimlik (slug)** | URL'de görünecek kısa ad. Sadece küçük harf-rakam-tire. (Örn: `lgs-hazirlik`) |
   | **İkon** | Programın başına gelecek emoji (📚 📐 ✏️ 🎓) |
   | **Program Adı** | Görünen tam ad |
   | **Hedef Kitle** | Hangi sınıf/grup için |
   | **Kısa Açıklama** | Kartta görünecek 1-2 cümle |
   | **Özellikler** | Programın özellikleri (madde madde, "+ Özellik Ekle" ile çoğaltılır) |

4. **Kaydet** → "Dosyayı İndir" akışı (A.7).

---

## A.9. Eğitim Kadrosunu Yönetmek

1. **Kadro** menüsüne gidin.
2. **+ Yeni Öğretmen** veya soldan birine tıklayın.
3. Sol üstte profil fotoğrafı yükleme bölümü, sağda bilgiler:
   - **Ad Soyad, Branş, Ünvan** (zorunlu)
   - **Mezuniyet, Deneyim yılı, Motto** (opsiyonel)
4. **📷 Fotoğraf Yükle** düğmesi ile profil fotoğrafı seçin. Otomatik kare
   formatına küçültülür (600x600 px). Yüksek kalite isteyenler için, vesikalık
   tarzı tek arka planlı portrelerin tutarlı görünmesi tavsiye edilir.

> Fotoğraf yoksa öğretmenin baş harfleri renkli bir daireye yazılır
> (örn. "AY" Ahmet Yılmaz için).

---

## A.10. Galeriyi Yönetmek

Galeri, kurum içi mekanlar, ders anları, etkinliklerden oluşur.

### Görsel ekleme
1. **Galeri** menüsüne gidin.
2. Tek görsel: **+ Görsel Ekle** veya üstteki büyük "+" karesi.
3. Çoklu görsel: **+ Çoklu Ekle** — birden fazla dosya seçebilirsiniz.

### Görseli düzenleme
- **Başlık:** Görselin alt yazısı (zorunlu değil)
- **Albüm:** Hangi kategoriye ait
- **📷 Değiştir / 🗑 Sil:** Görseli güncelle veya kaldır

### Albümleri yönetme
**⚙ Albümleri Düzenle** düğmesine basın. Albüm ekleyebilir, adlandırabilir
veya silebilirsiniz. Albümler galeride filtreleme için kullanılır (Tümü /
Kurumumuz / Etkinlikler vb.).

> ⚠️ **Önemli:** Görseller yüksek çözünürlüklü olsa bile sistem otomatik
> 1600x1600 piksele indirir. Yine de yatay (manzara) çekimleri ve kaliteli
> kareler tercih edin.

---

## A.11. Formları Yönetmek (Başvuru / Anket)

İlk Adım Akademi'nin **kendi form motoru** vardır. Google Forms'a ihtiyaç yok;
formu siz tasarlarsınız, ziyaretçi doldurur, cevaplar **Cevaplar** menüsünde
toplanır.

### Yeni form oluşturmak

1. **Formlar** menüsüne girin → **+ Yeni Form**
2. Üst bilgileri doldurun:
   - **Form Adı:** Ziyaretçiye görünen ad (örn. "Ön Kayıt Formu")
   - **Kimlik:** URL slug (`basvuru`, `memnuniyet-anketi` vb.)
   - **Açıklama:** Formun üstünde görünen ek bilgi
   - **Teşekkür Mesajı:** Form gönderildikten sonra görünen yazı
3. **Yayında** ✅ → site ziyaretçileri görür
4. **Varsayılan** ✅ → `/basvuru.html` ana sayfada bu form gösterilir

### Alan eklemek

Aşağıdaki tipler mevcuttur:

| Tip | Açıklama |
|---|---|
| **Kısa metin** | Tek satır (ad, soyad vb.) |
| **Uzun metin** | Çok satırlı (mesaj, açıklama) |
| **E-posta** | Format kontrolü yapılır |
| **Telefon** | Cep numarası vb. |
| **Sayı** | Numerik |
| **Tarih** | Takvim seçici |
| **Açılır liste** | Önceden tanımlı seçenekler arasından tek seçim |
| **Tek seçim** | Radio düğmeleri (ankette önerilen) |
| **Çoklu seçim** | Checkbox grubu (birden fazla seçilebilir) |
| **Onay kutusu** | Tek checkbox (KVKK onayı vb.) |
| **Başlık** | Veri toplamaz, formu bölümlere ayırmaya yarar |

Her alan için:
- **Etiket:** Ziyaretçiye görünen soru
- **Yardım metni:** Etiketin altında küçük açıklama
- **Zorunlu mu:** Boş bırakılırsa form gönderilemez
- **Placeholder:** Boş alana yazılan ipucu (metin alanları için)
- **Seçenekler:** Liste/radio/checkbox için

### Alanları sıralama / silme
- Her alan kartında ↑ ↓ düğmeleri ile sıralama
- 🗑 ile silme
- Alana tıklayarak detayları düzenleme

### Önizleme
Sağ alttaki **👁 Önizle** düğmesi formu yeni sekmede açar — ziyaretçinin
göreceği halini test edebilirsiniz.

### Yayın akışı
Her zamanki gibi: değişikliği "Formu Kaydet" → sağ üstten **"⬇ Dosyayı İndir"** →
`formlar.json` geliştiriciye iletilir.

### Formu site ziyaretçileri nasıl görür?

Formu **Yayında** işaretledikten sonra üst kısımda 🔗 **Site URL** bölümü
görünür. İki yol var:

**1. Otomatik yol — "📢 Duyuruya Ekle" düğmesi**

- Site URL kutusunun yanındaki bu düğme, formla bağlantılı **yeni bir duyuru
  taslağı** oluşturur (kategori: Kayıt, önemli işareti açık)
- Duyurular sayfasında metnini ve kapak görselini düzenlersiniz
- Duyuru yayınlandığında ziyaretçiler:
  - Ana sayfada "Son Duyurular" bölümünde görür
  - `/duyurular.html`'de tüm duyurular arasında görür
  - Duyuruyu açtığında altta büyük **"📝 Formu Doldur"** düğmesi
  - Form kartında küçük bir "Form var" rozeti
- Bu yöntem **veliler için en görünür yer** — önerilen

**2. Manuel yol — URL'i kopyala**

- 📋 **Kopyala** düğmesi `/basvuru.html?form=<id>` adresini kopyalar
- Bu URL'i:
  - WhatsApp/SMS ile velilere gönderebilir
  - Instagram bio'ya koyabilir
  - Bir banner / poster QR koduna koyabilir
  - Başka bir duyurunun içine elle link olarak ekleyebilirsiniz

### Varsayılan form
Bir form "Varsayılan" işaretliyse, `/basvuru.html` (URL parametresi olmadan)
açıldığında otomatik o form gösterilir. Aynı anda sadece **bir** form
varsayılan olabilir.

---

## A.12. Cevapları Görüntülemek

**Cevaplar** menüsünde:

### Görüntüleme
- Üstte form sekmeleri (her formun cevap sayısı yanında)
- Tabloda her cevap: tarih + ilk 3 alanın özeti
- **👁 (göz) ikonu** veya satıra tıklayarak detay açma
- Detay modalda tüm alanları tarayabilir, **🗑 ile silebilirsiniz**

### Dışa aktarma
Sağ üstte 4 buton:

| Buton | Format | Kullanım |
|---|---|---|
| **📊 CSV** | `.csv` | Excel/Numbers'ta açılır, Türkçe karakterler korunur (UTF-8 BOM) |
| **📄 PDF** | `.pdf` | Yeni sekme açılır → tarayıcının "PDF olarak kaydet" diyalogu |
| **{ } JSON** | `.json` | Geliştirici/yedek için yapılandırılmış veri |
| **⤓ JSONL** | `.jsonl` | Her satırda bir cevap (veri ambarı/import için) |

### Tüm cevapları silmek
**🗑 Tümünü Sil** seçeneği aktif formdaki **tüm cevapları siler**.
Geri alınamaz; önce dışa aktarın!

### ⚠️ Şu an demo modu
**Önemli:** Şu an cevaplar yalnızca **bu tarayıcının** localStorage'ında.
Yani:
- Ziyaretçi A telefonundan formu doldurursa, **kurum personelinin B
  bilgisayarında** bu cevap görünmez
- Her cihaz kendi cevap setini tutar

Bu **geliştirme modu**dur — UI/UX test ve kavram doğrulama için.

**Üretim modu:** Site Netlify'a deploy edildiğinde formlar bir backend'e
(Netlify Forms / GitHub commit + JSONL / Cloudflare KV vb.) bağlanır ve
tüm cevaplar tek merkezde toplanır. Detay: Bölüm B.

---

## A.13. Bildirimler

Yeni bir form cevabı geldiğinde sağ üstteki 🔔 ikonunun yanında kırmızı bir
sayı belirir. Tıklayınca **Bildirimler** sayfası açılır.

### Bildirim listesi
- Yeni (okunmamış) bildirimler **mavi vurgulu**
- Tıklayınca ilgili cevap detayına yönlendirir + otomatik okundu işaretlenir
- **✓** — manuel okundu işaretle
- **🗑** — sil

### Toplu işlemler
- **✓ Tümünü Okundu İşaretle**
- **🗑 Tümünü Sil**

### Sınır
Sistem otomatik olarak son 200 bildirimi saklar. Üzerine yeni gelirse eskiler
silinir (badge sayısını düşük tutmak ve hafızayı yormamak için).

---

## A.14. Site Ayarlarını Değiştirmek

Üst menüden **Site Ayarları**'na gidin. Değiştirmek istediğiniz alanı düzenleyip
aşağıdaki **Değişiklikleri Kaydet** düğmesine basın. Sonra A.7 adımındaki
"Dosyayı İndir / Kopyala" işlemini yapın.

### Önemli alanlar:
- **Telefon:** İki kez yazılır — `+90...` formatlı (tıkla-ara için), bir de
  insan okuyabileceği `(0264) XXX XX XX` formatlı. İkisi de aynı numara.
- **WhatsApp:** **Sadece rakam**, başında `90`. Örn: `905321234567`.
  Başına `+` veya `0` koymayın, boşluk bırakmayın.
- **Google Maps:**
  1. Google Maps'te kurumu açın.
  2. **Paylaş** → **Haritayı yerleştir**.
  3. Açılan iframe kodundaki `src="..."` içindeki URL'i kopyalayın.
  4. **Google Maps Embed URL** alanına yapıştırın.
- **Sosyal Medya:** Boş bıraktığınız hesaplar sitede gösterilmez. Yeni hesap
  açtığınızda URL'ini buraya yapıştırın.

---

## A.13. Sık Karşılaşılan Sorunlar

**"Yanlışlıkla bir duyuruyu sildim, geri alabilir miyim?"**
Henüz **Dosyayı İndir** yapmadıysanız → üst kısımdaki **↺ Dosyadan Yenile**
düğmesine basın. Site dosyasındaki son yayın hâli yüklenir.
İndirip geliştiriciye gönderdiyseniz → eski sürümü geliştiriciden talep edin.

**"Şifremi unuttum"**
Geliştiricinizden yeni şifre talep edin.

**"Tarayıcımı kapatınca işim kayboldu mu?"**
Hayır. Tarayıcı taslakları kaydeder, bir sonraki açışınızda kaldığınız yerden
devam edersiniz (8 saat içinde).

**"Yanlışlıkla başka biri panele girerse?"**
Şifrenizi hemen geliştiricinizden değiştirmesini isteyin.

---

# B) GELİŞTİRİCİ REHBERİ

## B.1. Mimari Özeti

| Katman | Teknoloji |
|---|---|
| **Frontend** | Statik HTML/CSS/Vanilla JS (admin paneli + ziyaretçi sayfaları) |
| **Backend** | PHP 7.4+ / 8.x REST API (`/api/...`) |
| **Veritabanı** | MySQL 5.7+ veya MariaDB 10.3+ |
| **Auth** | PHP native session (cookie) + bcrypt şifre hash |
| **Hosting** | Herhangi bir PHP+MySQL hosting (cPanel önerilen) |

Tüm içerik veritabanında, hiçbir Netlify/3. parti bağımlılığı yok. Detaylı
kurulum için: [KURULUM_PHP.md](KURULUM_PHP.md)

## B.2. Dosya Yapısı

```
/
├── admin/                  # Yönetim paneli
│   ├── index.html          # Login + dashboard
│   ├── duyurular.html      # CRUD (kapak görseli + form bağlama)
│   ├── programlar.html     # CRUD
│   ├── kadro.html          # CRUD (profil fotoğrafı)
│   ├── galeri.html         # CRUD + albüm yönetimi
│   ├── formlar.html        # Form tasarımcı (11 alan tipi)
│   ├── cevaplar.html       # CSV/PDF/JSON/JSONL dışa aktarma
│   ├── bildirimler.html    # Bildirim akışı
│   ├── blog.html           # Quill rich-text editor
│   ├── kullanicilar.html   # Admin/editör (yalnızca admin rolü)
│   ├── ayarlar.html        # Site ayarları
│   ├── css/admin.css
│   └── js/
│       ├── admin-core.js   # Auth, toast, görsel resize, dışa aktarma
│       └── api-client.js   # PHP API'ye konuşan ince katman
│
├── api/                    # PHP REST API
│   ├── .htaccess           # URL rewrite
│   ├── index.php           # Router
│   ├── config.example.php  # → config.php (gitignore'da)
│   ├── db.php / helpers.php / auth.php
│   ├── endpoints/          # 10 endpoint (auth, ayarlar, duyurular, ...)
│   └── install/import-json.php
│
├── sql/
│   ├── schema.sql
│   └── seed.sql
│
├── assets/js/              # Site tarafı (tümü API'ye fetch eder)
├── data/                   # Eski JSON (yalnızca migration referansı)
└── router.php              # PHP built-in server için dev router
```

## B.3. Auth Akışı

1. Kullanıcı `/admin/` açar
2. `ADMIN.kullaniciAl()` → `GET /api/auth/me`
3. Cevap `null` → login formu; cevap kullanıcı → dashboard
4. Login: `POST /api/auth/login` → PHP `session_start()` + bcrypt verify → cookie set
5. Sonraki istekler cookie ile kimliklenir (`credentials: 'include'`)
6. Logout: `POST /api/auth/logout` → session destroy

**Şifre güvenliği:**
- `password_hash(PASSWORD_DEFAULT)` (şu an bcrypt cost 12)
- `password_needs_rehash` kontrolü ile login sırasında auto-rehash
- Timing attack koruması: hata durumunda küçük rastgele gecikme

**Session ayarları** ([api/config.example.php](api/config.example.php)):
- 8 saat varsayılan ömür
- HTTPS production'da → `secure: true`
- SameSite: Lax, HttpOnly: true

## B.4. Kullanıcı Rolleri

- **admin**: Tüm yetki + kullanıcı yönetimi
- **editor**: İçerik düzenleme; kullanıcı yönetimine erişemez

Sistem **son aktif admin kullanıcısının silinmesini/pasifleştirilmesini
engeller** (kilitlenmeyi önler).

## B.5. Görsel Yükleme

- `ADMIN.gorselSec({ maxGenislik, maxYukseklik, kalite })` çağrılır
- File input → FileReader → Image → Canvas resize → `toDataURL('image/jpeg', kalite)`
- Sonuç base64 olarak DB'ye yazılır (LONGTEXT kolonda)
- 1200x800 JPEG q82 ≈ 100-200KB
- İleride dosya sistemi tabanlı saklamaya geçirilebilir (api/uploads/) — şu anki
  base64 yaklaşımı kurulum kolaylığı için

## B.6. Sorun Giderme

### "Admin sayfası 404 / boş"
- Apache `mod_rewrite` aktif mi? (`/api/blog` → `/api/index.php?path=blog`)
- `api/.htaccess` doğru klasörde mi? (api kökü)

### "Sunucuya ulaşılamıyor"
- `api/config.php` var mı? DB bilgileri doğru mu?
- Tarayıcı Network sekmesinden `/api/auth/me` → ne dönüyor?

### "Şifre doğru ama girmiyor"
- DB'de kullanıcı `aktif=1` mi? (`SELECT * FROM admin_kullanicilar`)
- Hash bcrypt'le mi üretilmiş? (`$2y$...` ile başlamalı)
- Session dosyaları yazılabiliyor mu? PHP `session.save_path` izinleri

### "Türkçe karakterler bozuk"
- DB karakter seti `utf8mb4_unicode_ci` mi?
- `api/db.php` DSN'de `charset=utf8mb4` var mı?

### "Görsel yüklenmiyor / dolu görünüyor ama sunucuda yok"
- Görsel base64 olarak DB'ye yazılır, ayrı dosya yok
- DB max_allowed_packet yeterli mi? (50 MB önerilen)
- Tek bir form/duyuru güncellemesinde JSON body çok büyükse → PHP
  `post_max_size` ve `upload_max_filesize` artır

### "Bildirim badge güncellenmiyor"
- `/api/bildirimler/sayim` çağrısı çalışıyor mu?
- Periyodik check 30 saniyede bir (admin-core.js)

## B.7. Gelecek İyileştirmeler

- [ ] Görselleri base64 yerine dosya sistemine yaz (`api/uploads/`)
- [ ] Duyuru "yayınlama tarihi" — gelecekteki tarihli duyurular otomatik gizlenir
- [ ] Şifre sıfırlama (e-posta ile)
- [ ] CSRF token koruması (şu an SameSite cookie yeterli korumayı veriyor)
- [ ] 2FA (TOTP)
- [ ] Rate limiting (form-gönder endpoint'inde özellikle)
- [ ] Activity log (kim ne zaman ne yaptı)
