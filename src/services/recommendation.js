// Öneri motoru — Counter, sinerji, meta, ban önceliği ve blind pick analizine göre şampiyon önerir

import championMeta from '../data/championMeta.json';

// Tier puanları — tier ne kadar yüksekse o kadar iyi
const TIER_SCORES = { S: 10, A: 7, B: 4, C: 2 };

// Ağırlık katsayıları — her kriterin toplam puana katkısı
const WEIGHTS = {
  counter: 3.0,      // Rakibe karşı counter avantajı
  synergy: 2.0,      // Takımla uyum
  meta: 2.0,         // Güncel meta gücü (tier + WR)
  blindPick: 1.0,    // Blind pick güvenilirliği
  banPriority: 1.5,  // Ban önceliği — çok banlanan = çok güçlü
};

// Minimum seçilme eşiği — outlier'ları filtrele
const MIN_PICKS_THRESHOLD = 8;

/**
 * Gerçek verilere dayanarak etkin tier hesapla
 * Stored tier yanlış olabilir, ban rate ve WR'ye göre override et
 */
function getEffectiveTier(champData, role) {
  const storedTier = champData.tier?.[role] || 'C';
  const wr = champData.winRate?.[role] || 0;
  const banRate = champData.banRate || 0;
  const presence = champData.presence || 0;
  const picks = champData.proStats?.picks || 0;

  if (picks < 5) return storedTier;

  // Ban rate + WR combo = gerçek güç göstergesi
  if (banRate >= 25 && wr >= 48) return 'S';
  if (banRate >= 15 && wr >= 52) return 'S';
  if (presence >= 50 && wr >= 48) return 'S';
  if (presence >= 40 && wr >= 50) return 'S';
  if (banRate >= 10 && wr >= 50) return 'A';
  if (presence >= 25 && wr >= 48) return 'A';
  if (presence >= 15 && wr >= 45) return Math.min(storedTier === 'C' ? 'B' : storedTier, 'B') === storedTier ? storedTier : 'B';

  return storedTier;
}

/**
 * Rakip takıma, takıma ve seçilen role göre en iyi 5 şampiyonu önerir
 */
export function getRecommendations(enemyChampions, allyChampions, selectedRole, t, options = {}) {
  const results = [];
  const { fearless = false, bannedChamps = [] } = options;

  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (!champData.roles.includes(selectedRole)) continue;
    if (enemyChampions.includes(champId) || allyChampions.includes(champId)) continue;

    // Fearless: daha önce seçilmiş şampiyonları hariç tut
    if (fearless && bannedChamps.includes(champId)) continue;

    // Outlier filtresi — çok az seçilen şampiyonları görmezden gel
    const rolePicks = champData.proStats?.picks || 0;
    const banRate = champData.banRate || 0;
    if (rolePicks < MIN_PICKS_THRESHOLD && banRate < 10) continue;

    // --- PUAN HESAPLAMA ---

    // 1. Counter puanı
    let counterScore = 0;
    let counterReasons = [];
    for (const enemyId of enemyChampions) {
      if (champData.counters?.[enemyId]) {
        const bonus = champData.counters[enemyId];
        counterScore += bonus;
        counterReasons.push(`${enemyId} ${t ? t('reasonCounterStrong') : "'e karşı güçlü"} (+${bonus})`);
      }
    }

    // 2. Sinerji puanı
    let synergyScore = 0;
    let synergyReasons = [];
    for (const allyId of allyChampions) {
      if (champData.synergies?.[allyId]) {
        const bonus = champData.synergies[allyId];
        synergyScore += bonus;
        synergyReasons.push(`${allyId} ${t ? t('reasonSynergy') : 'ile sinerji'} (+${bonus})`);
      }
    }

    // 3. Meta puanı — etkin tier + WR bonusu
    const effectiveTier = getEffectiveTier(champData, selectedRole);
    const baseMeta = TIER_SCORES[effectiveTier] || 2;
    const wrBonus = ((champData.winRate?.[selectedRole] || 50) - 50) * 0.1; // WR farkı bonus
    const metaScore = Math.max(baseMeta + wrBonus, 1);

    // 4. Blind pick puanı
    const blindPickScore = champData.blindPickSafety || 5;

    // 5. Ban önceliği — çok banlanan şampiyonlar çok güçlü
    // İlk ban aşaması (yüksek ban rate) ekstra değerli
    const banPriorityScore = Math.min((banRate / 4), 10);

    // Ağırlıklı toplam puan
    const totalScore =
      counterScore * WEIGHTS.counter +
      synergyScore * WEIGHTS.synergy +
      metaScore * WEIGHTS.meta +
      blindPickScore * WEIGHTS.blindPick +
      banPriorityScore * WEIGHTS.banPriority;

    const reasons = buildReasons(
      champId, champData, effectiveTier,
      counterReasons, synergyReasons,
      enemyChampions, allyChampions, t, banRate
    );

    results.push({
      id: champId,
      name: champData.name,
      roles: champData.roles,
      tier: effectiveTier,
      winRate: champData.winRate?.[selectedRole] || null,
      pickRate: champData.pickRate?.[selectedRole] || null,
      banRate: banRate,
      scores: {
        counter: +(counterScore * WEIGHTS.counter).toFixed(1),
        synergy: +(synergyScore * WEIGHTS.synergy).toFixed(1),
        meta: +(metaScore * WEIGHTS.meta).toFixed(1),
        blindPick: +(blindPickScore * WEIGHTS.blindPick).toFixed(1),
        banPriority: +(banPriorityScore * WEIGHTS.banPriority).toFixed(1),
        total: +totalScore.toFixed(1),
      },
      reasons,
      description: champData.description,
    });
  }

  results.sort((a, b) => b.scores.total - a.scores.total);
  return results.slice(0, 5);
}

