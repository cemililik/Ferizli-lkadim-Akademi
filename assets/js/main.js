/* ============================================
   main.js — tüm sayfalarda ortak çalışır
   Görevleri:
   - data/ayarlar.json'u tek seferde yükler, global pencereye koyar
   - Header / Footer / Floating-icons partial'larını yükler
   - data-veri="..." şablonlarını gerçek değerlerle doldurur
   - Aktif menü vurgusu
   - Mobil menü aç/kapa
   - Header scroll efekti
   - Footer yıl bilgisi
   ============================================ */

(() => {
  'use strict';

  // Mevcut sayfanın "data-link" değerini bulmak için yardımcı
  const getMevcutSayfa = () => {
    const yol = location.pathname.split('/').pop() || 'index.html';
    const eslesme = {
      'index.html': 'anasayfa',
      '': 'anasayfa',
      'hakkimizda.html': 'hakkimizda',
      'programlar.html': 'programlar',
      'kadro.html': 'kadro',
      'duyurular.html': 'duyurular',
      'galeri.html': 'galeri',
      'iletisim.html': 'iletisim',
      'basvuru.html': 'basvuru',
      'basarilarimiz.html': 'basarilarimiz',
      'blog.html': 'blog',
      'yazi.html': 'blog'
    };
    return eslesme[yol] || null;
  };

  // Nokta-yollu nesne getirici: "iletisim.adres" gibi
  const noktaYol = (obj, yol) => yol.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

  // Güvenli HTML kaçışı (innerHTML ile yazılan dinamik metinler için)
  const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const azaltilmisHareket = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Çoklu-format bool çözücü (admin '1'/'0' string, JSON true/false saklayabilir)
  const dogruMu = (v, varsayilan = true) => {
    if (v === undefined || v === null || v === '') return varsayilan;
    return v === true || v === 1 || v === '1' || v === 'true';
  };

  // İkon haritası — "neden biz" kartları admin'den ikon ADI seçer (emoji değil, modern SVG).
  // Lucide stroke ikonları; yeni ikon eklemek için buraya path eklenir + admin select'ine option.
  const IKONLAR = {
    'graduation-cap': '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    'trending-up': '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'book-open': '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'award': '<path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    'check-circle': '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    'heart': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.5 4.04 3 5.5l7 7Z"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'pencil': '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    'smile': '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>',
    'star': '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    // Hero rozeti için ek ikonlar (konum, takvim, duyuru vb.)
    'map-pin': '<path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    'calendar': '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>',
    'megaphone': '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    'sparkles': '<path d="M9.94 14.06A2 2 0 0 0 8.5 12.6L2.4 11a.5.5 0 0 1 0-1l6.1-1.56A2 2 0 0 0 9.94 6.94L11.5.84a.5.5 0 0 1 1 0l1.56 6.1A2 2 0 0 0 15.5 8.4L21.6 10a.5.5 0 0 1 0 1l-6.1 1.56a2 2 0 0 0-1.44 1.44L12.5 20.1a.5.5 0 0 1-1 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
    'flame': '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    'tag': '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.71a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  };
  const ikonSvg = (ad) => {
    const ic = IKONLAR[ad] || IKONLAR['check-circle'];
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg>`;
  };
  // Hero rozet ikonu — 'none'/'yok' ise ikon gösterme; tanımsızsa konum (geriye dönük uyum)
  const rozetIkonSvg = (ad) => {
    if (ad === 'none' || ad === 'yok') return '';
    return ikonSvg(ad || 'map-pin');
  };

  // Frontend varsayılanları — DB/ayarlar henüz doldurulmamışsa site yine de dolu görünür.
  // Admin panelinden kaydedilen değerler bunları geçersiz kılar.
  const HERO_VARSAYILAN = {
    gecisSuresiSn: 6,
    otomatikGecis: true,
    slaytlar: [
      { gorsel: '/assets/img/hero/slayt-1.svg', rozet: 'Ferizli, Sakarya', rozetIkon: 'map-pin', baslik: 'Sınava emin adımlarla hazırlanın', altBaslik: 'Ortaokul ve lise öğrencileri için LGS–YKS hazırlık, takviye ve etüt programları.', butonMetin: 'Ücretsiz Görüşme Talep Et', butonLink: '/basvuru.html', buton2Metin: "WhatsApp'tan Sor", buton2Link: 'whatsapp', overlayKoyuluk: 55 },
      { gorsel: '/assets/img/hero/slayt-2.svg', rozet: 'Birebir İlgi', rozetIkon: 'sparkles', baslik: 'Küçük sınıflar, deneyimli öğretmenler', altBaslik: 'Her öğrenciye birebir ilgi gösterebildiğimiz küçük mevcutlu sınıflar.', butonMetin: 'Programlarımızı İncele', butonLink: '/programlar.html', buton2Metin: 'Kadromuzu Tanıyın', buton2Link: '/kadro.html', overlayKoyuluk: 55 },
      { gorsel: '/assets/img/hero/slayt-3.svg', rozet: 'Ön Kayıt Başladı', rozetIkon: 'megaphone', baslik: 'Geleceğe ilk adımı bizimle atın', altBaslik: 'Yeni dönem ön kayıtlarımız başladı. Ön kayıt formunu doldurun, sizinle iletişime geçelim.', butonMetin: 'Hemen Ön Kayıt Ol', butonLink: '/basvuru.html', buton2Metin: 'Bize Ulaşın', buton2Link: '/iletisim.html', overlayKoyuluk: 50 },
    ],
  };
  const NEDENBIZ_VARSAYILAN = [
    { ikon: 'graduation-cap', baslik: 'Deneyimli Kadro', metin: 'Alanında uzman branş öğretmenleri' },
    { ikon: 'users', baslik: 'Küçük Sınıflar', metin: 'Her öğrenciye birebir ilgi' },
    { ikon: 'trending-up', baslik: 'Düzenli Deneme', metin: 'Haftalık deneme sınavları ve analiz' },
    { ikon: 'message-square', baslik: 'Veli İletişimi', metin: 'Şeffaf takip ve düzenli bilgilendirme' },
  ];

  // HTML partial yükleyici (yer tutucu div'in içine basar)
  const partialYukle = async (yer, url) => {
    const el = document.querySelector(yer);
    if (!el) return;
    try {
      const cevap = await fetch(url);
      if (!cevap.ok) throw new Error(`Partial yüklenemedi: ${url}`);
      el.outerHTML = await cevap.text();
    } catch (hata) {
      console.error(hata);
      el.innerHTML = `<div style="padding:1rem;color:#dc2626;font-size:.9rem">Bölüm yüklenemedi: ${url}. Geliştirici modunda statik bir sunucu (örn. VS Code "Live Server") kullanmalısın.</div>`;
    }
  };

  // Modül aktif mi? — ayarlar.moduller.<X> kontrol et, undefined ise açık varsay
  const modulAktif = (ayarlar, ad) => {
    const m = ayarlar.moduller;
    if (!m || typeof m !== 'object') return true;        // ayar yok → varsayılan açık
    const v = m[ad];
    if (v === undefined || v === null || v === '') return true; // değer yok → açık
    return v === true || v === 1 || v === '1';            // string/bool çoklu format
  };

  // Modülleri uygula:
  //   - [data-modul] elementlerini açık modüller için göster, kapalılar için gizle.
  //     (Blog için HTML'de default hidden — açılması bu fonksiyonun görevi.)
  //   - [data-sayfa-modul] body kapalıysa 404'e yönlendir.
  // Blog footer linki için: modül açıkken footer "Hızlı Erişim" menüsüne ekle.
  const modulleriUygula = (ayarlar) => {
    document.querySelectorAll('[data-modul]').forEach(el => {
      const ad = el.getAttribute('data-modul');
      el.hidden = !modulAktif(ayarlar, ad);
    });

    // Blog açıksa footer "Hızlı Erişim" menüsüne ekle (eski blogModuluKontrol davranışı).
    if (modulAktif(ayarlar, 'blog')) {
      const footerMenu = document.querySelector('.site-footer__menu');
      if (footerMenu && !footerMenu.querySelector('[href="/blog.html"]')) {
        const li = document.createElement('li');
        li.setAttribute('data-modul', 'blog');
        li.innerHTML = '<a href="/blog.html">Blog</a>';
        footerMenu.appendChild(li);
      }
    }

    const sayfaModul = document.body.getAttribute('data-sayfa-modul');
    if (sayfaModul && !modulAktif(ayarlar, sayfaModul)) {
      // Sayfayı yok say — 404'e yönlendir (modül kapalıyken kullanıcı /programlar.html'e
      // direkt yazmış olabilir). location.replace ile geri tuşu da güvenli.
      location.replace('/404.html');
    }
  };

  // data-veri="path" niteliği taşıyan elemanlara metni bas
  const veriBagla = (ayarlar) => {
    document.querySelectorAll('[data-veri]').forEach(el => {
      const yol = el.getAttribute('data-veri');
      const deger = noktaYol(ayarlar, yol);
      if (deger != null && deger !== '') el.textContent = deger;
    });

    // data-veri-html="path" — multi-line HTML değerlerini innerHTML olarak yaz.
    // SADECE ayarlar tablosundan gelen güvenli içerikler için (kurum kendi yazıyor).
    // Yine de basit bir whitelist: script/style/iframe içeren değerleri reddet.
    document.querySelectorAll('[data-veri-html]').forEach(el => {
      const yol = el.getAttribute('data-veri-html');
      const deger = noktaYol(ayarlar, yol);
      if (deger == null || deger === '') return;
      const str = String(deger);
      if (/<\s*(script|iframe|object|embed|style)\b/i.test(str) || /\son\w+\s*=/i.test(str)) {
        // Tehlikeli içerik — düz metne düşür
        el.textContent = str.replace(/<[^>]+>/g, '');
      } else {
        el.innerHTML = str;
      }
    });

    // data-veri-gizle-bos="iletisim.eposta" → değer boş/eksikse en yakın li/satırı gizle.
    // E-posta gibi opsiyonel bilgiler için: sahte "info@example.com" gösterip kafa karıştırmaktansa,
    // değer yoksa satır hiç gözükmesin.
    document.querySelectorAll('[data-veri-gizle-bos]').forEach(el => {
      const yol = el.getAttribute('data-veri-gizle-bos');
      const deger = noktaYol(ayarlar, yol);
      if (deger == null || String(deger).trim() === '') {
        const gizlenecek = el.closest('[data-satir]') || el.closest('li') || el;
        gizlenecek.hidden = true;
      }
    });

    // data-veri-src="hakkimizda.kurucuFoto" → img.src dinamik atama.
    // Değer boşsa: en yakın [data-veri-src-kaldir-bossa] varsa onu kaldır
    // (örn. fotoğraf wrapper'ı). Yoksa img'i hidden bırak.
    document.querySelectorAll('[data-veri-src]').forEach(el => {
      const yol = el.getAttribute('data-veri-src');
      const deger = noktaYol(ayarlar, yol);
      if (deger != null && String(deger).trim() !== '') {
        el.setAttribute('src', String(deger));
        el.hidden = false;
      } else {
        const kaldir = el.closest('[data-veri-src-kaldir-bossa]');
        if (kaldir) {
          kaldir.remove();
        } else {
          el.hidden = true;
        }
      }
    });

    // data-veri-href="tel:iletisim.telefon" → href="tel:+90..."
    document.querySelectorAll('[data-veri-href]').forEach(el => {
      const ham = el.getAttribute('data-veri-href');
      const [prefix, yol] = ham.includes(':') ? ham.split(/:(.+)/) : ['', ham];
      const deger = noktaYol(ayarlar, yol);
      if (deger != null) {
        el.setAttribute('href', prefix ? `${prefix}:${deger}` : deger);
      }
    });

    // data-sosyal="instagram" → ayarlar.sosyal.instagram'dan href
    document.querySelectorAll('[data-sosyal]').forEach(el => {
      const anahtar = el.getAttribute('data-sosyal');
      const url = ayarlar.sosyal && ayarlar.sosyal[anahtar];
      if (url) {
        el.setAttribute('href', url);
      } else {
        // URL yoksa simgeyi gizle (kurum henüz girmemiş olabilir)
        el.style.display = 'none';
      }
    });

    // Floating ikon bağlantıları — değer yoksa elementi gizle (fallback)
    const wa = document.querySelector('[data-float="whatsapp"]');
    if (wa) {
      if (ayarlar.iletisim && ayarlar.iletisim.whatsapp) {
        const mesaj = encodeURIComponent(ayarlar.whatsappMesaj || '');
        wa.setAttribute('href', `https://wa.me/${ayarlar.iletisim.whatsapp}?text=${mesaj}`);
      } else {
        wa.hidden = true;
      }
    }
    const ig = document.querySelector('[data-float="instagram"]');
    if (ig) {
      if (ayarlar.sosyal && ayarlar.sosyal.instagram) {
        ig.setAttribute('href', ayarlar.sosyal.instagram);
      } else {
        ig.hidden = true;
      }
    }
    const tel = document.querySelector('[data-float="telefon"]');
    if (tel) {
      if (ayarlar.iletisim && ayarlar.iletisim.telefon) {
        tel.setAttribute('href', `tel:${ayarlar.iletisim.telefon}`);
      } else {
        tel.hidden = true;
      }
    }
    // Floating-icons partial yoksa veya tüm ikonlar gizliyse konteyner'ı kaldır
    const floatYer = document.getElementById('floatIkonlar') || document.querySelector('.floating-icons');
    if (floatYer) {
      const gorunenler = floatYer.querySelectorAll('[data-float]:not([hidden])');
      if (gorunenler.length === 0) floatYer.hidden = true;
    }

    // Tanıtım videosu — admin/ayarlar'dan 'kurum.tanitimVideoId' set edildiyse YouTube iframe yerleştir.
    // Sade & güvenli embed: youtube-nocookie.com domain'i + rel=0 (ilgili video kısıtlaması) +
    // modestbranding=1 + iv_load_policy=3 (annotations off). Boş veya geçersiz ID'de bölüm gizli.
    document.querySelectorAll('[data-tanitim-video]').forEach(yer => {
      const ham = (ayarlar.kurum && ayarlar.kurum.tanitimVideoId || '').toString().trim();
      // Kullanıcı tam URL yapıştırmış olabilir — ID'yi çıkar
      const eslesme = ham.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
      const vid = eslesme ? eslesme[1] : (/^[A-Za-z0-9_-]{11}$/.test(ham) ? ham : '');
      if (!vid) {
        yer.hidden = true;
        return;
      }
      yer.hidden = false;
      // Chrome-less, otomatik döngü, sessiz başlayan tanıtım videosu (background-video deneyimi).
      // YouTube quirk: tek videoyu loop'lamak için `playlist=<aynı ID>` şart.
      // Tarayıcılar muted=1 olmadan autoplay'e izin vermez → ses kapalı başlar.
      const params = new URLSearchParams({
        autoplay: '1',
        mute: '1',
        loop: '1',
        playlist: vid,             // loop=1 için zorunlu — aynı video ID
        controls: '0',             // oynat/duraklat/ses çubuğu yok
        modestbranding: '1',
        iv_load_policy: '3',       // annotation kapalı
        disablekb: '1',            // klavye kısayolları kapalı
        fs: '0',                   // tam ekran düğmesi gizli
        rel: '0',
        playsinline: '1',          // iOS'ta inline oynat
        hl: 'tr',
      });
      const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?${params}`;
      yer.innerHTML = `
        <iframe
          src="${src}"
          title="Tanıtım videosu"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="autoplay; encrypted-media; picture-in-picture"
          aria-hidden="true"
          tabindex="-1"></iframe>
      `;
    });

    // İstatistik (sayaç) render'ı ayrı fonksiyonda — count-up animasyonu + modül kontrolü için.
    // baslat() içinde veriBagla'dan sonra çağrılır.

    // Sayfa başlığı: kurum adı
    if (ayarlar.kurum && ayarlar.kurum.ad) {
      const titleEl = document.querySelector('title');
      if (titleEl && titleEl.dataset.dinamik !== 'false') {
        const mevcut = titleEl.textContent;
        if (!mevcut.includes(ayarlar.kurum.ad)) {
          titleEl.textContent = mevcut + ' | ' + ayarlar.kurum.ad;
        }
      }
    }
  };

  // Aktif menü linkini işaretle
  const aktifMenu = () => {
    const sayfa = getMevcutSayfa();
    if (!sayfa) return;
    document.querySelectorAll('[data-link]').forEach(a => {
      if (a.getAttribute('data-link') === sayfa) {
        a.classList.add('aktif');
        a.setAttribute('aria-current', 'page');
      }
    });
  };

  // Mobil menü toggle + body level teleport
  // Sticky/backdrop-filter olan header'ın stacking context'inden site-nav'i
  // çıkarıyoruz; böylece mobile'da fixed konumlama tarayıcı bağımsız çalışır.
  const mobilMenu = () => {
    const dugme = document.getElementById('menuDugmesi');
    const nav = document.getElementById('siteNav');
    const headerIcerik = document.querySelector('.site-header__icerik');
    if (!dugme || !nav || !headerIcerik) return;

    const mq = window.matchMedia('(max-width: 960px)');

    let kayitliScroll = 0;
    const menuKapat = () => {
      const kilitli = document.body.classList.contains('menu-kilit');
      document.body.classList.remove('menu-acik', 'menu-kilit');
      dugme.setAttribute('aria-expanded', 'false');
      if (kilitli) {
        // Scroll kilidini aç ve sayfayı eski konumuna döndür (iOS-güvenli)
        document.body.style.top = '';
        window.scrollTo(0, kayitliScroll);
      }
    };

    const navTasi = () => {
      let backdrop = document.getElementById('mobilMenuBackdrop');

      if (mq.matches) {
        // MOBILE: body direct child (stacking context'ten kurtar)
        if (nav.parentElement !== document.body) {
          document.body.appendChild(nav);
          nav.classList.add('site-nav--mobil');
        }
        // Backdrop yoksa oluştur (click-outside için)
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.id = 'mobilMenuBackdrop';
          backdrop.className = 'mobil-menu-backdrop';
          backdrop.setAttribute('aria-hidden', 'true');
          backdrop.addEventListener('click', menuKapat);
          document.body.appendChild(backdrop);
        }
      } else {
        // DESKTOP: header içine geri yerleştir (logo'dan sonra)
        nav.classList.remove('site-nav--mobil');
        if (nav.parentElement === document.body) {
          const logo = headerIcerik.querySelector('.site-logo');
          if (logo) logo.after(nav);
          menuKapat();
        }
        if (backdrop) backdrop.remove();
      }
    };
    mq.addEventListener('change', navTasi);
    navTasi();

    // Focus trap için odaklanabilir element seçici
    const odakSec = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let oncekiOdak = null;

    // Hamburger toggle (açık<->kapalı). Kapatma menuKapat() üzerinden tek yoldan
    // yapılır ki scroll kilidi her zaman doğru açılsın.
    dugme.addEventListener('click', () => {
      if (document.body.classList.contains('menu-acik')) {
        menuKapat();
        if (oncekiOdak && typeof oncekiOdak.focus === 'function') { oncekiOdak.focus(); oncekiOdak = null; }
        else dugme.focus();
        return;
      }
      // Aç
      document.body.classList.add('menu-acik');
      dugme.setAttribute('aria-expanded', 'true');
      if (mq.matches) {
        // iOS-güvenli scroll kilidi: konumu sakla + body'yi sabitle
        kayitliScroll = window.scrollY;
        document.body.style.top = `-${kayitliScroll}px`;
        document.body.classList.add('menu-kilit');
        oncekiOdak = document.activeElement;
        const ilk = nav.querySelector(odakSec);
        if (ilk) setTimeout(() => ilk.focus(), 80);
      }
    });

    // Linke veya kapatma (X) butonuna tıklayınca menüyü kapa
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('.site-nav__kapat')) menuKapat();
    });

    // Tab içeride kalsın (focus trap) + ESC ile kapat
    document.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('menu-acik')) return;
      if (e.key === 'Escape') {
        menuKapat();
        if (oncekiOdak && typeof oncekiOdak.focus === 'function') {
          oncekiOdak.focus();
          oncekiOdak = null;
        } else {
          dugme.focus();
        }
        return;
      }
      if (e.key !== 'Tab' || !mq.matches) return;
      const odaklanabilirler = Array.from(nav.querySelectorAll(odakSec))
        .filter(el => !el.hidden && el.offsetParent !== null);
      if (odaklanabilirler.length === 0) return;
      const ilk = odaklanabilirler[0];
      const son = odaklanabilirler[odaklanabilirler.length - 1];
      if (e.shiftKey && document.activeElement === ilk) {
        e.preventDefault();
        son.focus();
      } else if (!e.shiftKey && document.activeElement === son) {
        e.preventDefault();
        ilk.focus();
      } else if (!nav.contains(document.activeElement)) {
        e.preventDefault();
        ilk.focus();
      }
    });
  };

  // Header gölgesi (scroll'da)
  const headerScroll = () => {
    const header = document.getElementById('siteHeader');
    if (!header) return;
    const isle = () => {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    isle();
    window.addEventListener('scroll', isle, { passive: true });
  };

  // Footer yıl
  const yilGuncelle = () => {
    const yilEl = document.getElementById('yilBilgisi');
    if (yilEl) yilEl.textContent = new Date().getFullYear();
  };

  // (eski blogModuluKontrol kaldırıldı — blog artık ayarlar.moduller.blog ile
  // diğer modüllerle birlikte modulleriUygula üzerinden yönetiliyor.)

  /* ============================================================
     HERO SLIDER — admin "Ana Sayfa / Hero" bölümünden yönetilir.
     Kütüphanesiz vanilla JS: fade geçiş, otomatik oynatma (hover/focus'ta durur),
     noktalar + oklar, klavye (←/→), prefers-reduced-motion'da otomatik kapalı.
  ============================================================ */
  const heroSlider = (ayarlar) => {
    const yer = document.querySelector('[data-hero-slider]');
    if (!yer) return;

    const hero = (ayarlar.hero && typeof ayarlar.hero === 'object') ? ayarlar.hero : null;
    // hero hiç tanımlı değilse (DB boş) → varsayılan slaytlar; tanımlıysa admin'in seçimi geçerli.
    let slaytlar = hero && Array.isArray(hero.slaytlar)
      ? hero.slaytlar.filter(s => s && s.aktif !== false && (s.gorsel || s.baslik))
      : null;
    if (slaytlar === null) slaytlar = HERO_VARSAYILAN.slaytlar;

    if (!slaytlar.length) {
      const bolum = yer.closest('.hero');
      if (bolum) bolum.hidden = true;
      return;
    }

    const linkCoz = (link) => {
      if (!link || link === '#') return '#';
      if (link === 'whatsapp') {
        const wa = ayarlar.iletisim && ayarlar.iletisim.whatsapp;
        if (!wa) return '#';
        return `https://wa.me/${wa}?text=${encodeURIComponent(ayarlar.whatsappMesaj || '')}`;
      }
      return link;
    };
    const gorselTemiz = (u) => String(u || '').replace(/["'()\\]/g, '');
    const n = slaytlar.length;
    const cokSlayt = n > 1;

    const slaytHtml = (s, i) => {
      const bg = gorselTemiz(s.gorsel);
      const overlay = Math.max(0, Math.min(90, Number(s.overlayKoyuluk ?? 50))) / 100;
      const basTag = i === 0 ? 'h1' : 'h2';
      const b1 = (s.butonMetin || '').trim();
      const b2 = (s.buton2Metin || '').trim();
      return `
        <div class="hero-slayt${i === 0 ? ' aktif' : ''}" role="group" aria-roledescription="slayt"
             aria-label="${i + 1} / ${n}" aria-hidden="${i === 0 ? 'false' : 'true'}"
             style="--hero-bg:url('${bg}'); --hero-overlay:${overlay};">
          <div class="hero-slayt__katman"></div>
          <div class="kapsayici hero-slayt__icerik">
            ${s.rozet ? `<span class="hero-slayt__rozet">
              ${rozetIkonSvg(s.rozetIkon)}
              <span>${escapeHtml(s.rozet)}</span></span>` : ''}
            <${basTag} class="hero-slayt__baslik">${escapeHtml(s.baslik || '')}</${basTag}>
            ${s.altBaslik ? `<p class="hero-slayt__alt">${escapeHtml(s.altBaslik)}</p>` : ''}
            ${(b1 || b2) ? `<div class="hero-slayt__cta">
              ${b1 ? `<a class="dugme dugme--vurgu dugme--buyuk" href="${escapeHtml(linkCoz(s.butonLink))}">${escapeHtml(b1)}</a>` : ''}
              ${b2 ? `<a class="dugme dugme--cerceve-acik dugme--buyuk" href="${escapeHtml(linkCoz(s.buton2Link))}">${escapeHtml(b2)}</a>` : ''}
            </div>` : ''}
          </div>
        </div>`;
    };

    yer.innerHTML = `
      <div class="hero-slider__sahne">${slaytlar.map(slaytHtml).join('')}</div>
      ${cokSlayt ? `
        <button class="hero-slider__ok hero-slider__ok--onceki" type="button" aria-label="Önceki slayt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button class="hero-slider__ok hero-slider__ok--sonraki" type="button" aria-label="Sonraki slayt">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <div class="hero-slider__noktalar" role="tablist" aria-label="Slayt seçimi">
          ${slaytlar.map((s, i) => `<button class="hero-slider__nokta${i === 0 ? ' aktif' : ''}" type="button" role="tab" aria-selected="${i === 0 ? 'true' : 'false'}" tabindex="${i === 0 ? '0' : '-1'}" aria-label="Slayt ${i + 1}"></button>`).join('')}
        </div>` : ''}
    `;

    if (!cokSlayt) return;

    const slaytEl = Array.from(yer.querySelectorAll('.hero-slayt'));
    const noktaEl = Array.from(yer.querySelectorAll('.hero-slider__nokta'));
    let aktif = 0;
    let zaman = null;
    const sure = Math.max(2, Number(hero?.gecisSuresiSn ?? HERO_VARSAYILAN.gecisSuresiSn)) * 1000;
    const otomatik = dogruMu(hero ? hero.otomatikGecis : true, true) && !azaltilmisHareket();

    const goster = (i) => {
      aktif = (i + n) % n;
      slaytEl.forEach((el, idx) => {
        const a = idx === aktif;
        el.classList.toggle('aktif', a);
        el.setAttribute('aria-hidden', a ? 'false' : 'true');
      });
      noktaEl.forEach((el, idx) => {
        const a = idx === aktif;
        el.classList.toggle('aktif', a);
        el.setAttribute('aria-selected', a ? 'true' : 'false');
        el.tabIndex = a ? 0 : -1;   // roving tabindex (tablist a11y)
      });
    };
    const sonraki = () => goster(aktif + 1);
    const onceki = () => goster(aktif - 1);
    const durdur = () => { if (zaman) { clearInterval(zaman); zaman = null; } };
    const baslatOto = () => { durdur(); if (otomatik) zaman = setInterval(sonraki, sure); };

    yer.querySelector('.hero-slider__ok--sonraki').addEventListener('click', () => { sonraki(); baslatOto(); });
    yer.querySelector('.hero-slider__ok--onceki').addEventListener('click', () => { onceki(); baslatOto(); });
    noktaEl.forEach((el, idx) => el.addEventListener('click', () => { goster(idx); baslatOto(); }));

    yer.addEventListener('mouseenter', durdur);
    yer.addEventListener('mouseleave', baslatOto);
    yer.addEventListener('focusin', durdur);
    yer.addEventListener('focusout', baslatOto);
    yer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { onceki(); baslatOto(); }
      else if (e.key === 'ArrowRight') { sonraki(); baslatOto(); }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') durdur(); else baslatOto();
    });

    // Dokunmatik kaydırma (swipe) — mobilde oklar gizli olduğundan kritik.
    // Yatay kaydırma slaytı değiştirir; dikey kaydırma sayfa scroll'u olarak kalır.
    let dokunX = 0, dokunY = 0, kaydiriyor = false;
    yer.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      dokunX = t.clientX; dokunY = t.clientY; kaydiriyor = true;
      durdur();
    }, { passive: true });
    yer.addEventListener('touchend', (e) => {
      if (!kaydiriyor) return;
      kaydiriyor = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - dokunX, dy = t.clientY - dokunY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) sonraki(); else onceki();
      }
      baslatOto();
    }, { passive: true });

    baslatOto();
  };

  /* ----- NEDEN BİZ (özellik kartları) — admin'den düzenlenebilir ----- */
  const nedenBizRender = (ayarlar) => {
    const yer = document.querySelector('[data-nedenbiz-yer]');
    if (!yer) return;
    const a = (ayarlar.anasayfa && typeof ayarlar.anasayfa === 'object') ? ayarlar.anasayfa : null;
    let liste = a && Array.isArray(a.nedenBiz)
      ? a.nedenBiz.filter(x => x && (x.baslik || x.metin))
      : null;
    if (liste === null) liste = NEDENBIZ_VARSAYILAN;
    const bolum = yer.closest('[data-nedenbiz-bolum]');
    if (!liste.length) { if (bolum) bolum.hidden = true; return; }
    if (bolum) bolum.hidden = false;
    yer.innerHTML = liste.map(o => `
      <div class="ozellik">
        <div class="ozellik__ikon" aria-hidden="true">${ikonSvg(o.ikon)}</div>
        <div>
          <div class="ozellik__baslik">${escapeHtml(o.baslik || '')}</div>
          <div class="ozellik__metin">${escapeHtml(o.metin || '')}</div>
        </div>
      </div>`).join('');
  };

  /* ----- İSTATİSTİK (sayaç) — count-up + modül kontrolü ----- */
  const sayacAnimasyon = (el) => {
    const metin = (el.dataset.deger || el.textContent || '').trim();
    const m = metin.match(/^(\D*)(\d[\d.,]*)(.*)$/s);
    if (!m || azaltilmisHareket()) { el.textContent = metin; return; }
    const on = m[1], sayiStr = m[2], son = m[3];
    const ayirici = /[.,]/.test(sayiStr);
    const hedef = parseFloat(sayiStr.replace(/[.,]/g, ''));
    if (!isFinite(hedef)) { el.textContent = metin; return; }
    const bicim = (v) => ayirici ? v.toLocaleString('tr-TR') : String(v);
    const sure = 1200;
    let bas = null;
    const adim = (t) => {
      if (bas === null) bas = t;
      const ilerle = Math.min(1, (t - bas) / sure);
      const kolay = 1 - Math.pow(1 - ilerle, 3);
      el.textContent = on + bicim(Math.round(hedef * kolay)) + son;
      if (ilerle < 1) requestAnimationFrame(adim);
      else el.textContent = on + bicim(hedef) + son;
    };
    requestAnimationFrame(adim);
  };

  const istatistikRender = (ayarlar) => {
    const liste = (Array.isArray(ayarlar.istatistikler) ? ayarlar.istatistikler : [])
      .filter(s => s && (s.deger || '').toString().trim() !== '');
    const aktifModul = modulAktif(ayarlar, 'istatistik');

    document.querySelectorAll('[data-istatistik-yer]').forEach(yer => {
      const kapsayan = yer.closest('[data-istatistik-bolum]') || yer.closest('section');
      if (!aktifModul || liste.length === 0) {
        if (kapsayan) kapsayan.hidden = true;
        return;
      }
      if (kapsayan) kapsayan.hidden = false;
      yer.innerHTML = liste.map(s => `
        <div class="istatistik">
          ${s.ikon ? `<div class="istatistik__ikon" aria-hidden="true">${escapeHtml(s.ikon)}</div>` : ''}
          <span class="istatistik__sayi" data-deger="${escapeHtml(s.deger)}">${escapeHtml(s.deger)}</span>
          <span class="istatistik__etiket">${escapeHtml(s.etiket || '')}</span>
        </div>`).join('');

      // Sayaç animasyonu: bölüm ekrana girince bir kez tetikle
      const sayilar = yer.querySelectorAll('.istatistik__sayi');
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((girisler, ob) => {
          girisler.forEach(g => {
            if (g.isIntersecting) {
              sayilar.forEach(sayacAnimasyon);
              ob.disconnect();
            }
          });
        }, { threshold: 0.4 });
        io.observe(yer);
      } else {
        sayilar.forEach(sayacAnimasyon);
      }
    });

    // Başarılarımız sayfasında: istatistik varsa "boş durum" bölümünü gizle
    const basariBosBolum = document.querySelector('[data-basarilar-bos]');
    if (basariBosBolum && aktifModul && liste.length > 0) basariBosBolum.hidden = true;
  };

  /* ----- GÖRÜŞLER (testimonials) ----- */
  const goruslerRender = (ayarlar) => {
    const yer = document.querySelector('[data-gorusler-yer]');
    if (!yer) return;
    const aktifModul = modulAktif(ayarlar, 'gorusler');
    const liste = (Array.isArray(ayarlar.gorusler) ? ayarlar.gorusler : [])
      .filter(g => g && g.aktif !== false && (g.metin || '').toString().trim() !== '');
    const bolum = yer.closest('[data-gorusler-bolum]');
    if (!aktifModul || liste.length === 0) { if (bolum) bolum.hidden = true; return; }
    if (bolum) bolum.hidden = false;
    yer.innerHTML = liste.map(g => {
      const adBas = (g.ad || '?').toString().trim().charAt(0).toUpperCase();
      return `
        <figure class="gorus-karti">
          <div class="gorus-karti__yildiz" aria-hidden="true">★★★★★</div>
          <blockquote class="gorus-karti__metin">${escapeHtml(g.metin)}</blockquote>
          <figcaption class="gorus-karti__kisi">
            <div class="gorus-karti__avatar" aria-hidden="true">${g.foto ? `<img src="${escapeHtml(g.foto)}" alt="">` : escapeHtml(adBas)}</div>
            <div>
              <div class="gorus-karti__ad">${escapeHtml(g.ad || '')}</div>
              ${g.rol ? `<div class="gorus-karti__rol">${escapeHtml(g.rol)}</div>` : ''}
            </div>
          </figcaption>
        </figure>`;
    }).join('');
  };

  /* ----- SSS (accordion) ----- */
  const sssRender = (ayarlar) => {
    const yer = document.querySelector('[data-sss-yer]');
    if (!yer) return;
    const aktifModul = modulAktif(ayarlar, 'sss');
    const liste = (Array.isArray(ayarlar.sss) ? ayarlar.sss : [])
      .filter(s => s && s.aktif !== false && (s.soru || '').toString().trim() !== '');
    const bolum = yer.closest('[data-sss-bolum]');
    if (!aktifModul || liste.length === 0) { if (bolum) bolum.hidden = true; return; }
    if (bolum) bolum.hidden = false;
    yer.innerHTML = liste.map(s => `
      <details class="sss-oge">
        <summary class="sss-oge__soru">
          <span>${escapeHtml(s.soru)}</span>
          <svg class="sss-oge__ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </summary>
        <div class="sss-oge__cevap">${escapeHtml(s.cevap || '')}</div>
      </details>`).join('');
  };

  /* ----- Mobil alt CTA çubuğu (Ara / WhatsApp / Ön Kayıt) -----
     Sadece mobilde (CSS) görünür; iletişim ayarlarından üretilir.
     Çubuk varken sağ-alt floating ikonlar gizlenir (body.mobil-cta-var). */
  const mobilCtaCubugu = (ayarlar) => {
    if (document.querySelector('.mobil-cta-bar')) return;
    if (document.body.getAttribute('data-sayfa') === 'tesekkurler') return;
    const il = ayarlar.iletisim || {};
    const tel = (il.telefon || '').toString().trim();
    const wa = (il.whatsapp || '').toString().trim();
    if (!tel && !wa) return;

    const oge = [];
    if (tel) oge.push(`<a class="mobil-cta-bar__dugme mobil-cta-bar__dugme--ara" href="tel:${escapeHtml(tel)}" aria-label="Telefonla ara">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span>Ara</span></a>`);
    if (wa) {
      const mesaj = encodeURIComponent(ayarlar.whatsappMesaj || '');
      oge.push(`<a class="mobil-cta-bar__dugme mobil-cta-bar__dugme--wa" href="https://wa.me/${escapeHtml(wa)}?text=${mesaj}" aria-label="WhatsApp ile yaz">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24z"/></svg>
        <span>WhatsApp</span></a>`);
    }
    oge.push(`<a class="mobil-cta-bar__dugme mobil-cta-bar__dugme--kayit" href="/basvuru.html" aria-label="Ön kayıt formu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>
      <span>Ön Kayıt</span></a>`);

    const bar = document.createElement('nav');
    bar.className = 'mobil-cta-bar';
    bar.setAttribute('aria-label', 'Hızlı iletişim');
    bar.innerHTML = oge.join('');
    document.body.appendChild(bar);
    document.body.classList.add('mobil-cta-var');
  };

  // Ana çalıştırıcı
  const baslat = async () => {
    // 1. Partial'ları yükle (paralel)
    await Promise.all([
      partialYukle('#siteHeaderYer', '/partials/header.html'),
      partialYukle('#siteFooterYer', '/partials/footer.html'),
      partialYukle('#floatIkonlarYer', '/partials/floating-icons.html')
    ]);

    // 2. Ayarları yükle (PHP API'den)
    let ayarlar = {};
    try {
      const cevap = await fetch('/api/ayarlar');
      const veri = await cevap.json();
      ayarlar = veri.ayarlar || {};
      window.__SITE_AYARLAR__ = ayarlar;
    } catch (e) {
      console.warn('Ayarlar yüklenemedi:', e);
    }

    // 3. Bağla & başlat
    // ÖNEMLİ: modulleriUygula veriBagla'dan ÖNCE gelir — eğer sayfa modülü kapalıysa
    // 404'e yönlendiren bu fonksiyon çalışsın, gereksiz veri bağlama yapılmasın.
    modulleriUygula(ayarlar);
    veriBagla(ayarlar);

    // Anasayfa dinamik bölümleri (yer tutucular yoksa fonksiyonlar sessizce çıkar)
    heroSlider(ayarlar);
    nedenBizRender(ayarlar);
    istatistikRender(ayarlar);
    goruslerRender(ayarlar);
    sssRender(ayarlar);
    mobilCtaCubugu(ayarlar);   // tüm sayfalarda mobil alt CTA çubuğu

    aktifMenu();
    mobilMenu();
    headerScroll();
    yilGuncelle();

    // 4. Özel olay: diğer scriptler "site:hazir" bekleyebilir
    document.dispatchEvent(new CustomEvent('site:hazir', { detail: { ayarlar } }));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
