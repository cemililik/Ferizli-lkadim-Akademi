/* programlar.js — data/programlar.json'u okur, sayfaya basar.
   SPRINT 5: kategori filtre çipleri (Hepsi / Ortaokul / Lise).
   Backend değişikliği yapmamak için kategori hedefKitle metninden otomatik
   türetilir; ilerde admin'den eklenirse program.kategoriler dizisi override eder. */

(() => {
  'use strict';

  // Güvenli HTML kaçışı (diğer render dosyalarıyla tutarlı — XSS önleme)
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* Kategoriyi hedefKitle metninden çıkar. Override: program.kategoriler dizisi */
  const kategoriCikar = (p) => {
    if (Array.isArray(p.kategoriler) && p.kategoriler.length) return p.kategoriler;
    const cats = new Set();
    const text = (p.hedefKitle || '').toLowerCase();
    if (text.includes('ortaokul')) cats.add('ortaokul');
    if (text.includes('lise')) cats.add('lise');
    // Metindeki tüm rakamları gez: 5-8 → ortaokul, 9-12 → lise
    const numbers = (text.match(/\d+/g) || []).map(Number);
    for (const n of numbers) {
      if (n >= 5 && n <= 8) cats.add('ortaokul');
      if (n >= 9 && n <= 12) cats.add('lise');
    }
    return Array.from(cats);
  };

  /* Çip etiket sözlüğü — UI'da gösterilen Türkçe ad */
  const KATEGORI_ETIKET = {
    ortaokul: 'Ortaokul',
    lise: 'Lise',
  };

  const kartHtml = (p) => `
    <article class="program-karti" data-kategoriler="${esc((p._kategoriler || []).join(' '))}">
      <div class="program-karti__ikon" aria-hidden="true">${esc(p.ikon || '📘')}</div>
      <h3 class="program-karti__baslik">${esc(p.ad)}</h3>
      <div class="program-karti__kitle">${esc(p.hedefKitle || '')}</div>
      <p class="program-karti__aciklama">${esc(p.kisaAciklama || '')}</p>
      <ul class="program-karti__ozellikler">
        ${(p.ozellikler || []).map(o => `<li>${esc(o)}</li>`).join('')}
      </ul>
    </article>
  `;

  /* Filtre çiplerini render et — sadece data'da bulunan kategoriler için */
  const cipleriRender = (mevcutKategoriler) => {
    const yer = document.querySelector('[data-program-filtre]');
    if (!yer || !mevcutKategoriler.length) return;
    yer.innerHTML = `
      <button type="button" class="cip cip--aktif" data-filtre="">Hepsi</button>
      ${mevcutKategoriler.map(k =>
        `<button type="button" class="cip" data-filtre="${k}">${KATEGORI_ETIKET[k] || k}</button>`
      ).join('')}
    `;
    yer.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filtre]');
      if (!btn) return;
      const filtre = btn.dataset.filtre;
      yer.querySelectorAll('.cip').forEach(b => b.classList.toggle('cip--aktif', b === btn));
      filtreUygula(filtre);
    });
  };

  /* Seçilen filtreye göre kartları göster/gizle (aria-hidden ile a11y dahil) */
  const filtreUygula = (filtre) => {
    const kartlar = document.querySelectorAll('[data-program-yer] .program-karti');
    kartlar.forEach(k => {
      const kats = (k.dataset.kategoriler || '').split(/\s+/).filter(Boolean);
      const goster = !filtre || kats.includes(filtre);
      k.hidden = !goster;
    });
  };

  const baslat = async () => {
    const yer = document.querySelector('[data-program-yer]');
    if (!yer) return;
    // Yükleniyor iskeleti (CLS + boş-beyaz flash önleme)
    yer.innerHTML = Array.from({ length: 3 }, () => `<div class="iskelet-kart" aria-hidden="true"><div class="iskelet iskelet-daire"></div><div class="iskelet iskelet-baslik"></div><div class="iskelet iskelet-satir"></div><div class="iskelet iskelet-satir iskelet-satir--kisa"></div></div>`).join('');
    yer.setAttribute('aria-busy', 'true');
    try {
      const cevap = await fetch('/api/programlar');
      if (!cevap.ok) throw new Error(`HTTP ${cevap.status}`);
      const veri = await cevap.json();
      const liste = veri.programlar || [];
      // Her programa türetilmiş _kategoriler iliştir
      liste.forEach(p => { p._kategoriler = kategoriCikar(p); });
      yer.removeAttribute('aria-busy');
      yer.innerHTML = liste.map(kartHtml).join('');
      // Data'da bulunan tüm benzersiz kategoriler — sabit sırada (ortaokul → lise)
      const tumKategoriler = ['ortaokul', 'lise']
        .filter(k => liste.some(p => p._kategoriler.includes(k)));
      cipleriRender(tumKategoriler);
    } catch (e) {
      console.error('Programlar yüklenemedi:', e);
      yer.removeAttribute('aria-busy');
      yer.innerHTML = '<p class="bos-durum">Programlar yüklenemedi. Lütfen birazdan tekrar deneyin.</p>';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
