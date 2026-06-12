/* ============================================================
   hero-cropper.js — Hero görseli için modal photo cropper
   ------------------------------------------------------------
   Akış: dosya seç → client-side oku (EXIF düzeltilir) → modal aç →
   16:9 master üzerinde pan/zoom ile kırp → Web / Tablet / Mobil canlı
   önizleme (hero gradient + örnek metin) → "Uygula" → cropped JPEG'i
   /api/uploads'a yükle → { url } döner.

   Bağımlılık: ADMIN.toast, ADMIN.escHtml (admin-core.js), /api/uploads.
   Kullanım:
     const r = await HERO_CROPPER.sec({ klasor: 'hero', baslik, rozet });
     // r.url → slayt görseli
   Kendi modalını (hk-* namespace) yönetir; başka modal sistemine dokunmaz.
============================================================ */
(function () {
  'use strict';

  const HERO_ORAN = 16 / 9;          // master crop oranı (hero placeholder'ları 1600×900)
  const CIKTI_GEN = 1920;            // hedef çıktı genişliği (gerekirse küçültülür, asla büyütülmez)
  const MIN_CROP_GEN = 320;          // crop bölgesi bundan dar olamaz (aşırı zoom siniri)
  const DUSUK_COZ_ESIK = 1000;       // master crop bu px genişlikten darsa "düşük çözünürlük" uyarısı

  // Önizleme cihazları — gerçek hero en/boy oranlarının temsili değerleri.
  const CIHAZLAR = [
    { ad: 'Web',    sinif: 'web',    oran: 2.0 },   // geniş masaüstü → üst/alt kırpılır
    { ad: 'Tablet', sinif: 'tablet', oran: 1.2 },   // tablet → hafif yan kırpma
    { ad: 'Mobil',  sinif: 'mobil',  oran: 0.66 },  // telefon → yanlar belirgin kırpılır
  ];

  /* ---------- Dosya → düzeltilmiş bitmap (EXIF döndürme dahil) ---------- */
  const dosyaOku = async (file) => {
    // createImageBitmap + imageOrientation:'from-image' → telefon fotolarındaki
    // EXIF döndürmeyi uygular (yana yatık görsel sorununu önler).
    if (typeof createImageBitmap === 'function') {
      try {
        const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { kaynak: bmp, w: bmp.width, h: bmp.height };
      } catch (_) { /* fallback'e düş */ }
    }
    // Fallback: <img>
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { resolve({ kaynak: img, w: img.naturalWidth, h: img.naturalHeight, objectUrl: url }); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Görsel okunamadı.')); };
      img.src = url;
    });
  };

  /* ---------- Cropped blob'u sunucuya yükle ---------- */
  const yukle = async (blob, klasor) => {
    const form = new FormData();
    form.append('dosya', blob, 'hero-' + Date.now() + '.jpg');
    form.append('klasor', klasor || 'hero');
    form.append('max', String(CIKTI_GEN));
    const r = await fetch('/api/uploads', { method: 'POST', body: form, credentials: 'include' });
    const veri = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(veri.hata || ('Yükleme hatası (HTTP ' + r.status + ')'));
    return veri; // { url, boyutKB, ... }
  };

  /* ---------- Modal iskeleti ---------- */
  const esc = (s) => (window.ADMIN ? ADMIN.escHtml(s) : String(s == null ? '' : s));
  const toast = (m, t) => { if (window.ADMIN) ADMIN.toast(m, t); };

  const modalHtml = (opts) => {
    const onizlemeler = CIHAZLAR.map(c => `
      <figure class="hk-onz hk-onz--${c.sinif}">
        <div class="hk-onz__cerceve">
          <canvas class="hk-onz__cv" data-onz="${c.sinif}"></canvas>
          <div class="hk-onz__katman" aria-hidden="true">
            ${opts.rozet ? `<span class="hk-onz__rozet">${esc(opts.rozet)}</span>` : ''}
            <span class="hk-onz__baslik">${esc(opts.baslik || 'Başlık metni')}</span>
            <span class="hk-onz__btn">${esc(opts.buton || 'Buton')}</span>
          </div>
        </div>
        <figcaption class="hk-onz__ad">${c.ad}</figcaption>
      </figure>`).join('');

    return `
      <div class="hk-arkaplan" role="dialog" aria-modal="true" aria-label="Hero görseli kırpma">
        <div class="hk-kart">
          <header class="hk-bas">
            <div>
              <h2 class="hk-bas__baslik">Hero Görselini Kırp</h2>
              <p class="hk-bas__alt">Görseli konumlandırın; sağda her cihazda nasıl görüneceğini görün.</p>
            </div>
            <button type="button" class="hk-kapat" data-hk="iptal" aria-label="Kapat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </header>

          <div class="hk-govde">
            <div class="hk-sol">
              <div class="hk-tuval-sar">
                <canvas class="hk-tuval" data-hk="tuval"></canvas>
                <div class="hk-tuval-yukleniyor" data-hk="yukleniyor" hidden>Yükleniyor…</div>
              </div>
              <div class="hk-arac">
                <button type="button" class="hk-arac__btn" data-hk="uzaklas" aria-label="Uzaklaş">−</button>
                <input type="range" class="hk-arac__kaydir" data-hk="zoom" min="1" max="4" step="0.01" value="1" aria-label="Yakınlaştır">
                <button type="button" class="hk-arac__btn" data-hk="yakinlas" aria-label="Yakınlaş">+</button>
                <button type="button" class="hk-arac__sifirla" data-hk="sifirla">Sıfırla</button>
              </div>
              <p class="hk-ipucu">Sürükleyerek konumlandırın · tekerlek/kaydırıcı ile yakınlaştırın. <strong>Önemli kısmı ortada tutun</strong> — telefonda yalnızca orta şerit görünür.</p>
              <p class="hk-uyari" data-hk="uyari" hidden></p>
            </div>

            <div class="hk-sag">
              <div class="hk-sag__baslik">Cihaz önizlemeleri</div>
              <div class="hk-onzler">${onizlemeler}</div>
            </div>
          </div>

          <footer class="hk-alt">
            <button type="button" class="dugme dugme--cerceve" data-hk="iptal">İptal</button>
            <button type="button" class="dugme dugme--birincil" data-hk="uygula">
              <span data-hk="uygula-metin">Uygula ve Yükle</span>
            </button>
          </footer>
        </div>
      </div>`;
  };

  /* ---------- Cropper'ı aç (bitmap hazır) ---------- */
  const kirpiciAc = (veri, opts) => new Promise((resolve, reject) => {
    const { kaynak, w: iw, h: ih } = veri;
    const tetikleyen = document.activeElement;   // modal kapanınca odak buraya geri verilir
    let bitti = false;        // modal sonlandı mı (resolve/reject olundu)
    let temizlendi = false;   // temizle() yalnız bir kez çalışsın (idempotent)

    const kok = document.createElement('div');
    kok.innerHTML = modalHtml(opts);
    const root = kok.firstElementChild;
    document.body.appendChild(root);
    const oncekiOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const $ = (s) => root.querySelector(`[data-hk="${s}"]`);
    const tuval = $('tuval');
    const ctx = tuval.getContext('2d');
    const zoomEl = $('zoom');
    const uyariEl = $('uyari');
    const onzCanvaslar = CIHAZLAR.map(c => ({
      c, cv: root.querySelector(`[data-onz="${c.sinif}"]`),
    }));

    // ---- Crop durumu ----
    // En büyük 16:9 crop (z=1): kaynağa sığan en geniş 16:9 dikdörtgen.
    const maxCropW = Math.min(iw, ih * HERO_ORAN);
    const maxZoom = Math.max(1, Math.min(4, maxCropW / MIN_CROP_GEN));
    zoomEl.max = String(maxZoom.toFixed(2));
    let z = 1;
    let cx = iw / 2;
    let cy = ih / 2;

    const cropBoyut = () => {
      const cw = maxCropW / z;
      return { cw, ch: cw / HERO_ORAN };
    };
    const sinirla = () => {
      const { cw, ch } = cropBoyut();
      cx = Math.max(cw / 2, Math.min(iw - cw / 2, cx));
      cy = Math.max(ch / 2, Math.min(ih - ch / 2, cy));
    };
    const cropRect = () => {
      sinirla();   // her okumada clamp garanti → crop görsel dışına taşmaz (sessiz beyaz şerit önlenir)
      const { cw, ch } = cropBoyut();
      return { sx: cx - cw / 2, sy: cy - ch / 2, cw, ch };
    };

    // ---- Ana tuval boyutu (16:9, responsive) ----
    const tuvalBoyutla = () => {
      const sar = tuval.parentElement;
      const en = Math.max(240, sar.clientWidth || 480);
      const boy = Math.round(en / HERO_ORAN);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      tuval.width = Math.round(en * dpr);
      tuval.height = Math.round(boy * dpr);
      tuval.style.width = en + 'px';
      tuval.style.height = boy + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { en, boy };
    };
    let tb = { en: 480, boy: 270 };

    // ---- Çizim ----
    const ciz = () => {
      if (bitti) return;       // kapanmış modalda detached/closed canvas'a çizme (rAF yarışı)
      const { sx, sy, cw, ch } = cropRect();
      const { en, boy } = tb;

      // Ana tuval: crop bölgesi
      ctx.clearRect(0, 0, en, boy);
      ctx.drawImage(kaynak, sx, sy, cw, ch, 0, 0, en, boy);

      // Mobil-güvenli orta şerit: telefonda yalnız merkez görünür.
      // Kenar (kırpılan) bölgeleri HAFİFÇE karart + sadece 2 NET sınır çizgisi.
      // (Üçler-kuralı ızgarası ve tam dikdörtgen çerçeve kaldırıldı → temiz, çift-çizgi yok.)
      const mobilOran = CIHAZLAR.find(c => c.sinif === 'mobil').oran;
      const guvenliEn = boy * mobilOran;
      const bandX = (en - guvenliEn) / 2;
      const solX = Math.round(bandX) + 0.5;        // 1px keskin çizgi için yarım piksel
      const sagX = Math.round(en - bandX) - 0.5;

      ctx.fillStyle = 'rgba(10, 22, 48, 0.34)';
      ctx.fillRect(0, 0, solX, boy);
      ctx.fillRect(sagX, 0, en - sagX, boy);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(solX, 0); ctx.lineTo(solX, boy);
      ctx.moveTo(sagX, 0); ctx.lineTo(sagX, boy);
      ctx.stroke();

      // Cihaz önizlemeleri: master crop'un her cihaz oranında merkez-cover hali
      onzCanvaslar.forEach(({ c, cv }) => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const ow = cv.clientWidth || 200, oh = cv.clientHeight || 120;
        if (cv.width !== Math.round(ow * dpr) || cv.height !== Math.round(oh * dpr)) {
          cv.width = Math.round(ow * dpr); cv.height = Math.round(oh * dpr);
        }
        const octx = cv.getContext('2d');
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        octx.clearRect(0, 0, ow, oh);
        octx.fillStyle = '#ffffff';     // çıktıyla tutarlı: saydam PNG'de beyaz zemin
        octx.fillRect(0, 0, ow, oh);
        // Cihazın master (cw×ch) içindeki merkez alt-dikdörtgeni (cover)
        let dw2, dh2, dx2, dy2;
        if (c.oran < HERO_ORAN) {        // cihaz daha dar/uzun → tam yükseklik, orta genişlik
          dh2 = ch; dw2 = ch * c.oran; dx2 = sx + (cw - dw2) / 2; dy2 = sy;
        } else {                         // cihaz daha geniş → tam genişlik, orta yükseklik
          dw2 = cw; dh2 = cw / c.oran; dx2 = sx; dy2 = sy + (ch - dh2) / 2;
        }
        octx.drawImage(kaynak, dx2, dy2, dw2, dh2, 0, 0, ow, oh);
      });

      // Düşük çözünürlük uyarısı
      if (cw < DUSUK_COZ_ESIK) {
        uyariEl.hidden = false;
        uyariEl.textContent = '⚠ Bu kırpma düşük çözünürlüklü (' + Math.round(cw) + 'px). Büyük ekranlarda bulanık görünebilir; daha az yakınlaştırın veya daha büyük bir görsel yükleyin.';
      } else {
        uyariEl.hidden = true;
      }
    };

    let cizPlanli = false;
    const cizGec = () => { if (cizPlanli) return; cizPlanli = true; requestAnimationFrame(() => { cizPlanli = false; ciz(); }); };

    // ---- Pan (pointer) ----
    let suruk = null;
    tuval.addEventListener('pointerdown', (e) => {
      suruk = { x: e.clientX, y: e.clientY };
      tuval.setPointerCapture(e.pointerId);
      tuval.style.cursor = 'grabbing';
    });
    tuval.addEventListener('pointermove', (e) => {
      if (!suruk) return;
      const { cw } = cropBoyut();
      const olcek = cw / tb.en;                  // ekran px → kaynak px
      cx -= (e.clientX - suruk.x) * olcek;
      cy -= (e.clientY - suruk.y) * olcek;
      suruk = { x: e.clientX, y: e.clientY };
      cizGec();
    });
    const panBitir = (e) => { if (suruk) { suruk = null; tuval.style.cursor = 'grab'; try { tuval.releasePointerCapture(e.pointerId); } catch (_) {} } };
    tuval.addEventListener('pointerup', panBitir);
    tuval.addEventListener('pointercancel', panBitir);

    // ---- Zoom (slider + tekerlek + butonlar) ----
    const zoomAyarla = (yeni) => {
      z = Math.max(1, Math.min(maxZoom, yeni));
      zoomEl.value = String(z);
      cizGec();
    };
    zoomEl.addEventListener('input', () => zoomAyarla(parseFloat(zoomEl.value)));
    $('yakinlas').addEventListener('click', () => zoomAyarla(z + 0.25));
    $('uzaklas').addEventListener('click', () => zoomAyarla(z - 0.25));
    tuval.addEventListener('wheel', (e) => {
      const hedef = Math.max(1, Math.min(maxZoom, z + (e.deltaY < 0 ? 0.12 : -0.12)));
      if (hedef === z) return;       // sınırda → sayfa/modal kaydırmasına izin ver (dar ekran)
      e.preventDefault();
      zoomAyarla(hedef);
    }, { passive: false });
    $('sifirla').addEventListener('click', () => { z = 1; cx = iw / 2; cy = ih / 2; zoomEl.value = '1'; cizGec(); });

    // ---- Kapat / İptal ----
    const temizle = () => {
      if (temizlendi) return;       // idempotent: çift-settle yarışında ikinci çağrı no-op
      temizlendi = true;
      document.removeEventListener('keydown', tusDinle);
      window.removeEventListener('resize', boyutla);
      document.body.style.overflow = oncekiOverflow;
      root.remove();
      if (kaynak && typeof kaynak.close === 'function') { try { kaynak.close(); } catch (_) {} }
      if (veri && veri.objectUrl) { try { URL.revokeObjectURL(veri.objectUrl); } catch (_) {} }
      if (tetikleyen && typeof tetikleyen.focus === 'function') { try { tetikleyen.focus(); } catch (_) {} }
    };
    const iptal = () => { if (bitti) return; bitti = true; temizle(); reject(new Error('İptal edildi')); };
    // Esc kapatır + Tab odağı modal içinde döndürür (focus-trap, WCAG)
    const odaklananlar = () => Array.from(root.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
    const tusDinle = (e) => {
      if (e.key === 'Escape') { iptal(); return; }
      if (e.key === 'Tab') {
        const f = odaklananlar();
        if (!f.length) return;
        const ilk = f[0], son = f[f.length - 1];
        if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
        else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
      }
    };
    document.addEventListener('keydown', tusDinle);
    root.addEventListener('click', (e) => { if (e.target === root) iptal(); });
    root.querySelectorAll('[data-hk="iptal"]').forEach(b => b.addEventListener('click', iptal));

    // ---- Uygula ----
    const uyguBtn = $('uygula');
    const uyguMetin = $('uygula-metin');
    uyguBtn.addEventListener('click', async () => {
      if (bitti) return;
      const { sx, sy, cw, ch } = cropRect();
      // Çıktı: 16:9, ASLA büyütme yok (floor → hedef genişlik ≤ kaynak crop genişliği)
      const cikW = Math.min(CIKTI_GEN, Math.floor(cw));
      const cikH = Math.round(cikW / HERO_ORAN);
      const out = document.createElement('canvas');
      out.width = cikW; out.height = cikH;
      const octx = out.getContext('2d');
      octx.fillStyle = '#ffffff';
      octx.fillRect(0, 0, cikW, cikH);
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(kaynak, sx, sy, cw, ch, 0, 0, cikW, cikH);

      uyguBtn.disabled = true;
      uyguMetin.textContent = 'Yükleniyor…';
      $('yukleniyor').hidden = false;
      try {
        const blob = await new Promise((res, rej) =>
          out.toBlob(b => b ? res(b) : rej(new Error('Görsel oluşturulamadı.')), 'image/jpeg', 0.9));
        const r = await yukle(blob, opts.klasor || 'hero');
        bitti = true;
        temizle();
        resolve({ url: r.url, genislik: cikW, yukseklik: cikH, boyutKB: r.boyutKB });
      } catch (err) {
        uyguBtn.disabled = false;
        uyguMetin.textContent = 'Uygula ve Yükle';
        $('yukleniyor').hidden = true;
        toast(err.message || 'Yükleme başarısız.', 'hata');
      }
    });

    // ---- İlk çizim + resize ----
    const boyutla = () => { tb = tuvalBoyutla(); cizGec(); };
    window.addEventListener('resize', boyutla);
    // Modal layout otursun diye bir frame bekle + ilk kontrole odak ver (a11y)
    requestAnimationFrame(() => {
      tb = tuvalBoyutla(); ciz();
      const odak = $('zoom') || root.querySelector('.hk-kapat');
      if (odak) try { odak.focus(); } catch (_) {}
    });
    tuval.style.cursor = 'grab';
  });

  /* ---------- Genel API: dosya seç → kırp → yükle ---------- */
  const sec = (opts = {}) => new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);

    let cozuldu = false;   // change/cancel/focus-fallback yarışında tek settle
    const temizleInput = () => {
      window.removeEventListener('focus', odakFallback);
      try { input.remove(); } catch (_) {}
    };
    const iptal = () => { if (cozuldu) return; cozuldu = true; temizleInput(); reject(new Error('İptal edildi')); };
    // Eski Safari/WebKit 'cancel' event'i desteklemez → diyalog kapanınca window'a focus döner;
    // kısa süre sonra hâlâ dosya yoksa iptal say (askıda promise + input birikmesini önler).
    const odakFallback = () => setTimeout(() => {
      if (!cozuldu && (!input.files || !input.files.length)) iptal();
    }, 400);

    input.addEventListener('cancel', iptal);
    input.addEventListener('change', async () => {
      if (cozuldu) return;
      cozuldu = true;
      const file = input.files && input.files[0];
      temizleInput();
      if (!file) return reject(new Error('İptal edildi'));
      if (file.type && !/^image\//.test(file.type)) return reject(new Error('Lütfen bir görsel dosyası seçin.'));
      try {
        const veri = await dosyaOku(file);
        if (veri.w < 200 || veri.h < 120) throw new Error('Görsel çok küçük (en az 200×120 piksel önerilir).');
        resolve(await kirpiciAc(veri, opts));
      } catch (e) {
        reject(e);
      }
    });
    window.addEventListener('focus', odakFallback, { once: true });
    input.click();
  });

  window.HERO_CROPPER = { sec };
})();
