// ================================================================
// PRO META ENGINE v2
// Veri kaynağı: LCK / LPL / LEC / LCP 2026 pro maç istatistikleri
// Referans kalite: gol.gg + Oracle's Elixir eşdeğeri veri işleme
//
// Temel felsefe: "istatistiksel olarak iyi görünen" değil,
// profesyonel takımların aynı koşullarda gerçekten seçeceği şampiyonları öner.
// ================================================================

import championMeta from '../data/championMeta.json';

// ----------------------------------------------------------------
// BAYESIAN WIN RATE (iç kullanım — circular dep olmaması için)
// ----------------------------------------------------------------
function _bwr(rawWR, n, k = 50) {
  if (!n || n <= 0) return 50;
  return ((rawWR / 100 * n) + k * 0.5) / (n + k) * 100;
}

// ================================================================
// 1. PRESENCE MULTIPLIERS
// Düşük presence = pro'da hiç tercih edilmez → sert ceza
// ================================================================
export function getPresenceMultiplier(presence) {
  if (presence <  4) return 0;     // Kesinlikle önerme — perma-niche
  if (presence < 10) return 0.25;  // Nadir görülen durum pick — çok ağır ceza
  if (presence < 15) return 0.45;  // Durumsal, koşullu pick
  if (presence < 20) return 0.70;  // Alt meta sınırı
  return 1.0;
}

// ================================================================
// 2. GAME COUNT PENALTY
// Az oynanan şampiyonların istatistikleri güvenilmez
// ================================================================
export function getGameCountPenalty(games) {
  if (games <  10) return 0;    // Yeterli veri yok — önermek yanıltıcı
  if (games <  20) return 0.50; // Az veri — tahminler güvenilmez
  return 1.0;
}

// ================================================================
// 3. PRO TIER CLASSIFICATION (S+, S, A+, A, B, C, D)
// gol.gg'nin tier mantığına eşdeğer
// ================================================================
export function classifyProTier(presence, smoothedWR, banRate, totalGames) {
  if (getGameCountPenalty(totalGames) === 0) return 'D';
  if (presence >= 60 && (smoothedWR >= 50 || banRate >= 25)) return 'S+';
  if (presence >= 45 && smoothedWR >= 48)                    return 'S';
  if (presence >= 28 && smoothedWR >= 50)                    return 'A+';
  if (presence >= 20 && smoothedWR >= 48)                    return 'A';
  if (presence >= 12 && smoothedWR >= 47)                    return 'B';
  if (presence >=  5)                                        return 'C';
  return 'D';
}

// Tier önceliği (banlama/seçme sıralaması için)
export const TIER_PRIORITY = { 'S+': 7, 'S': 6, 'A+': 5, 'A': 4, 'B': 3, 'C': 1, 'D': 0 };

// Tier → ban öncelik çarpanı
export const TIER_BAN_MULT = { 'S+': 1.5, 'S': 1.2, 'A+': 1.0, 'A': 0.85, 'B': 0.55, 'C': 0.25, 'D': 0.0 };

// ================================================================
// 4. CHAMPION TIER DATABASE (module-level önbellek)
// Tüm şampiyonlar için tier + presence + WR önden hesaplanır
// ================================================================
const _tierCache = {};

for (const [id, data] of Object.entries(championMeta)) {
  if (id === '_meta') continue;
  const presence   = data.presence  || 0;
  const banRate    = data.banRate   || 0;
  const totalGames = data.proStats?.picks || 0;

  let wr;
  if (typeof data.winRate === 'object') {
    const vals = Object.values(data.winRate).filter(v => typeof v === 'number');
    wr = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 50;
  } else {
    wr = data.winRate || 50;
  }
  const smoothed = _bwr(wr, totalGames);

  _tierCache[id] = {
    tier:       classifyProTier(presence, smoothed, banRate, totalGames),
    presence,
    smoothedWR: +smoothed.toFixed(1),
    banRate,
  };
}

export function getChampionProTier(champId) {
  return _tierCache[champId] || { tier: 'D', presence: 0, smoothedWR: 50, banRate: 0 };
}

// ================================================================
// 5. HARD BLACKLIST CHECK
// Presence < 4% → pro draftında hiçbir koşulda önerilmez
// ================================================================
export function isProHardBlacklisted(champId) {
  const data = championMeta[champId];
  return !data || (data.presence || 0) < 4;
}

