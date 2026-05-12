/* form-render.js — Site tarafı dinamik form motoru
   - data/formlar.json'dan formu alır
   - JSON tanımına göre HTML render eder
   - Submit'te validation + storage adapter ile kaydeder
   - Storage adapter şu an localStorage; deploy sonrası backend için tek yerden değişir

   Desteklenen alan tipleri:
     text, email, tel, number, textarea, select, radio, checkbox, checkbox-tek, date, baslik
*/

(() => {
  'use strict';

  /* ============================================
     STORAGE — PHP API üzerinden cevap kaydı
  ============================================ */
  const STORAGE = {
    kaydet: async (formId, veriler) => {
      const r = await fetch(`/api/formlar/${encodeURIComponent(formId)}/gonder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ veriler }),
      });
      const cevap = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(cevap.hata || 'Form gönderilemedi.');
        err.status = r.status;
        throw err;
      }
      return cevap;
    }
  };

  /* ============================================
     YARDIMCI
  ============================================ */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ============================================
     ALAN RENDER
  ============================================ */
  const alanHtml = (alan) => {
    const id = `f-${alan.id}`;
    const zorunlu = alan.zorunlu ? 'required' : '';
    // Yıldız görsel; screen reader için "(zorunlu)" sr-only metni ile birlikte
    const yildiz = alan.zorunlu
      ? ' <span class="form-zorunlu" aria-hidden="true">*</span><span class="sr-only"> (zorunlu)</span>'
      : '';
    const placeholder = alan.placeholder ? ` placeholder="${esc(alan.placeholder)}"` : '';
    const yardim = alan.yardim
      ? `<p style="font-size: var(--yazi-xs); color: var(--renk-yazi-soluk); margin-top: 4px;">${esc(alan.yardim)}</p>` : '';

    switch (alan.tip) {
      case 'baslik':
        return `
          <div style="margin: var(--bosluk-5) 0 var(--bosluk-3); padding-top: var(--bosluk-3); border-top: 1px solid var(--renk-cizgi);">
            <h3 style="font-size: var(--yazi-lg); margin: 0;">${esc(alan.etiket)}</h3>
            ${alan.yardim ? `<p style="color: var(--renk-yazi-acik); font-size: var(--yazi-sm); margin-top: 4px;">${esc(alan.yardim)}</p>` : ''}
          </div>
        `;

      case 'textarea':
        return `
          <div class="form-grup">
            <label class="form-etiket" for="${id}">${esc(alan.etiket)}${yildiz}</label>
            <textarea class="form-alani" id="${id}" name="${esc(alan.id)}" rows="4"${placeholder} ${zorunlu}></textarea>
            ${yardim}
          </div>
        `;

      case 'select':
        const opts = (alan.secenekler || [])
          .map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('');
        return `
          <div class="form-grup">
            <label class="form-etiket" for="${id}">${esc(alan.etiket)}${yildiz}</label>
            <select class="form-secim" id="${id}" name="${esc(alan.id)}" ${zorunlu}>
              <option value="">Seçiniz…</option>
              ${opts}
            </select>
            ${yardim}
          </div>
        `;

      case 'radio':
        const radios = (alan.secenekler || []).map((s, i) => `
          <label class="form-secenek">
            <input type="radio" id="${id}-${i}" name="${esc(alan.id)}" value="${esc(s)}" ${zorunlu}>
            <span>${esc(s)}</span>
          </label>
        `).join('');
        return `
          <fieldset class="form-grup form-grup--grup">
            <legend class="form-etiket">${esc(alan.etiket)}${yildiz}</legend>
            <div role="radiogroup" aria-label="${esc(alan.etiket)}">${radios}</div>
            ${yardim}
          </fieldset>
        `;

      case 'checkbox':
        const checks = (alan.secenekler || []).map((s, i) => `
          <label class="form-secenek">
            <input type="checkbox" id="${id}-${i}" name="${esc(alan.id)}" value="${esc(s)}">
            <span>${esc(s)}</span>
          </label>
        `).join('');
        return `
          <fieldset class="form-grup form-grup--grup" data-alan-tip="checkbox" data-alan-id="${esc(alan.id)}"${alan.zorunlu ? ' data-zorunlu="true"' : ''}>
            <legend class="form-etiket">${esc(alan.etiket)}${yildiz}</legend>
            <div>${checks}</div>
            ${yardim}
          </fieldset>
        `;

      case 'checkbox-tek':
        // Tek checkbox: onay (KVKK gibi)
        return `
          <div class="form-grup">
            <label style="display: flex; align-items: flex-start; gap: var(--bosluk-2); font-size: var(--yazi-sm); color: var(--renk-yazi-acik); line-height: 1.5;">
              <input type="checkbox" id="${id}" name="${esc(alan.id)}" value="evet" ${zorunlu} style="margin-top: 4px; flex-shrink: 0;">
              <span>${esc(alan.etiket)}${yildiz}</span>
            </label>
            ${yardim}
          </div>
        `;

      case 'date':
        return `
          <div class="form-grup">
            <label class="form-etiket" for="${id}">${esc(alan.etiket)}${yildiz}</label>
            <input class="form-girdi" type="date" id="${id}" name="${esc(alan.id)}" ${zorunlu}>
            ${yardim}
          </div>
        `;

      case 'tel': {
        const telPh = alan.placeholder ? ` placeholder="${esc(alan.placeholder)}"` : ' placeholder="0549 355 61 54"';
        return `
          <div class="form-grup">
            <label class="form-etiket" for="${id}">${esc(alan.etiket)}${yildiz}</label>
            <input class="form-girdi" type="tel" inputmode="tel" autocomplete="tel" pattern="^[0-9+\\s()\\-]{10,20}$" id="${id}" name="${esc(alan.id)}"${telPh} ${zorunlu}>
            ${yardim}
          </div>
        `;
      }
      case 'email':
        return `
          <div class="form-grup">
            <label class="form-etiket" for="${id}">${esc(alan.etiket)}${yildiz}</label>
            <input class="form-girdi" type="email" inputmode="email" autocomplete="email" id="${id}" name="${esc(alan.id)}"${placeholder} ${zorunlu}>
            ${yardim}
          </div>
        `;
      case 'number':
      case 'url':
      case 'text':
      default:
        return `
          <div class="form-grup">
            <label class="form-etiket" for="${id}">${esc(alan.etiket)}${yildiz}</label>
            <input class="form-girdi" type="${alan.tip === 'baslik' ? 'text' : alan.tip}" id="${id}" name="${esc(alan.id)}"${placeholder} ${zorunlu}>
            ${yardim}
          </div>
        `;
    }
  };

  /* ============================================
     FORM RENDER
  ============================================ */
  const formRender = (yer, form) => {
    const alanlarHtml = (form.alanlar || []).map(alanHtml).join('');
    yer.innerHTML = `
      <form id="dinamikForm" class="kart" style="padding: var(--bosluk-8);" novalidate>
        ${form.aciklama ? `<p style="color: var(--renk-yazi-acik); margin-bottom: var(--bosluk-6); padding-bottom: var(--bosluk-4); border-bottom: 1px solid var(--renk-cizgi);">${esc(form.aciklama)}</p>` : ''}
        ${alanlarHtml}
        <button type="submit" class="dugme dugme--birincil dugme--buyuk dugme--blok" style="margin-top: var(--bosluk-6);">
          Gönder
        </button>
        <p style="font-size: var(--yazi-sm); color: var(--renk-yazi-soluk); margin-top: var(--bosluk-4); text-align: center;">
          <span class="form-zorunlu" aria-hidden="true">*</span> işaretli alanlar zorunludur.
        </p>
      </form>
    `;

    document.getElementById('dinamikForm').addEventListener('submit', (e) => {
      e.preventDefault();
      submitEt(form, e.target);
    });
  };

  /* Alan-bazlı hata feedback: hata olan input/grubun yanına .form-alan-hata
     span'i ekler ve border'ı kızartır. Submit tekrar denendiğinde temizler. */
  const alanHataIsaretle = (formEl, alan, mesaj = 'Bu alan zorunludur.') => {
    if (alan.tip === 'checkbox' || alan.tip === 'radio') {
      const grup = formEl.querySelector(`[data-alan-tip="checkbox"][data-alan-id="${alan.id}"]`)
        || formEl.querySelector(`[role="radiogroup"][aria-label="${alan.etiket}"]`)
        || formEl.querySelector(`[name="${alan.id}"]`)?.closest('.form-grup');
      if (!grup) return;
      grup.style.outline = '2px solid var(--renk-hata)';
      grup.style.outlineOffset = '4px';
      grup.style.borderRadius = 'var(--yuvarlak)';
      grup.setAttribute('aria-invalid', 'true');
      _hataSpanEkle(grup, mesaj);
    } else {
      const el = formEl.querySelector(`[name="${alan.id}"]`);
      if (!el) return;
      el.style.borderColor = 'var(--renk-hata)';
      el.setAttribute('aria-invalid', 'true');
      const grup = el.closest('.form-grup') || el.parentElement;
      _hataSpanEkle(grup, mesaj);
    }
  };
  const _hataSpanEkle = (grup, mesaj) => {
    if (!grup) return;
    let s = grup.querySelector('.form-alan-hata');
    if (!s) {
      s = document.createElement('span');
      s.className = 'form-alan-hata';
      s.style.cssText = 'display:block;color:var(--renk-hata);font-size:var(--yazi-xs);margin-top:4px;';
      grup.appendChild(s);
    }
    s.textContent = mesaj;
  };
  const alanHatalariTemizle = (formEl) => {
    formEl.querySelectorAll('.form-alan-hata').forEach(s => s.remove());
    formEl.querySelectorAll('[style*="outline"]').forEach(el => {
      el.style.outline = ''; el.style.outlineOffset = '';
    });
    formEl.querySelectorAll('.form-girdi, .form-secim, .form-alani').forEach(el => {
      el.style.borderColor = '';
    });
  };

  /* Form üstünde genel hata kutusu */
  const genelHataGoster = (formEl, mesaj) => {
    let kutu = formEl.querySelector('.form-hata.bilgi-kutusu');
    if (!kutu) {
      kutu = document.createElement('div');
      kutu.className = 'form-hata bilgi-kutusu';
      kutu.setAttribute('role', 'alert');
      kutu.style.cssText = 'margin-bottom: var(--bosluk-4); border-left: 4px solid var(--renk-hata); background: #fef2f2; color: #991b1b; padding: var(--bosluk-3) var(--bosluk-4); border-radius: var(--yuvarlak);';
      formEl.prepend(kutu);
    }
    kutu.textContent = mesaj;
    kutu.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const genelHataTemizle = (formEl) => {
    const kutu = formEl.querySelector('.form-hata.bilgi-kutusu');
    if (kutu) kutu.remove();
  };

  /* ============================================
     SUBMIT
  ============================================ */
  const submitEt = async (form, formEl) => {
    // Önceki hataları temizle (kullanıcı tekrar deniyor)
    alanHatalariTemizle(formEl);
    genelHataTemizle(formEl);

    // Veri topla
    const veriler = {};
    let hataVar = false;
    let ilkHataEl = null;

    for (const alan of (form.alanlar || [])) {
      if (alan.tip === 'baslik') continue;

      if (alan.tip === 'checkbox') {
        const secili = Array.from(formEl.querySelectorAll(`[name="${alan.id}"]:checked`))
          .map(i => i.value);
        if (alan.zorunlu && secili.length === 0) {
          hataVar = true;
          alanHataIsaretle(formEl, alan, 'En az bir seçim yapın.');
          if (!ilkHataEl) ilkHataEl = formEl.querySelector(`[data-alan-id="${alan.id}"]`);
        }
        veriler[alan.id] = secili;
      } else if (alan.tip === 'checkbox-tek') {
        const el = formEl.querySelector(`[name="${alan.id}"]`);
        if (alan.zorunlu && !el.checked) {
          hataVar = true;
          alanHataIsaretle(formEl, alan, 'Bu kutuyu işaretlemelisiniz.');
          if (!ilkHataEl) ilkHataEl = el;
        }
        veriler[alan.id] = el.checked ? 'evet' : 'hayır';
      } else if (alan.tip === 'radio') {
        const sec = formEl.querySelector(`[name="${alan.id}"]:checked`);
        if (alan.zorunlu && !sec) {
          hataVar = true;
          alanHataIsaretle(formEl, alan, 'Bir seçenek belirleyin.');
          if (!ilkHataEl) {
            ilkHataEl = formEl.querySelector(`[role="radiogroup"][aria-label="${alan.etiket}"]`)
              || formEl.querySelector(`[name="${alan.id}"]`);
          }
        }
        veriler[alan.id] = sec ? sec.value : '';
      } else {
        const el = formEl.querySelector(`[name="${alan.id}"]`);
        if (!el) continue;
        const val = el.value.trim();
        if (alan.zorunlu && !val) {
          hataVar = true;
          alanHataIsaretle(formEl, alan, 'Bu alan zorunludur.');
          if (!ilkHataEl) ilkHataEl = el;
        } else if (val !== '' && alan.tip === 'tel') {
          // Sadece rakam, boşluk, +, -, () izinli — min 10 karakter
          const temiz = val.replace(/[\s()\-]/g, '');
          if (!/^\+?[0-9]{10,15}$/.test(temiz)) {
            hataVar = true;
            alanHataIsaretle(formEl, alan, 'Geçerli bir telefon numarası girin. Örnek: 0549 355 61 54');
            if (!ilkHataEl) ilkHataEl = el;
          }
        } else if (val !== '' && alan.tip === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            hataVar = true;
            alanHataIsaretle(formEl, alan, 'Geçerli bir e-posta adresi girin.');
            if (!ilkHataEl) ilkHataEl = el;
          }
        }
        veriler[alan.id] = val;
      }
    }

    if (hataVar) {
      if (ilkHataEl) {
        ilkHataEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof ilkHataEl.focus === 'function') ilkHataEl.focus();
      }
      return;
    }

    // Submit düğmesini disable et
    const dgm = formEl.querySelector('button[type="submit"]');
    const eskiText = dgm.textContent;
    dgm.disabled = true;
    dgm.textContent = 'Gönderiliyor…';

    try {
      await STORAGE.kaydet(form.id, veriler);

      // Teşekkür ekranı — formu yerinde değiştir, scroll + focus ile bildir
      const tesekkur = form.tesekkurMesaji || 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.';
      const yeni = document.createElement('div');
      yeni.className = 'kart form-tesekkur';
      yeni.setAttribute('role', 'status');
      yeni.setAttribute('aria-live', 'polite');
      yeni.tabIndex = -1; // focus alabilsin
      yeni.style.cssText = 'padding: var(--bosluk-12); text-align: center;';
      yeni.innerHTML = `
        <div style="font-size: 4rem; margin-bottom: var(--bosluk-4);" aria-hidden="true">✅</div>
        <h2 style="margin-bottom: var(--bosluk-4);">Teşekkür Ederiz!</h2>
        <p style="color: var(--renk-yazi-acik); font-size: var(--yazi-lg); margin-bottom: var(--bosluk-6); max-width: 500px; margin-inline: auto;">
          ${esc(tesekkur)}
        </p>
        <a href="/index.html" class="dugme dugme--birincil">Ana Sayfaya Dön</a>
      `;
      formEl.parentNode.replaceChild(yeni, formEl);
      // Scroll + focus: smooth animasyon, sticky header'ı scroll-padding-top ile aşar
      yeni.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Animasyon biter bitmez focus → screen reader "Teşekkür Ederiz!" başlığını duyurur
      setTimeout(() => yeni.focus({ preventScroll: true }), 320);
    } catch (err) {
      console.error('Form gönderilemedi:', err);
      dgm.disabled = false;
      dgm.textContent = eskiText;
      // Status koduna göre kullanıcı dostu mesaj
      let mesaj;
      if (err.status === 422) {
        mesaj = err.message || 'Form gönderilemedi';
      } else if (err.status === 429) {
        mesaj = 'Çok hızlı denediniz, biraz bekleyin.';
      } else {
        mesaj = 'Form gönderilemedi. Lütfen tekrar deneyin.';
      }
      genelHataGoster(formEl, mesaj);
    }
  };

  /* ============================================
     BAŞLAT
  ============================================ */
  const baslat = async () => {
    const yer = document.querySelector('[data-form-yer]');
    if (!yer) return;

    let yayinda = [];
    try {
      const r = await fetch('/api/formlar', { cache: 'no-store' });
      const veri = await r.json();
      yayinda = (veri.formlar || []); // API zaten yayında olanları döner (public)
    } catch (e) {
      console.error('Formlar yüklenemedi:', e);
      yer.innerHTML = '<div class="bilgi-kutusu"><strong>Form yüklenemedi.</strong> Lütfen daha sonra tekrar deneyin.</div>';
      return;
    }

    // Hangi form?
    const istenenId = yer.dataset.formYer;
    let form = null;
    if (istenenId && istenenId !== 'varsayilan') {
      form = yayinda.find(f => f.id === istenenId);
    }
    if (!form) {
      form = yayinda.find(f => f.varsayilan) || yayinda[0];
    }

    if (!form) {
      yer.innerHTML = `
        <div class="bilgi-kutusu">
          <strong>Şu anda yayında form bulunmuyor.</strong>
          Bizimle iletişime geçmek için lütfen <a href="/iletisim.html">iletişim sayfasını</a> kullanın.
        </div>`;
      return;
    }

    // Başlığı ve açıklamayı güncelle (sayfa üstünde varsa)
    const baslikEl = document.querySelector('[data-form-baslik]');
    if (baslikEl) baslikEl.textContent = form.ad;
    const aciklamaEl = document.querySelector('[data-form-aciklama]');
    if (aciklamaEl && form.aciklama) aciklamaEl.textContent = form.aciklama;

    formRender(yer, form);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baslat);
  } else {
    baslat();
  }
})();
