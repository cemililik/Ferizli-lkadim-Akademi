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

  // data-veri="path" niteliği taşıyan elemanlara metni bas
  const veriBagla = (ayarlar) => {
    document.querySelectorAll('[data-veri]').forEach(el => {
      const yol = el.getAttribute('data-veri');
      const deger = noktaYol(ayarlar, yol);
      if (deger != null && deger !== '') el.textContent = deger;
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

    // İstatistikler — admin'den yönetilen liste. Yoksa bölüm tamamen gizlenir.
    const istatistikListesi = Array.isArray(ayarlar.istatistikler) ? ayarlar.istatistikler : [];
    const istatistikGorunenler = istatistikListesi.filter(s => s && (s.deger || '').toString().trim() !== '');
    const escapeHtml = (s) => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    document.querySelectorAll('[data-istatistik-yer]').forEach(yer => {
      const kapsayan = yer.closest('[data-istatistik-bolum]') || yer.closest('section');
      if (istatistikGorunenler.length === 0) {
        if (kapsayan) kapsayan.hidden = true;
        return;
      }
      if (kapsayan) kapsayan.hidden = false;
      yer.innerHTML = istatistikGorunenler.map(s => `
        <div class="istatistik">
          ${s.ikon ? `<div class="istatistik__ikon" aria-hidden="true">${escapeHtml(s.ikon)}</div>` : ''}
          <span class="istatistik__sayi">${escapeHtml(s.deger)}</span>
          <span class="istatistik__etiket">${escapeHtml(s.etiket || '')}</span>
        </div>
      `).join('');
    });
    // Başarılarımız sayfasında: istatistik varsa "boş durum" bölümünü gizle
    const basariBosBolum = document.querySelector('[data-basarilar-bos]');
    if (basariBosBolum && istatistikGorunenler.length > 0) {
      basariBosBolum.hidden = true;
    }

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

    const menuKapat = () => {
      document.body.classList.remove('menu-acik');
      dugme.setAttribute('aria-expanded', 'false');
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

    // Hamburger toggle
    dugme.addEventListener('click', () => {
      const acik = document.body.classList.toggle('menu-acik');
      dugme.setAttribute('aria-expanded', acik ? 'true' : 'false');
      if (acik && mq.matches) {
        oncekiOdak = document.activeElement;
        // İlk odaklanabilir elemana focus (animasyon bitsin diye küçük gecikme)
        const ilk = nav.querySelector(odakSec);
        if (ilk) setTimeout(() => ilk.focus(), 80);
      } else if (!acik && oncekiOdak && typeof oncekiOdak.focus === 'function') {
        oncekiOdak.focus();
        oncekiOdak = null;
      }
    });

    // Linke tıklayınca menüyü kapa
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a')) menuKapat();
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

  // Blog modülü aktif mi? Aktifse menüye Blog item'ı eklenir.
  // API yoksa sessizce başarısız olur (statik mod).
  const blogModuluKontrol = async () => {
    const menuOgesi = document.querySelector('[data-blog-menu]');
    if (!menuOgesi) return;
    try {
      const r = await fetch('/api/blog/durum', { credentials: 'include' });
      if (!r.ok) return;
      const veri = await r.json();
      if (veri.aktif) {
        menuOgesi.hidden = false;
        // Footer hızlı erişim menüsüne de ekle
        const footerMenu = document.querySelector('.site-footer__menu');
        if (footerMenu && !footerMenu.querySelector('[href="/blog.html"]')) {
          const li = document.createElement('li');
          li.innerHTML = '<a href="/blog.html">Blog</a>';
          footerMenu.appendChild(li);
        }
      }
    } catch {
      // API yok / hata — menü gizli kalır
    }
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
    veriBagla(ayarlar);
    aktifMenu();
    mobilMenu();
    headerScroll();
    yilGuncelle();
    blogModuluKontrol();

    // 4. Özel olay: diğer scriptler "site:hazir" bekleyebilir
    document.dispatchEvent(new CustomEvent('site:hazir', { detail: { ayarlar } }));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
