# Mobil UI/UX Analiz & Denetim Raporu

> **Proje:** Özel Ferizli İlk Adım Akademi
> **Tarih:** 2026-06-11
> **Kapsam:** Mobil (360px / 390px) deneyim — anasayfa + iç sayfalar (iletişim, başvuru, programlar, duyurular, kadro, hakkımızda) + mobil menü
> **Yöntem:** Gerçek 390px render (iframe izolasyonu) + DOM ölçümü + 6 boyutlu kod denetimi (CSS/HTML/JS, dosya:satır kanıtlı) + adversarial doğrulama
> **Durum:** Salt analiz — kod değişikliği yapılmadı.

---

## 0. Yönetici Özeti + Önemli Metodolojik Düzeltme

**Kritik tespit:** İlk aldığım headless ekran görüntüleri **yanıltıcıydı** — `--window-size=390` gerçek mobil viewport'u render etmeyip daha geniş bir layout'u 390'a *kırpıyordu* (Neden Biz'i 2 kolon ve metinleri kesik gösteriyordu). **Gerçek 390px render (iframe) + DOM ölçümü** ile doğruladım:

- **360px ve 390px'te yatay taşma YOK** (`html.scrollWidth = viewport`, 0 taşan eleman).
- Responsive breakpoint'ler **doğru çalışıyor**: Neden Biz 480px altında 1 kolon, hero alt başlığı tam sarıyor, form/tablo/duyuru kartları düzgün, mobil drawer çalışıyor.

**Sonuç:** Mobil layout **temelde sağlam** — katastrofik bir bug yok. "Çok iyi değil" hissi **incelikli** noktalardan geliyor: dokunma hedefleri, hero kontrolleri, dokunsal geri bildirim, dikey yoğunluk ve eksik mobil-özel öğeler (yapışkan CTA). Aşağıdaki bulguların hepsi gerçek kod üzerinden (dosya:satır + hesaplanan boyut) doğrulandı ve adversarial kritikten geçirildi.

**En yüksek getirili 6 iş:** (1) hero'ya swipe + nokta dokunma alanı, (2) global tap-highlight + `:active` geri bildirim, (3) iOS scroll-lock, (4) kadro görsellerinde lazy + kaçış, (5) yapışkan alt CTA çubuğu, (6) yoğunluk/dokunma-yüksekliği CSS override'ları.

---

## 1. P1 — Yüksek Öncelik

### 1.1 🔴 Hero slider'da dokunma-kaydırma (swipe) yok + oklar mobilde gizli
Telefonda slayt değiştirmenin **tek yolu** noktalar. `main.js:566-578` yalnızca click/keydown dinliyor; projede `touchstart/touchmove` = 0. `pages.css:131` mobilde `.hero-slider__ok{display:none}`.
**Düzeltme:** `heroSlider()` içine minimal vanilla touch dinleyici (`passive:true`, ~40px yatay eşik, dikey kaydırmada no-op). **En yüksek getirili tek değişiklik.** (efor: orta)

### 1.2 🔴 Hero noktaları 12×12px — dokunma hedefi çok küçük
`pages.css:120-121 .hero-slider__nokta{width:12px;height:12px}`, gap 10px. Önerilen 44px'in ~%27'si. Oklar gizli olduğu için kritik.
**Düzeltme:** `.hero-slider__nokta{position:relative}` + `::after{content:'';position:absolute;inset:-16px}` → görsel 12px kalır, dokunma alanı ~44px. Gap'i 12-14px'e çıkar. (efor: küçük)

### 1.3 🔴 iOS Safari'de drawer açıkken arka plan kayıyor (scroll-lock eksik)
`layout.css:216 body.menu-acik{overflow:hidden}` tek başına iOS'ta touchmove'u güvenilir kilitlemez; `main.js menuKapat()` scroll konumu saklamıyor.
**Düzeltme:** menü açılınca `body{position:fixed;top:-Ypx;width:100%}`, kapanınca geri al + `scrollTo(0,Y)`. (efor: orta)

### 1.4 🔴 Mobilde yapışkan alt CTA çubuğu yok (Ara / WhatsApp / Ön Kayıt)
Tek mobil eylem sağ-alttaki floating daireler. Dersane sitesinde veli telefon/WhatsApp odaklı → alt sabit çubuk **dönüşüm getirisi yüksek**. (Bug değil, eksik özellik.)
**Düzeltme:** mobile-only `.mobil-cta-bar` (`position:fixed;bottom:0`, 3 buton, `min-height:52px`, `padding-bottom:env(safe-area-inset-bottom)`); `body`'ye alt padding. **A12 (safe-area) ile birlikte yapılmalı.** (efor: orta)

