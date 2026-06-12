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

  // Güvenli HTML kaçışı (diğer render dosyalarıyla tutarlı)
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const kartHtml = (k) => {
    const fotoIcerik = k.foto
      ? `<img src="${esc(k.foto)}" alt="${esc(k.ad)}" loading="lazy" decoding="async" width="320" height="320" onerror="this.style.display='none'">`
      : PLACEHOLDER_SVG;
    const mottoBlok = k.motto
      ? `<p class="kadro-karti__motto">"${esc(k.motto)}"</p>`
      : '';
    const altSatir = [k.mezuniyet, k.deneyimYil ? `${k.deneyimYil} yıl deneyim` : null]
      .filter(Boolean).map(esc).join(' • ');
    return `
      <article class="kadro-karti">
        <div class="kadro-karti__foto">${fotoIcerik}</div>
        <h3 class="kadro-karti__ad">${esc(k.ad)}</h3>
        <div class="kadro-karti__brans">${esc(k.brans || '')}</div>
        ${altSatir ? `<p class="kadro-karti__detay">${altSatir}</p>` : ''}
        ${mottoBlok}
      </article>
    `;
  };

  const baslat = async () => {
    const yer = document.querySelector('[data-kadro-yer]');
    if (!yer) return;
    // Yükleniyor iskeleti (CLS + boş-beyaz flash önleme)
    yer.innerHTML = Array.from({ length: 4 }, () => `<div class="iskelet-kart" aria-hidden="true" style="text-align:center"><div class="iskelet" style="width:144px;height:144px;border-radius:50%;margin:0 auto var(--bosluk-4)"></div><div class="iskelet iskelet-baslik" style="margin-inline:auto"></div><div class="iskelet iskelet-satir iskelet-satir--kisa" style="margin-inline:auto"></div></div>`).join('');
    yer.setAttribute('aria-busy', 'true');
    try {
      const cevap = await fetch('/api/kadro');
      if (!cevap.ok) throw new Error(`HTTP ${cevap.status}`);
      const veri = await cevap.json();
      const liste = veri.kadro || [];
      yer.removeAttribute('aria-busy');
      if (liste.length === 0) {
        yer.innerHTML = '<p class="bos-durum">Kadro bilgileri yakında eklenecek.</p>';
        return;
      }
      yer.innerHTML = liste.map(kartHtml).join('');
    } catch (e) {
      console.error('Kadro yüklenemedi:', e);
      yer.removeAttribute('aria-busy');
      yer.innerHTML = '<p class="bos-durum">Kadro bilgileri yüklenemedi. Lütfen birazdan tekrar deneyin.</p>';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
