/* blog.js — Site tarafı blog liste + tek yazı render
   Filtreler: ?etiket=X, ?yazar=X, ?q=X, ?kategori=X
*/

(() => {
  'use strict';

  const API_BASE = '/api';

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const tarihTr = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const fetchJson = async (url) => {
    const r = await fetch(url, { credentials: 'include' });
    if (!r.ok) {
      const e = new Error(`Yüklenemedi (HTTP ${r.status})`);
      e.status = r.status;
      throw e;
    }
    return r.json();
  };

  /* Okuma süresi tahmini (~200 kelime/dakika) */
  const okumaSuresi = (icerik = '', ozet = '') => {
    const metin = (icerik || ozet || '').replace(/<[^>]+>/g, ' ');
    const kelime = metin.trim().split(/\s+/).filter(Boolean).length;
    const dakika = Math.max(1, Math.round(kelime / 200));
    return `${dakika} dk okuma`;
  };

  /* URL parametrelerini oku */
  const aktifFiltreler = () => {
    const p = new URLSearchParams(location.search);
    return {
      etiket:   p.get('etiket')   || '',
      yazar:    p.get('yazar')    || '',
      q:        p.get('q')        || '',
      kategori: p.get('kategori') || '',
    };
  };

  /* Filtre chip'lerinin görüntüsü (üstte) */
  const filtreChipHtml = (filtreler) => {
    const aktif = Object.entries(filtreler).filter(([_, v]) => v);
    if (aktif.length === 0) return '';
    const etiketAd = { etiket: '🏷️ Etiket', yazar: '✍️ Yazar', q: '🔍 Arama', kategori: '📁 Kategori' };
    const chips = aktif.map(([k, v]) =>
      `<span class="filtre-chip">
        <span class="filtre-chip__etiket">${etiketAd[k]}:</span>
        <span class="filtre-chip__deger">${esc(v)}</span>
        <a href="${chipKaldirUrl(k)}" class="filtre-chip__kaldir" aria-label="Filtreyi kaldır">×</a>
      </span>`
    ).join('');
    return `
      <div class="filtre-aktif-bar">
        <span class="filtre-aktif-bar__etiket">Aktif filtre:</span>
        ${chips}
        <a href="/blog.html" class="filtre-aktif-bar__temizle">Tümünü temizle</a>
      </div>
    `;
  };

  /* Belli bir parametreyi URL'den kaldıran href */
  const chipKaldirUrl = (parametre) => {
    const p = new URLSearchParams(location.search);
    p.delete(parametre);
    const qs = p.toString();
    return '/blog.html' + (qs ? '?' + qs : '');
  };

  /* Filtre param eklemek/değiştirmek için URL üretici */
  const filtreUrl = (anahtar, deger) => {
    const p = new URLSearchParams();
    p.set(anahtar, deger);
    return '/blog.html?' + p.toString();
  };

  /* Arama formu */
  const aramaKutusuHtml = (mevcut) => `
    <form class="blog-arama" role="search">
      <input type="search" name="q" placeholder="Yazılarda ara…" value="${esc(mevcut || '')}" aria-label="Yazı ara">
      <button type="submit" class="dugme dugme--birincil dugme--kucuk">Ara</button>
    </form>
  `;

  /* ============================================================
     LİSTE
  ============================================================ */
  const listeRender = async () => {
    const yer = document.querySelector('[data-blog-liste]');
    if (!yer) return;

    const filtreler = aktifFiltreler();
    const qs = new URLSearchParams(filtreler).toString();
    let veri;
    try {
      veri = await fetchJson(`${API_BASE}/blog${qs ? '?' + qs : ''}`);
    } catch (e) {
      yer.innerHTML = `<div class="bilgi-kutusu"><strong>Blog yüklenemedi.</strong> ${esc(e.message)}</div>`;
      return;
    }

    // Üst bar: arama kutusu + filtre chip'leri
    const ustBar = document.querySelector('[data-blog-ust]');
    if (ustBar) {
      ustBar.innerHTML = aramaKutusuHtml(filtreler.q) + filtreChipHtml(filtreler);
      const form = ustBar.querySelector('.blog-arama');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const q = form.q.value.trim();
          location.href = q ? `/blog.html?q=${encodeURIComponent(q)}` : '/blog.html';
        });
      }
    }

    if (!veri.yazilar || veri.yazilar.length === 0) {
      const aktifVar = Object.values(filtreler).some(v => v);
      yer.innerHTML = `
        <div class="bos-durum" style="grid-column: 1/-1;">
          <div class="bos-durum__ikon">${aktifVar ? '🔍' : '📰'}</div>
          <h3 style="margin-bottom: var(--bosluk-2);">${aktifVar ? 'Sonuç bulunamadı' : 'Henüz yazı yok'}</h3>
          <p>${aktifVar ? 'Filtreyi temizleyip tüm yazılara bakabilirsiniz.' : 'Çok yakında ilk yazımızı yayınlayacağız.'}</p>
          ${aktifVar ? '<a href="/blog.html" class="dugme dugme--cerceve" style="margin-top: var(--bosluk-4);">← Tüm yazılar</a>' : ''}
        </div>`;
      return;
    }

    // Sayım
    const sayiEl = document.querySelector('[data-blog-sayim]');
    if (sayiEl) sayiEl.textContent = `${veri.toplam} yazı`;

    yer.innerHTML = veri.yazilar.map(kartHtml).join('');
  };

  const kartHtml = (y) => {
    const url = `/blog/yazi.html?slug=${encodeURIComponent(y.slug)}`;
    const tarih = y.yayin_tarihi ? tarihTr(y.yayin_tarihi) : '';
    const sure = okumaSuresi('', y.ozet);
    const gorsel = y.kapak_gorseli
      ? `<a href="${url}" class="blog-kart__gorsel" aria-hidden="true"><img src="${esc(y.kapak_gorseli)}" alt="" loading="lazy" onerror="this.closest('.blog-kart__gorsel')?.remove()"></a>`
      : '';
    const yazarUrl = y.yazar_kullanici_adi
      ? `/blog.html?yazar=${encodeURIComponent(y.yazar_kullanici_adi)}`
      : null;
    const etiketler = (y.etiketler || []).slice(0, 3).map(e =>
      `<a href="/blog.html?etiket=${encodeURIComponent(e)}" class="etiket etiket--yumusak etiket--link">#${esc(e)}</a>`
    ).join(' ');
    const kategoriEt = y.kategori
      ? `<a href="/blog.html?kategori=${encodeURIComponent(y.kategori)}" class="etiket etiket--yumusak">${esc(y.kategori)}</a>`
      : '';

    return `
      <article class="blog-kart">
        ${gorsel}
        <div class="blog-kart__icerik">
          <div class="blog-kart__meta">
            ${kategoriEt}
            ${tarih ? `<time>${tarih}</time>` : ''}
            <span class="blog-kart__sure">${sure}</span>
          </div>
          <h3 class="blog-kart__baslik"><a href="${url}">${esc(y.baslik)}</a></h3>
          ${y.ozet ? `<p class="blog-kart__ozet">${esc(y.ozet)}</p>` : ''}
          ${etiketler ? `<div class="blog-kart__etiketler">${etiketler}</div>` : ''}
          <div class="blog-kart__alt">
            ${y.yazar_adi ? `
              <span class="blog-kart__yazar">
                ✍️
                ${yazarUrl
                  ? `<a href="${yazarUrl}">${esc(y.yazar_adi)}</a>`
                  : esc(y.yazar_adi)}
              </span>` : ''}
            <a href="${url}" class="blog-kart__link">Devamını oku →</a>
          </div>
        </div>
      </article>
    `;
  };

  /* ============================================================
     DETAY
  ============================================================ */
  /* HTML sanitize — XSS koruması.
     DOMPurify CDN yüklüyse onu kullan; yoksa güvenli fallback olarak
     içeriği plain-text'e çevir (HTML kaybedilir ama XSS riski sıfır). */
  const sanitize = window.DOMPurify
    ? (h) => window.DOMPurify.sanitize(h, {
        ALLOWED_TAGS: ['p','br','h2','h3','h4','strong','em','u','blockquote',
                       'ul','ol','li','a','img','pre','code','span'],
        ALLOWED_ATTR: ['href','src','alt','title','class'],
        ALLOWED_URI_REGEXP: /^(https?:|\/)/i,
      })
    : (h) => esc(String(h || '').replace(/<[^>]+>/g, ' '));

  const detayRender = async () => {
    const yer = document.querySelector('[data-blog-detay]');
    if (!yer) return;

    const params = new URLSearchParams(location.search);
    const slug = params.get('slug');
    if (!slug) {
      yer.innerHTML = '<div class="bilgi-kutusu">Yazı bulunamadı.</div>';
      return;
    }

    let veri;
    try {
      veri = await fetchJson(`${API_BASE}/blog/${encodeURIComponent(slug)}`);
    } catch (e) {
      if (e.status === 404) {
        yer.innerHTML = `
          <div class="bos-durum">
            <div class="bos-durum__ikon">🔍</div>
            <h3>Yazı bulunamadı</h3>
            <p>Aradığınız yazı silinmiş veya yayından kaldırılmış olabilir.</p>
            <a href="/blog.html" class="dugme dugme--cerceve" style="margin-top: var(--bosluk-4);">← Tüm yazılar</a>
          </div>`;
      } else {
        yer.innerHTML = '<div class="bilgi-kutusu"><strong>Yazı yüklenemedi.</strong></div>';
      }
      return;
    }

    const y = veri.yazi;

    // Sayfa başlığı
    document.title = `${y.baslik} | Blog`;
    document.querySelectorAll('[data-blog-baslik-tag]').forEach(el => {
      el.textContent = y.baslik;
    });

    const tarih = y.yayin_tarihi ? tarihTr(y.yayin_tarihi) : '';
    const sure = okumaSuresi(y.icerik, y.ozet);

    const yazarLinkli = y.yazar_kullanici_adi
      ? `<a href="/blog.html?yazar=${encodeURIComponent(y.yazar_kullanici_adi)}" class="blog-detay__yazar-link">${esc(y.yazar_adi)}</a>`
      : esc(y.yazar_adi || '');

    const etiketler = (y.etiketler || []).map(e =>
      `<a href="/blog.html?etiket=${encodeURIComponent(e)}" class="etiket etiket--yumusak etiket--link">#${esc(e)}</a>`
    ).join(' ');

    const kategoriLink = y.kategori
      ? `<a href="/blog.html?kategori=${encodeURIComponent(y.kategori)}" class="etiket etiket--yumusak">${esc(y.kategori)}</a>`
      : '';

    const gorsel = y.kapak_gorseli
      ? `<img src="${esc(y.kapak_gorseli)}" alt="" class="blog-detay__kapak" onerror="this.style.display='none'">`
      : '';

    // Önceki/sonraki yazı navigasyonu
    const navHtml = (veri.onceki || veri.sonraki) ? `
      <nav class="blog-nav" aria-label="Yazı navigasyonu">
        ${veri.onceki ? `
          <a href="/blog/yazi.html?slug=${encodeURIComponent(veri.onceki.slug)}" class="blog-nav__link blog-nav__link--onceki">
            <span class="blog-nav__yon">← Önceki yazı</span>
            <span class="blog-nav__baslik">${esc(veri.onceki.baslik)}</span>
          </a>
        ` : '<span></span>'}
        ${veri.sonraki ? `
          <a href="/blog/yazi.html?slug=${encodeURIComponent(veri.sonraki.slug)}" class="blog-nav__link blog-nav__link--sonraki">
            <span class="blog-nav__yon">Sonraki yazı →</span>
            <span class="blog-nav__baslik">${esc(veri.sonraki.baslik)}</span>
          </a>
        ` : '<span></span>'}
      </nav>
    ` : '';

    yer.innerHTML = `
      <article class="blog-detay">
        <header class="blog-detay__ust">
          <div class="blog-detay__meta">
            ${kategoriLink}
            ${tarih ? `<time>${tarih}</time>` : ''}
            <span>•</span>
            <span>${sure}</span>
            ${y.okunma_sayisi ? `<span>•</span><span>👁 ${y.okunma_sayisi} okunma</span>` : ''}
          </div>
          <h1>${esc(y.baslik)}</h1>
          ${y.ozet ? `<p class="blog-detay__ozet">${esc(y.ozet)}</p>` : ''}
          ${y.yazar_adi ? `
            <div class="blog-detay__yazar">
              <div class="blog-detay__yazar-avatar">${esc((y.yazar_adi||'?').charAt(0).toLocaleUpperCase('tr-TR'))}</div>
              <div>
                <div class="blog-detay__yazar-ad">${yazarLinkli}</div>
                <div class="blog-detay__yazar-alt">Yazar</div>
              </div>
            </div>
          ` : ''}
        </header>
        ${gorsel}
        <div class="blog-detay__icerik">${sanitize(y.icerik || '')}</div>
        ${etiketler ? `<div class="blog-detay__etiketler"><strong>Etiketler:</strong> ${etiketler}</div>` : ''}
      </article>

      ${navHtml}

      ${y.yazar_kullanici_adi ? `
        <aside class="blog-yazar-cta">
          <p>${esc(y.yazar_adi)} tarafından yazılan diğer yazıları okumak ister misiniz?</p>
          <a href="/blog.html?yazar=${encodeURIComponent(y.yazar_kullanici_adi)}" class="dugme dugme--cerceve">
            ${esc(y.yazar_adi)}'in diğer yazıları →
          </a>
        </aside>
      ` : ''}
    `;
  };

  /* ============================================================
     Başlat
  ============================================================ */
  const baslat = () => {
    listeRender();
    detayRender();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
