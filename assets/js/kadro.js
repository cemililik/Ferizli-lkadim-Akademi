/* kadro.js — data/kadro.json'u okur, sayfaya basar */

(() => {
  'use strict';

  // İsmin baş harflerini al (Ahmet Yılmaz → AY)
  const harfler = (ad) => ad
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('');

  const kartHtml = (k) => {
    const foto = k.foto
      ? `<img src="${k.foto}" alt="${k.ad}">`
      : `<span aria-hidden="true">${harfler(k.ad || '?')}</span>`;
    const mottoBlok = k.motto
      ? `<p class="kadro-karti__motto">"${k.motto}"</p>`
      : '';
    const altSatir = [k.mezuniyet, k.deneyimYil ? `${k.deneyimYil} yıl deneyim` : null]
      .filter(Boolean).join(' • ');
    return `
      <article class="kadro-karti">
        <div class="kadro-karti__foto">${foto}</div>
        <h3 class="kadro-karti__ad">${k.ad}</h3>
        <div class="kadro-karti__brans">${k.brans || ''}</div>
        ${altSatir ? `<p style="font-size: var(--yazi-sm); color: var(--renk-yazi-soluk); margin-bottom: 8px;">${altSatir}</p>` : ''}
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
