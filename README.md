# LoL Draft Asistanı

League of Legends için akıllı draft asistanı. Rakip takımın şampiyonlarına, takım arkadaşlarınıza ve seçtiğiniz role göre en iyi 5 şampiyonu önerir.

## Özellikler

- **Counter Analizi**: Rakip şampiyonlara karşı en etkili pick'leri belirler
- **Takım Sinerjisi**: Takım arkadaşlarınızla uyumlu şampiyonları önerir
- **Meta Gücü**: Güncel tier list verisiyle güçlü şampiyonları öne çıkarır
- **Blind Pick Güvenilirliği**: Counter alınma riskini değerlendirir
- **Şampiyon Görselleri**: Riot Games Data Dragon API'sinden otomatik çekilir
- **Otomatik Tamamlama**: Şampiyon ara ve hızlıca seç
- **Responsive Tasarım**: Mobil ve masaüstünde çalışır
- **Koyu Tema**: Gaming estetiğine uygun modern arayüz

## Teknolojiler

- React 18
- Tailwind CSS 3
- Vite 6
- Riot Games Data Dragon API

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18 veya üstü)
- npm (Node.js ile birlikte gelir)

### Adımlar

```bash
# 1. Proje dizinine git
cd lol-draft-assistant

# 2. Bağımlılıkları kur
npm install

# 3. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcınızda `http://localhost:3000` adresine gidin.

### Production Build

```bash
# Optimize edilmiş build oluştur
npm run build

# Build önizlemesi
npm run preview
```

## Kullanım

1. **Rol Seç**: Oynamak istediğin rolü seç (Top, Jungle, Mid, ADC, Support)
2. **Rakipleri Gir**: Rakip takımın seçtiği şampiyonları (1-5 arası) arama kutusundan seç
3. **Takımını Gir** (opsiyonel): Kendi takımındaki şampiyonları gir
4. **Öneri Al**: "Şampiyon Öner" butonuna tıkla
5. **Sonuçları İncele**: Önerilen 5 şampiyon, puan detayları ve açıklamalarıyla birlikte gösterilir

## Proje Yapısı

```
lol-draft-assistant/
├── index.html              # HTML giriş dosyası
├── package.json            # Proje bağımlılıkları
├── vite.config.js          # Vite yapılandırması
├── tailwind.config.js      # Tailwind CSS yapılandırması
├── postcss.config.js       # PostCSS yapılandırması
├── README.md               # Bu dosya
├── public/
│   └── favicon.svg         # Site ikonu
└── src/
    ├── main.jsx            # React giriş noktası
    ├── App.jsx             # Ana uygulama bileşeni
    ├── index.css           # Global stiller + Tailwind
    ├── components/
    │   ├── ChampionSearch.jsx      # Otomatik tamamlamalı arama
    │   ├── RoleSelector.jsx        # Rol seçim butonları
    │   ├── SelectedChampions.jsx   # Seçilmiş şampiyon chip'leri
    │   ├── RecommendationCard.jsx  # Öneri kartı
    │   └── ResultsPage.jsx         # Sonuçlar sayfası
    ├── data/
    │   └── championMeta.json       # Statik counter/sinerji/meta verisi
    └── services/
        ├── dataDragon.js           # Data Dragon API servisi
        └── recommendation.js       # Öneri algoritması
```

## Öneri Algoritması

Her aday şampiyon için 4 kriter ağırlıklı olarak hesaplanır:

| Kriter | Ağırlık | Açıklama |
|--------|---------|----------|
| Counter | 3.0x | Rakip şampiyonlara karşı kazanma oranı avantajı |
| Sinerji | 2.0x | Takım arkadaşlarıyla uyum bonusu |
| Meta | 1.5x | Güncel tier list gücü (S/A/B/C) |
| Blind Pick | 1.0x | Counter alınma riski düşüklüğü |

## Notlar

- Şampiyon görselleri Riot Games Data Dragon API'sinden çekilir (API key gerektirmez)
- Counter ve sinerji verileri statik JSON dosyasından gelir
- Bu proje Riot Games ile resmi bir bağlantıya sahip değildir

## Lisans

MIT
