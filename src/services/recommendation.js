// Öneri motoru — Pro play prioScore, counter, sinerji bazlı şampiyon önerir

import championMeta from '../data/championMeta.json';

// Toplam oyun sayısı (prioScore hesabı için)
const TOTAL_GAMES = championMeta._meta?.totalGames || 1446;

// Ağırlık katsayıları — her kriterin toplam puana katkısı
const WEIGHTS = {
  prioScore: 5.0,     // Pro play önceliği — ANA FAKTÖR (ne kadar pick/ban ediliyor)
  winRate: 1.0,        // Kazanma oranı bonusu (confidence ile dampened)
  counter: 3.0,        // Rakibe karşı counter avantajı
  synergy: 2.0,        // Takımla uyum
  blindPick: 0.2,      // Blind pick güvenilirliği (minor)
};

// Minimum ROL-SPESİFİK seçilme eşiği — outlier'ları filtrele
// Bu role'de en az bu kadar kez seçilmiş olmalı
const MIN_ROLE_PICKS = 15;

// WR güven eşiği — bu pick sayısına ulaşınca WR tam güvenilir
const WR_CONFIDENCE_PICKS = 50;

/**
 * Bir şampiyonun belirli bir roldeki pick sayısını hesaplar
 * Önce rolePickCounts'a bakar (yeni format), yoksa pickRate'ten türetir
 */
function getRolePicks(champData, role) {
  // Yeni format: doğrudan rolePickCounts
  if (champData.rolePickCounts?.[role]) return champData.rolePickCounts[role];
  // Eski format: pickRate'ten türet
  const pickRate = champData.pickRate?.[role] || 0;
  return Math.round(pickRate / 100 * TOTAL_GAMES);
}

/**
 * Bir şampiyonun belirli bir roldeki prioScore'unu hesaplar
 * prioScore = (rolePicks + orantılı banlar) / totalGames * 100
 * Banlar, o rolde oynanma oranına göre dağıtılır
 */
function getRolePrioScore(champData, role) {
  // Yeni format 
  if (champData.rolePrioScore?.[role]) return champData.rolePrioScore[role];
  
  const rolePicks = getRolePicks(champData, role);
  const totalPicks = champData.proStats?.picks || 1;
  const totalBans = champData.proStats?.bans || 0;
  
  // Banları orantılı olarak role dağıt
  const proportionalBans = totalBans * (rolePicks / Math.max(totalPicks, 1));
  return (rolePicks + proportionalBans) / TOTAL_GAMES * 100;
}

/**
 * PrioScore'a dayalı etkin tier hesapla
 */
