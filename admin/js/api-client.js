/* ============================================================
   api-client.js — PHP backend ile konuşma katmanı
   Tüm admin sayfalarından kullanılır.
============================================================ */

const API = (() => {
  'use strict';

  const BASE = '/api';

  const istek = async (yol, opts = {}) => {
    const url = `${BASE}/${yol.replace(/^\/+/, '')}`;
    const config = {
      method: opts.method || 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        ...(opts.headers || {})
      }
    };
    if (opts.body !== undefined) {
      config.headers['Content-Type'] = 'application/json';
      config.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    }
    let r;
    try {
      r = await fetch(url, config);
    } catch (e) {
      throw new Error('Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.');
    }
    let veri = {};
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { veri = await r.json(); } catch {}
    }
    // auth/* (login, me) ve şifre-değiştir 401'leri 'yanlış şifre/oturum yok' gibi
    // beklenen ALAN hatalarıdır — bunları 'oturum doldu' diye yutup login'e atmayız.
    const yolNorm = yol.replace(/^\/+/, '');
    const oturumDoldu401 = !yolNorm.startsWith('auth/') && !yolNorm.includes('sifre-degistir');
    if (r.status === 401 && oturumDoldu401) {
      // Gerçek oturum sonlanması — sessiz başarısızlık (yazılan içerik kaybı) yerine
      // kullanıcıyı bir kez uyar ve giriş ekranına al.
      if (!window.__OTURUM_UYARISI__) {
        window.__OTURUM_UYARISI__ = true;
        alert('Oturum süreniz doldu. Güvenlik için tekrar giriş yapmanız gerekiyor.');
        location.href = '/admin/';
      }
      const err = new Error('Oturum süresi doldu.');
      err.status = 401;
      throw err;
    }
    if (!r.ok) {
      const err = new Error(veri.hata || `Hata (HTTP ${r.status})`);
      err.status = r.status;
      err.veri = veri;
      throw err;
    }
    return veri;
  };

  /* ---------- AUTH ---------- */
  const auth = {
    login: (kullaniciAdi, sifre) => istek('auth/login', { method: 'POST', body: { kullaniciAdi, sifre } }),
    logout: () => istek('auth/logout', { method: 'POST' }),
    me: () => istek('auth/me'),
  };

  /* ---------- AYARLAR ---------- */
  const ayarlar = {
    al: () => istek('ayarlar'),
    guncelle: (obj) => istek('ayarlar', { method: 'PUT', body: obj }),
  };

  /* ---------- DUYURULAR ---------- */
  const duyurular = {
    liste: (adminGoruntu = false) => istek('duyurular' + (adminGoruntu ? '?admin=1' : '')),
    al: (id) => istek(`duyurular/${encodeURIComponent(id)}`),
    olustur: (v) => istek('duyurular', { method: 'POST', body: v }),
    guncelle: (id, v) => istek(`duyurular/${encodeURIComponent(id)}`, { method: 'PUT', body: v }),
    sil: (id) => istek(`duyurular/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };

  /* ---------- PROGRAMLAR ---------- */
  const programlar = {
    liste: (adminGoruntu = false) => istek('programlar' + (adminGoruntu ? '?admin=1' : '')),
    al: (id) => istek(`programlar/${encodeURIComponent(id)}`),
    olustur: (v) => istek('programlar', { method: 'POST', body: v }),
    guncelle: (id, v) => istek(`programlar/${encodeURIComponent(id)}`, { method: 'PUT', body: v }),
    sil: (id) => istek(`programlar/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };

  /* ---------- KADRO ---------- */
  const kadro = {
    liste: (adminGoruntu = false) => istek('kadro' + (adminGoruntu ? '?admin=1' : '')),
    al: (id) => istek(`kadro/${encodeURIComponent(id)}`),
    olustur: (v) => istek('kadro', { method: 'POST', body: v }),
    guncelle: (id, v) => istek(`kadro/${encodeURIComponent(id)}`, { method: 'PUT', body: v }),
    sil: (id) => istek(`kadro/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };

  /* ---------- GALERİ ---------- */
  const galeri = {
    al: () => istek('galeri'),
    // Albümler
    albumEkle: (v) => istek('galeri/albumler', { method: 'POST', body: v }),
    albumGuncelle: (id, v) => istek(`galeri/albumler/${encodeURIComponent(id)}`, { method: 'PUT', body: v }),
    albumSil: (id) => istek(`galeri/albumler/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    // Görseller
    gorselEkle: (v) => istek('galeri/gorseller', { method: 'POST', body: v }),
    gorselGuncelle: (id, v) => istek(`galeri/gorseller/${encodeURIComponent(id)}`, { method: 'PUT', body: v }),
    gorselSil: (id) => istek(`galeri/gorseller/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  };

  /* ---------- FORMLAR ---------- */
  const formlar = {
    liste: (adminGoruntu = false) => istek('formlar' + (adminGoruntu ? '?admin=1' : '')),
    al: (id) => istek(`formlar/${encodeURIComponent(id)}`),
    olustur: (v) => istek('formlar', { method: 'POST', body: v }),
    guncelle: (id, v) => istek(`formlar/${encodeURIComponent(id)}`, { method: 'PUT', body: v }),
    sil: (id) => istek(`formlar/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    gonder: (id, veriler) => istek(`formlar/${encodeURIComponent(id)}/gonder`, { method: 'POST', body: { veriler } }),
  };

  /* ---------- CEVAPLAR ---------- */
  const cevaplar = {
    liste: (formId) => istek(`cevaplar?form=${encodeURIComponent(formId)}`),
    al: (id) => istek(`cevaplar/${encodeURIComponent(id)}`),
    sil: (id) => istek(`cevaplar/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    tumunuSil: (formId) => istek(`cevaplar?form=${encodeURIComponent(formId)}`, { method: 'DELETE' }),
  };

  /* ---------- BİLDİRİMLER ---------- */
  const bildirimler = {
    liste: () => istek('bildirimler'),
    okunmamis: () => istek('bildirimler/sayim'),
    okundu: (id) => istek(`bildirimler/${encodeURIComponent(id)}/okundu`, { method: 'PUT' }),
    tumuOkundu: () => istek('bildirimler/tumu-okundu', { method: 'PUT' }),
    sil: (id) => istek(`bildirimler/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    tumunuSil: () => istek('bildirimler', { method: 'DELETE' }),
  };

  /* ---------- BLOG ---------- */
  const blog = {
    listeAdmin: (sayfa = 1) => istek(`blog?admin=1&sayfa=${sayfa}`),
    listePublic: (sayfa = 1) => istek(`blog?sayfa=${sayfa}`),
    al: (slugYaId) => istek(`blog/${encodeURIComponent(slugYaId)}`),
    olustur: (veri) => istek('blog', { method: 'POST', body: veri }),
    guncelle: (id, veri) => istek(`blog/${encodeURIComponent(id)}`, { method: 'PUT', body: veri }),
    sil: (id) => istek(`blog/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    durumAl: () => istek('blog/durum'),
    durumDegistir: (aktif) => istek('blog/durum', { method: 'PUT', body: { aktif } }),
  };

  /* ---------- KULLANICILAR ---------- */
  const kullanicilar = {
    liste: () => istek('kullanicilar'),
    al: (id) => istek(`kullanicilar/${id}`),
    olustur: (v) => istek('kullanicilar', { method: 'POST', body: v }),
    guncelle: (id, v) => istek(`kullanicilar/${id}`, { method: 'PUT', body: v }),
    sil: (id) => istek(`kullanicilar/${id}`, { method: 'DELETE' }),
    sifreDegistir: (eskiSifre, yeniSifre) =>
      istek('kullanicilar/sifre-degistir', { method: 'POST', body: { eskiSifre, yeniSifre } }),
    profilGuncelle: (veri) =>
      istek('kullanicilar/profil', { method: 'PUT', body: veri }),
  };

  const moduller = {
    // Tüm modül durumlarını tek seferde getir
    tumDurumlar: () => istek('moduller'),
    // Tek modül durumu
    durumAl: (ad) => istek(`moduller/durum?ad=${encodeURIComponent(ad)}`),
    // Modül aç/kapa (auth)
    durumDegistir: (ad, aktif) =>
      istek('moduller/durum', { method: 'PUT', body: { ad, aktif: !!aktif } }),
  };

  return {
    istek, auth, ayarlar, duyurular, programlar, kadro,
    galeri, formlar, cevaplar, bildirimler, blog, kullanicilar, moduller,
  };
})();
