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
      ? `<span class="form-yardim">${esc(alan.yardim)}</span>` : '';

    switch (alan.tip) {
      case 'baslik':
        return `
          <div class="form-altbaslik">
            <h3 class="form-altbaslik__baslik">${esc(alan.etiket)}</h3>
            ${alan.yardim ? `<p class="form-yardim">${esc(alan.yardim)}</p>` : ''}
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
            <label class="form-onay" for="${id}">
              <input type="checkbox" id="${id}" name="${esc(alan.id)}" value="evet" ${zorunlu}>
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
      <form id="dinamikForm" class="kart kart--form" novalidate>
        ${form.aciklama ? `<p class="form-aciklama">${esc(form.aciklama)}</p>` : ''}
        ${alanlarHtml}
        <button type="submit" class="dugme dugme--birincil dugme--buyuk dugme--blok form-aksiyon">
          Gönder
        </button>
        <p class="form-not">
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
  // SPRINT 3: inline style atamaları yerine aria-invalid + CSS class kullanılıyor.
  // .form-girdi[aria-invalid="true"], .form-grup[aria-invalid="true"], .form-yardim--hata
  // tanımları components.css'te.
  const alanHataIsaretle = (formEl, alan, mesaj = 'Bu alan zorunludur.') => {
    if (alan.tip === 'checkbox' || alan.tip === 'radio') {
      const grup = formEl.querySelector(`[data-alan-tip="checkbox"][data-alan-id="${alan.id}"]`)
        || formEl.querySelector(`[role="radiogroup"][aria-label="${alan.etiket}"]`)
        || formEl.querySelector(`[name="${alan.id}"]`)?.closest('.form-grup');
      if (!grup) return;
      grup.setAttribute('aria-invalid', 'true');
      _hataSpanEkle(grup, mesaj);
    } else {
      const el = formEl.querySelector(`[name="${alan.id}"]`);
      if (!el) return;
      el.setAttribute('aria-invalid', 'true');
      const grup = el.closest('.form-grup') || el.parentElement;
      _hataSpanEkle(grup, mesaj);
    }
  };
  const _hataSpanEkle = (grup, mesaj) => {
    if (!grup) return;
    let s = grup.querySelector('.form-yardim--hata');
    if (!s) {
      s = document.createElement('span');
      s.className = 'form-yardim form-yardim--hata';
      s.setAttribute('role', 'alert');
      grup.appendChild(s);
    }
    s.textContent = mesaj;
  };
  const alanHatalariTemizle = (formEl) => {
    formEl.querySelectorAll('.form-yardim--hata').forEach(s => s.remove());
    formEl.querySelectorAll('[aria-invalid="true"]').forEach(el => {
      el.removeAttribute('aria-invalid');
    });
  };

  /* Form üstünde genel hata kutusu — stil tamamen .form-hata class'ında */
  const genelHataGoster = (formEl, mesaj) => {
    let kutu = formEl.querySelector('.form-hata');
    if (!kutu) {
      kutu = document.createElement('div');
      kutu.className = 'form-hata';
      kutu.setAttribute('role', 'alert');
      formEl.prepend(kutu);
    }
    kutu.textContent = mesaj;
    kutu.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const genelHataTemizle = (formEl) => {
    const kutu = formEl.querySelector('.form-hata');
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

    // Submit düğmesini disable et — SPRINT 3: data-loading="true" attribute'u
    // CSS spinner'ı tetikler. textContent değiştirmiyoruz; orijinal label kalır
    // ama görünmez olur (color:transparent), yerinde spin animasyonu döner.
    const dgm = formEl.querySelector('button[type="submit"]');
    dgm.disabled = true;
    dgm.setAttribute('data-loading', 'true');

    try {
      await STORAGE.kaydet(form.id, veriler);

      // Teşekkür ekranı — formu yerinde değiştir, scroll + focus ile bildir
      const tesekkur = form.tesekkurMesaji || 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.';
      const yeni = document.createElement('div');
      yeni.className = 'kart form-tesekkur';
      yeni.setAttribute('role', 'status');
      yeni.setAttribute('aria-live', 'polite');
      yeni.tabIndex = -1; // focus alabilsin
      yeni.innerHTML = `
        <div class="form-tesekkur__ikon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <h2>Teşekkür Ederiz!</h2>
        <p class="form-tesekkur__metin">${esc(tesekkur)}</p>
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
      dgm.removeAttribute('data-loading');
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
