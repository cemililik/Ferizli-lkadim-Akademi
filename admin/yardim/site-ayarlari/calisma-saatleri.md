# Çalışma Saatleri

Kurumunuzun haftalık çalışma saatleri **iletişim sayfasında bir tablo** ve **footer'da kısa özet** olarak gösterilir.

**Yer:** Üst menü → **Ayarlar** → "Çalışma Saatleri" bölümü

## Her gün için ayrı alan

Pazartesi'den Pazar'a kadar her gün için ayrı bir metin alanı vardır. Buraya **kendi sözcüklerinizle** çalışma saatlerini yazabilirsiniz:

| Örnek değer | Açıklama |
|---|---|
| `09:00 – 21:00` | Standart saat aralığı |
| `Kapalı` | O gün kapalıyız |
| `10:00 – 19:30 (Deneme günü)` | Açıklama ekleyebilirsiniz |
| `09:00 – 13:00 / 14:00 – 18:00` | Öğle arası varsa |

## Örnek doluş

| Gün | Değer |
|---|---|
| Pazartesi | `Kapalı` |
| Salı | `09:00 – 21:00` |
| Çarşamba | `09:00 – 21:00` |
| Perşembe | `09:00 – 21:00` |
| Cuma | `10:00 – 19:30 (Deneme günü)` |
| Cumartesi | `09:00 – 18:30` |
| Pazar | `09:00 – 18:30` |

## Nasıl gözükür?

**İletişim sayfasında** — tam tablo (7 satır).

**Footer'da** — kısa özet:
```
Pzt: Kapalı
Salı–Per: 09:00 – 21:00
Cuma: 10:00 – 19:30
Cmt–Pzr: 09:00 – 18:30
```

Footer otomatik olarak hafta içi/hafta sonu özetler.

## Bayram / özel günler

Yarıyıl tatili, kandil, milli bayram gibi geçici değişiklikler için iki yöntem:

1. **Çalışma saatini geçici değiştirin** — örneğin Cuma için `10:00 – 14:00 (Kandil)` yazın. Sonra normal değere geri çevirin.

2. **Duyuru olarak yayınlayın** — Duyurular bölümünden "23 Nisan tatili nedeniyle 23 Nisan'da kapalıyız" gibi bir duyuru ekleyin. Bu daha esnektir.

> [!İPUCU]
> Sürekli güncellemekle uğraşmamak için: Çalışma saatleri tablosunu **yıllık standart** olarak tutun, geçici tatilleri duyuru olarak girin.

## Kaydetme

Tüm günleri doldurduktan sonra **Değişiklikleri Kaydet**'e basın. Değişiklikler **anında** iletişim sayfasında ve footer'da görünür.

## Sık karşılaşılan durumlar

**Salı'dan Perşembe'ye kadar aynı saatler**
Her gün için aynı saati yazmanız gerekir; sistem otomatik birleştirme yapmaz.

**O gün çalışmıyoruz**
`Kapalı` yazın (büyük harfle başlasın).

**Birden çok saat aralığı var**
`09:00 – 12:00 / 14:00 – 18:00` gibi yazabilirsiniz. Görsel olarak okunaklı olur.
