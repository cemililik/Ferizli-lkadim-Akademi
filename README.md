# Ferizli İlkadım Akademi — Web Sitesi

Statik HTML/CSS/JS tabanlı kurumsal web sitesi. Veritabanı yok; tüm dinamik
veri JSON dosyalarından okunur.

## Hızlı Bakış

- **Tech:** Vanilla HTML + CSS + JS. Build adımı yok.
- **Veri:** `data/*.json` dosyalarında.
- **Hosting (önerilen):** Netlify / Vercel / GitHub Pages (hepsi ücretsiz).
- **Bağımlılık:** Yalnızca Google Fonts (Inter + Manrope) CDN.

---

## Geliştirme Ortamı

Site **statik bir sunucu** üzerinden çalıştırılmalı (dosyaları çift tıkla
açmak `fetch()` çağrılarını CORS hatasıyla bozar).

### Seçenek 1 — VS Code "Live Server" eklentisi (en kolay)
1. VS Code'da `Live Server` eklentisini kur.
2. `index.html`'e sağ tıkla → "Open with Live Server".
3. Tarayıcı otomatik açılır (genelde `http://127.0.0.1:5500`).

### Seçenek 2 — Python ile
```bash
cd /Users/dev/Documents/Projects/FerizliIlkadimDersane
python3 -m http.server 8000
# Tarayıcı: http://localhost:8000
```

### Seçenek 3 — Node.js ile
```bash
npx serve .
```

---

## Dosya Yapısı

```
/
├── *.html                # Tüm sayfalar (kök seviyede)
├── partials/             # Header, footer, floating icons (paylaşılan)
├── assets/
│   ├── css/              # Modüler stil dosyaları
│   ├── js/               # main.js + sayfa-özel scriptler
│   └── img/              # Görseller (kurum gelene kadar boş)
├── admin/                # Yönetim paneli (geliştirme + Decap CMS hazırlık)
│   ├── index.html        # Login + dashboard
│   ├── duyurular.html    # Duyuru CRUD ekranı
│   ├── ayarlar.html      # Site ayarları düzenleme
│   ├── css/admin.css
│   ├── js/admin-core.js  # Auth, toast, JSON indir/yükle yardımcıları
│   ├── decap-config.yml  # Production CMS config (deploy sonrası)
│   └── decap-index.html.taslak  # Production admin HTML (deploy sonrası)
├── data/                 # JSON içerik dosyaları
│   ├── ayarlar.json      # Site geneli ayarlar (tel, adres, sosyal)
│   ├── duyurular.json    # Duyuru listesi
│   ├── programlar.json   # Eğitim programları
│   └── kadro.json        # Öğretmen listesi
├── ANALIZ.md             # Proje planlama dokümanı
├── KURUMA_ICERIK_TALEBI.md  # Kurumla paylaşılan içerik isteği
└── README.md             # Bu dosya
```

---

## Tek Bir Yerden Değiştirilebilenler

### Tüm site iletişim bilgileri → `data/ayarlar.json`
Telefon numarası, adres, sosyal medya URL'leri, çalışma saatleri vb. **tek
dosyadan** değişir; tüm sayfalara otomatik yansır.

```json
{
  "iletisim": {
    "telefon": "+90 264 XXX XX XX",
    "whatsapp": "905XXXXXXXXX",
    ...
  }
}
```

### Tema renkleri → `assets/css/base.css` (en üst, `:root`)
```css
:root {
  --renk-birincil: #0f4c81;  /* Bunu değiştirsen tüm site etkilenir */
  --renk-vurgu: #f2a65a;
  ...
}
```

---

## Yönetim Paneli (`/admin/`)

Detaylı rehber için: **[ADMIN_REHBERI.md](ADMIN_REHBERI.md)**

Kısa özet:
- **Aşama 1 (şu an):** `/admin/` rotasında client-side panel. Şifre:
  `ilkadim2026` (`admin/js/admin-core.js` içinde değiştirilir). Duyuru ve site
  ayarları düzenlenir, `JSON İndir` → manuel git push.
- **Aşama 2 (deploy sonrası):** Decap CMS + Netlify Identity. Config dosyaları
  `admin/decap-config.yml` ve `admin/decap-index.html.taslak` olarak hazır.
  Aktivasyon adımları yine `ADMIN_REHBERI.md` Bölüm B'de.

---

## Duyuru Ekleme — Manuel (panel kullanmadan)

`data/duyurular.json` dosyasını elle düzenle, git'e push et, Netlify otomatik
yeniden deploy eder.

