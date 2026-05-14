/* kadro.js — data/kadro.json'u okur, sayfaya basar.
   SPRINT 5: Eski gradient + initial-harf placeholder modernleştirildi —
   foto yoksa Lucide user-round SVG ikonu, soft mavi zemin üzerinde. */

(() => {
  'use strict';

  // Lucide "user-round" — foto yoksa nötr placeholder
  const PLACEHOLDER_SVG = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="5"/>
      <path d="M20 21a8 8 0 0 0-16 0"/>
    </svg>
  `;

  const kartHtml = (k) => {
    const fotoIcerik = k.foto
      ? `<img src="${k.foto}" alt="${k.ad}">`
      : PLACEHOLDER_SVG;
    const mottoBlok = k.motto
      ? `<p class="kadro-karti__motto">"${k.motto}"</p>`
      : '';
    const altSatir = [k.mezuniyet, k.deneyimYil ? `${k.deneyimYil} yıl deneyim` : null]
      .filter(Boolean).join(' • ');
    return `
      <article class="kadro-karti">
        <div class="kadro-karti__foto">${fotoIcerik}</div>
        <h3 class="kadro-karti__ad">${k.ad}</h3>
        <div class="kadro-karti__brans">${k.brans || ''}</div>
        ${altSatir ? `<p class="kadro-karti__detay">${altSatir}</p>` : ''}
        ${mottoBlok}
      </article>
    `;
  };

  const baslat = async () => {
    const yer = document.querySelector('[data-kadro-yer]');
    if (!yer) return;
    try {
      const cevap = await fetch('/api/kadro');
      const veri = await cevap.json();
      const liste = veri.kadro || [];
      if (liste.length === 0) {
        yer.innerHTML = '<p class="bos-durum">Kadro bilgileri yakında eklenecek.</p>';
        return;
      }
      yer.innerHTML = liste.map(kartHtml).join('');
    } catch (e) {
      console.error('Kadro yüklenemedi:', e);
      yer.innerHTML = '<p class="bos-durum">Kadro bilgileri yüklenemedi.</p>';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
