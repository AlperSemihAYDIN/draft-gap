// Öneri motoru — Counter, sinerji, meta ve blind pick analizine göre şampiyon önerir

import championMeta from '../data/championMeta.json';

// Tier puanları — tier ne kadar yüksekse o kadar iyi
const TIER_SCORES = { S: 10, A: 7, B: 4, C: 2 };

// Ağırlık katsayıları — her kriterin toplam puana katkısı
const WEIGHTS = {
  counter: 3.0,   // Rakibe karşı counter avantajı
  synergy: 2.0,   // Takımla uyum
  meta: 1.5,      // Güncel meta gücü
  blindPick: 1.0, // Blind pick güvenilirliği
};

/**
 * Rakip takıma, takıma ve seçilen role göre en iyi 5 şampiyonu önerir
 *
 * @param {string[]} enemyChampions - Rakip şampiyon ID'leri (1-5 arası)
 * @param {string[]} allyChampions  - Takımdaki şampiyon ID'leri (0-4 arası)
 * @param {string} selectedRole     - Seçilen rol (top, jungle, mid, adc, support)
 * @returns {Array} - En iyi 5 şampiyon önerisi, puan detaylarıyla
 */
export function getRecommendations(enemyChampions, allyChampions, selectedRole) {
  const results = [];

  // Meta verisindeki tüm şampiyonları tara (_meta hariç)
  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;

    // Seçilen rolde oynayabilen şampiyonları filtrele
    if (!champData.roles.includes(selectedRole)) continue;

    // Zaten seçilmiş şampiyonları hariç tut (takım ve rakip)
    if (enemyChampions.includes(champId) || allyChampions.includes(champId)) continue;

    // --- PUAN HESAPLAMA ---

    // 1. Counter puanı: Bu şampiyon rakip şampiyonlara karşı ne kadar iyi?
    let counterScore = 0;
    let counterReasons = [];
    for (const enemyId of enemyChampions) {
      if (champData.counters && champData.counters[enemyId]) {
        const bonus = champData.counters[enemyId];
        counterScore += bonus;
        counterReasons.push(`${enemyId}'e karşı güçlü (+${bonus})`);
      }
    }
    // Rakip sayısına göre normalize et
    if (enemyChampions.length > 0) {
      counterScore = counterScore / enemyChampions.length * enemyChampions.length;
    }

    // 2. Sinerji puanı: Bu şampiyon takımla ne kadar uyumlu?
    let synergyScore = 0;
    let synergyReasons = [];
    for (const allyId of allyChampions) {
      if (champData.synergies && champData.synergies[allyId]) {
        const bonus = champData.synergies[allyId];
        synergyScore += bonus;
        synergyReasons.push(`${allyId} ile sinerji (+${bonus})`);
      }
    }

    // 3. Meta puanı: Bu şampiyon güncel meta'da ne kadar güçlü?
    const tierForRole = champData.tier[selectedRole] || 'C';
    const metaScore = TIER_SCORES[tierForRole] || 2;

    // 4. Blind pick puanı: Rakip bilinmediğinde ne kadar güvenli?
    const blindPickScore = champData.blindPickSafety || 5;

    // Ağırlıklı toplam puan hesapla
    const totalScore =
      counterScore * WEIGHTS.counter +
      synergyScore * WEIGHTS.synergy +
      metaScore * WEIGHTS.meta +
      blindPickScore * WEIGHTS.blindPick;

    // Öneri açıklaması oluştur
    const reasons = buildReasons(
      champId,
      champData,
      tierForRole,
      counterReasons,
      synergyReasons,
      enemyChampions,
      allyChampions
    );

    results.push({
      id: champId,
      name: champData.name,
      roles: champData.roles,
      tier: tierForRole,
      winRate: champData.winRate?.[selectedRole] || null,
      pickRate: champData.pickRate?.[selectedRole] || null,
      scores: {
        counter: +(counterScore * WEIGHTS.counter).toFixed(1),
        synergy: +(synergyScore * WEIGHTS.synergy).toFixed(1),
        meta: +(metaScore * WEIGHTS.meta).toFixed(1),
        blindPick: +(blindPickScore * WEIGHTS.blindPick).toFixed(1),
        total: +totalScore.toFixed(1),
      },
      reasons,
      description: champData.description,
    });
  }

  // Toplam puana göre sırala ve en iyi 5'i döndür
  results.sort((a, b) => b.scores.total - a.scores.total);
  return results.slice(0, 5);
}

/**
 * Şampiyon için Türkçe öneri açıklaması oluşturur
 */
function buildReasons(champId, champData, tier, counterReasons, synergyReasons, enemies, allies) {
  const parts = [];

  // Tier bilgisi
  const tierNames = { S: 'S-Tier (çok güçlü)', A: 'A-Tier (güçlü)', B: 'B-Tier (orta)', C: 'C-Tier (zayıf)' };
  parts.push(`📊 Meta: ${tierNames[tier] || tier}`);

  // Counter açıklamaları
  if (counterReasons.length > 0) {
    parts.push(`⚔️ Counter: ${counterReasons.join(', ')}`);
  } else if (enemies.length > 0) {
    parts.push('⚔️ Rakiplere karşı nötr matchup');
  }

  // Sinerji açıklamaları
  if (synergyReasons.length > 0) {
    parts.push(`🤝 Sinerji: ${synergyReasons.join(', ')}`);
  } else if (allies.length > 0) {
    parts.push('🤝 Takımla standart uyum');
  }

  // Blind pick güvenilirliği
  if (champData.blindPickSafety >= 8) {
    parts.push('🛡️ Blind pick için çok güvenli');
  } else if (champData.blindPickSafety >= 6) {
    parts.push('🛡️ Blind pick için güvenli');
  } else {
    parts.push('⚠️ Counter alınma riski var');
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
