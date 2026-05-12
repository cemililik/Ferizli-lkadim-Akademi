/* ============================================
   duyurular.js — duyuru verisini okuyup listeler
   - Ana sayfa için: data-duyuru-yer="anasayfa" → ilk 3 duyuru
   - Duyurular sayfası için: data-duyuru-yer="liste" → tümü + filtre
   ============================================ */

(() => {
  'use strict';

  const ayBilgisi = (t) => {
    const tarih = new Date(t);
    if (isNaN(tarih)) return t;
    return tarih.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const slugify = (s) => s.toString()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const kartHtml = (d, kategoriler) => {
    const kategoriAdi = (kategoriler && kategoriler[d.kategori]) || d.kategori || 'Genel';
    const onemliMi = d.onemli ? ' duyuru-karti--onemli' : '';
    const onemliEtiket = d.onemli
      ? '<span class="etiket etiket--vurgu" style="margin-right:6px">Önemli</span>'
      : '';
    const id = d.id || slugify(d.baslik);
    const altMetin = d.baslik ? `${d.baslik} — kapak görseli` : 'Duyuru kapak görseli';
    const gorsel = d.kapakGorseli
      ? `<a href="/duyurular.html#${id}" class="duyuru-karti__gorsel"><img src="${d.kapakGorseli}" alt="${altMetin}" loading="lazy"></a>`
      : '';
    return `
      <article class="duyuru-karti${onemliMi}">
        ${gorsel}
        <div class="duyuru-karti__icerik">
          <div class="duyuru-karti__ust">
            <span>${onemliEtiket}<span class="etiket etiket--yumusak">${kategoriAdi}</span></span>
            <time class="duyuru-karti__tarih" datetime="${d.tarih}">${ayBilgisi(d.tarih)}</time>
          </div>
          <h3 class="duyuru-karti__baslik">${d.baslik}</h3>
          <p class="duyuru-karti__ozet">${d.ozet || ''}</p>
          <a href="/duyurular.html#${id}" class="duyuru-karti__link">Devamını oku</a>
        </div>
      </article>
    `;
  };

  const detayHtml = (d, kategoriler) => {
    const kategoriAdi = (kategoriler && kategoriler[d.kategori]) || d.kategori || 'Genel';
    const detayAlt = d.baslik ? `${d.baslik} — kapak görseli` : 'Duyuru kapak görseli';
    const gorsel = d.kapakGorseli
      ? `<img src="${d.kapakGorseli}" alt="${detayAlt}" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: var(--yuvarlak-md); margin-bottom: var(--bosluk-6);">`
      : '';
    const formCagri = d.bagliForm
      ? `
        <div style="margin-top: var(--bosluk-6); padding: var(--bosluk-5); background: var(--renk-arka-yumusak); border-radius: var(--yuvarlak-md); border-left: 4px solid var(--renk-vurgu); text-align: center;">
          <p style="margin-bottom: var(--bosluk-3); font-weight: 600; font-size: var(--yazi-lg);">Hemen başvurmak ister misiniz?</p>
          <a href="/basvuru.html?form=${encodeURIComponent(d.bagliForm)}" class="dugme dugme--vurgu dugme--buyuk">
            📝 Formu Doldur
          </a>
        </div>`
      : '';
    return `
      <article class="kart" style="margin-bottom: var(--bosluk-6);">
        ${gorsel}
        <header style="margin-bottom: var(--bosluk-4); padding-bottom: var(--bosluk-4); border-bottom: 1px solid var(--renk-cizgi);">
          <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom: var(--bosluk-3);">
            <span class="etiket etiket--yumusak">${kategoriAdi}</span>
            <time class="duyuru-karti__tarih" datetime="${d.tarih}">${ayBilgisi(d.tarih)}</time>
          </div>
          <h2 style="margin: 0;">${d.baslik}</h2>
        </header>
        <div>${(d.icerik || d.ozet || '').replace(/\n/g, '<br>')}</div>
        ${formCagri}
      </article>
    `;
  };

  const tarihSiralayici = (a, b) => new Date(b.tarih) - new Date(a.tarih);

  const baslat = async () => {
    let veri;
    try {
      const cevap = await fetch('/api/duyurular');
      veri = await cevap.json();
    } catch (e) {
      console.error('Duyurular yüklenemedi:', e);
      return;
    }

    // API normalize formatı: { kapakGorseli, bagliForm } — site bunu kullanıyor
    const tumDuyurular = (veri.duyurular || []).slice().sort(tarihSiralayici);
    const kategoriler = veri.kategoriler || {};

    // --- ANA SAYFA: ilk 3 duyuru ---
    const anaYer = document.querySelector('[data-duyuru-yer="anasayfa"]');
    if (anaYer) {
      const ilk3 = tumDuyurular.slice(0, 3);
      if (ilk3.length === 0) {
        anaYer.innerHTML = '<p class="bos-durum">Henüz duyuru bulunmuyor.</p>';
      } else {
        anaYer.innerHTML = ilk3.map(d => kartHtml(d, kategoriler)).join('');
      }
    }

    // --- DUYURULAR SAYFASI: tüm liste + filtre ---
    const listeYer = document.querySelector('[data-duyuru-yer="liste"]');
    const filtreYer = document.querySelector('[data-duyuru-filtre]');

    if (listeYer) {
      // URL'de #id varsa, detay olarak aç
      const renderListe = (kategoriFiltresi = 'hepsi') => {
        const liste = kategoriFiltresi === 'hepsi'
          ? tumDuyurular
          : tumDuyurular.filter(d => d.kategori === kategoriFiltresi);

        if (liste.length === 0) {
          listeYer.innerHTML = `
            <div class="bos-durum">
              <div class="bos-durum__ikon">📭</div>
              <p>Bu kategoride duyuru bulunmuyor.</p>
            </div>`;
        } else {
          listeYer.className = 'izgara izgara--3';
          listeYer.innerHTML = liste.map(d => kartHtml(d, kategoriler)).join('');
        }
      };

      const renderDetay = (id) => {
        const d = tumDuyurular.find(x => (x.id || slugify(x.baslik)) === id);
        if (!d) {
          // 404 durumu — yanlış/silinmiş duyuru linki açıldı
          listeYer.className = '';
          listeYer.innerHTML = `
            <div class="bos-durum" style="text-align:center; padding: var(--bosluk-16) var(--bosluk-6);">
              <div class="bos-durum__ikon" style="font-size: 3rem; margin-bottom: var(--bosluk-4);">📭</div>
              <h2 style="margin-bottom: var(--bosluk-3);">Duyuru Bulunamadı</h2>
              <p style="color: var(--renk-yazi-acik); margin-bottom: var(--bosluk-6); max-width: 480px; margin-inline:auto;">
                Aradığınız duyuru kaldırılmış veya bağlantı hatalı olabilir.
                Tüm duyurularımıza göz atabilirsiniz.
              </p>
              <a href="/duyurular.html" class="dugme dugme--birincil">Tüm Duyurular</a>
            </div>
          `;
          return;
        }
        listeYer.className = ''; // izgara değil
        listeYer.innerHTML = `
          <a href="/duyurular.html" class="duyuru-karti__link" style="display:inline-block; margin-bottom: var(--bosluk-6);">← Tüm duyurulara dön</a>
          ${detayHtml(d, kategoriler)}
        `;
      };

      // İlk render
      if (location.hash) {
        renderDetay(location.hash.slice(1));
      } else {
        renderListe();
      }

      // Hash değişimi (URL'den direkt duyuru açma)
      window.addEventListener('hashchange', () => {
        if (location.hash) renderDetay(location.hash.slice(1));
        else renderListe();
      });

      // Filtre düğmeleri
      if (filtreYer) {
        // Filtre düğmelerini dinamik üret
        const dugmeler = [
          { id: 'hepsi', ad: 'Tümü' },
          ...Object.entries(kategoriler).map(([id, ad]) => ({ id, ad }))
        ];
        filtreYer.innerHTML = dugmeler.map((b, i) =>
          `<button type="button" class="duyuru-filtre__dugme${i === 0 ? ' aktif' : ''}" data-kategori="${b.id}">${b.ad}</button>`
        ).join('');

        filtreYer.addEventListener('click', (e) => {
          const dugme = e.target.closest('[data-kategori]');
          if (!dugme) return;
          filtreYer.querySelectorAll('.duyuru-filtre__dugme').forEach(d => d.classList.remove('aktif'));
          dugme.classList.add('aktif');
          history.replaceState(null, '', location.pathname); // hash'i temizle
          renderListe(dugme.dataset.kategori);
        });
      }
    }
  };

  // main.js'in partial yüklemesini beklemeyiz; bu sayfa kendi DOMContentLoaded'inde başlar.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
