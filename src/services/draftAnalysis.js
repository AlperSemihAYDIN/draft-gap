import championMeta from '../data/championMeta.json';

// ============================================
// DRAFT ANALYSIS ENGINE - Sofistike Scoring
// ============================================

// Meta güçü hesapla (0-20)
function getMetaScore(champId) {
  const champ = championMeta[champId];
  if (!champ) return 0;

  const presence = champ.presence || 0;
  const wr = champ.winRate || 50;

  // Perma-ban seviyeleri = highest meta score
  if (presence >= 60 && wr >= 50) return 20;
  if (presence >= 50 && wr >= 49) return 18;
  if (presence >= 40 && wr >= 48) return 16;
  if (presence >= 30 && wr >= 48) return 14;
  if (presence >= 20 && wr >= 47) return 12;
  if (presence >= 10 && wr >= 46) return 8;
  return Math.max(0, (wr - 45) / 2);
}

// Counter value (rakip team'e karşı) - (-15 to +20)
function getCounterScore(champId, enemyChampIds) {
  const champ = championMeta[champId];
  if (!champ) return 0;

  let totalScore = 0;
  for (const enemy of enemyChampIds) {
    const matchupKey = `${champId}_vs_${enemy}`;
    const counterMatchup = champ.counters?.[enemy] || 0;
    totalScore += counterMatchup;
  }

  // Normalize
  const avgCounter = enemyChampIds.length > 0 ? totalScore / enemyChampIds.length : 0;
  return Math.max(-15, Math.min(20, avgCounter));
}

// Synergy score (ally team'e) - (-10 to +15)
function getSynergyScore(champId, allyChampIds) {
  const champ = championMeta[champId];
  if (!champ) return 0;

  let totalScore = 0;
  for (const ally of allyChampIds) {
    const synergyKey = `${champId}_with_${ally}`;
    const allyMatch = champ.synergies?.[ally] || 0;
    totalScore += allyMatch;
  }

  const avgSynergy = allyChampIds.length > 0 ? totalScore / allyChampIds.length : 0;
  return Math.max(-10, Math.min(15, avgSynergy));
}

// Lane matchup gücü - (0-15)
function getLaneScore(champId, role, enemyRole, enemyChampId) {
  const champ = championMeta[champId];
  if (!champ) return 7; // neutral

  // Rol uygunluğu
  if (!champ.roles.includes(role)) return 2; // off-role ceza

  // Counter matchup vektoru
  const counter = champ.counters?.[`${enemyChampId}_vs_${champId}`] || 0;
  const baseScore = 7 + (counter / 2);

  return Math.max(0, Math.min(15, baseScore));
}

// Carry potansiyeli - (0-15)
function getCarryScore(champId, role) {
  const champ = championMeta[champId];
  if (!champ) return 5;

  // High carry roles
  const carryRoles = { mid: 1.3, adc: 1.2, top: 1.1, jungle: 1.0, support: 0.5 };
  const roleMulti = carryRoles[role] || 1.0;

  // Pick rate = how often played = carry potential indicator
  const pickRate = champ.pickRate?.[role] || champ.pickRate || 10;
  const wr = champ.winRate || 50;

  // High WR + high PR = reliable carry
  if (wr >= 54 && pickRate >= 15) return 15;
  if (wr >= 52 && pickRate >= 10) return 12;
  if (wr >= 50 && pickRate >= 8) return 10;
  if (wr >= 48) return 8;
  return 5;
}

// Scaling - (0-12)
function getScalingScore(champId) {
  const champ = championMeta[champId];
  if (!champ) return 5;

  // Scaling heuristic: high WR in late game champions tend to scale
  // Professionals pick them late = good scaling indicator
  const presence = champ.presence || 0;

  // Perma picked = scales well
  if (presence >= 50) return 12;
  if (presence >= 35) return 10;
  if (presence >= 20) return 8;
  return 5;
}

// Objective control (CC, engage tools) - (0-10)
function getObjectiveScore(champId) {
  const champ = championMeta[champId];
  if (!champ) return 5;

  // Use ban rate as proxy - contested picks have utility
  const banRate = champ.banRate || 0;
  if (banRate >= 40) return 10;
  if (banRate >= 25) return 8;
  if (banRate >= 15) return 6;
  return 4;
}

// Role uygunluğu - (0-10)
function getRoleAppropriatenessScore(champId, role) {
  const champ = championMeta[champId];
  if (!champ) return 0;

  if (champ.roles.includes(role)) return 10;
  if (champ.roles.length === 1) return 0; // hard role-locked
  return 5; // flex capable
}

// Blind pick güvenliği (Pro mode) - (0-10)
function getBlindPickScore(champId) {
  const champ = championMeta[champId];
  if (!champ) return 5;

  const safety = champ.blindPickSafety || 5;
  return (safety / 10) * 10; // normalize to 0-10
}

