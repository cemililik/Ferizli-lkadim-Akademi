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

  // Güvenli HTML kaçışı — diğer render dosyalarıyla tutarlı (XSS önleme)
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Boş/hata durumu için Lucide megafon ikonu + tek kanon boş-durum bloğu
  const ikonMega = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>';
  const bosDurum = (ikon, baslik, metin, cta = '') => `
    <div class="bos-durum bos-durum--buyuk">
      <div class="bos-durum__ikon" aria-hidden="true">${ikon}</div>
      ${baslik ? `<h3 style="margin-bottom: var(--bosluk-2);">${esc(baslik)}</h3>` : ''}
      ${metin ? `<p>${esc(metin)}</p>` : ''}
      ${cta}
    </div>`;

  // Yükleniyor iskeleti — fetch beklerken CLS önler + "yükleniyor" hissi verir
  const iskeletKartlar = (n = 3) => Array.from({ length: n }, () => `
    <div class="iskelet-kart" aria-hidden="true">
      <div class="iskelet iskelet-baslik"></div>
      <div class="iskelet iskelet-satir"></div>
      <div class="iskelet iskelet-satir"></div>
      <div class="iskelet iskelet-satir iskelet-satir--kisa"></div>
    </div>`).join('');

  const kartHtml = (d, kategoriler) => {
    const kategoriAdi = (kategoriler && kategoriler[d.kategori]) || d.kategori || 'Genel';
    const onemliMi = d.onemli ? ' duyuru-karti--onemli' : '';
    const onemliEtiket = d.onemli
      ? '<span class="etiket etiket--vurgu" style="margin-right:6px">Önemli</span>'
      : '';
    const id = d.id || slugify(d.baslik || '');
    const altMetin = d.baslik ? `${d.baslik} — kapak görseli` : 'Duyuru kapak görseli';
    const gorsel = d.kapakGorseli
      ? `<a href="/duyurular.html#${encodeURIComponent(id)}" class="duyuru-karti__gorsel"><img src="${esc(d.kapakGorseli)}" alt="${esc(altMetin)}" loading="lazy" onerror="this.closest('.duyuru-karti__gorsel')?.remove()"></a>`
      : '';
    return `
      <article class="duyuru-karti${onemliMi}">
        ${gorsel}
        <div class="duyuru-karti__icerik">
          <div class="duyuru-karti__ust">
            <span>${onemliEtiket}<span class="etiket etiket--yumusak">${esc(kategoriAdi)}</span></span>
            <time class="duyuru-karti__tarih" datetime="${esc(d.tarih)}">${esc(ayBilgisi(d.tarih))}</time>
          </div>
          <h3 class="duyuru-karti__baslik">${esc(d.baslik)}</h3>
          <p class="duyuru-karti__ozet">${esc(d.ozet || '')}</p>
          <a href="/duyurular.html#${encodeURIComponent(id)}" class="duyuru-karti__link">Devamını oku</a>
        </div>
      </article>
    `;
  };

  const detayHtml = (d, kategoriler) => {
    const kategoriAdi = (kategoriler && kategoriler[d.kategori]) || d.kategori || 'Genel';
    const detayAlt = d.baslik ? `${d.baslik} — kapak görseli` : 'Duyuru kapak görseli';
    const gorsel = d.kapakGorseli
      ? `<img src="${esc(d.kapakGorseli)}" alt="${esc(detayAlt)}" onerror="this.style.display='none'" style="width: 100%; max-height: 480px; object-fit: cover; border-radius: var(--yuvarlak-md); margin-bottom: var(--bosluk-6);">`
      : '';
    const formCagri = d.bagliForm
      ? `
        <div style="margin-top: var(--bosluk-6); padding: var(--bosluk-5); background: var(--renk-arka-yumusak); border-radius: var(--yuvarlak-md); border-left: 4px solid var(--renk-vurgu); text-align: center;">
          <p style="margin-bottom: var(--bosluk-3); font-weight: 600; font-size: var(--yazi-lg);">Hemen başvurmak ister misiniz?</p>
          <a href="/basvuru.html?form=${encodeURIComponent(d.bagliForm)}" class="dugme dugme--vurgu dugme--buyuk">
            Formu Doldur
          </a>
        </div>`
      : '';
    // İçeriği escape edip yalnız satır sonlarını <br>'e çevir (HTML enjeksiyonu/XSS önleme)
    const icerikGuvenli = esc(d.icerik || d.ozet || '').replace(/\n/g, '<br>');
    return `
      <article class="kart" style="margin-bottom: var(--bosluk-6);">
        ${gorsel}
        <header style="margin-bottom: var(--bosluk-4); padding-bottom: var(--bosluk-4); border-bottom: 1px solid var(--renk-cizgi);">
          <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom: var(--bosluk-3);">
            <span class="etiket etiket--yumusak">${esc(kategoriAdi)}</span>
            <time class="duyuru-karti__tarih" datetime="${esc(d.tarih)}">${esc(ayBilgisi(d.tarih))}</time>
          </div>
          <h2 style="margin: 0;">${esc(d.baslik)}</h2>
        </header>
        <div>${icerikGuvenli}</div>
        ${formCagri}
      </article>
    `;
  };

  const tarihSiralayici = (a, b) => new Date(b.tarih) - new Date(a.tarih);

  const baslat = async () => {
    // Yükleniyor iskeletini hemen göster (CLS + boş-beyaz flash önleme)
    const anaYer0 = document.querySelector('[data-duyuru-yer="anasayfa"]');
    const listeYer0 = document.querySelector('[data-duyuru-yer="liste"]');
    if (anaYer0) { anaYer0.innerHTML = iskeletKartlar(3); anaYer0.setAttribute('aria-busy', 'true'); }
    if (listeYer0 && !location.hash) { listeYer0.className = 'izgara izgara--3'; listeYer0.innerHTML = iskeletKartlar(6); listeYer0.setAttribute('aria-busy', 'true'); }

    let veri;
    try {
      const cevap = await fetch('/api/duyurular');
      if (!cevap.ok) throw new Error(`HTTP ${cevap.status}`);
      veri = await cevap.json();
    } catch (e) {
      console.error('Duyurular yüklenemedi:', e);
      // Sessiz boşluk yerine kullanıcı-dostu hata (kurum 'duyuru girmemiş' gibi görünmesin)
      const hata = bosDurum(ikonMega, 'Duyurular yüklenemedi',
        'Bağlantı kurulamadı. Lütfen birazdan tekrar deneyin.',
        '<a href="/duyurular.html" onclick="location.reload();return false;" class="dugme dugme--cerceve">Tekrar dene</a>');
      if (anaYer0) { anaYer0.removeAttribute('aria-busy'); anaYer0.innerHTML = hata; }
      if (listeYer0) { listeYer0.removeAttribute('aria-busy'); listeYer0.className = ''; listeYer0.innerHTML = hata; }
      return;
    }
    if (anaYer0) anaYer0.removeAttribute('aria-busy');
    if (listeYer0) listeYer0.removeAttribute('aria-busy');

    // API normalize formatı: { kapakGorseli, bagliForm } — site bunu kullanıyor
    const tumDuyurular = (veri.duyurular || []).slice().sort(tarihSiralayici);
    const kategoriler = veri.kategoriler || {};

    // --- ANA SAYFA: ilk 3 duyuru ---
    const anaYer = document.querySelector('[data-duyuru-yer="anasayfa"]');
    if (anaYer) {
      const ilk3 = tumDuyurular.slice(0, 3);
      if (ilk3.length === 0) {
        anaYer.innerHTML = bosDurum(ikonMega, '', 'Henüz duyuru bulunmuyor.');
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
          listeYer.className = '';
          listeYer.innerHTML = bosDurum(ikonMega, '', 'Bu kategoride duyuru bulunmuyor.');
        } else {
          listeYer.className = 'izgara izgara--3';
          listeYer.innerHTML = liste.map(d => kartHtml(d, kategoriler)).join('');
        }
      };

      const renderDetay = (id) => {
        const d = tumDuyurular.find(x => (x.id || slugify(x.baslik || '')) === id);
        if (!d) {
          // 404 durumu — yanlış/silinmiş duyuru linki açıldı
          listeYer.className = '';
          listeYer.innerHTML = bosDurum(ikonMega, 'Duyuru Bulunamadı',
            'Aradığınız duyuru kaldırılmış veya bağlantı hatalı olabilir. Tüm duyurularımıza göz atabilirsiniz.',
            '<a href="/duyurular.html" class="dugme dugme--birincil">Tüm Duyurular</a>');
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
          `<button type="button" class="cip${i === 0 ? ' cip--aktif' : ''}" data-kategori="${esc(b.id)}" aria-pressed="${i === 0 ? 'true' : 'false'}">${esc(b.ad)}</button>`
        ).join('');

        filtreYer.addEventListener('click', (e) => {
          const dugme = e.target.closest('[data-kategori]');
          if (!dugme) return;
          filtreYer.querySelectorAll('.cip').forEach(d => { d.classList.remove('cip--aktif'); d.setAttribute('aria-pressed', 'false'); });
          dugme.classList.add('cip--aktif');
          dugme.setAttribute('aria-pressed', 'true');
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