// ================================================================
// 6. YENİ META SCORE FORMÜLÜ
// Presence 45% | BanRate 15% | WinRate 10% | Flex 10% | Blind 10% | Counter avg 10%
// Her bileşen 0-100 normalize edilir, ağırlıklı toplam 0-15'e çevrilir.
// ================================================================
export function calculateProMetaScore(champId, role) {
  const champ = championMeta[champId];
  if (!champ) return 0;

  const presence      = champ.presence || 0;
  const banRate       = champ.banRate  || 0;
  const numRoles      = Array.isArray(champ.roles) ? champ.roles.length : 1;
  const blindSafe     = champ.blindPickSafety || 5;
  const rolePickCount = champ.rolePickCounts?.[role] || 0;
  const rawWR = typeof champ.winRate === 'object'
    ? (champ.winRate[role] ?? Object.values(champ.winRate)[0] ?? 50)
    : (champ.winRate ?? 50);
  const smoothedWR = _bwr(rawWR, rolePickCount);

  // Hard check: presence < 4% → asla önerme
  const presenceMult = getPresenceMultiplier(presence);
  if (presenceMult === 0) return 0;

  // Game count check: bu roldeki oyun sayısı çok azsa güvenilmez
  const gamePenalty = getGameCountPenalty(rolePickCount);
  if (gamePenalty === 0) return 0;

  // Ortalama counter değeri (genel, context'e bağlı değil)
  const counterVals = Object.values(champ.counters || {});
  const avgCounter  = counterVals.length
    ? counterVals.reduce((a, b) => a + b, 0) / counterVals.length
    : 0;

  // Bileşen skorları (0-100)
  // Presence: 80%+ = S+ baseline → 100 puan
  const cPresence = Math.min(100, (presence / 80) * 100);
  // BanRate: 50%+ = çok tehlikeli → 100 puan
  const cBan      = Math.min(100, (banRate  / 50) * 100);
  // WinRate: 45% = 0, 55% = 100 (pro standartlarına göre)
  const cWR       = Math.max(0, Math.min(100, (smoothedWR - 45) / 10 * 100));
  // Flex: tek rolle = 0, 2 rol = 60, 3+ rol = 100
  const cFlex     = Math.min(100, (numRoles - 1) * 60);
  // Blind Safety: 0-10 skala → 0-100
  const cBlind    = Math.min(100, (blindSafe / 10) * 100);
  // Counter avg: 4 = typical max → 100
  const cCounter  = Math.min(100, (avgCounter / 4) * 100);

  // Ağırlıklı toplam (0-100)
  const raw =
    cPresence * 0.45 +
    cBan      * 0.15 +
    cWR       * 0.10 +
    cFlex     * 0.10 +
    cBlind    * 0.10 +
    cCounter  * 0.10;

  // 0-15 ölçeğine çevir + presence çarpanı + oyun sayısı cezası
  return Math.min(15, (raw / 100) * 15 * presenceMult * gamePenalty);
}

// ================================================================
// 7. PAIR SYNERGY DATABASE
// Pro maçlardan otomatik çıkarılan en güçlü şampiyon ikilileri
// Her çift için sinerji skoru: synergies verisi çift yönlü birleştirilerek max alınır
// ================================================================
const _pairs = {};

for (const [champId, data] of Object.entries(championMeta)) {
  if (champId === '_meta') continue;
  for (const [allyId, score] of Object.entries(data.synergies || {})) {
    if (score > 0) {
      const key = [champId, allyId].sort().join('::');
      _pairs[key] = Math.max(_pairs[key] || 0, score);
    }
  }
}

export function getPairSynergy(champId1, champId2) {
  return _pairs[[champId1, champId2].sort().join('::')] || 0;
}

export function getTeamPairScore(champId, allies) {
  if (!allies || allies.length === 0) return 0;
  let total = 0;
  for (const allyId of allies) total += getPairSynergy(champId, allyId);
  return total / allies.length;
}

// En güçlü 5 pair partnerini döndürür (araç amaçlı)
export function getTopPairPartners(champId, limit = 5) {
  const syns = championMeta[champId]?.synergies || {};
  return Object.entries(syns)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([allyId, score]) => ({ champId: allyId, score }));
}

