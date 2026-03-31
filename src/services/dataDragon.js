// Data Dragon API servisi — Riot Games'in ücretsiz CDN'inden şampiyon verisi çeker

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

// Önbellekleme için modül seviyesinde değişkenler
let cachedVersion = null;
let cachedChampions = null;

/**
 * Güncel oyun versiyonunu çeker (örn: "14.10.1")
 */
export async function getLatestVersion() {
  if (cachedVersion) return cachedVersion;

  const res = await fetch(`${DDRAGON_BASE}/api/versions.json`);
  const versions = await res.json();
  cachedVersion = versions[0]; // İlk eleman en güncel versiyon
  return cachedVersion;
}

/**
 * Tüm şampiyonların listesini Türkçe lokalizasyonla çeker
 * @returns {Object} - { championId: { id, key, name, title, image } }
 */
export async function getChampions() {
  if (cachedChampions) return cachedChampions;

  const version = await getLatestVersion();
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${version}/data/tr_TR/champion.json`
  );
  const data = await res.json();

  // Şampiyon verisini düzenle ve önbelleğe al
  cachedChampions = {};
  for (const [key, champ] of Object.entries(data.data)) {
    cachedChampions[key] = {
      id: champ.id,
      key: champ.key,
      name: champ.name,
      title: champ.title,
      image: champ.image.full,
    };
  }

  return cachedChampions;
}

/**
 * Şampiyon kare ikonunun URL'sini döndürür
 */
export async function getChampionImageUrl(championId) {
  const version = await getLatestVersion();
  return `${DDRAGON_BASE}/cdn/${version}/img/champion/${championId}.png`;
}

/**
 * Şampiyon splash art (loading screen) URL'sini döndürür
 */
export function getSplashUrl(championId) {
  return `${DDRAGON_BASE}/cdn/img/champion/splash/${championId}_0.jpg`;
}

/**
 * Versiyon bazlı şampiyon ikonu URL'si (senkron — version biliniyorsa)
 */
export function getChampionIconUrl(version, championId) {
  return `${DDRAGON_BASE}/cdn/${version}/img/champion/${championId}.png`;
}
