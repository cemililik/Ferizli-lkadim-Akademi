# Google Maps Konumu

İletişim sayfasında **kurumunuzun konumunu gösteren harita** Google Maps'ten alınır. Buradan haritanın hangi konumu göstereceğini ayarlayabilirsiniz.

**Yer:** Üst menü → **Ayarlar** → "İletişim" bölümü → "Google Maps Embed URL"

## URL nasıl alınır?

<ol class="adim-listesi">
<li><strong>Google Maps</strong> sitesini açın: <a href="https://maps.google.com" target="_blank" rel="noopener">maps.google.com</a></li>
<li>Arama kutusuna kurumun adresini yazın. Örnek: <em>Kemalpaşa Mahallesi 112. Sokak Ferizli</em></li>
<li>Doğru yer bulununca, sol panelin altındaki <strong>Paylaş</strong> düğmesine basın.</li>
<li>Açılan pencerede <strong>"Harita yerleştirme" (Embed a map)</strong> sekmesine geçin.</li>
<li>Sağ üstte <strong>"HTML'i kopyala"</strong> düğmesi vardır. Buna basmadan önce, kutudaki <code>&lt;iframe ... src="..."&gt;</code> ifadesinin içindeki <strong>src="..."</strong> kısmının içeriğini kopyalayın.</li>
<li>Aldığınız URL şuna benzer:
<pre><code>https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3014.7...</code></pre>
</li>
<li>Bunu admin panelinde <strong>Google Maps Embed URL</strong> alanına yapıştırın.</li>
<li><strong>Değişiklikleri Kaydet</strong>'e basın.</li>
</ol>

## Alternatif: kısa form

Eğer "Embed" URL'ini bulamadıysanız, daha basit bir formatta da çalışır:

```
https://www.google.com/maps?q=Kemalpaşa+Mahallesi+112.+Sokak+Ferizli+Sakarya&output=embed
```

Buradaki `q=` parametresinin yanına adresinizi `+` işaretleriyle (boşluk yerine) yazabilirsiniz. Bu formatlardan biri haritayı gösterecektir.

## Güvenlik kontrolü

> [!UYARI]
> Sistem güvenlik nedeniyle yalnızca **`google.com`** alan adından gelen URL'leri kabul eder. Yandex Maps, Bing Maps, OpenStreetMap gibi farklı servisler şu anda desteklenmez. URL `https://` ile başlamalı ve `google.com` içermelidir.

Yanlış bir URL girerseniz iletişim sayfasında harita yerine "Harita yüklenemedi" yazısı görünür. Doğru URL'yi tekrar yapıştırın.

## Haritayı test etme

1. **Kaydet**'e basın.
2. **Siteyi Aç ↗** → İletişim sayfasını ziyaret edin.
3. Harita doğru konumu göstermeli; üzerinde **kurum işareti (pin)** olmalı.
4. Telefonda da test edin — haritada zoom/pan çalışıyor mu?

## Sık sorulan sorular

**Harita yüklenmiyor**
- URL `https://www.google.com/...` ile başlıyor mu?
- URL'in baş veya sonunda fazladan boşluk var mı?
- Tarayıcınız "üçüncü taraf içerik"i engelliyor olabilir; gizli sekmede test edin.

**Harita yanlış yeri gösteriyor**
- Google Maps'te kurumun adresini ararken doğru pin'i seçtiniz mi?
- Bazen "yakındaki" işletmeler gösterilir; pin'i kontrol edin.

**Haritayı tamamen kaldırmak istiyorum**
- URL alanını boş bırakın ve kaydedin. Harita yerine boş alan kalır.
- Daha temiz bir görünüm için kurumun teknik sorumlusundan iletişim sayfasından harita bölümünü kaldırmasını isteyebilirsiniz.
