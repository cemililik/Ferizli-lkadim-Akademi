/* galeri.js — data/galeri.json'u okur, sayfaya basar
   Hash navigasyonu ile lightbox açma */

(() => {
  'use strict';

  let veri = { albumler: [], gorseller: [] };
  let aktifAlbum = 'hepsi';

  const $g = document.querySelector('[data-galeri-yer]');
  const $f = document.querySelector('[data-galeri-filtre]');

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- Lightbox ---------- */
  let aktifIndex = -1;
  let listeRef = [];
  let lightboxOncekiOdak = null;

  const lightboxAc = (index) => {
    lightboxOncekiOdak = document.activeElement;
    aktifIndex = index;
    lightboxRender();
    document.body.style.overflow = 'hidden';
  };

  const lightboxKapa = () => {
    aktifIndex = -1;
    const lb = document.getElementById('galeriLightbox');
    if (lb) lb.remove();
    document.body.style.overflow = '';
    if (lightboxOncekiOdak && typeof lightboxOncekiOdak.focus === 'function') {
      lightboxOncekiOdak.focus();
    }
    lightboxOncekiOdak = null;
  };

  const lightboxIlerle = (yon) => {
    if (listeRef.length === 0) return;
    aktifIndex = (aktifIndex + yon + listeRef.length) % listeRef.length;
    lightboxRender();
  };

  const lightboxRender = () => {
    if (aktifIndex < 0 || aktifIndex >= listeRef.length) return;
    const g = listeRef[aktifIndex];
    let lb = document.getElementById('galeriLightbox');
    let yeni = false;
    if (!lb) {
      yeni = true;
      lb = document.createElement('div');
      lb.id = 'galeriLightbox';
      lb.className = 'galeri-lightbox';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.setAttribute('aria-label', 'Görsel önizleme');
      lb.innerHTML = `
        <button type="button" class="galeri-lightbox__kapa" aria-label="Kapat">×</button>
        <button type="button" class="galeri-lightbox__yon galeri-lightbox__yon--sol" aria-label="Önceki görsel">‹</button>
        <button type="button" class="galeri-lightbox__yon galeri-lightbox__yon--sag" aria-label="Sonraki görsel">›</button>
        <div class="galeri-lightbox__icerik">
          <img id="galeriLightboxImg" alt="">
          <div class="galeri-lightbox__baslik" id="galeriLightboxBaslik"></div>
        </div>
      `;
      document.body.appendChild(lb);
      lb.addEventListener('click', (e) => { if (e.target === lb) lightboxKapa(); });
      lb.querySelector('.galeri-lightbox__kapa').addEventListener('click', lightboxKapa);
      lb.querySelector('.galeri-lightbox__yon--sol').addEventListener('click', () => lightboxIlerle(-1));
      lb.querySelector('.galeri-lightbox__yon--sag').addEventListener('click', () => lightboxIlerle(1));
      // Dokunmatik kaydırma (mobilde gezinme — 40px köşe oklarına nişan almak zorunda kalınmasın)
      let lbX = 0, lbY = 0;
      lb.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; lbX = t.clientX; lbY = t.clientY; }, { passive: true });
      lb.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        const dx = t.clientX - lbX, dy = t.clientY - lbY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) lightboxIlerle(dx < 0 ? 1 : -1);
      }, { passive: true });
    }
    const img = document.getElementById('galeriLightboxImg');
    img.alt = g.baslik || 'Galeri görseli';
    // Yükleme geri bildirimi: yeni görsel gelene kadar şeffaf, gelince fade-in.
    // Aynı src yeniden atanınca tarayıcı 'load' fire ETMEZ (no-op) → onload beklersek
    // görsel kalıcı görünmez kalırdı. Bu yüzden opacity'i koşullu yönet. (transition CSS'te.)
    const gorunurYap = () => { img.style.opacity = '1'; };
    if (img.getAttribute('src') === g.src) {
      gorunurYap();                       // aynı görsel (tek-görselli albüm/wrap-around) — fade yok
    } else {
      img.style.opacity = '0';
      img.onload = gorunurYap;
      img.onerror = gorunurYap;
      img.src = g.src;
      if (img.complete) gorunurYap();     // önbellekten anında geldiyse onload gelmeyebilir
    }
    document.getElementById('galeriLightboxBaslik').textContent = g.baslik || '';
    // Komşu görselleri önceden indir (hızlı gezinme)
    [aktifIndex + 1, aktifIndex - 1].forEach(j => {
      const komsu = listeRef[(j + listeRef.length) % listeRef.length];
      if (komsu && komsu.src) { const im = new Image(); im.src = komsu.src; }
    });
    if (yeni) {
      // İlk açılışta kapatma butonuna focus
      setTimeout(() => lb.querySelector('.galeri-lightbox__kapa')?.focus(), 30);
    }
  };

  document.addEventListener('keydown', (e) => {
    if (aktifIndex < 0) return;
    if (e.key === 'Escape') { lightboxKapa(); return; }
    if (e.key === 'ArrowLeft') { lightboxIlerle(-1); return; }
    if (e.key === 'ArrowRight') { lightboxIlerle(1); return; }
    if (e.key !== 'Tab') return;
    // Focus trap — odaklanabilir elementleri lightbox içinde sınırla
    const lb = document.getElementById('galeriLightbox');
    if (!lb) return;
    const odaklanabilirler = Array.from(
      lb.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
    );
    if (odaklanabilirler.length === 0) return;
    const ilk = odaklanabilirler[0];
    const son = odaklanabilirler[odaklanabilirler.length - 1];
    if (e.shiftKey && document.activeElement === ilk) {
      e.preventDefault(); son.focus();
    } else if (!e.shiftKey && document.activeElement === son) {
      e.preventDefault(); ilk.focus();
    } else if (!lb.contains(document.activeElement)) {
      e.preventDefault(); ilk.focus();
    }
  });

  /* Hash sync — #album=ID URL parametresi ile albüm seçimi.
     Yeni albüm seçimi history.replaceState ile hash'i günceller. */
  const hashOku = () => {
    const m = location.hash.match(/^#album=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  };
  const hashYaz = (albumId) => {
    const yeniHash = albumId && albumId !== 'hepsi' ? `#album=${encodeURIComponent(albumId)}` : '';
    if (location.hash !== yeniHash) {
      history.replaceState(null, '', location.pathname + location.search + yeniHash);
    }
  };

  /* ---------- Filtre düğmeleri ---------- */
  const filtreRender = () => {
    if (!$f) return;
    const sayi = { hepsi: (veri.gorseller || []).length };
    (veri.gorseller || []).forEach(g => { sayi[g.album] = (sayi[g.album] || 0) + 1; });
    const dugmeler = [{ id: 'hepsi', ad: 'Tümü' }, ...(veri.albumler || [])];
    $f.innerHTML = dugmeler
      .filter(a => a.id === 'hepsi' || sayi[a.id]) // boş albümleri gizle
      .map(a => `
        <button type="button" class="cip${aktifAlbum === a.id ? ' cip--aktif' : ''}" data-album="${esc(a.id)}" aria-pressed="${aktifAlbum === a.id ? 'true' : 'false'}">
          ${esc(a.ad)} <span style="opacity:.7">(${sayi[a.id] || 0})</span>
        </button>
      `).join('');
    $f.querySelectorAll('[data-album]').forEach(b => {
      b.addEventListener('click', () => {
        aktifAlbum = b.dataset.album;
        hashYaz(aktifAlbum);
        filtreRender();
        izgaraRender();
      });
    });
  };

  /* ---------- Izgara ---------- */
  const izgaraRender = () => {
    listeRef = (veri.gorseller || [])
      .filter(g => aktifAlbum === 'hepsi' || g.album === aktifAlbum)
      .filter(g => g.src);

    if (listeRef.length === 0) {
      $g.innerHTML = `
        <div class="bos-durum bos-durum--buyuk">
          <div class="bos-durum__ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg></div>
          <p>Bu albümde henüz görsel yok.</p>
        </div>`;
      return;
    }

    $g.innerHTML = listeRef.map((g, i) => `
      <button type="button" class="galeri-oge" data-index="${i}" aria-label="${esc(g.baslik || 'Galeri görselini büyüt')}">
        <img src="${esc(g.src)}" alt="${esc(g.baslik || 'Galeri görseli')}" loading="lazy" onerror="this.closest('.galeri-oge')?.remove()">
        ${g.baslik ? `<span class="galeri-oge__baslik">${esc(g.baslik)}</span>` : ''}
      </button>
    `).join('');

    $g.querySelectorAll('[data-index]').forEach(el => {
      el.addEventListener('click', () => lightboxAc(Number(el.dataset.index)));
    });
  };

  /* ---------- Başlat ---------- */
  const baslat = async () => {
    if (!$g) return;
    // Yükleniyor iskeleti (CLS + boş-beyaz flash önleme)
    $g.innerHTML = Array.from({ length: 6 }, () => '<div class="iskelet" style="aspect-ratio:4/3;border-radius:var(--yuvarlak-md);"></div>').join('');
    $g.setAttribute('aria-busy', 'true');
    try {
      const r = await fetch('/api/galeri');
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      veri = await r.json();
    } catch (e) {
      console.error('Galeri yüklenemedi:', e);
      $g.removeAttribute('aria-busy');
      $g.innerHTML = `
        <div class="bos-durum bos-durum--buyuk">
          <div class="bos-durum__ikon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg></div>
          <p>Galeri yüklenemedi. Lütfen birazdan tekrar deneyin.</p>
          <a href="/galeri.html" onclick="location.reload();return false;" class="dugme dugme--cerceve">Tekrar dene</a>
        </div>`;
      return;
    }
    $g.removeAttribute('aria-busy');
    // Hash varsa ilgili albümü seç (album id veri içinde mevcutsa)
    const hashAlbum = hashOku();
    if (hashAlbum) {
      const bulundu = (veri.albumler || []).some(a => a.id === hashAlbum);
      if (bulundu) aktifAlbum = hashAlbum;
    }
    filtreRender();
    izgaraRender();
  };

  // Geri/ileri ile hash değişirse senkronize et
  window.addEventListener('hashchange', () => {
    const yeni = hashOku() || 'hepsi';
    if (yeni !== aktifAlbum) {
      aktifAlbum = yeni;
      filtreRender();
      izgaraRender();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