---

## 2. P2 — Orta Öncelik (dokunsal geri bildirim, yoğunluk, form)

### 2.1 🟡 Global `-webkit-tap-highlight-color` yok + birçok öğede `:active` eksik
Projede `tap-highlight` = 0. `.dugme:active` var ama `.cip`, `.duyuru-filtre__dugme`, `.site-nav__link`, `.float-ikon`, `.hero-slider__nokta`, `.menu-dugmesi`, kart linkleri için yok → mobilde varsayılan gri/mavi flaş + basma onayı yok. **Tek kök neden, tek çözüm** (denetimde 5 ayrı yerde tekrarlanmıştı).
**Düzeltme:** `base.css`'e `html{-webkit-tap-highlight-color:transparent}` + ilgili öğelere `:active{transform:scale(0.96);transition-duration:80ms}`. (efor: küçük)

### 2.2 🟡 `kadro.js` görsellerinde `loading="lazy"` yok + XSS kaçışı yok
`kadro.js:18 <img src="${k.foto}" alt="${k.ad}">` — `loading/width/height/decoding` yok; diğer tüm render dosyaları (`duyurular.js`, `galeri.js`, `blog.js`) `loading="lazy"` + `esc()` kullanıyor. `kadro.js` ayrıca `${k.ad}`, `${k.brans}`, `${k.motto}`'yu **hiç kaçışsız** innerHTML'e basıyor (perf + güvenlik).
**Düzeltme:** `kadro.js`'e `esc()` ekle; `<img ... alt="${esc(k.ad)}" loading="lazy" decoding="async" width="320" height="320">`. CLS'i de önler. (efor: küçük)

### 2.3 🟡 Filtre dokunma yükseklikleri 44px altında (`.cip` ~35px, `.duyuru-filtre__dugme` ~36px)
`components.css:233` ve `pages.css:920` — ikisi de gerçek `<button>`, sadece `:hover`.
**Düzeltme:** padding'i `var(--bosluk-3) var(--bosluk-4)` veya `min-height:44px`; `:active` feedback (2.1 ile birleşir). (efor: küçük)

### 2.4 🟡 Form radio/checkbox: native kutu küçük + `accent-color` yok + satır ~40px
`.form-secenek` satırı komple `<label>` (tüm satır tıklanabilir — bu iyi), ama native kutu boyutsuz (~13-16px), `accent-color` = 0 → işaretli kutu marka mavisi değil. KVKK kutusu da boyutsuz.
**Düzeltme:** `.form-secenek input, .form-onay input[type=checkbox]{width:20px;height:20px;accent-color:var(--renk-birincil)}` + mobilde satıra `min-height:44px`. (efor: küçük)

### 2.5 🟡 Footer menü + KVKK linkleri ~19px, tutarsız
`layout.css:397` menü linkleri padding'siz 14px, `li` arası 8px → yanlış-link riski. Aynı footer'da `.site-footer__iletisim a` mobilde `min-height:44px` ALMIŞ ama menü linkleri almamış (tutarsızlık).
**Düzeltme:** aynı 540px desenini `.site-footer__menu a` + `.site-footer__alt a`'ya uygula. (efor: küçük)

### 2.6 🟡 Dikey yoğunluk: başlık-altı ve sayaç boşlukları mobilde küçülmüyor
- `.bolum-baslik{margin-bottom:48px}` (`base.css:236`) — mobil override yok; bölüm padding'i 48px'e inerken başlık-altı boşluk masaüstü değerinde kalıyor.
- `.istatistik__sayi{font-size:48px}` clamp yok (`components.css:521`); 4 sayaç <640px'te tek kolon (üst üste).
**Düzeltme:** `@media(max-width:520px){.bolum-baslik{margin-bottom:var(--bosluk-8)}}`; `.istatistik__sayi` → `clamp(var(--yazi-4xl),9vw,var(--yazi-5xl))` + `@media(max-width:520px){.sayac-izgara{grid-template-columns:1fr 1fr}}` (2×2 kompakt). *Not: 640-960px arası zaten 2×2, sadece <640'ı hedefle.* (efor: küçük)

### 2.7 🟡 Hero yüksekliği mobilde 78vh — alt içerik sinyali zayıf
`pages.css:17 min-height:clamp(460px,78vh,720px)` → küçük ekranda hero neredeyse tüm ekranı kaplıyor, "aşağıda içerik var" affordance'ı zayıf.
**Düzeltme:** `@media(max-width:640px){.hero-slider__sahne{min-height:clamp(420px,64vh,560px)}}`. (efor: küçük)

