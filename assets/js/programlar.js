/* programlar.js — data/programlar.json'u okur, sayfaya basar */

(() => {
  'use strict';

  const kartHtml = (p) => `
    <article class="program-karti">
      <div class="program-karti__ikon" aria-hidden="true">${p.ikon || '📘'}</div>
      <h3 class="program-karti__baslik">${p.ad}</h3>
      <div class="program-karti__kitle">${p.hedefKitle || ''}</div>
      <p class="program-karti__aciklama">${p.kisaAciklama || ''}</p>
      <ul class="program-karti__ozellikler">
        ${(p.ozellikler || []).map(o => `<li>${o}</li>`).join('')}
      </ul>
    </article>
  `;

  const baslat = async () => {
    const yer = document.querySelector('[data-program-yer]');
    if (!yer) return;
    try {
      const cevap = await fetch('/api/programlar');
      const veri = await cevap.json();
      const liste = veri.programlar || [];
      yer.innerHTML = liste.map(kartHtml).join('');
    } catch (e) {
      console.error('Programlar yüklenemedi:', e);
      yer.innerHTML = '<p class="bos-durum">Programlar yüklenemedi.</p>';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
