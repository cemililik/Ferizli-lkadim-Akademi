# Düzenleme ve Sıralama

## Mevcut öğretmen kartını düzenleme

<ol class="adim-listesi">
<li><strong>Kadro</strong> sayfasında ilgili öğretmen kartına tıklayın.</li>
<li>Sağ panelde tüm alanlar açılır.</li>
<li>İstediğiniz alanı değiştirin (fotoğraf dahil).</li>
<li><strong>Kaydet</strong>'e basın.</li>
</ol>

## Fotoğrafı değiştirme

1. Öğretmen kartını açın.
2. Mevcut fotoğrafın altındaki **Fotoğrafı Değiştir** veya **Görsel Seç** düğmesine basın.
3. Yeni fotoğrafı seçin → otomatik yüklenir.
4. **Kaydet**'e basın.

Eski fotoğraf otomatik silinir, yeri yeni dosyaya verilir.

## Yayından kaldırma

Bir öğretmenin kartını sitede gizlemek (örneğin kurumdan ayrıldığında ama kayıt tutmak istediğinizde):

1. Kartı açın.
2. **Yayında** kutusunu işaretsiz yapın.
3. **Kaydet**.

Kart sitede görünmez ama admin'de görünür. İleride gerekirse yine yayınlayabilirsiniz.

## Sıralama

Kadro listesinde sıra **kart-üzeri ok düğmeleriyle** değiştirilir:

- **↑** — bir üst sıraya
- **↓** — bir alt sıraya

Sıralama **anında** kaydedilir. Genelde:

```mermaid
flowchart TD
  A[Müdür / Kurum Yetkilisi] --> B[Müdür Yardımcıları]
  B --> C[Branş Öğretmenleri<br/>(kıdem veya isim sırası)]
```

## Silme

Bir öğretmen kartını **tamamen silmek**:

1. Kartı açın.
2. Kırmızı **Sil** düğmesine basın.
3. Onaylayın.

> [!TEHLIKE]
> Silme geri alınamaz. Veda ediyorsanız bile fotoğraf+bilgileri arşivde kalsın diye silmek yerine **yayından kaldırmayı** tercih edebilirsiniz.

## Sık karşılaşılan sorular

**Fotoğraf yüklemiyor**
- Dosya boyutu 5 MB'den küçük olmalı.
- Yüklenebilir formatlar: JPG, PNG, WebP, GIF.
- Bkz. [Görsel İpuçları](#/ipuclari/gorsel-ipuclari).

**Öğretmenin pozisyonu değişti**
"Unvan / Branş" alanını güncelleyip kaydedin. Yeni pozisyonu yansıtılır.

**Aynı isimle iki kart oluştu**
Sadece birini düzenleyin, diğerini silin. Aynı isimle iki kart sitede tuhaf görünür.
