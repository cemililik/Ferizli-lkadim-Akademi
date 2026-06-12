/* ============================================
   yardim.js — Admin Yardım Merkezi
   - _index.json: bölüm/sayfa hiyerarşisi
   - yardim/<bolum>/<sayfa>.md: gerçek içerik
   - marked: Markdown → HTML
   - DOMPurify: XSS-safe sanitize
   - mermaid: ```mermaid bloklarını şemaya çevir
   - Hash router: #/<bolum>/<sayfa>
   ============================================ */

(() => {
  'use strict';

  const VARSAYILAN_ROTA = 'baslarken/giris';
  const BASE = '/admin/yardim';

  // Mermaid blocklarını işaretle: marked'in fence handler'ı `<pre><code class="language-mermaid">`
  // çıkartır, bunu render sonrası `<div class="mermaid">` olarak yeniden yazıyoruz.
  const mermaidIsle = (kok) => {
    kok.querySelectorAll('pre > code.language-mermaid').forEach(code => {
      const pre = code.parentElement;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      pre.replaceWith(div);
    });
    if (window.mermaid && typeof window.mermaid.run === 'function') {
      try {
        window.mermaid.run({ querySelector: '.yardim-icerik .mermaid' });
      } catch (e) { console.warn('Mermaid render hata:', e); }
    }
  };

  // Callout dönüştürücü: blockquote ilk satırı `[!UYARI]`, `[!İPUCU]`, `[!TEHLIKE]`
  // ile başlıyorsa class ekle.
  const calloutIsle = (kok) => {
    kok.querySelectorAll('blockquote').forEach(bq => {
      const ilk = bq.firstElementChild;
      if (!ilk) return;
      const metin = ilk.textContent.trim();
      const eslesme = metin.match(/^\[!(\w+)\]\s*(.*)/);
      if (!eslesme) return;
      const tip = eslesme[1].toUpperCase();
      const kalan = eslesme[2];
      if (tip === 'UYARI') bq.classList.add('uyari');
      else if (tip === 'TEHLIKE' || tip === 'TEHLİKE') bq.classList.add('tehlike');
      else if (tip === 'IPUCU' || tip === 'İPUCU' || tip === 'IPUCU' || tip === 'NOT') bq.classList.add('ipucu');
      // İlk paragraftan tag'i çıkar
      if (kalan) ilk.innerHTML = kalan;
      else ilk.remove();
    });
  };

  // Slugify (id üretimi için)
  const slug = (s) => String(s).toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/İ/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // H2/H3 başlıklarına id ekle (TOC için)
  const baslikIdEkle = (kok) => {
    kok.querySelectorAll('h2, h3').forEach(h => {
      if (!h.id) h.id = slug(h.textContent);
    });
  };

  // TOC üret. rotaStr = "<bolum>/<sayfa>" → linkler TAM rota + anchor formatında
  // (#/<bolum>/<sayfa>#<baslik>) olur; böylece hash router doğru sayfada kalır,
  // çıplak #baslik hash'i varsayılan sayfaya düşürmez.
  const tocUret = (kok, rotaStr) => {
    const toc = document.getElementById('yardimToc');
    if (!toc) return;
    const basliklar = kok.querySelectorAll('h2, h3');
    if (basliklar.length < 2) { toc.innerHTML = ''; return; }
    const items = Array.from(basliklar).map(h => {
      const cls = h.tagName === 'H3' ? 'h3' : 'h2';
      return `<li class="${cls}"><a href="#/${rotaStr}#${h.id}" data-toc-link data-hedef="${h.id}">${h.textContent}</a></li>`;
    }).join('');
    toc.innerHTML = `
      <div class="yardim-toc__baslik">Bu Sayfada</div>
      <ul>${items}</ul>
    `;
    // Scroll-spy
    const linkler = toc.querySelectorAll('[data-toc-link]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          linkler.forEach(l => l.classList.toggle('aktif', l.dataset.hedef === e.target.id));
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    basliklar.forEach(h => observer.observe(h));
  };

  let _index = null;
  let _aktifRota = null;   // şu an yüklü sayfa rotası — anchor-only hash değişiminde sayfayı yeniden yüklememek için

  const indexYukle = async () => {
    if (_index) return _index;
    const r = await fetch(`${BASE}/_index.json`, { cache: 'no-store' });
    _index = await r.json();
    return _index;
  };

  // Tüm sayfalardan düz liste üret (prev/next için)
  const tumSayfalar = (idx) => {
    const liste = [];
    idx.bolumler.forEach(b => b.sayfalar.forEach(s => {
      liste.push({ ...s, bolum: b.id, bolumBaslik: b.baslik });
    }));
    return liste;
  };

  const sayfaBul = (idx, rota) => {
    const [bolum, sayfa] = rota.split('/');
    if (!bolum || !sayfa) return null;
    const b = idx.bolumler.find(x => x.id === bolum);
    if (!b) return null;
    const s = b.sayfalar.find(x => x.id === sayfa);
    if (!s) return null;
    return { ...s, bolum, bolumBaslik: b.baslik, bolumIkon: b.ikon };
  };

  // Sidebar render
  const sidebarRender = (idx, aktifRota) => {
    const yer = document.getElementById('yardimSidebar');
    if (!yer) return;
    const aramaHtml = `
      <div class="yardim-sidebar__ara">
        <input type="search" id="yardimArama" placeholder="Bu rehberde ara…" aria-label="Yardımda ara">
      </div>
    `;
    const bolumlerHtml = idx.bolumler.map(b => `
      <div class="yardim-bolum" data-bolum="${b.id}">
        <div class="yardim-bolum__baslik">
          <span class="yardim-bolum__baslik-ikon" aria-hidden="true">${b.ikon || '📘'}</span>
          ${b.baslik}
        </div>
        <ul class="yardim-bolum__liste">
          ${b.sayfalar.map(s => `
            <li>
              <a href="#/${b.id}/${s.id}"
                 class="yardim-bolum__link${aktifRota === `${b.id}/${s.id}` ? ' aktif' : ''}"
                 data-sayfa-baslik="${s.baslik.replace(/"/g, '&quot;')}">
                ${s.baslik}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `).join('');
    yer.innerHTML = aramaHtml + bolumlerHtml;

    // Arama (basit: link textine substring match)
    const arama = document.getElementById('yardimArama');
    arama.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      yer.querySelectorAll('.yardim-bolum').forEach(b => {
        const linkler = b.querySelectorAll('.yardim-bolum__link');
        let eslesti = 0;
        linkler.forEach(l => {
          const m = l.textContent.toLowerCase().includes(q);
          l.parentElement.hidden = !m && q !== '';
          if (m) eslesti++;
        });
        b.hidden = q !== '' && eslesti === 0;
      });
    });
  };

  // Sayfa içeriğini yükle & render et
  const sayfaYukle = async (rota) => {
    const idx = await indexYukle();
    const meta = sayfaBul(idx, rota);
    const icerikYer = document.getElementById('yardimIcerik');
    if (!icerikYer) return;

    if (!meta) {
      icerikYer.innerHTML = `
        <div class="yardim-bos">
          <div class="yardim-bos__ikon">🔍</div>
          <h2>Sayfa bulunamadı</h2>
          <p>Aradığınız yardım sayfası mevcut değil. Sol menüden bir konu seçin.</p>
        </div>
      `;
      return;
    }

    let md;
    try {
      const r = await fetch(`${BASE}/${meta.bolum}/${meta.id}.md`, { cache: 'no-store' });
      if (!r.ok) throw new Error('Yüklenemedi');
      md = await r.text();
    } catch (e) {
      icerikYer.innerHTML = `
        <div class="yardim-bos">
          <div class="yardim-bos__ikon">⚠️</div>
          <h2>İçerik yüklenemedi</h2>
          <p>Bu yardım sayfası şu an yüklenemiyor. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      `;
      return;
    }

    // Markdown → HTML → sanitize
    const ham = window.marked.parse(md);
    const temiz = window.DOMPurify.sanitize(ham, {
      ADD_TAGS: ['div', 'ol', 'ul', 'li'],
      ADD_ATTR: ['class', 'id', 'aria-hidden']
    });

    // Kırılma yolu + içerik + pager
    const sayfalar = tumSayfalar(idx);
    const i = sayfalar.findIndex(s => s.bolum === meta.bolum && s.id === meta.id);
    const onceki = i > 0 ? sayfalar[i - 1] : null;
    const sonraki = i < sayfalar.length - 1 ? sayfalar[i + 1] : null;
    const pagerHtml = `
      <nav class="yardim-icerik__pager" aria-label="Sayfa gezintisi">
        ${onceki ? `
          <a href="#/${onceki.bolum}/${onceki.id}">
            <div class="yon">← Önceki</div>
            <div class="baslik">${onceki.baslik}</div>
          </a>
        ` : '<span></span>'}
        ${sonraki ? `
          <a href="#/${sonraki.bolum}/${sonraki.id}" class="ileri">
            <div class="yon">Sonraki →</div>
            <div class="baslik">${sonraki.baslik}</div>
          </a>
        ` : '<span></span>'}
      </nav>
    `;

    icerikYer.innerHTML = `
      <nav class="yardim-icerik__kirilma" aria-label="Konum">
        <span aria-hidden="true">${meta.bolumIkon || ''}</span>
        <span>${meta.bolumBaslik}</span>
        <span>›</span>
        <span>${meta.baslik}</span>
      </nav>
      <article class="yardim-md">${temiz}</article>
      ${pagerHtml}
    `;

    const article = icerikYer.querySelector('.yardim-md');
    calloutIsle(article);
    mermaidIsle(article);
    baslikIdEkle(article);
    tocUret(article, `${meta.bolum}/${meta.id}`);
    _aktifRota = `${meta.bolum}/${meta.id}`;

    // Sayfa başlığını güncelle
    document.title = `${meta.baslik} — Yardım — İlk Adım Akademi`;

    // Aktif sidebar linkini güncelle
    document.querySelectorAll('.yardim-bolum__link').forEach(a => {
      a.classList.toggle('aktif', a.getAttribute('href') === `#/${meta.bolum}/${meta.id}`);
    });

    // İçeriği görünür alana getir (mobilde sidebar açıksa kapansın)
    document.getElementById('yardimSidebar')?.classList.remove('acik');
    icerikYer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Hash içinde #section varsa o başlığa kaydır
    if (location.hash.includes('#', 1)) {
      const id = location.hash.split('#').pop();
      const el = document.getElementById(id);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  // Hash router
  const rotaOku = () => {
    const h = location.hash.replace(/^#\/?/, '');
    if (!h || !h.includes('/')) return VARSAYILAN_ROTA;
    // Sayfa içi anchor için bölümü ayır (#/duyurular/yeni-duyuru#header → duyurular/yeni-duyuru)
    return h.split('#')[0];
  };

  // Geçerli hash'teki #<baslik> anchor'ına kaydır (aynı sayfada TOC tıklaması).
  // Anchor yoksa içeriğin başına gider.
  const anchorKaydir = () => {
    const parcalar = location.hash.split('#');   // ["", "/bolum/sayfa", "baslik"?]
    const id = parcalar.length > 2 ? parcalar[parcalar.length - 1] : '';
    const el = id ? document.getElementById(id) : null;
    const hedef = el || document.getElementById('yardimIcerik');
    hedef?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const baslat = async () => {
    // marked options (v12 — headerIds/mangle kaldırıldığı için kullanmıyoruz)
    if (window.marked && typeof window.marked.setOptions === 'function') {
      window.marked.setOptions({ gfm: true, breaks: false });
    }
    // mermaid options
    if (window.mermaid && typeof window.mermaid.initialize === 'function') {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        flowchart: { curve: 'basis', padding: 20 },
        themeVariables: {
          primaryColor: '#eaf3fb',
          primaryBorderColor: '#1565c0',
          primaryTextColor: '#1a2332',
          lineColor: '#4a5568',
          fontFamily: 'Inter, system-ui, sans-serif'
        }
      });
    }

    const idx = await indexYukle();
    const ilkRota = rotaOku();
    sidebarRender(idx, ilkRota);
    await sayfaYukle(ilkRota);

    // Mobile sidebar toggle
    const mobilDugme = document.getElementById('yardimMobilToggle');
    if (mobilDugme) {
      mobilDugme.addEventListener('click', () => {
        document.getElementById('yardimSidebar')?.classList.toggle('acik');
      });
    }

    // Hash değişiminde: rota değiştiyse sayfayı yükle; yalnızca sayfa içi anchor
    // değiştiyse (TOC tıklaması) yeniden yükleme yapma, sadece o başlığa kaydır.
    window.addEventListener('hashchange', () => {
      const yeni = rotaOku();
      if (yeni === _aktifRota) {
        anchorKaydir();
      } else {
        sayfaYukle(yeni);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
