# Ferizli İlkadım Akademi — Web Sitesi Analiz & Plan

> Bu doküman, projeye başlamadan önce yapılan araştırma ve önerileri içerir.
> Karar verildikten sonra `README.md` ve dosya yapısına geçilecek.

---

## 1. Kurum Hakkında Bağlam

### 1.1. Kurum Tipi
"Ferizli İlkadım Akademi" adı, kurumun bir **özel öğretim kurumu** olduğunu gösteriyor.
Konum: **Sakarya / Ferizli ilçesi** (kurumun adından ve Instagram hesabından anlaşılıyor).
Instagram: [@ferizliilkadmakademi](https://www.instagram.com/ferizliilkadmakademi/)

> Not: Web aramalarında kurumun resmi web sitesi/ayrıntılı tanıtım sayfası bulunamadı.
> Bu, sıfırdan kurumsal kimlik üretebileceğimiz anlamına geliyor — fakat içerik tarafında
> kurumdan ham bilgi almamız şart (aşağıdaki "Kurumdan Talep Listesi" bölümüne bakınız).

### 1.2. "Dersane" → "Akademi" Dönüşümü (Yasal Arka Plan)
Kurum adının "İlkadım Dersane" yerine **"İlkadım Akademi"** olmasının arkasındaki gerçek:

- **14 Mart 2014** tarihinde Resmi Gazete'de yayımlanan kanunla, "Özel Öğretim Kurumları
  Kanunu"ndan **"dershane" tanımı çıkarıldı**.
- Dershanelerin **1 Eylül 2015** tarihine kadar; ya **özel okul**, ya **özel öğretim
  kursu**, ya da **temel lise**'ye dönüşmesi gerekti.
- Anayasa Mahkemesi bazı maddeleri **13 Temmuz 2015**'te iptal etti, ancak "dershane"
  ibaresi yasal olarak kaldırıldı; günümüzde aktif kategoriler:
  - **Özel Öğretim Kursu** (LGS, YKS, KPSS vb. sınavlara hazırlık veren kurumlar)
  - **Öğrenci Etüt Eğitim Merkezi** (ödev takibi, etüt, takviye dersleri)
  - **Özel Okul**

Kurumun adında "Akademi" geçmesi, eski "dershane" markasının modern bir isimle
sürdürüldüğünü anlatıyor. Bu, sitenin **hem köklü/güvenilir** hem de **modern/genç**
bir tonu yakalamasını gerektiriyor. (Site dilinde "dersane" kelimesinden kaçınmalıyız;
"akademi", "kurs", "etüt merkezi" tercih edilmeli.)

---

## 2. Hedef Kitle & Site Tonu

### 2.1. Birincil Hedef Kitle
- **Veliler** (karar verici — kayıt onayını veren taraf)
- **Öğrenciler** (12–18 yaş; LGS, YKS, ortaokul/lise takviye)
- İkinci derece: **Mezunlar** (başarı hikâyeleri için)

### 2.2. Veliler Sitede Ne Arar?
- "Bu kurum güvenilir mi, ne kadar süredir var?"
- "Hangi sınıflara hangi dersleri veriyor?"
- "Öğretmenler kim, deneyimleri ne?"
- "Başarı oranı ne?" (geçmiş öğrenci sonuçları)
- "Fiziksel ortam nasıl?" (sınıf fotoğrafları)
- "Adres nerede, nasıl ulaşırım?"
- "Fiyat ne?" (genellikle telefon/yüz yüze görüşmeye yönlendirilir, sitede yazılmaz)
- "Hemen iletişime nasıl geçerim?" (WhatsApp, telefon)

### 2.3. Görsel Ton
- **Renk paleti önerisi:** Lacivert + sıcak turuncu/altın aksanı (eğitim sektörü
  güveni + enerji dengesi). Veya kurumsal yeşil tonları (büyüme/gelişim). Logo varsa
  ona göre.
- **Tipografi:** Başlıklar için modern sans-serif (Poppins, Manrope, Inter);
  metinler için okunaklı (Inter, Source Sans).
- **Stil:** Bol beyaz alan, büyük tipografi, yumuşak gölgeler, mobil-öncelikli.
  Stok fotoğraf yerine kurumun kendi sınıf/öğrenci fotoğrafları öncelikli olmalı.

---

## 3. Site Mimarisi — Sayfa Listesi

### 3.1. Ana Sayfa (`index.html`)
- **Hero bölümü:** Slogan + iki büyük CTA ("Hemen Ara" — `tel:`, "WhatsApp ile Yaz" — `wa.me`)
- **Kısa kurum tanıtımı** (3-4 cümle + 3 ikonlu özellik: tecrübeli kadro, küçük sınıflar, takip sistemi vb.)
- **Hizmetler/Programlar özeti** (LGS, YKS, ortaokul takviye, etüt — kart yapısı)
- **Son duyurular** (3 adet — duyurular sayfasına link)
- **Başarılarımız / sayılarla biz** (X öğrenci, Y mezun, Z yıl)
- **Galeri önizleme** (4-6 fotoğraf)
- **İletişim / harita** kesidi
- **Footer**

### 3.2. Hakkımızda (`hakkimizda.html`)
- Kuruluş hikâyesi, misyon, vizyon, kurum değerleri
- Kurucu / yönetici mesajı (foto + imza)
- Tarihçe (timeline tarzı, eğer geçmişi varsa)

### 3.3. Programlar / Kurslar (`programlar.html`)
Her program için ayrı bölüm veya alt sayfa:
- LGS Hazırlık
- YKS (TYT–AYT) Hazırlık
- Ortaokul Takviye Dersleri
- Lise Takviye Dersleri
- Etüt / Ödev Takip Programı
- (varsa) Yaz okulu, bireysel ders

Her programda: hedef sınıf, süre, ders kapsamı, haftalık saat, sınıf mevcudu.

### 3.4. Eğitim Kadrosu (`kadro.html`)
- Öğretmen kartları (foto, ad, branş, deneyim, kısa not)
- Tek sayfada veya branşa göre gruplandırılmış

### 3.5. Başarılarımız (`basarilarimiz.html`)
- Yıllara göre öğrenci başarıları (sınav sonuçları, kazanılan okullar/bölümler)
- Mezun yorumları/videoları
- (Varsa) basın görünümleri, ödüller

### 3.6. Galeri (`galeri.html`)
- Sınıf, etkinlik, kamp fotoğrafları (lightbox ile büyütülebilir)

### 3.7. Duyurular (`duyurular.html`) — Liste sayfası
- Tüm duyuruların listelendiği sayfa
- Filtre: kategori (genel, sınav, kayıt, etkinlik), tarih
- Tek tek duyuru detay sayfası (`duyurular/[slug].html` veya hash-route)

### 3.8. İletişim (`iletisim.html`)
- Adres, telefon, e-posta, çalışma saatleri
- Google Maps gömme
- İletişim formu (Google Form embed veya Formspree)
- Sosyal medya linkleri

### 3.9. Başvuru / Ön Kayıt (`basvuru.html`)
- Dinamik form (ilk aşamada Google Forms embed; sonra kendi formumuz)
- Kayıt sonrası "teşekkürler" sayfası

### 3.10. (Opsiyonel) SSS (`sss.html`)
- Sık sorulan sorular (kayıt nasıl, dersler kaç saat, ücretler nasıl belirleniyor vb.)

### 3.11. Yönetim Paneli (`/admin/`)
- Şifre korumalı (basit JS auth — gerçek güvenlik için sunucu tarafı şart, aşağıda detay)
- **Duyuru ekle / düzenle / sil**
- **Form yönetimi** (ileride): yeni form oluştur, sorular ekle, Google Sheet'e bağla
- **Galeri yönetimi** (foto yükle/sil) — ileride

### 3.12. Yardımcı Sayfalar
- `404.html` — özelleştirilmiş "bulunamadı" sayfası
- `tesekkurler.html` — form gönderim sonrası
- `kvkk.html` — kişisel veri politikası (form topladığımız için **zorunlu**)
- `cerez-politikasi.html` — eğer analytics/cookie kullanılacaksa

---

## 4. Sabit Bileşenler (Tüm Sayfalarda)

### 4.1. Header
- Logo + kurum adı
- Yatay menü (mobilde hamburger)
- Sağ üstte "Hemen İletişim" düğmesi (WhatsApp)

### 4.2. Footer
- Adres, telefon, e-posta, çalışma saatleri
- Hızlı menü linkleri
- Sosyal medya ikonları
- Telif satırı

### 4.3. Sabit Yan İkonlar (Floating Action Buttons — talep edildi)
Sağ alt köşede, scroll sırasında sabit kalan **yuvarlak ikonlar**:
- 📱 WhatsApp → `https://wa.me/90XXXXXXXXXX?text=Merhaba`
- 📷 Instagram → `https://www.instagram.com/ferizliilkadmakademi/`
- 📞 Telefon → `tel:+90XXXXXXXXXX`

Mobilde alta gelen sticky CTA bar olarak da düşünülebilir.

---

## 5. Teknoloji Seçimi & Mimari

### 5.1. Kullanıcı Talebi
> "html css js yeterli olur sanırım", "basit, kolay bakım yapılabilir", "veritabanı
> olayına girmeyelim ama analizini yap"

### 5.2. Önerilen Stack

| Katman | Seçim | Neden |
|---|---|---|
| Frontend | **Vanilla HTML + CSS + JavaScript** | Bağımlılık yok, herkes bakım yapabilir, hızlı yükleme |
| Stil | **CSS değişkenleri + flexbox/grid** | Framework gerekmiyor; tema değişikliği kolay |
| (Opsiyonel) UI yardımcı | Yok — sıfırdan yazılacak | Bootstrap/Tailwind bağımlılık ekler; basit site için fazla |
| Build tool | Yok | Doğrudan tarayıcıda çalışır; FTP/Git push yeterli |
| Hosting | **Netlify** veya **Vercel** veya **GitHub Pages** | Ücretsiz, SSL otomatik, deploy 1 dakika |
| Domain | Kurumdan satın alınmalı | `ferizliilkadimakademi.com` gibi |

### 5.3. Duyuru Sistemi — Mimari Karar

**Problem:** Kurumun "duyurularını girebileceği bir arayüz" istemesi → admin paneli lazım. Veritabanı istemediler. Veritabanısız nasıl çözeriz?

**Seçenek A — JSON dosyası + Decap CMS (önerilen)**
- Duyurular `data/duyurular.json` dosyasında tutulur
- Sitenin `/admin/` rotası, **Decap CMS** (eski Netlify CMS) ile gelir
- Kurum personeli `/admin/` adresine gidip giriş yapar, duyuru ekler/siler
- Decap CMS, arka planda GitHub commit oluşturur → site otomatik yeniden deploy olur
- ✅ Veritabanı yok ✅ Ücretsiz ✅ Versiyon kontrolü doğal ✅ Çok kullanıcı destekli
- ❌ Kurum personelinin GitHub veya Netlify Identity hesabı olması lazım (basit kurulum)

**Seçenek B — Firebase Firestore (NoSQL bulut veritabanı, "veritabanı kurulumu yok")**
- Veritabanı var ama sunucu yok; client'tan direkt yazılır
- Kurum admin paneline girer → Firestore'a yazar → site Firestore'dan okur
- ✅ Çok gerçek-zamanlı ✅ Ücretsiz tier yeterli
- ❌ Yine de "veritabanı" hissi var; kurulum + güvenlik kuralları gerekir
- ❌ Veri kaybolursa yedek almak zor

**Seçenek C — Google Sheets'i CMS gibi kullanmak**
- Duyurular bir Google Sheet'te tutulur
- Site `gviz` API ile sheet'ten okur
- Kurum, Google Sheet'i normal Excel gibi düzenler
- ✅ Kurumun zaten bildiği bir arayüz ✅ Sıfır kurulum
- ❌ Resim ekleme zor ❌ Format kontrolü yok ❌ Sheet public olmak zorunda (gizlilik)

**Seçenek D — Tamamen statik, duyurular HTML'e elle yazılır**
- Reddedildi: kurum "kendi girebilsin" istiyor

**Önerim: Seçenek A (Decap CMS + JSON)**
İlerleyen formlar/anketler de aynı yöntemle yönetilebilir. Tek bir tutarlı admin
paneli.

### 5.4. Form Sistemi — Mimari Karar

**Kullanıcı isteği:** "İleride başvuru formları, anketler dinamik olarak oluşturulsun.
Cevaplar Google Sheets'e gitsin."

**Önerilen yaklaşım — 2 aşamalı:**

**Aşama 1 (MVP — şimdi):**
- Her form, bir **Google Forms** ile yapılır
- Google Form, sitede `<iframe>` ile gömülür
- Cevaplar otomatik olarak ilişkili Google Sheet'e düşer
- ✅ Sıfır kod ✅ Kurum form'u Google'da düzenleyebilir ✅ E-posta bildirim, koşullu mantık hepsi var
- Site tarafında sadece "Başvuru Formu" sayfası ve iframe vardır

**Aşama 2 (ileride — eğer iframe'in görsel/UX'i yetersiz gelirse):**
- Kendi form motorumuz: JSON tabanlı form tanımı (`forms/basvuru.json`)
- Decap CMS'ten kurum, form alanı ekler/çıkarır
- Submit → **Google Apps Script Web App** → ilgili Google Sheet'e yazar
- ✅ Görsel sitenin kimliğinde ✅ Yine veritabanı yok ✅ Kurum hâlâ yönetiyor

**Sonuç:** Şimdilik Google Forms embed ile başlayalım, Aşama 2'yi
ihtiyaç doğunca yapalım. YAGNI prensibi.

### 5.5. Admin Paneli Güvenliği — Önemli Not
- Vanilla JS ile yapılan "şifre kontrolü" **gerçek güvenlik değildir** (client'ta
  şifre görünür)
- **Çözüm:** Decap CMS, **Netlify Identity** (ücretsiz, e-posta + şifre auth) kullanır
- Kurumun bilgisayarında deneyim: `admin@kurum.com` ile login → Decap UI açılır
- Tehdit modeli: 1-2 admin kullanıcı, kötü niyetli saldırgan beklemiyoruz; bu
  yeterli güvenlik

### 5.6. Dosya/Klasör Yapısı (Önerilen)
```
/
├── index.html
├── hakkimizda.html
├── programlar.html
├── kadro.html
├── basarilarimiz.html
├── galeri.html
├── duyurular.html
├── duyurular/
│   └── [slug].html  (veya tek sayfada hash-route ile)
├── iletisim.html
├── basvuru.html
├── tesekkurler.html
├── kvkk.html
├── 404.html
│
├── assets/
│   ├── css/
│   │   ├── base.css       (reset, değişkenler, tipografi)
│   │   ├── components.css (button, card, form, navbar)
│   │   ├── layout.css     (header, footer, grid)
│   │   └── pages.css      (sayfa-özel)
│   ├── js/
│   │   ├── main.js        (header toggle, smooth scroll, vb.)
│   │   ├── duyurular.js   (JSON'u okur, listeler)
│   │   └── galeri.js      (lightbox)
│   ├── img/
│   │   ├── logo.svg
│   │   ├── hero/
│   │   ├── kadro/
│   │   ├── galeri/
│   │   └── duyurular/
│   └── fonts/  (opsiyonel — Google Fonts CDN de kullanılabilir)
│
├── data/
│   ├── duyurular.json
│   ├── kadro.json         (öğretmen listesi — kolay güncelleme)
│   ├── programlar.json
│   └── ayarlar.json       (tel no, adres, sosyal linkler — tek yerden)
│
├── admin/
│   ├── index.html         (Decap CMS yükleyici)
│   └── config.yml         (CMS koleksiyon tanımları)
│
└── README.md              (kurum için kısa kullanım kılavuzu)
```

**Not:** Tüm sayfalar `data/ayarlar.json` dosyasından telefon, adres, sosyal medya
URL'lerini okur. Kurum tel numarasını değiştirmek istediğinde **tek dosyada** değişir.

---

## 6. Kurumdan Talep Edilecekler

> Bu liste **çok önemli** — siteye başlamadan kurumun bize ulaştırması gereken
> içerikleri kapsar. WhatsApp'tan veya tek bir paylaşımlı klasörden (Drive) toplanması
> ideal.

### 6.1. Kurumsal Bilgi
- [ ] Kurumun **resmi adı** (tabela/MEB ruhsatındaki tam isim)
- [ ] **Kuruluş yılı**
- [ ] **Kısa hikâye** (1-2 paragraf, kuruluş motivasyonu)
- [ ] **Misyon ve vizyon** (yoksa bizim taslak hazırlamamızı isteyecekler mi?)
- [ ] **Kurucu/müdür mesajı** (opsiyonel, kurucu adı + 1 paragraf)
- [ ] **Kurum değerleri** (3-5 madde: disiplin, takip, samimi yaklaşım vb.)

### 6.2. İletişim & Konum
- [ ] **Tam adres** (mahalle, sokak, no, ilçe)
- [ ] **Telefon numarası** (sabit + WhatsApp ayrı mı?)
- [ ] **E-posta adresi**
- [ ] **Çalışma saatleri** (hafta içi/cumartesi)
- [ ] **Google Maps konumu** (link veya pin koordinatı)
- [ ] **Sosyal medya hesaplarının tamamı** (Instagram, Facebook, YouTube, TikTok vb.)

### 6.3. Görsel Varlıklar
- [ ] **Logo** (tercihen vektör — `.svg`, `.ai`, `.eps`; yoksa yüksek çözünürlük `.png`)
- [ ] **Kurumsal renkler** (logo nasıl üretildiyse)
- [ ] **Kurum dış cephe fotoğrafı** (hero için)
- [ ] **Sınıf/iç mekan fotoğrafları** (galeri — en az 10-15 adet, yatay yüksek çözünürlük)
- [ ] **Etkinlik/gezi fotoğrafları** (varsa)
- [ ] **Tanıtım videosu** (varsa — opsiyonel)

### 6.4. Eğitim Programı
- [ ] Hangi **sınıf seviyelerine** hizmet veriliyor? (5–8, 9–12, lise sonrası vb.)
- [ ] Hangi **sınavlara hazırlık**? (LGS, TYT, AYT, YDT, KPSS, ALES, açık öğretim vb.)
- [ ] Verilen **ders branşları** (her sınıf seviyesi için)
- [ ] **Hafta içi/hafta sonu** ders yapısı (ders saati, ödev, etüt)
- [ ] **Sınıf mevcudu** (ortalama / maks)
- [ ] **Deneme sınavı** uygulaması var mı, sıklığı?
- [ ] **Birebir / küçük grup** dersleri var mı?
- [ ] **Yaz okulu / kamp** programları var mı?

### 6.5. Eğitim Kadrosu
Her öğretmen için:
- [ ] Ad-Soyad
- [ ] Branş
- [ ] Mezun olduğu üniversite/bölüm
- [ ] Deneyim yılı
- [ ] (Opsiyonel) Kısa bir kişisel not / motto
- [ ] **Vesikalık fotoğraf** (kurumsal, aynı arka planlı tercih edilir)

### 6.6. Başarılar
- [ ] Geçmiş yıl **sınav başarıları** (yıl, öğrenci sayısı, kazanılan okullar/bölümler)
- [ ] **Veli/öğrenci yorumları** (yazılı izinli — KVKK)
- [ ] Mezun öğrencilerin **şu an nerede oldukları** (üniversite/iş — kişi izniyle)
- [ ] Aldığı **ödüller, sertifikalar**

### 6.7. Yasal & Politika
- [ ] **MEB ruhsat numarası** (footer'a konur, güven artırır)
- [ ] **Vergi dairesi / firma ünvanı** (KVKK aydınlatma metni için)
- [ ] **KVKK aydınlatma metni** (yoksa biz şablon hazırlayıp uyarlayabiliriz)

### 6.8. Operasyonel
- [ ] **Domain adı** seçimi (ferizliilkadimakademi.com / .com.tr önerileri)
- [ ] Kurumsal **e-posta** kuracak mıyız? (info@... gibi)
- [ ] Kurum admin paneline kimler erişecek? (kullanıcı adı/e-posta listesi — Netlify Identity için)
- [ ] **Google Workspace** hesabı var mı? (Forms ve Sheets için Gmail yeterli)

---

## 7. Yol Haritası — Aşamalar

### Faz 0 — Hazırlık (1-2 gün)
- Kurumdan içeriklerin toplanması (Bölüm 6 listesi)
- Domain & hosting hesabı açımı
- GitHub repository kurulumu

### Faz 1 — Statik MVP (1 hafta)
- Sayfa iskeleti (HTML)
- Stil sistemi (CSS base + components)
- Mobil-uyumlu navbar + footer
- 5 ana sayfa içeriklendirilir (Ana, Hakkımızda, Programlar, Kadro, İletişim)
- Floating WhatsApp/IG/Tel ikonları
- Google Maps embed
- Sitenin Netlify/Vercel'e ilk deploy'u

### Faz 2 — Duyuru Sistemi (2-3 gün)
- `data/duyurular.json` yapısı
- `duyurular.html` listeleyici (vanilla JS fetch)
- Tek duyuru detay görünümü
- Ana sayfada son 3 duyuru widget'ı
- **Decap CMS** kurulumu + Netlify Identity
- Kuruma admin paneli kullanım eğitimi (5 dakikalık video)

### Faz 3 — Form & Başvuru (2 gün)
- Google Form: başvuru formu oluştur → Sheet bağla
- `basvuru.html` içine embed
- İletişim formu (sayfa sonu)
- KVKK aydınlatma sayfası

### Faz 4 — Zenginleştirme (sürekli)
- Galeri (lightbox)
- Başarılar sayfası
- SSS
- Blog/duyuru kategorileri
- SEO (meta tag, sitemap, robots.txt)
- Google Search Console + Analytics kurulumu

### Faz 5 (gelecek) — Dinamik Form Motoru
- Eğer Google Forms embed yetersiz gelirse:
- JSON-tabanlı form tanımı + kendi form render motoru
- Google Apps Script ile Sheets'e yazma
- CMS'ten form alanı ekleme/düzenleme

---

## 8. Net Cevaplar (Kullanıcı Sorularına)

**S: "html css js yeterli olur sanırım?"**
✅ Evet. Statik HTML/CSS/Vanilla JS + JSON veri dosyaları yeterli. Build adımı yok, framework yok.

**S: "Duyuruları girebilecekleri arayüz, fonksiyonelliği maksimum"**
✅ Decap CMS (eski Netlify CMS) öneriliyor. GitHub backed, ücretsiz, görsel arayüzlü.
İlerideki formlar/anketler de aynı admin panelinden yönetilebilir.

**S: "Formlar Google tablolara yönlendirilebilir"**
✅ MVP'de Google Forms embed → otomatik Google Sheet'e yazar.
İleride kendi form motorumuzu Google Apps Script ile Sheets'e bağlayabiliriz.

**S: "Veritabanı olayına girmeyelim"**
✅ Hiç veritabanı yok. Tüm dinamik veri:
- Duyurular → JSON dosyası (Git versiyonlu)
- Form cevapları → Google Sheets
- Kullanıcı auth → Netlify Identity (admin paneli için)

**S: "Instagram, WhatsApp, telefon ikonları"**
✅ Tüm sayfalarda sabit (floating) sağ alt köşede. Mobilde sticky bottom bar.

---

## 9. Açık Sorular / Karar Bekleyenler

Sen onayladığında bu maddeleri kurumla netleştireceğiz, fakat senin de fikrini almam
gereken birkaç şey:

1. **Domain & hosting** — Netlify (ücretsiz, kolay deploy) yoksa kendi sunucusu mu?
2. **Tasarım yönü** — Modern minimal (boş alan + büyük tipografi) mi, geleneksel
   yoğun (her bilgi ana sayfada) mı? Kurumun mevcut Instagram tonuna bakıp eşleştirmek
   isterim.
3. **Çoklu dil** — Sadece Türkçe (önerim). Yabancı öğrenci hedefi yoksa İngilizce
   gereksiz iş yükü.
4. **Blog/içerik üretimi** — Duyurular yeterli mi, yoksa SEO için blog mu kuralım?
   (SEO öneririm ama kurum içerik üretebilir mi?)
5. **Önce nereden başlayalım?** — Statik iskelet + örnek içerikle mi, yoksa
   kurumdan içerik gelene kadar bekleyelim mi?

---

## 10. Önerilen Sonraki Adım

Bu dokümanı incelemen ve şu üç sorudan birini cevaplaman yeterli, gerisini götürürüm:

**A)** "Onayladım, hemen iskelete başla — placeholder içerikle çalış, kuruma sonra
toplarız." → Bugün ilk commit'i atarım: ana sayfa + temel stil.

**B)** "Önce kurumdan içerik listesini WhatsApp mesajı olarak hazırla, ben atayım." →
Bölüm 6'yı temiz bir mesaj formatında hazırlarım.

**C)** "Şu kısma itirazım var: ..." → Düzenler, sonra başlarım.
