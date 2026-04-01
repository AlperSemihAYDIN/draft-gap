// Riot API frontend servisi — Vercel proxy üzerinden Riot API çağrıları

export const REGIONS = {
  tr: { platform: 'tr1', region: 'europe', label: 'Türkiye' },
  euw: { platform: 'euw1', region: 'europe', label: 'EU West' },
  eune: { platform: 'eun1', region: 'europe', label: 'EU Nordic & East' },
  na: { platform: 'na1', region: 'americas', label: 'North America' },
  kr: { platform: 'kr', region: 'asia', label: 'Korea' },
  jp: { platform: 'jp1', region: 'asia', label: 'Japan' },
  br: { platform: 'br1', region: 'americas', label: 'Brazil' },
  lan: { platform: 'la1', region: 'americas', label: 'LAN' },
  las: { platform: 'la2', region: 'americas', label: 'LAS' },
  oce: { platform: 'oc1', region: 'sea', label: 'Oceania' },
  ru: { platform: 'ru', region: 'europe', label: 'Russia' },
  ph: { platform: 'ph2', region: 'sea', label: 'Philippines' },
  sg: { platform: 'sg2', region: 'sea', label: 'Singapore' },
  vn: { platform: 'vn2', region: 'sea', label: 'Vietnam' },
};

/**
 * Riot ID ile hesap bilgisi al
 */
export async function getAccountByRiotId(gameName, tagLine, regionKey = 'tr') {
  const { region } = REGIONS[regionKey] || REGIONS.tr;
  const params = new URLSearchParams({ action: 'account', gameName, tagLine, region });
  const res = await fetch(`/api/riot?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Account not found (${res.status})`);
  }
  return res.json();
}

/**
 * Canlı oyun verisi al (oyuncu şu an maçtaysa)
 */
export async function getActiveGame(puuid, regionKey = 'tr') {
  const { platform } = REGIONS[regionKey] || REGIONS.tr;
  const params = new URLSearchParams({ action: 'spectator', puuid, platform });
  const res = await fetch(`/api/riot?${params}`);
  if (res.status === 404) return null; // Oyunda değil
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Spectator error (${res.status})`);
  }
  return res.json();
}

/**
 * Son maç geçmişi ID'lerini al
 */
export async function getMatchHistory(puuid, regionKey = 'tr', count = 10) {
  const { region } = REGIONS[regionKey] || REGIONS.tr;
  const params = new URLSearchParams({ action: 'matches', puuid, region, count: String(count) });
  const res = await fetch(`/api/riot?${params}`);
  if (!res.ok) return [];
  return res.json();
}