// ================================================================
// 8. TEAM NEEDS ANALYSIS
// Mevcut takımın AP/AD dengesi, frontline eksikliği, engage ihtiyacı
// getTagsFn: draftAnalysis.js'den geçirilir (circular dep önleme)
// ================================================================
export function analyzeTeamNeeds(picks, getTagsFn) {
  if (!picks || picks.length === 0) {
    return {
      adCount: 0, apCount: 0, frontlineCount: 0, engageCount: 0,
      carryCount: 0, pokeCount: 0, splitCount: 0,
      needsFrontline: false, needsEngage: false,
      needsAP: false, needsAD: false, needsCarry: false,
      isAPHeavy: false, isADHeavy: false, hasPoke: false, hasSplit: false,
    };
  }

  let ad = 0, ap = 0, fl = 0, eng = 0, carry = 0, poke = 0, split = 0;

  for (const pick of picks) {
    const t = getTagsFn(pick.champId);
    if (t.includes('ad') || t.includes('adc'))                              ad++;
    if (t.includes('ap'))                                                    ap++;
    if (t.includes('frontline') || t.includes('tank') || t.includes('bruiser')) fl++;
    if (t.includes('engage')    || t.includes('cc'))                        eng++;
    if (t.includes('hypercarry') || t.includes('assassin') || t.includes('scaling')) carry++;
    if (t.includes('poke'))                                                  poke++;
    if (t.includes('splitpush'))                                             split++;
  }

  const n = picks.length;
  return {
    adCount: ad, apCount: ap, frontlineCount: fl, engageCount: eng,
    carryCount: carry, pokeCount: poke, splitCount: split,
    needsFrontline: fl === 0    && n >= 2,
    needsEngage:    eng === 0   && n >= 3,
    needsAP:        ap  === 0   && ad >= 2,
    needsAD:        ad  === 0   && ap >= 2,
    needsCarry:     carry === 0 && n >= 3,
    isAPHeavy:      ap >= 3,
    isADHeavy:      ad >= 3,
    hasPoke:        poke >= 2,
    hasSplit:       split >= 1,
  };
}

// ================================================================
// 9. DRAFT POSITION AFFINITY
// B1 (blind) → yüksek blindSafe + presence + flex = ideal
// Pick2 (counter) → düşük blindSafe OK, counter değeri önemli
// Profesyonel draft mantığı: ilk pickler güvenli & high meta olmalı
// ================================================================
export function getDraftPositionScore(champId, phaseInfo) {
  const champ = championMeta[champId];
  if (!champ) return 0;

  const bs       = champ.blindPickSafety || 5;
  const numRoles = Array.isArray(champ.roles) ? champ.roles.length : 1;
  const pres     = champ.presence || 0;
  const isBlind  = phaseInfo?.isBlind ?? true;
  const phase    = phaseInfo?.phase   || 'pick1';

  if (isBlind && phase === 'pick1') {
    // B1 idealı: blindSafe ≥ 8, presence ≥ 35%, 2+ rol (flex)
    if (bs >= 8 && pres >= 35 && numRoles >= 2) return 10; // Mükemmel first pick
    if (bs >= 8 && pres >= 25)                  return 9;
    if (bs >= 7 && pres >= 30)                  return 8;
    if (bs >= 7 && pres >= 20)                  return 6;
    if (bs >= 6 && pres >= 15)                  return 4;
    if (bs <  5 && pres >= 40)                  return 3; // Popular ama blind'da riskli
    return Math.max(0, bs - 5);                           // Güvensiz blind pick cezası
  }

  if (phase === 'pick2') {
    // Counter phase: düşük blind safety OK çünkü rakip belli
    if (bs <= 5 && pres >= 15) return 8; // Klasik "last pick" profili
    if (bs <= 6 && pres >= 20) return 7;
    return 5; // nötr
  }

  // Orta pick slot: dengeli
  return bs >= 7 ? 7 : bs >= 5 ? 5 : 3;
}

// ================================================================
// 10. PRO PICK ORDER TIERS (Hangi şampiyonlar hangi slota uygun)
// B1: Yüksek blind safety + meta presence + flex
// Double pick (B2B3, R1R2): Güçlü pair değeri olan şampiyonlar
// Last pick (B5/R5): Düşük blind safety, yüksek counter değeri
// ================================================================
export function getPickOrderLabel(champId) {
  const champ = championMeta[champId];
  if (!champ) return 'ANY';

  const bs       = champ.blindPickSafety || 5;
  const numRoles = Array.isArray(champ.roles) ? champ.roles.length : 1;
  const pres     = champ.presence || 0;

  if (bs >= 8 && pres >= 25 && numRoles >= 2) return 'FIRST_PICK'; // B1 / R1
  if (bs <= 5 && pres >= 15)                  return 'LAST_PICK';  // B5 / R5 counter
  if (pres >= 30)                             return 'FLEX_PICK';  // Esnek orta pick
  return 'SITUATIONAL';
}