/**
 * Şampiyon için öneri açıklaması oluşturur
 */
function buildReasons(champId, champData, tier, counterReasons, synergyReasons, enemies, allies, t, banRate) {
  const parts = [];

  // Tier bilgisi
  const tierNames = t
    ? { S: t('tierNameS'), A: t('tierNameA'), B: t('tierNameB'), C: t('tierNameC') }
    : { S: 'S-Tier (çok güçlü)', A: 'A-Tier (güçlü)', B: 'B-Tier (orta)', C: 'C-Tier (zayıf)' };
  parts.push(`📊 Meta: ${tierNames[tier] || tier}`);

  // Ban önceliği
  if (banRate >= 25) {
    parts.push(`🚫 ${t ? t('reasonPermaBan') : 'Perma-ban seviyesi — çok güçlü'}`);
  } else if (banRate >= 15) {
    parts.push(`🚫 ${t ? t('reasonHighBan') : 'Yüksek ban oranı — meta tanımlayan'}`);
  }

  // Counter açıklamaları
  if (counterReasons.length > 0) {
    parts.push(`⚔️ Counter: ${counterReasons.join(', ')}`);
  } else if (enemies.length > 0) {
    parts.push(`⚔️ ${t ? t('reasonCounterNeutral') : 'Rakiplere karşı nötr matchup'}`);
  }

  // Sinerji açıklamaları
  if (synergyReasons.length > 0) {
    parts.push(`🤝 ${t ? t('synergy') : 'Sinerji'}: ${synergyReasons.join(', ')}`);
  } else if (allies.length > 0) {
    parts.push(`🤝 ${t ? t('reasonSynergyStandard') : 'Takımla standart uyum'}`);
  }

  // Blind pick güvenilirliği
  if (champData.blindPickSafety >= 8) {
    parts.push(`🛡️ ${t ? t('reasonBlindSafe') : 'Blind pick için çok güvenli'}`);
  } else if (champData.blindPickSafety >= 6) {
    parts.push(`🛡️ ${t ? t('reasonBlindOk') : 'Blind pick için güvenli'}`);
  } else {
    parts.push(`⚠️ ${t ? t('reasonBlindRisky') : 'Counter alınma riski var'}`);
  }

  return parts;
}

/**
 * Belirli bir roldeki tüm şampiyonları döndürür (dropdown/liste için)
 */
export function getChampionsByRole(role) {
  const champs = [];
  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (champData.roles.includes(role)) {
      champs.push({ id: champId, name: champData.name, tier: champData.tier[role] });
    }
  }
  return champs.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Belirli bir şampiyona karşı counter'ları döndürür
 */
export function getCountersFor(targetChampId, role) {
  const counters = [];
  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta' || champId === targetChampId) continue;
    if (role && !champData.roles.includes(role)) continue;
    if (champData.counters?.[targetChampId]) {
      counters.push({
        id: champId,
        name: champData.name,
        score: champData.counters[targetChampId],
        winRate: champData.winRate?.[role] || null,
        tier: champData.tier?.[role] || 'C',
        banRate: champData.banRate || 0,
      });
    }
  }
  counters.sort((a, b) => b.score - a.score);
  return counters;
}

/**
 * Belirli bir şampiyonun counter olduğu şampiyonları döndürür (kimleri yener)
 */
export function getCounteredBy(champId, role) {
  const champData = championMeta[champId];
  if (!champData?.counters) return [];
  const results = [];
  for (const [enemyId, score] of Object.entries(champData.counters)) {
    const enemyData = championMeta[enemyId];
    if (!enemyData) continue;
    if (role && !enemyData.roles.includes(role)) continue;
    results.push({
      id: enemyId,
      name: enemyData.name,
      score,
      tier: enemyData.tier?.[role] || 'C',
    });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

/**
 * Blind pick tier listesi — banRate, WR ve counter sayısına göre sırala
 */
export function getBlindPickTierList(role) {
  const champs = [];
  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (!champData.roles.includes(role)) continue;
    
    const picks = champData.proStats?.picks || 0;
    const banRate = champData.banRate || 0;
    if (picks < MIN_PICKS_THRESHOLD && banRate < 10) continue;

    // Counter sayısını hesapla (kaç şampiyon bunu counter'lıyor)
    let counterCount = 0;
    for (const [, otherData] of Object.entries(championMeta)) {
      if (otherData.counters?.[champId]) counterCount++;
    }

    const wr = champData.winRate?.[role] || 50;
    const safety = champData.blindPickSafety || 5;
    // Blind pick skoru: yüksek WR + yüksek safety + düşük counter sayısı + yüksek ban (güçlü)
    const blindScore = (wr - 45) * 0.3 + safety * 0.4 + Math.max(0, 10 - counterCount) * 0.15 + Math.min(banRate / 3, 5) * 0.15;

    champs.push({
      id: champId,
      name: champData.name,
      winRate: wr,
      banRate,
      pickRate: champData.pickRate?.[role] || 0,
      blindPickSafety: safety,
      counterCount,
      blindScore: +blindScore.toFixed(2),
      tier: champData.tier?.[role] || 'C',
      description: champData.description,
    });
  }
  champs.sort((a, b) => b.blindScore - a.blindScore);
  return champs;
}

/**
 * Tüm şampiyonları döndürür (arama için)
 */
export function getAllChampions() {
  const champs = [];
  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    champs.push({
      id: champId,
      name: champData.name,
      roles: champData.roles,
      banRate: champData.banRate || 0,
    });
  }
  return champs;
}