function getEffectiveTier(champData, role) {
  const prioScore = getRolePrioScore(champData, role);
  const wr = champData.winRate?.[role] || 0;
  const rolePicks = getRolePicks(champData, role);
  
  if (rolePicks < 10) return 'C';
  
  // PrioScore + WR bazlı tier
  if (prioScore >= 50 && wr >= 45) return 'S';
  if (prioScore >= 40 && wr >= 48) return 'S';
  if (prioScore >= 30 && wr >= 50) return 'S';
  if (prioScore >= 25 && wr >= 48) return 'A';
  if (prioScore >= 20 && wr >= 45) return 'A';
  if (prioScore >= 15 && wr >= 45) return 'B';
  if (prioScore >= 10) return 'B';
  return 'C';
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

    // ===== ROL-SPESİFİK Outlier filtresi =====
    // Bu rolde yeterince oynanmamış şampiyonları atla
    const rolePicks = getRolePicks(champData, selectedRole);
    if (rolePicks < MIN_ROLE_PICKS) continue;

    // Rol-spesifik prioScore
    const prioScore = getRolePrioScore(champData, selectedRole);

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

    // 3. PrioScore — pro play önceliği (0-10 arası normalize)
    const prioScoreNorm = Math.min(prioScore / 10, 10);

    // 4. Win rate bonusu — confidence ile dampened
    // Az oynanan şampiyonların WR'si şişirilmiş olabilir
    const wr = champData.winRate?.[selectedRole] || 50;
    const confidence = Math.min(rolePicks / WR_CONFIDENCE_PICKS, 1);
    const wrBonus = Math.max(0, Math.min((wr - 45) * 0.5, 10)) * confidence;

    // 5. Blind pick puanı (minor)
    const blindPickScore = (champData.blindPickSafety || 5) / 10; // 0-1 normalize

    // Ağırlıklı toplam puan
    const totalScore =
      prioScoreNorm * WEIGHTS.prioScore +
      wrBonus * WEIGHTS.winRate +
      counterScore * WEIGHTS.counter +
      synergyScore * WEIGHTS.synergy +
      blindPickScore * WEIGHTS.blindPick;

    const effectiveTier = getEffectiveTier(champData, selectedRole);
    const banRate = champData.banRate || 0;

    const reasons = buildReasons(
      champId, champData, effectiveTier,
      counterReasons, synergyReasons,
      enemyChampions, allyChampions, t, prioScore, rolePicks
    );

    results.push({
      id: champId,
      name: champData.name,
      roles: champData.roles,
      tier: effectiveTier,
      winRate: champData.winRate?.[selectedRole] || null,
      pickRate: champData.pickRate?.[selectedRole] || null,
      banRate: banRate,
      prioScore: +prioScore.toFixed(1),
      scores: {
        prioScore: +(prioScoreNorm * WEIGHTS.prioScore).toFixed(1),
        winRate: +(wrBonus * WEIGHTS.winRate).toFixed(1),
        counter: +(counterScore * WEIGHTS.counter).toFixed(1),
        synergy: +(synergyScore * WEIGHTS.synergy).toFixed(1),
        blindPick: +(blindPickScore * WEIGHTS.blindPick).toFixed(1),
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
function buildReasons(champId, champData, tier, counterReasons, synergyReasons, enemies, allies, t, prioScore, rolePicks) {
  const parts = [];

  // PrioScore bilgisi
  if (prioScore >= 50) {
    parts.push(`🔥 ${t ? t('reasonPermaBan') : 'Perma-ban seviyesi — çok güçlü'} (PrioScore: ${prioScore.toFixed(0)}%)`);
  } else if (prioScore >= 30) {
    parts.push(`🔥 ${t ? t('reasonHighBan') : 'Yüksek öncelik — meta tanımlayan'} (PrioScore: ${prioScore.toFixed(0)}%)`);
  } else {
    parts.push(`📊 PrioScore: ${prioScore.toFixed(0)}% (${rolePicks} pick)`);
  }

  // Tier bilgisi
  const tierNames = t
    ? { S: t('tierNameS'), A: t('tierNameA'), B: t('tierNameB'), C: t('tierNameC') }
    : { S: 'S-Tier (çok güçlü)', A: 'A-Tier (güçlü)', B: 'B-Tier (orta)', C: 'C-Tier (zayıf)' };
  parts.push(`📊 Meta: ${tierNames[tier] || tier}`);

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
      champs.push({
        id: champId,
        name: champData.name,
        tier: getEffectiveTier(champData, role),
        rolePicks: getRolePicks(champData, role),
      });
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
 * Blind pick tier listesi — prioScore + WR bazlı sırala
 */
export function getBlindPickTierList(role) {
  const champs = [];
  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (!champData.roles.includes(role)) continue;
    
    const rolePicks = getRolePicks(champData, role);
    if (rolePicks < MIN_ROLE_PICKS) continue;

    const prioScore = getRolePrioScore(champData, role);

    // Counter sayısını hesapla (kaç şampiyon bunu counter'lıyor)
    let counterCount = 0;
    for (const [, otherData] of Object.entries(championMeta)) {
      if (otherData.counters?.[champId]) counterCount++;
    }

    const wr = champData.winRate?.[role] || 50;
    const safety = champData.blindPickSafety || 5;
    // Blind pick skoru: prioScore ağırlıklı + WR + safety
    const blindScore = prioScore * 0.4 + (wr - 45) * 0.3 + safety * 0.2 + Math.max(0, 10 - counterCount) * 0.1;

    champs.push({
      id: champId,
      name: champData.name,
      winRate: wr,
      banRate: champData.banRate || 0,
      pickRate: champData.pickRate?.[role] || 0,
      prioScore: +prioScore.toFixed(1),
      rolePicks,
      blindPickSafety: safety,
      counterCount,
      blindScore: +blindScore.toFixed(2),
      tier: getEffectiveTier(champData, role),
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
