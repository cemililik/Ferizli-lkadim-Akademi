# Site Yenileme Raporu — Hero Slider, UI/UX & Admin Yönetimi

> **Proje:** Özel Ferizli İlk Adım Akademi
> **Tarih:** 2026-06-11
> **Talep:** Müşteri siteyi "çok sade ve eski usul" buldu. İstenenler: (1) ana sayfa hero alanını eğitim temalı öğrenci/öğretmen fotoğraflarından bir **slider** yapmak, (2) burası dahil **tüm alanların admin panelinden düzenlenebilir/aç-kapa edilebilir** olması, (3) sitenin tümünü UI/UX gözüyle gözden geçirmek, (4) [bahcesehir.k12.tr](https://bahcesehir.k12.tr/)'den ilham almak.
> **Çalışma ilkesi:** Yapılan her ekran/modül/component mümkün mertebe admin'den **açılıp kapatılabilir ve düzenlenebilir** olacak.
> **İlişki:** Bu rapor [ANALIZ_UI_UX.md](ANALIZ_UI_UX.md) (2026-05-13) raporunun ÜZERİNE kuruludur, onu tekrar etmez. O rapor "görsel modernizasyon" (renk/tipografi/ikon), bu rapor "**yapısal yenileme + admin yönetimi**" odaklıdır.

---

## ✅ Uygulama Durumu (2026-06-11)

Onayınızla **tüm paket** `feature/anasayfa-yenileme` dalında uygulandı ve `localhost:8088` üzerinde (Docker + MariaDB) uçtan uca doğrulandı (masaüstü + mobil ekran görüntüsü ile):

- **Faz 1 — Hero foto slider:** ✅ Kütüphanesiz vanilla JS slider (fade, otomatik geçiş, ok/nokta, klavye, hover'da durur, reduced-motion, mobilde görünür). 3 telifsiz placeholder görsel. Admin'den slayt CRUD + görsel upload + aç/kapa.
- **Faz 2 — Metinler admin'e:** ✅ Hero, "Neden Biz" kartları, CTA, tüm bölüm başlıkları artık `ayarlar` (DB) üzerinden düzenlenir; HTML'de hardcoded metin kalmadı.
- **Faz 3 — Yeni modüller:** ✅ Sayaç (count-up animasyonu), Görüşler (testimonials), SSS (accordion) — hepsi admin CRUD + `Modüller`'den aç/kapa.
- **Faz 4 — Görsel modernizasyon:** ✅ CTA gradient sadeleştirildi; pastel/letter-spacing/reduced-motion/footer önceki sprint'lerde zaten yapılmıştı; hero sarı vurgu slider'la doğal olarak kalktı.

**Mimari:** Yeni bölümler `moduller.{hero,istatistik,gorusler,sss}` toggle'larıyla yönetilir; içerik `ayarlar.{hero,anasayfa,gorusler,sss}` altında. Tüm yeni nested yapıların DB roundtrip'i (`nokta_duzlestir`/`nokta_set`) test edildi. **Henüz commit edilmedi** — gözden geçirmeniz için dalda duruyor.

---

## 0. Yönetici Özeti

Site mimari olarak sağlam (vanilla JS frontend + PHP API + MySQL + JSON ayar katmanı). Eksik olan **"yaşayan, fotoğraflı, kurumun anlattığı" bir ön yüz** ve **içeriğin tamamına admin'den hâkim olabilmek**. İyi haber: admin altyapısı (`ayarlar.json` ↔ `[data-veri]` enjeksiyonu ↔ `moduller` aç/kapa) bunu büyütmeye **çok uygun** — sıfırdan sistem kurmuyoruz, var olanı genişletiyoruz.

**3 ana iş kolu:**
1. **Hero Foto Slider** → statik SVG yerine, admin'den yönetilen çoklu görsel + metin + buton slider'ı.
2. **Ana sayfayı zenginleştir** → Bahçeşehir esinli yeni bölümler (sayaç şeridi, eğitim modeli, görüşler, SSS) — hepsi admin'den aç/kapa + düzenle.
3. **"Her şey admin'den" mimarisini tamamla** → şu an HTML'e gömülü olan hero/CTA/bölüm başlığı metinlerini ayar katmanına taşı.

**En kritik tespit:** Hero başlığı, alt başlık, CTA metinleri, "hero-altı 4 özellik" ve bölüm başlıkları şu an **kodda sabit** — müşteri bunları değiştiremiyor. "Her şey admin'den" hedefinin kalbi burası.

---

## 1. Mevcut Durum (Kısa Tespit)

### Ne çalışıyor (admin'den yönetiliyor) ✅
- Kurum bilgisi, iletişim, çalışma saatleri, sosyal medya
- **Modül aç/kapa:** hakkımızda, programlar, kadro, duyurular, galeri, blog (`ayarlar.moduller`)
- Hakkımızda içeriği (hikâye/misyon/vizyon/kurucu mesajı)
- İstatistikler (dizi — ama **şu an boş, ana sayfada gizli**)
- Tanıtım videosu (YouTube ID girilince çıkıyor)
- İçerik CRUD: duyurular, programlar, kadro, galeri, formlar, blog

### Ne çalışmıyor / eski hissettiriyor ❌
| Konu | Durum |
|---|---|
| **Hero** | Statik SVG illüstrasyon (hedef+ok+kitap+kep). Fotoğraf yok, slider yok, mobilde tamamen gizli. |
| **Hero metinleri** | `index.html`'de hardcoded ([index.html:69-72](index.html#L69-L72)). Admin değiştiremez. |
| **Hero-altı 4 özellik** | "Deneyimli Kadro / Küçük Sınıflar..." hardcoded ([index.html:236-296](index.html#L236-L296)). |
| **CTA metinleri** | "Hayalinizdeki başarıya..." hardcoded ([index.html:371-372](index.html#L371-L372)). |
| **Bölüm başlıkları** | "Programlarımız / Son Duyurular / Kurumumuz" hardcoded. |
| **Gerçek fotoğraf** | Sitede neredeyse hiç yok — her şey SVG/ikon. Eğitim kurumu için "soğuk" duruyor. |
| **Sayaç/istatistik** | Veri boş + animasyon yok. |
| **Sosyal kanıt** | Veli/öğrenci görüşü, başarı hikâyesi, SSS yok. |

---

## 2. Bahçeşehir Koleji'nden Çıkarımlar

Bahçeşehir'in beğenilen yanları ve **bizim ölçeğimize** (tek şubeli, butik kurs) uyarlaması:

| Bahçeşehir'de | Bizde karşılığı (uyarlanmış) | Almalı mı? |
|---|---|---|
| Tam genişlik **fotoğraflı hero slider** (öğrenci/kampüs görselleri + üstte başlık + CTA) | **Hero foto slider** — ana talep. Eğitim temalı stok + zamanla kurumun kendi fotoğrafları. | ✅ Evet (öncelik 1) |
| Büyük **sayaç şeridi** (58 il, 144 kampüs, 100.000+ öğrenci) | Bize uygun sayılar: kuruluş yılı, öğrenci sayısı, başarı oranı, branş öğretmeni, deneme/yıl | ✅ Evet — istatistik zaten var, **aktive + animasyon** ekle |
| **Eğitim modeli kartları** (STEM, çift dil, yapay zekâ, KÖM, KAREM) | "Eğitim Anlayışımız" / "Neden İlk Adım?" kartları: birebir etüt, deneme analizi, rehberlik, küçük sınıf | ✅ Evet — bugünkü "hero-altı 4 özellik"i bu zengin bölüme dönüştür |
| **Haberler/Duyurular** fotoğraflı grid | Zaten var (duyurular) | ✅ Mevcut — görselleştir |
| **Tanıtım videosu** bölümü | Zaten var (YouTube) | ✅ Mevcut |
| **Kampüs haritası / şube bulucu** | Tek şube → "Konum & Ulaşım" + harita (iletişimde var) | ⚠️ Sadeleştirerek |
| Kurumsal **çok katmanlı footer** | Var | ✅ Mevcut |
| Çok ağır animasyon / kurumsal görkem | Butik kurs için fazla iddialı; sıcak + sade tut | ❌ Aynen alma |

**Çıkarım:** Bahçeşehir'in "fotoğraf + sayı + sosyal kanıt + net CTA" iskeletini al; ama ölçeği ve sıcaklığı İlk Adım'a göre ayarla (kurumsal soğukluk değil, mahalle kursunun samimiyeti + profesyonel görünüm).

> Not: bahcesehir.k12.tr sunucusunun SSL sertifika zinciri eksik olduğundan otomatik içerik çekimi yapılamadı; analiz, arama sonuçları + Türk kolej sitelerinin bilinen tasarım dili üzerinden yapıldı. Birlikte tarayıcıdan canlı bakıp bu bölümü netleştirebiliriz.

---

## 3. Hero Foto Slider (Ana Talep)

### 3.1 Tasarım
- **Tam genişlik**, yükseklik `min(90vh, 720px)` masaüstü / `70vh` mobil.
- Her slide: **arka plan fotoğrafı** + koyulaştırıcı **overlay** (metin okunabilirliği için) + sol/orta hizalı **başlık + alt başlık + 1-2 CTA**.
- **Otomatik geçiş** (5sn, ayarlanabilir), **noktalar (dots)** + ok butonları, **hover'da durur**, klavye ile gezilir, `prefers-reduced-motion`'da otomatik kayma kapanır.
- Geçiş: yumuşak **fade** (slide'a göre daha sakin/kurumsal).
- Mobilde de görünür (bugünkü hero görseli mobilde gizleniyor — bu düzelir).
- Kütüphane **yok** — ~60 satır vanilla JS (mevcut "no framework" ilkesine uygun, performanslı).

### 3.2 Admin Mimarisi (kritik)
`ayarlar.json` içine yeni bir `hero` objesi:
```jsonc
"hero": {
  "aktif": true,                 // tüm hero'yu aç/kapa
  "mod": "slider",               // "slider" | "tekli" | "video"
  "otomatikGecis": true,
  "gecisSuresiSn": 5,
  "slaytlar": [
    {
      "aktif": true,
      "gorsel": "/assets/uploads/hero-1.jpg",
      "baslik": "Sınava emin adımlarla hazırlanın",
      "altBaslik": "Ortaokul ve lise için sınav hazırlık, takviye ve etüt.",
      "butonMetin": "Ücretsiz Görüşme",
      "butonLink": "/basvuru.html",
      "buton2Metin": "WhatsApp'tan Sor",
      "buton2Link": "whatsapp",
      "overlayKoyuluk": 45        // % — okunabilirlik ayarı
    }
  ]
}
```
- Admin'de **yeni "Ana Sayfa / Hero" sekmesi**: slayt ekle/sil/sırala, her slayta görsel **yükle** (mevcut `uploads.php` ile), metin + buton + overlay düzenle, slaytı tek tek aç/kapa.
- `hero.aktif=false` → hero gizlenir (modül mantığının aynısı).
- Frontend: `main.js`'e küçük bir `heroSlider()` fonksiyonu; `data-hero` konteynerini `ayarlar.hero`'dan render eder. Veri yoksa **güvenli fallback** (tek statik görsel/başlık).

### 3.3 Görsel kaynağı (karar gerekli)
1. **Stok başlangıç + admin upload** (önerilen): 3-4 telifsiz eğitim fotoğrafıyla (Unsplash/Pexels lisansı) başlatalım, müşteri kurumun kendi fotoğraflarıyla değiştirsin. Hızlı + esnek.
2. **Sadece müşteri fotoğrafı:** Daha otantik ama müşteriden kaliteli foto beklemek gerekir (gecikme riski).

---

## 4. Ana Sayfa Yeni Kurgu (Bahçeşehir Esinli)

Önerilen yeni ana sayfa akışı — **her bölüm admin'den aç/kapa + düzenle**:

| # | Bölüm | Durum | Admin |
|---|---|---|---|
| 1 | **Hero foto slider** | 🆕 Yeni | Slayt CRUD + aç/kapa |
| 2 | **Hero-altı özellikler → "Neden İlk Adım?"** | ♻️ Düzenle | 4 kartı admin'den metin+ikon düzenle |
| 3 | **Sayaç şeridi (istatistikler)** | ♻️ Aktive et | Var ama boş; doldur + sayaç animasyonu, aç/kapa |
| 4 | **Hakkımızda + video** | ✅ Var | Metin admin'de; özet metni ayrıca düzenlenebilir yap |
| 5 | **Programlar** | ✅ Var | CRUD mevcut; başlık metni düzenlenebilir yap |
| 6 | **Veli/Öğrenci Görüşleri (testimonials)** | 🆕 Yeni | Görüş CRUD + aç/kapa (sosyal kanıt) |
| 7 | **Duyurular** | ✅ Var | CRUD mevcut |
| 8 | **Sıkça Sorulan Sorular (SSS)** | 🆕 Yeni | Soru-cevap CRUD + aç/kapa |
| 9 | **CTA (ön kayıt çağrısı)** | ♻️ Düzenle | Başlık/metin/buton admin'de |
| 10 | **Konum & İletişim özeti** | İsteğe bağlı | Harita + adres (ayarlardan) |

🆕 = yeni modül, ♻️ = mevcut ama düzenlenebilir/zengin yapılacak, ✅ = mevcut.

---

## 5. "Her Şey Admin'den" Mimarisini Tamamlama

Mevcut sistem zaten `[data-veri="yol"]` ile metin enjekte ediyor. Eksik olan, **hardcoded metinleri ayar katmanına taşımak**. Önerilen yeni ayar alanları:

```jsonc
"anasayfa": {
  "nedenBiz": [                       // "hero-altı 4 özellik" buradan
    { "ikon": "graduation-cap", "baslik": "Deneyimli Kadro", "metin": "Alanında uzman branş öğretmenleri" }
  ],
  "ctaBaslik": "Hayalinizdeki başarıya bir adım uzaklıktasınız.",
  "ctaMetin": "Ön kayıt formumuzu doldurun, en kısa sürede sizinle iletişime geçelim.",
  "ctaButonMetin": "Ön Kayıt Ol",
  "bolumBasliklari": {
    "programlar": { "ustBaslik": "Programlarımız", "baslik": "Her Seviyeye Uygun Eğitim", "aciklama": "..." },
    "duyurular":  { "ustBaslik": "Güncel", "baslik": "Son Duyurular", "aciklama": "..." }
  }
},
"gorusler": [ { "aktif": true, "ad": "Veli adı", "rol": "8. sınıf velisi", "metin": "...", "foto": "" } ],
"sss": [ { "aktif": true, "soru": "...", "cevap": "..." } ],
"moduller": {
  "...mevcutlar": true,
  "hero": true, "istatistik": true, "gorusler": true, "sss": true   // 🆕 yeni toggle'lar
}
```

Bu yaklaşımla: **müşteri kod görmeden** ana sayfanın her kelimesini, her kartını, her bölümün görünürlüğünü panelden yönetir. Frontend tarafı zaten `[data-veri]` + `[data-modul]` motoruna sahip; sadece bu yeni alanları bağlamak yeterli.

---

## 6. Diğer Sayfalar — UI/UX Gözden Geçirme (Özet)

Detaylı tasarım (renk/tipografi/ikon/gölge) analizi [ANALIZ_UI_UX.md](ANALIZ_UI_UX.md)'de mevcut. Bu talep özelinde **yapısal** notlar:

- **Hakkımızda:** İçerik admin'de ✅. Eklenebilir: zaman çizelgesi (kuruluş→bugün), kurucu fotoğrafı (alan var). Foto eklenince ısınır.
- **Programlar:** Çalışıyor ✅. Kart görselleri eklenebilir (şu an ikon).
- **Kadro:** Foto placeholder eski (initial harf). Gerçek foto + modern placeholder.
- **Duyurular/Galeri/Blog:** Fonksiyonel ✅. Galeri masonry + lightbox ile zenginleşir.
- **Başarılarımız:** Boş. Sayaç + başarı kartları (öğrenci dereceleri) ile doldurulmalı — admin'den.
- **İletişim:** Sağlam ✅. Harita + çalışma saatleri admin'de.
- **Genel görsel dil:** ANALIZ_UI_UX.md'deki "Sprint 1" (pastel→nötr, letter-spacing, sarı vurgu→kırmızı, gradient sadeleştir) düşük riskli yüksek getiri — bu yenilemeyle birlikte yapılabilir.

---

## 7. Önceliklendirilmiş Aksiyon Planı (Taslak)

> Her faz bağımsız teslim edilebilir; müşteri her fazdan sonra görüp onaylayabilir.

### Faz 1 — Hero Foto Slider + Admin (ana talep) 🎯
1. `ayarlar.json`'a `hero` şeması + API'de okuma/yazma
2. Frontend `heroSlider()` (vanilla JS) + CSS (tam genişlik, overlay, dots/ok, responsive, a11y)
3. Admin "Ana Sayfa / Hero" sekmesi (slayt CRUD + görsel upload + aç/kapa)
4. 3-4 telifsiz başlangıç görseli
- **Çıktı:** Müşteri ana sayfa hero'sunu tamamen panelden yönetebilir.

### Faz 2 — Ana Sayfa Metinlerini Admin'e Taşı
1. `anasayfa` ayar bloğu (neden-biz, CTA, bölüm başlıkları)
2. `index.html`'deki hardcoded metinleri `[data-veri]`'ye çevir
3. Admin ayarlar sayfasına ilgili alanlar
- **Çıktı:** "Her şey admin'den" hedefi ana sayfada tamamlanır.

### Faz 3 — Yeni Modüller: Sayaç + Görüşler + SSS
1. İstatistik sayaç animasyonu + örnek veri + aç/kapa
2. Görüşler (testimonials) modülü: data + frontend + admin CRUD
3. SSS modülü: data + frontend (accordion) + admin CRUD
- **Çıktı:** Sosyal kanıt + sayılarla "dolu" ana sayfa.

### Faz 4 — Görsel Modernizasyon (ANALIZ_UI_UX.md Sprint 1-2)
1. Pastel→nötr renk, letter-spacing, gradient sadeleştirme
2. Emoji→SVG ikon tutarlılığı
3. Kart hover dilini sadeleştir
- **Çıktı:** "Eski usul" hissinin görsel tarafı çözülür.

### Faz 5 — Sayfa-özel zenginleştirme
1. Başarılarımız doldur, Kadro foto, Galeri masonry, Hakkımızda timeline
- **Çıktı:** Her sayfa kendi karakterine kavuşur.

---

## 8. Karar Gereken Noktalar

1. **Başlama noktası:** Önce yalnız Hero Slider mı (hızlı görünür kazanç), yoksa Faz 1+2 birlikte mi (hero + tüm ana sayfa admin'e)?
2. **Hero görsel kaynağı:** Telifsiz stok + admin upload (hızlı) mı, yoksa müşteri fotoğrafı beklensin mi?
3. **Kapsam/agresiflik:** Sadece ana sayfa yenileme mi, yoksa görsel modernizasyon (Faz 4) da bu turda mı?
4. **Yeni modüller:** Görüşler ve SSS bu turda eklensin mi, sonraya mı?

---

*Bu rapor salt analiz + öneridir; kod değişikliği içermez. Onayınızla seçilen fazlardan başlayıp ilerleriz.*