---

## 3. P3 — Düşük Öncelik (cila / koşullu)

- **Drawer'da görünür kapatma (X) butonu yok** (`header.html`). Hamburger mobilde X'e dönüşüyor + backdrop var → affordance mevcut ama drawer içinde net değil. (efor: orta)
- **Viewport `viewport-fit=cover` yok** → `env(safe-area-inset)` 0 döner. Çentikli iPhone'da en alt floating ikon home-indicator'la çakışabilir. **Yapışkan CTA (1.4) eklenirse zorunlu.** Tüm `*.html`'e `, viewport-fit=cover` (⚠️ `user-scalable=no` EKLEMEYİN — a11y). (efor: küçük)
- **Hero noktalarında roving tabindex yok** (a11y) — 5 nokta tek tek tab ile geziliyor (`main.js:535`). (efor: küçük)
- **Blog filtre çip-kaldır (×) 18px** (`pages.css:591`) — blog modülü opsiyonel, düşük. (efor: küçük)
- **`.blog-izgara minmax(320px)` vs `.galeri-izgara minmax(260px)`** tutarsızlık — kozmetik, taşma yok. (efor: küçük)
- **Floating ikon tooltip'leri (`data-ipucu`) dokunmatik cihazda görünmez** — ikon işlevi görsel olarak belirsiz; aria-label var (a11y OK). (efor: küçük)

---

## 4. Ne SORUN DEĞİL (şeffaflık — reddedilen bulgular)

Denetimde çıkıp **doğrulamada elenen** iddialar (yanlış alarmı raporlamamak için):

- ❌ "Reduced-motion'da drawer animasyonu kapatılmıyor" → **YANLIŞ.** `base.css:135-143` global `*{animation/transition-duration:0.01ms !important}` bloğu var; drawer geçişi zaten ~0ms'ye iniyor.
- ❌ "Hero görselleri için LCP/srcset önlemi yok" → **spekülatif.** Mevcut slaytlar hafif SVG; gerçek foto henüz yok. Gelecek-iş notu, bugünkü bulgu değil.
- ❌ "Floating ikonlar z-index:90 backdrop altında dokunulabilir kalabilir" → **YANLIŞ.** Backdrop (z-999) tam-ekran overlay; ikonlar tıklanamaz.
- ❌ "Aktif link sol-bordürü hizalamayı kaydırır" → **YANLIŞ.** `padding-left:calc(... - 4px)` + 4px border = sabit; layout shift yok.
- ❌ "Gövde metni satır uzunluğu sınırsız" → mobilde ~50-55 karakter (sorun değil; masaüstü konusu).
- ❌ "h1 30px floor mobilde büyük" → kırpma/taşma yok; kabul edilebilir hiyerarşi.
- ✅ **Korunması gerekenler:** pinch-zoom açık (`user-scalable=no` yok — doğru), `scroll-padding-top` mobilde yeterli, çalışma saatleri tablosu / galeri grid / native select sorunsuz.

---

## 5. Önceliklendirilmiş Aksiyon Planı

| Sıra | İş | Dosyalar | Efor |
|---|---|---|---|
| 1 | **Global tap-highlight + `:active`** (2.1, 2.3) | base.css, components.css, pages.css | Küçük |
| 2 | **Hero swipe + nokta dokunma alanı** (1.1, 1.2) | main.js, pages.css | Orta |
| 3 | **iOS scroll-lock** (1.3) | main.js, layout.css | Orta |
| 4 | **Kadro lazy + esc** (2.2) | kadro.js | Küçük |
| 5 | **Yapışkan alt CTA + safe-area** (1.4, P3-viewport) | yeni partial/CSS, tüm *.html | Orta |
| 6 | **Yoğunluk + dokunma yükseklikleri** (2.4, 2.5, 2.6, 2.7) | base.css, components.css, layout.css, pages.css | Küçük |
| 7 | Cila (drawer X, roving tabindex, tutarlılık — P3) | header.html, main.js, pages.css | Küçük |

> **Tahmini toplam:** 1-6 arası ≈ yarım–bir günlük odaklı çalışma. Çoğu küçük, izole CSS/JS değişikliği; hiçbiri mevcut layout'u bozmaz.

---

*Bu rapor salt analiz + öneridir. Onayınızla seçilen önceliklerden başlayıp uygularız; her grup mobilde önce/sonra ekran görüntüsüyle doğrulanır.*
