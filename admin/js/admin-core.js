/* ============================================
   admin-core.js — Admin paneli ortak yardımcıları
   API ile session-based auth, görsel yükleme, toast, dışa aktarma vb.
   localStorage TASLAK AKIŞI ARTIK KULLANILMIYOR — her şey API üzerinden.
   ============================================ */

const ADMIN = (() => {
  'use strict';

  /* ---------- AUTH ---------- */
  // Mevcut kullanıcı bilgisini cache'le (her sayfada bir kere fetch)
  let _kullanici = null;

  const kullaniciAl = async () => {
    if (_kullanici !== null) return _kullanici;
    try {
      const r = await API.auth.me();
      _kullanici = r.kullanici || false;
      return _kullanici;
    } catch {
      _kullanici = false;
      return false;
    }
  };

  /**
   * Korumalı sayfa kapısı.
   * Async — admin sayfaları çağırıp await etmeli.
   * Giriş yoksa /admin/'e yönlendirir, false döner.
   */
  const korumaliSayfaKapisi = async () => {
    const u = await kullaniciAl();
    if (!u) {
      location.replace('/admin/');
      return false;
    }
    return u;
  };

  const oturumKapat = async () => {
    try { await API.auth.logout(); } catch {}
    _kullanici = false;
    location.href = '/admin/';
  };

  /* ---------- TOAST ---------- */
  // Aynı anda en fazla 3 toast: yeni gelirse en eskisini kaldır.
  const TOAST_MAX = 3;
  const toast = (mesaj, tur = 'bilgi') => {
    // Eski toast'ları temizle
    const mevcut = document.querySelectorAll('.toast');
    if (mevcut.length >= TOAST_MAX) {
      // İlk eklenenleri (en eskileri) kaldır
      const fazla = mevcut.length - TOAST_MAX + 1;
      for (let i = 0; i < fazla; i++) mevcut[i].remove();
    }
    const el = document.createElement('div');
    el.className = `toast toast--${tur}`;
    el.textContent = mesaj;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 200ms';
      setTimeout(() => el.remove(), 200);
    }, 3000);
  };

  /* ---------- MODAL HELPER ----------
     ADMIN.modalAc(html, onKapat) → modal'ı açar; .modal-arkaplan + .modal-kart
     yapısını veya istenen markup'ı içerikten render eder.
     - Backdrop tıklama, ESC ve dönen kapat() fonksiyonu ile kapanır.
     - body scroll'u kilitler, role="dialog" aria-modal ekler.
  */
  let _aktifModal = null;
  let _modalEscDinleyici = null;
  const modalKapa = () => {
    if (!_aktifModal) return;
    const onKapat = _aktifModal.onKapat;
    _aktifModal.kok.remove();
    if (_modalEscDinleyici) {
      document.removeEventListener('keydown', _modalEscDinleyici);
      _modalEscDinleyici = null;
    }
    document.body.style.overflow = '';
    _aktifModal = null;
    if (typeof onKapat === 'function') {
      try { onKapat(); } catch (e) { console.error(e); }
    }
  };
  const modalAc = (html, onKapat) => {
    if (_aktifModal) modalKapa();
    const kok = document.createElement('div');
    kok.className = 'modal-arkaplan';
    kok.setAttribute('role', 'dialog');
    kok.setAttribute('aria-modal', 'true');
    kok.innerHTML = html;
    document.body.appendChild(kok);
    document.body.style.overflow = 'hidden';
    _aktifModal = { kok, onKapat };

    // Backdrop click → kapat
    kok.addEventListener('click', (e) => {
      if (e.target === kok) modalKapa();
    });
    // ESC → kapat
    _modalEscDinleyici = (e) => { if (e.key === 'Escape') modalKapa(); };
    document.addEventListener('keydown', _modalEscDinleyici);

    return { kok, kapa: modalKapa };
  };

  /* ---------- TARİH ---------- */
  const bugunISO = () => new Date().toISOString().slice(0, 10);

  const tarihGoster = (t) => {
    if (!t) return '—';
    const d = new Date(t);
    if (isNaN(d)) return t;
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ---------- PANOYA KOPYALA ---------- */
  const panoyaKopyala = async (metin) => {
    try {
      await navigator.clipboard.writeText(metin);
      return true;
    } catch {
      return false;
    }
  };

  /* ---------- SLUG / ID ---------- */
  const slugify = (s) => s.toString()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const benzersizId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  /* ---------- HTML kaçış ---------- */
  const escHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- GÖRSEL: dosya seç → sunucuya yükle → URL döner ---------- */
  // Geri uyumluluk: dönen obje hâlâ { dataUrl, ... } şeklinde — ama dataUrl
  // artık sunucu URL'si (örn: "/assets/uploads/duyurular/2026/05/abc.jpg").
  // Mevcut çağrılar değişmeden çalışır; img src'leri URL ya da base64
  // (legacy) olabilir.
  //
  // opsiyonlar:
  //   - klasor:  altklasör adı (örn: "kadro", "duyurular", "blog", "galeri")
  //   - maxGenislik/maxYukseklik: önerilen üst sınır
  //   - maxBoyutMB: client-side reddetme eşiği
  const gorselSec = (opsiyonlar = {}) => {
    const {
      maxGenislik = 1600,
      maxYukseklik = 1600,
      maxBoyutMB = 16,
      klasor = 'genel',
    } = opsiyonlar;

    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      document.body.appendChild(input);

      input.addEventListener('change', async () => {
        const dosya = input.files && input.files[0];
        input.remove();
        if (!dosya) return reject(new Error('Dosya seçilmedi'));
        if (dosya.size > maxBoyutMB * 1024 * 1024) {
          return reject(new Error(`Dosya çok büyük (${(dosya.size / 1024 / 1024).toFixed(1)} MB). En fazla ${maxBoyutMB} MB.`));
        }
        try {
          const form = new FormData();
          form.append('dosya', dosya);
          form.append('klasor', klasor);
          form.append('max', String(Math.max(maxGenislik, maxYukseklik)));
          const r = await fetch('/api/uploads', {
            method: 'POST',
            body: form,
            credentials: 'include',
          });
          const veri = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(veri.hata || `Yükleme hatası (HTTP ${r.status})`);
          resolve({
            dataUrl: veri.url,           // geri uyumluluk: alan adı dataUrl
            url: veri.url,
            boyutKB: veri.boyutKB,
            genislik: veri.genislik,
            yukseklik: veri.yukseklik,
            orijinalAd: dosya.name,
          });
        } catch (e) {
          reject(e);
        }
      });
      input.addEventListener('cancel', () => { input.remove(); reject(new Error('İptal edildi')); });
      input.click();
    });
  };

  const gorselOnizleme = (src, opsiyonlar = {}) => {
    const { yukseklik = 160, bos = 'Görsel yok' } = opsiyonlar;
    if (!src) {
      return `<div style="height: ${yukseklik}px; background: var(--renk-arka-yumusak); border: 1px dashed var(--renk-cizgi-koyu); border-radius: var(--yuvarlak); display: flex; align-items: center; justify-content: center; color: var(--renk-yazi-soluk); font-size: var(--yazi-sm);">${bos}</div>`;
    }
    return `<img src="${escHtml(src)}" alt="" style="width: 100%; height: ${yukseklik}px; object-fit: cover; border-radius: var(--yuvarlak); border: 1px solid var(--renk-cizgi);">`;
  };

  /* ---------- DIŞA AKTARMA (Cevaplar için) ---------- */
  const csvEscape = (v) => {
    if (v == null) return '';
    const s = Array.isArray(v) ? v.join('; ') : String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const cevaplariCsvIndir = (form, cevaplar) => {
    const alanlar = (form.alanlar || []).filter(a => a.tip !== 'baslik');
    const basliklar = ['Tarih', ...alanlar.map(a => a.etiket || a.id)];
    const satirlar = cevaplar.map(c => {
      const tarih = new Date(c.tarih).toLocaleString('tr-TR');
      const degerler = alanlar.map(a => c.veriler && c.veriler[a.id]);
      return [tarih, ...degerler];
    });
    const csv = '﻿' + [basliklar, ...satirlar].map(r => r.map(csvEscape).join(',')).join('\r\n');
    indirBlob(`${form.id}-cevaplar-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const cevaplariJsonIndir = (form, cevaplar) => {
    const veri = {
      form: { id: form.id, ad: form.ad, alanlar: (form.alanlar || []).map(a => ({ id: a.id, etiket: a.etiket, tip: a.tip })) },
      indirilme: new Date().toISOString(),
      cevapSayisi: cevaplar.length,
      cevaplar
    };
    indirBlob(`${form.id}-cevaplar-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(veri, null, 2),
              'application/json');
  };

  const cevaplariJsonlIndir = (form, cevaplar) => {
    const jsonl = cevaplar.map(c => JSON.stringify({ formId: c.formId, tarih: c.tarih, veriler: c.veriler })).join('\n') + '\n';
    indirBlob(`${form.id}-cevaplar-${new Date().toISOString().slice(0, 10)}.jsonl`,
              jsonl, 'application/x-ndjson;charset=utf-8');
  };

  const cevaplariPdfIndir = (form, cevaplar) => {
    const alanlar = (form.alanlar || []).filter(a => a.tip !== 'baslik');
    const tarihDuzeni = (t) => new Date(t).toLocaleString('tr-TR');
    const formatDeger = (v) => Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v));

    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>${escHtml(form.ad)} — Cevaplar</title>