```json
{
  "duyurular": [
    {
      "id": "benzersiz-bir-slug",
      "baslik": "Duyuru başlığı",
      "ozet": "Liste sayfasında görünecek kısa metin.",
      "icerik": "Detay sayfasında görünecek uzun metin.",
      "kategori": "kayit",          // genel | kayit | sinav | etkinlik
      "tarih": "2026-05-12",
      "kapakGorseli": "",
      "onemli": false
    }
  ]
}
```

**Gelecek:** [Decap CMS](https://decapcms.org/) entegrasyonu yapılınca, kurum
personeli `/admin/` adresinden görsel arayüzle düzenleyebilecek. Site
Netlify'a deploy edildikten sonra eklenecek.

---

## Form Kurulumu (başvuru, anket)

Şu an `basvuru.html` içinde statik bir taslak form var (submit → tesekkurler.html).

**Aşama 1 — Google Forms entegrasyonu (önerilen ilk adım):**
1. [Google Forms](https://forms.google.com)'da bir form oluştur.
2. Cevapları bir Google Sheet'e bağla.
3. Formun "Yayınla" → "Gömme" sekmesinden HTML kodunu al.
4. `basvuru.html` içinde, taslak `<form>` etiketinin yerine bu `<iframe>` kodu
   yapıştır. (`basvuru.html` dosyasında bu yerin nasıl olacağına dair yorum satırı var.)

**Aşama 2 (ileride):** Kurum daha fazla form yönetmek isterse, JSON tabanlı
custom form motoru + Google Apps Script web hook ile Sheets'e yazma yapılır.

---

## Deploy (Netlify ile, ücretsiz)

1. Bu klasörü bir GitHub repository'sine push et.
2. [netlify.com](https://netlify.com) → "Import from Git" → repo'yu seç.
3. Build komutu: **(boş)** | Publish directory: **(boş ya da `.`)**
4. Deploy. Custom domain bağla.

> Notlar:
> - Netlify, `404.html` dosyasını otomatik olarak 404 sayfası olarak kullanır.
> - Tüm `<a href="/...">` linkleri kökten başlıyor, bu yüzden alt klasör değil,
>   ana domain'de deploy edilmeli.

---

## Yeni Sayfa Ekleme

1. Kök dizinde `yenisayfa.html` oluştur. Mevcut bir sayfayı (örn. `hakkimizda.html`)
   şablon olarak kopyala.
2. `partials/header.html` içindeki `<ul class="site-nav__liste">` altına
   yeni bir `<li>` ekle:
   ```html
   <li><a href="/yenisayfa.html" class="site-nav__link" data-link="yenisayfa">Yeni Sayfa</a></li>
   ```
3. `assets/js/main.js` içindeki `eslesme` nesnesine sayfa eşlemesini ekle (aktif
   menü vurgusu için).
4. `partials/footer.html` içindeki ilgili menü listesine de ekle (isteğe bağlı).

---

## Yapılacaklar / Bağımlı Kısımlar

- [ ] Logo, kurum fotoğrafları, öğretmen fotoğrafları (kurum sağlayacak)
- [ ] Kurum metinleri (hikâye, kurucu mesajı vb.)
- [ ] Gerçek telefon, adres, e-posta bilgileri → `data/ayarlar.json`
- [ ] Google Maps gerçek konum embed URL'si
- [ ] Google Form bağlantısı (başvuru için)
- [ ] KVKK metni — kurum vergi/ünvan bilgisi sonrası finalize
- [ ] Netlify'a deploy
- [ ] (Sonra) Decap CMS kurulumu — `/admin/`
- [ ] (Sonra) Galeri için lightbox JS
- [ ] Favicon ekle (`/favicon.ico`, `/apple-touch-icon.png`)
- [ ] SEO meta tag'leri, Open Graph, sitemap.xml, robots.txt

---

## Geliştirici Notları

- Tüm sayfa şablonu aynıdır: `<div id="siteHeaderYer">`, `<main>`,
  `<div id="siteFooterYer">`, `<div id="floatIkonlarYer">`. `main.js` bu
  ID'leri görüp partial'ları yükler.
- Veri bağlama için `data-veri="path.to.field"` niteliği kullanılır.
  Örn: `<span data-veri="iletisim.telefon">…</span>` → ayarlar.json'daki
  `iletisim.telefon` değeriyle dolar.
- Sosyal medya linkleri için `data-sosyal="instagram"` kullanılır; URL boşsa
  link otomatik gizlenir.
- Floating ikonlar `partials/floating-icons.html`'de tanımlı, `main.js`
  içinden ayarlar'a göre bağlanır.