// ============================================
// MAIN SCORING FUNCTION
// ============================================

export function calculateDraftScore(
  champId,
  role,
  blueTeamChamps = [],
  redTeamChamps = [],
  userTeam = 'blue',
  mode = 'soloq'
) {
  const allies = userTeam === 'blue' ? blueTeamChamps : redTeamChamps;
  const enemies = userTeam === 'blue' ? redTeamChamps : blueTeamChamps;

  const scores = {
    meta: getMetaScore(champId),
    counter: getCounterScore(champId, enemies),
    synergy: getSynergyScore(champId, allies),
    lane: getLaneScore(champId, role, null, enemies[0] || ''),
    carry: getCarryScore(champId, role),
    scaling: getScalingScore(champId),
    objective: getObjectiveScore(champId),
    roleApp: getRoleAppropriatenessScore(champId, role),
    blind: getBlindPickScore(champId),
  };

  // Weights - Pro mode vs SoloQ
  const weights = mode === 'soloq' 
    ? {
        meta: 1.2,
        counter: 1.5,
        synergy: 1.0,
        lane: 1.3,
        carry: 1.5,
        scaling: 0.8,
        objective: 0.6,
        roleApp: 1.0,
        blind: 0.5,
      }
    : {
        meta: 1.3,
        counter: 1.2,
        synergy: 1.5,
        lane: 1.0,
        carry: 0.8,
        scaling: 1.2,
        objective: 1.5,
        roleApp: 1.0,
        blind: 1.5,
      };

  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    total += (scores[key] || 0) * weight;
  }

  // Normalize to 0-100
  const draftScore = Math.round((total / 15) * 10); // rough 0-100 scale

  return {
    score: Math.max(0, Math.min(100, draftScore)),
    breakdown: scores,
  };
}

// ============================================
// RECOMMENDATION ENGINE
// ============================================

export function getRecommendations(
  role,
  blueTeam,
  redTeam,
  userTeam = 'blue',
  mode = 'soloq',
  limit = 3
) {
  const usedChamps = new Set([
    ...blueTeam.map(p => p.champId),
    ...redTeam.map(p => p.champId),
  ]);

  const recommendations = [];

  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (usedChamps.has(champId)) continue;
    if (!champData.roles.includes(role)) continue;

    const { score, breakdown } = calculateDraftScore(
      champId,
      role,
      blueTeam.map(p => p.champId),
      redTeam.map(p => p.champId),
      userTeam,
      mode
    );

    recommendations.push({
      champId,
      name: champData.name,
      role,
      score,
      breakdown,
      winRate: champData.winRate,
      pickRate: champData.pickRate,
      banRate: champData.banRate,
    });
  }

  // Sort by score
  recommendations.sort((a, b) => b.score - a.score);
  return recommendations.slice(0, limit);
}

// ============================================
// TEAM COMPOSITION ANALYSIS
// ============================================

export function analyzeComposition(blueTeam, redTeam, userTeam = 'blue') {
  const ownTeam = userTeam === 'blue' ? blueTeam : redTeam;
  const enemyTeam = userTeam === 'blue' ? redTeam : blueTeam;

  const ownChamps = ownTeam.map(p => p.champId);
  const enemyChamps = enemyTeam.map(p => p.champId);

  // Team power metrics
  let ownMeta = 0, enemyMeta = 0;
  let ownCC = 0, enemyCC = 0;
  let ownAP = 0, ownAD = 0, enemyAP = 0, enemyAD = 0;

  for (const champId of ownChamps) {
    const champ = championMeta[champId];
    if (!champ) continue;
    ownMeta += champ.presence || 0;
    // CC estimate: high ban rate = CC heavy
    if (champ.banRate >= 30) ownCC += 2;
    if (champ.winRate >= 52) ownAP += 1; // rough guess
  }

  for (const champId of enemyChamps) {
    const champ = championMeta[champId];
    if (!champ) continue;
    enemyMeta += champ.presence || 0;
    if (champ.banRate >= 30) enemyCC += 2;
    if (champ.winRate >= 52) enemyAD += 1;
  }

  return {
    teamAdvantage: ownMeta > enemyMeta ? 'Own' : enemyMeta > ownMeta ? 'Enemy' : 'Equal',
    earlyGame: 'Analyzing...',
    lateGame: 'Analyzing...',
    teamfight: ownCC > enemyCC ? 'Favorable' : 'Unfavorable',
    scaling: 'Analyzing...',
    cc: `Own: ${ownCC}, Enemy: ${enemyCC}`,
    balance: 'Analyzing...',
  };
}

export default {
  calculateDraftScore,
  getRecommendations,
  analyzeComposition,
};