<style>
  *{box-sizing:border-box}body{font-family:'Inter',sans-serif;padding:24px;color:#1a2332}
  h1{font-size:22px;margin:0 0 4px}
  .ust{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #1565c0}
  .ust p{margin:0;color:#555;font-size:13px}
  .cevap{page-break-inside:avoid;margin-bottom:24px;padding:16px;border:1px solid #ccc;border-radius:8px}
  .cevap h3{font-size:14px;margin:0 0 12px;color:#1565c0;padding-bottom:8px;border-bottom:1px dashed #ccc}
  .satir{display:grid;grid-template-columns:200px 1fr;gap:12px;padding:6px 0;font-size:13px;border-bottom:1px solid #eee}
  .satir:last-child{border-bottom:0}.satir strong{color:#555}
  @media print{body{padding:0}.yazdir-dugmesi{display:none}}
  .yazdir-dugmesi{position:fixed;bottom:24px;right:24px;padding:12px 24px;background:#1565c0;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.2)}
</style></head><body>
<div class="ust"><div><h1>${escHtml(form.ad)}</h1><p>${cevaplar.length} cevap</p></div><p>${new Date().toLocaleString('tr-TR')}</p></div>
${cevaplar.map((c,i)=>`<article class="cevap"><h3>Cevap #${cevaplar.length-i} &middot; ${tarihDuzeni(c.tarih)}</h3>${alanlar.map(a=>`<div class="satir"><strong>${escHtml(a.etiket||a.id)}:</strong><span>${escHtml(formatDeger(c.veriler && c.veriler[a.id]))}</span></div>`).join('')}</article>`).join('')}
<button class="yazdir-dugmesi" onclick="window.print()">🖨 PDF Olarak Kaydet</button>
<script>setTimeout(()=>window.print(),300);<\/script></body></html>`;
    const w = window.open('', '_blank', 'width=1000,height=800');
    if (!w) { alert('Pop-up engelleyici aktif görünüyor.'); return; }
    w.document.write(html);
    w.document.close();
  };

  const indirBlob = (ad, icerik, mime) => {
    const blob = new Blob([icerik], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = ad;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  };

  /* ---------- BİLDİRİM BADGE ---------- */
  const bildirimBadgeGuncelle = async () => {
    const el = document.getElementById('adminBildirimSayi');
    if (!el) return;
    try {
      const r = await API.bildirimler.okunmamis();
      const sayi = r.okunmamis || 0;
      if (sayi > 0) {
        el.textContent = sayi > 99 ? '99+' : String(sayi);
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    } catch { /* sessiz */ }
  };

  /* ---------- ADMIN BAR ---------- */
  const adminBarYukle = (aktif = '') => {
    const yer = document.getElementById('adminBar');
    if (!yer) return;
    const u = _kullanici;
    const sadeceAdmin = u && u.rol === 'admin';
    const kullaniciMenuAdi = sadeceAdmin ? 'Kullanıcılar' : 'Profilim';

    yer.outerHTML = `
      <header class="admin-bar">
        <div class="kapsayici-genis kapsayici">
          <div class="admin-bar__icerik">
            <a href="/admin/" class="admin-bar__logo">
              İlk Adım Akademi <span class="admin-bar__logo-rozet">Yönetim</span>
            </a>
            <nav class="admin-bar__menu" aria-label="Admin menü">
              <a href="/admin/" class="admin-bar__link${aktif === 'dashboard' ? ' aktif' : ''}">Panel</a>
              <a href="/admin/duyurular.html" class="admin-bar__link${aktif === 'duyurular' ? ' aktif' : ''}">Duyurular</a>
              <a href="/admin/programlar.html" class="admin-bar__link${aktif === 'programlar' ? ' aktif' : ''}">Programlar</a>
              <a href="/admin/kadro.html" class="admin-bar__link${aktif === 'kadro' ? ' aktif' : ''}">Kadro</a>
              <a href="/admin/galeri.html" class="admin-bar__link${aktif === 'galeri' ? ' aktif' : ''}">Galeri</a>
              <a href="/admin/formlar.html" class="admin-bar__link${aktif === 'formlar' ? ' aktif' : ''}">Formlar</a>
              <a href="/admin/cevaplar.html" class="admin-bar__link${aktif === 'cevaplar' ? ' aktif' : ''}">Cevaplar</a>
              <a href="/admin/blog.html" class="admin-bar__link${aktif === 'blog' ? ' aktif' : ''}">Blog</a>
              <a href="/admin/kullanicilar.html" class="admin-bar__link${aktif === 'kullanicilar' ? ' aktif' : ''}">${kullaniciMenuAdi}</a>
              <a href="/admin/ayarlar.html" class="admin-bar__link${aktif === 'ayarlar' ? ' aktif' : ''}">Ayarlar</a>
              <a href="/admin/yardim.html" class="admin-bar__link${aktif === 'yardim' ? ' aktif' : ''}" title="Kullanım Rehberi">Yardım</a>
            </nav>
            <div class="admin-bar__sag">
              <a href="/admin/bildirimler.html" class="admin-bar__bildirim${aktif === 'bildirimler' ? ' aktif' : ''}" aria-label="Bildirimler">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" aria-hidden="true">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                <span class="admin-bar__bildirim-sayi" id="adminBildirimSayi" hidden>0</span>
              </a>
              <a href="/index.html" class="admin-bar__site-link" target="_blank">Siteyi Aç ↗</a>
              <button type="button" class="admin-bar__cikis" id="adminCikis" title="${escHtml((u && u.adSoyad) || (u && u.kullaniciAdi) || 'Çıkış')}">Çıkış</button>
            </div>
          </div>
        </div>
      </header>
    `;
    document.getElementById('adminCikis')?.addEventListener('click', oturumKapat);
    bildirimBadgeGuncelle();
  };

  // Periyodik badge güncellemesi (her sayfada bir kez kurulsun)
  // Visibility-aware: sekme arka plandayken polling yapma; sekme tekrar
  // görünür olduğunda hemen tek bir güncelleme tetikle.
  if (typeof window !== 'undefined' && !window.__BILDIRIM_TIMER__) {
    window.__BILDIRIM_TIMER__ = setInterval(() => {
      if (document.visibilityState === 'visible') bildirimBadgeGuncelle();
    }, 60000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') bildirimBadgeGuncelle();
    });
  }

  /* ---------- DIŞA AKTAR ---------- */
  return {
    kullaniciAl, korumaliSayfaKapisi, oturumKapat,
    toast, panoyaKopyala,
    slugify, benzersizId, escHtml,
    bugunISO, tarihGoster,
    gorselSec, gorselOnizleme,
    cevaplariCsvIndir, cevaplariJsonIndir, cevaplariJsonlIndir, cevaplariPdfIndir,
    bildirimBadgeGuncelle,
    adminBarYukle,
    modalAc, modalKapa,
  };
})();
