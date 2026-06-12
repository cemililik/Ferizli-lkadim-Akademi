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

  /* Onay (checkbox-tek) etiketinde okunabilir link üret.
     - Açık tanım: alan.link + alan.linkMetin (etiket içindeki o ifade anchor olur)
     - KVKK otomatik tespit: alan.link yoksa ve metin 'KVKK' içeriyorsa /kvkk.html'e bağla.
     Geri kalan metin esc() ile kaçırılır; yalnız bilinen ifade anchor'a çevrilir (XSS güvenli). */
  const onayEtiketHtml = (alan) => {
    const metin = String(alan.etiket || '');
    let link = alan.link;
    let linkMetin = alan.linkMetin;
    if (!link && /kvkk/i.test(metin)) {
      link = '/kvkk.html';
      const m = metin.match(/KVKK[^.,;]*?(?:Aydınlatma Metni|Metni|Aydınlatma)/i);
      linkMetin = (m && m[0]) || 'KVKK Aydınlatma Metni';
    }
    if (link && linkMetin && metin.includes(linkMetin)) {
      const i = metin.indexOf(linkMetin);
      const anchor = `<a href="${esc(link)}" target="_blank" rel="noopener" class="form-onay__link">${esc(linkMetin)}</a>`;
      return esc(metin.slice(0, i)) + anchor + esc(metin.slice(i + linkMetin.length));
    }
    return esc(metin);
  };

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
          <fieldset class="form-grup form-grup--grup" data-alan-tip="radio" data-alan-id="${esc(alan.id)}">
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
        // Tek checkbox: onay (KVKK gibi) — etikette okunabilir link (onayEtiketHtml)
        return `
          <div class="form-grup">
            <label class="form-onay" for="${id}">
              <input type="checkbox" id="${id}" name="${esc(alan.id)}" value="evet" ${zorunlu}>
              <span>${onayEtiketHtml(alan)}${yildiz}</span>
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
      default: {
        const tipAttr = alan.tip === 'baslik' ? 'text' : alan.tip;
        let ekstra = '';
        if (alan.tip === 'number') ekstra += ' inputmode="numeric"';
        // Ad/isim alanlarını otomatik autocomplete="name" ile işaretle (mobil veli sürtünmesi azalır)
        const ac = alan.autocomplete
          || ((/(^|-)ad(-?soyad)?$/i.test(alan.id) || /isim|name/i.test(alan.id)) ? 'name' : '');
        if (ac) ekstra += ` autocomplete="${esc(ac)}"`;
        return `
          <div class="form-grup">
            <label class="form-etiket" for="${id}">${esc(alan.etiket)}${yildiz}</label>
            <input class="form-girdi" type="${tipAttr}" id="${id}" name="${esc(alan.id)}"${placeholder}${ekstra} ${zorunlu}>
            ${yardim}
          </div>
        `;
      }
    }
  };

  /* ============================================
     FORM RENDER
  ============================================ */
  const formRender = (yer, form) => {
    const alanlarHtml = (form.alanlar || []).map(alanHtml).join('');
    // Dönüşüm-odaklı gönder metni + kırmızı (vurgu) CTA — site CTA diliyle hizalı.
    const gonderMetin = esc(form.gonderMetin || ((form.id === 'basvuru' || form.varsayilan) ? 'Ön Kaydımı Tamamla' : 'Gönder'));
    yer.innerHTML = `
      <form id="dinamikForm" class="kart kart--form" novalidate>
        ${form.aciklama ? `<p class="form-aciklama">${esc(form.aciklama)}</p>` : ''}
        ${alanlarHtml}
        <button type="submit" class="dugme dugme--vurgu dugme--buyuk dugme--blok form-aksiyon">
          ${gonderMetin}
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
      // data-alan-id ile seç (güvenli slug); ham etiketi seçiciye gömmek "/" gibi
      // özel karakterlerde querySelector SyntaxError üretiyordu.
      const grup = formEl.querySelector(`[data-alan-id="${alan.id}"]`)
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

  /* Tek alanın hatasını temizle (canlı doğrulama düzelince) */
  const alanHataTemizleTek = (formEl, alan) => {
    let hedef;
    if (alan.tip === 'checkbox' || alan.tip === 'radio') {
      hedef = formEl.querySelector(`[data-alan-id="${alan.id}"]`)
        || formEl.querySelector(`[name="${alan.id}"]`)?.closest('.form-grup');
    } else {
      hedef = formEl.querySelector(`[name="${alan.id}"]`);
    }
    if (!hedef) return;
    hedef.removeAttribute('aria-invalid');
    const grup = (hedef.matches && hedef.matches('.form-grup, fieldset'))
      ? hedef : (hedef.closest('.form-grup') || hedef.parentElement);
    if (grup) {
      grup.removeAttribute('aria-invalid');
      const s = grup.querySelector('.form-yardim--hata');
      if (s) s.remove();
    }
  };

  /* Saf (yan-etkisiz) doğrulama — hem submit hem canlı doğrulama kullanır.
     Hata varsa mesaj, yoksa null döner. */
  const alanHatasi = (alan, formEl) => {
    if (alan.tip === 'baslik') return null;
    if (alan.tip === 'checkbox') {
      const secili = formEl.querySelectorAll(`[name="${alan.id}"]:checked`);
      return (alan.zorunlu && secili.length === 0) ? 'En az bir seçim yapın.' : null;
    }
    if (alan.tip === 'checkbox-tek') {
      const el = formEl.querySelector(`[name="${alan.id}"]`);
      return (alan.zorunlu && el && !el.checked) ? 'Bu kutuyu işaretlemelisiniz.' : null;
    }
    if (alan.tip === 'radio') {
      const sec = formEl.querySelector(`[name="${alan.id}"]:checked`);
      return (alan.zorunlu && !sec) ? 'Bir seçenek belirleyin.' : null;
    }
    const el = formEl.querySelector(`[name="${alan.id}"]`);
    if (!el) return null;
    const val = el.value.trim();
    if (alan.zorunlu && !val) return 'Bu alan zorunludur.';
    if (val !== '' && alan.tip === 'tel') {
      const temiz = val.replace(/[\s()\-]/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(temiz)) return 'Geçerli bir telefon numarası girin. Örnek: 0549 355 61 54';
    }
    if (val !== '' && alan.tip === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Geçerli bir e-posta adresi girin.';
    }
    return null;
  };

  /* Alan değerini kayıt için topla */
  const alanDegerTopla = (alan, formEl) => {
    if (alan.tip === 'checkbox') {
      return Array.from(formEl.querySelectorAll(`[name="${alan.id}"]:checked`)).map(i => i.value);
    }
    if (alan.tip === 'checkbox-tek') {
      const el = formEl.querySelector(`[name="${alan.id}"]`);
      return el && el.checked ? 'evet' : 'hayır';
    }
    if (alan.tip === 'radio') {
      const sec = formEl.querySelector(`[name="${alan.id}"]:checked`);
      return sec ? sec.value : '';
    }
    const el = formEl.querySelector(`[name="${alan.id}"]`);
    return el ? el.value.trim() : '';
  };

  /* İlk hatalı alanın odaklanacak elementi */
  const ilkHataElBul = (alan, formEl) => {
    if (alan.tip === 'checkbox' || alan.tip === 'radio') {
      return formEl.querySelector(`[data-alan-id="${alan.id}"]`)
        || formEl.querySelector(`[name="${alan.id}"]`);
    }
    return formEl.querySelector(`[name="${alan.id}"]`);
  };

  /* Canlı doğrulama — yalnız ilk başarısız submit'TEN SONRA devreye girer
     (kullanıcı yazarken erkenden nag etmeyelim). Yazarken hatayı temizler,
     alandan çıkınca (blur) yeniden değerlendirir. */
  const canliDogrulamaBagla = (form, formEl) => {
    if (formEl.dataset.canli === '1') return;
    formEl.dataset.canli = '1';
    const alanBul = (name) => (form.alanlar || []).find(a => a.id === name);
    formEl.addEventListener('input', (e) => {
      const alan = alanBul(e.target.name);
      if (alan && !alanHatasi(alan, formEl)) alanHataTemizleTek(formEl, alan);
    });
    formEl.addEventListener('blur', (e) => {
      const alan = alanBul(e.target.name);
      if (!alan) return;
      const mesaj = alanHatasi(alan, formEl);
      if (mesaj) alanHataIsaretle(formEl, alan, mesaj);
      else alanHataTemizleTek(formEl, alan);
    }, true);
  };

  /* ============================================
     SUBMIT
  ============================================ */
  const submitEt = async (form, formEl) => {
    // Önceki hataları temizle (kullanıcı tekrar deniyor)
    alanHatalariTemizle(formEl);
    genelHataTemizle(formEl);

    // Veri topla + doğrula (saf alanHatasi / alanDegerTopla yardımcılarıyla)
    const veriler = {};
    let hataVar = false;
    let ilkHataEl = null;

    for (const alan of (form.alanlar || [])) {
      if (alan.tip === 'baslik') continue;
      const mesaj = alanHatasi(alan, formEl);
      if (mesaj) {
        hataVar = true;
        alanHataIsaretle(formEl, alan, mesaj);
        if (!ilkHataEl) ilkHataEl = ilkHataElBul(alan, formEl);
      }
      veriler[alan.id] = alanDegerTopla(alan, formEl);
    }

    if (hataVar) {
      // İlk başarısız denemeden sonra canlı (blur/yazarken) doğrulamayı aç
      canliDogrulamaBagla(form, formEl);
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
      // Başarı ekranına WhatsApp ikincil aksiyonu (ayarlardan) + beklenti yönetimi
      const _ay = window.__SITE_AYARLAR__ || {};
      const _wa = _ay.iletisim && _ay.iletisim.whatsapp;
      const _waBtn = _wa
        ? `<a href="https://wa.me/${esc(_wa)}?text=${encodeURIComponent(_ay.whatsappMesaj || '')}" target="_blank" rel="noopener" class="dugme dugme--whatsapp">WhatsApp'tan Yaz</a>`
        : '';
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
        <p class="form-not" style="margin-bottom: var(--bosluk-6);">Genellikle aynı gün içinde size geri dönüyoruz.</p>
        <div class="dugme-grubu dugme-grubu--merkez">
          ${_waBtn}
          <a href="/index.html" class="dugme dugme--cerceve">Ana Sayfaya Dön</a>
        </div>
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
