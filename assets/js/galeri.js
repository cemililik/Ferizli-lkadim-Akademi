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
    }
    const img = document.getElementById('galeriLightboxImg');
    img.src = g.src;
    img.alt = g.baslik || 'Galeri görseli';
    document.getElementById('galeriLightboxBaslik').textContent = g.baslik || '';
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
        <button type="button" class="duyuru-filtre__dugme${aktifAlbum === a.id ? ' aktif' : ''}" data-album="${esc(a.id)}">
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
        <div class="bos-durum">
          <div class="bos-durum__ikon">🖼️</div>
          <p>Bu albümde henüz görsel yok.</p>
        </div>`;
      return;
    }

    $g.innerHTML = listeRef.map((g, i) => `
      <button type="button" class="galeri-oge" data-index="${i}" aria-label="${esc(g.baslik || 'Galeri görselini büyüt')}">
        <img src="${g.src}" alt="${esc(g.baslik || 'Galeri görseli')}" loading="lazy">
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
    try {
      const r = await fetch('/api/galeri');
      veri = await r.json();
    } catch (e) {
      console.error('Galeri yüklenemedi:', e);
      $g.innerHTML = '<div class="bos-durum">Galeri yüklenemedi.</div>';
      return;
    }
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
