import championMeta from '../data/championMeta.json';
import {
  calculateProMetaScore,
  getTeamPairScore,
  analyzeTeamNeeds,
  getDraftPositionScore,
  isProHardBlacklisted,
  getChampionProTier,
  TIER_BAN_MULT,
} from './proMetaEngine';

// ============================================================
// CHAMPION ARCHETYPE TAG SYSTEM
// Pro data: LCK/LPL/LEC/LCP 2026 meta classification
// ============================================================

// Tags: engage, peel, disengage, cc, frontline, bruiser, tank,
//       assassin, poke, scaling, early_game, hypercarry, splitpush,
//       teamfight, pick, ap, ad, utility, objective, mobility, healing

const CHAMPION_TAGS = {
  // TOP
  Aatrox:    ['frontline','bruiser','ad','early_game','teamfight','healing'],
  Ambessa:   ['frontline','bruiser','ad','early_game','engage','pick'],
  Camille:   ['splitpush','pick','ad','bruiser','mobility','early_game'],
  Chogath:   ['frontline','tank','ap','scaling','cc','objective'],
  Darius:    ['frontline','bruiser','ad','early_game','pick','cc'],
  DrMundo:   ['frontline','tank','ad','scaling','healing'],
  Garen:     ['frontline','tank','ad','early_game'],
  Gangplank: ['poke','ad','scaling','objective','utility'],
  Gnar:      ['poke','cc','frontline','disengage','early_game'],
  Gragas:    ['frontline','engage','ap','poke','disengage','cc'],
  Gwen:      ['scaling','ap','bruiser'],
  Illaoi:    ['frontline','early_game','ad','splitpush'],
  Irelia:    ['early_game','ad','bruiser','pick','splitpush'],
  Jax:       ['splitpush','scaling','ad','bruiser'],
  Jayce:     ['poke','ad','early_game','flex'],
  KSante:    ['frontline','tank','engage','cc','flex'],
  Kayle:     ['scaling','late_game','ap','hypercarry'],
  Kennen:    ['teamfight','cc','ap','poke','disengage'],
  Kled:      ['early_game','ad','bruiser','engage'],
  Malphite:  ['teamfight','cc','engage','frontline','tank','ap'],
  Maokai:    ['frontline','cc','engage','tank','scaling'],
  Mordekaiser:['frontline','ap','duelist','scaling','pick'],
  Nasus:     ['scaling','frontline','tank','cc'],
  Olaf:      ['early_game','ad','bruiser','objective'],
  Ornn:      ['frontline','cc','engage','tank','scaling','teamfight'],
  Poppy:     ['frontline','disengage','cc','tank'],
  Renekton:  ['early_game','frontline','ad','bruiser','cc'],
  Rumble:    ['teamfight','poke','ap'],
  Sett:      ['frontline','engage','ad','bruiser'],
  Shen:      ['frontline','tank','cc','utility'],
  Shyvana:   ['scaling','ad','bruiser','objective'],
  Sion:      ['frontline','tank','engage','cc'],
  Trundle:   ['frontline','ad','bruiser','anti_healing','objective'],
  Tryndamere:['splitpush','scaling','ad'],
  Varus:     ['poke','ad','cc','flex'],
  Vladimir:  ['scaling','ap','poke','healing'],
  Volibear:  ['engage','frontline','tank','early_game','cc'],
  Yasuo:     ['scaling','ad','bruiser','teamfight','flex'],
  Yone:      ['scaling','ad','engage','teamfight','cc'],
  Yorick:    ['splitpush','frontline','ad'],
  Zac:       ['engage','cc','frontline','tank'],
  // JUNGLE
  Amumu:     ['teamfight','cc','engage','ap','frontline'],
  Bard:      ['utility','pick','cc','disengage','roam'],
  Diana:     ['engage','ap','dive','teamfight','cc'],
  Elise:     ['early_game','pick','ap','cc'],
  JarvanIV:  ['engage','cc','frontline','ad','early_game'],
  Kayn:      ['scaling','ad','pick','splitpush','mobility'],
  Khazix:    ['assassin','ad','pick','early_game','mobility'],
  Kindred:   ['scaling','ad','objective','disengage'],
  LeeSin:    ['early_game','pick','ad','mobility','cc'],
  Lillia:    ['scaling','cc','ap','disengage','mobility'],
  MonkeyKing:['engage','ad','early_game','frontline','cc'],
  Nidalee:   ['early_game','ap','poke'],
  Nocturne:  ['pick','ad','early_game','dive'],
  RekSai:    ['early_game','pick','ad','frontline'],
  Rengar:    ['assassin','ad','pick','early_game'],
  Sejuani:   ['engage','cc','frontline','tank','scaling'],
  Skarner:   ['pick','cc','frontline','early_game'],
  Udyr:      ['early_game','objective','bruiser','frontline','cc'],
  Vi:        ['engage','pick','ad','cc','frontline'],
  Viego:     ['scaling','ad','pick','mobility'],
  XinZhao:   ['early_game','engage','ad','frontline','cc'],
  // MID
  Ahri:      ['pick','ap','mobility','assassin','cc'],
  Akali:     ['assassin','ap','pick','scaling','mobility'],
  Anivia:    ['waveclear','cc','ap','scaling','zoning'],
  Annie:     ['cc','ap','teamfight','engage'],
  AurelionSol:['scaling','ap','roam','teamfight'],
  Aurora:    ['ap','pick','mobility','disengage'],
  Azir:      ['poke','scaling','ap','disengage','teamfight'],
  Cassiopeia:['scaling','ap','cc','poke'],
  Corki:     ['poke','ad','scaling'],
  Ekko:      ['scaling','ap','pick','mobility'],
  Galio:     ['teamfight','cc','frontline','ap','disengage'],
  Hwei:      ['poke','ap','teamfight','cc'],
  LeBlanc:   ['assassin','ap','pick','early_game','mobility'],
  Lissandra:  ['cc','engage','ap','teamfight','disengage'],
  Lucian:    ['early_game','ad','poke','mobility'],
  Naafiri:   ['assassin','ad','pick','early_game'],
  Neeko:     ['cc','ap','teamfight','engage'],
  Orianna:   ['teamfight','cc','ap','scaling','poke'],
  Qiyana:    ['assassin','ad','pick','objective','mobility'],
  Ryze:      ['scaling','ap','poke','teamfight','waveclear'],
  Smolder:   ['poke','scaling','ad'],
  Sylas:     ['ap','teamfight','scaling','pick','cc'],
  Syndra:    ['poke','cc','ap','pick','early_game'],
  Taliyah:   ['poke','ap','roam','teamfight','cc'],
  TwistedFate:['roam','ap','pick','cc','utility'],
  Veigar:    ['cc','ap','scaling','pick'],
  Vex:       ['cc','ap','anti_mobility','teamfight'],
  Viktor:    ['poke','ap','scaling','teamfight','waveclear'],
  Xerath:    ['poke','ap','cc','objective'],
  Yasuo:     ['scaling','ad','teamfight','flex'],
  Yone:      ['scaling','ad','engage','teamfight','cc'],
  Zed:       ['assassin','ad','pick','early_game'],
  Ziggs:     ['poke','ap','waveclear','objective'],
  Zoe:       ['poke','cc','ap','pick'],
  Yunara:    ['poke','ap','scaling','utility'],
  // ADC
  Aphelios:  ['scaling','ad','teamfight','objective'],
  Ashe:      ['cc','utility','ad','scaling','poke'],
  Caitlyn:   ['poke','ad','early_game','objective'],
  Draven:    ['early_game','ad','snowball'],
  Ezreal:    ['poke','ad','scaling','disengage','mobility'],
  Jhin:      ['poke','cc','ad','objective'],
  Jinx:      ['scaling','ad','hypercarry','teamfight'],
  Kaisa:     ['scaling','ad','dive','mobility'],
  Kalista:   ['early_game','ad','peel','objective'],
  KogMaw:    ['scaling','ad','hypercarry','late_game'],
  MissFortune:['poke','ad','teamfight','early_game','cc'],
  Senna:     ['ad','utility','scaling','poke'],
  Sivir:     ['waveclear','ad','teamfight','utility','poke'],
  Tristana:  ['early_game','ad','dive','scaling'],
  Varus:     ['poke','ad','cc'],
  Vayne:     ['scaling','ad','hypercarry','anti_tank'],
  Xayah:     ['scaling','ad','disengage','cc'],
  Zeri:      ['scaling','ad','mobility'],
  // SUPPORT
  Alistar:   ['engage','cc','frontline','early_game','support'],
  Blitzcrank:['pick','cc','engage','early_game','support'],
  Brand:     ['poke','ap','teamfight','cc','support'],
  Braum:     ['peel','cc','disengage','frontline','support'],
  Janna:     ['peel','disengage','utility','support','cc'],
  Karma:     ['poke','utility','peel','support','cc'],
  Leona:     ['engage','cc','frontline','early_game','support'],
  Lulu:      ['peel','hypercarry_amp','utility','support'],
  Lux:       ['poke','cc','ap','utility','support'],
  Mel:       ['poke','ap','utility','disengage','support'],
  Milio:     ['peel','utility','support','disengage'],
  Morgana:   ['cc','ap','anti_engage','support','scaling'],
  Nami:      ['peel','cc','utility','support','scaling'],
  Nautilus:  ['engage','cc','frontline','early_game','support'],
  Pyke:      ['pick','cc','assassin','support','scaling'],
  Rakan:     ['engage','cc','mobility','support','teamfight'],
  Rell:      ['engage','cc','frontline','support','teamfight'],
  Renata:    ['utility','support','cc','teamfight','scaling'],
  Seraphine: ['poke','cc','teamfight','support','scaling','waveclear'],
  Sona:      ['peel','utility','cc','scaling','support'],
  Soraka:    ['peel','utility','healing','support'],
  Swain:     ['teamfight','ap','frontline','support','cc'],
  TahmKench: ['peel','frontline','tank','support'],
  Taric:     ['peel','cc','utility','support','scaling'],
  Thresh:    ['engage','peel','cc','utility','support'],
  Yuumi:     ['hypercarry_amp','utility','scaling','support'],
  Zaahen:    ['support','utility'],
  Zyra:      ['poke','cc','ap','teamfight','support'],
};

// Kompozisyon arketipleri
const COMP_ARCHETYPES = {
  teamfight: {
    label: 'Teamfight',
    description: 'AOE hasar ve CC ile 5v5 egemenlik',
    winCondition: '5v5 fight kazanarak objective al',
    tags: ['teamfight','cc','engage','ap'],
    strengths: ['Dragon/Baron fight','Teamfight'],
    weaknesses: ['Split push','Poke siege'],
  },
  poke: {
    label: 'Poke / Siege',
    description: 'Uzaktan yıpratma ve kule baskısı',
    winCondition: 'Yorarak fight kabul ettir, turne baskısı',
    tags: ['poke','disengage','waveclear','objective'],
    strengths: ['Kule baskısı','Objective hazırlığı'],
    weaknesses: ['All-in engage','Flanking'],
  },
  engage: {
    label: 'Engage / Dive',
    description: 'Sert engage ile rakibi felç et',
    winCondition: 'Güçlü engage ile fights başlat',
    tags: ['engage','frontline','cc','dive'],
    strengths: ['Agresif fight','Bölme (flank)'],
    weaknesses: ['Disengage comp','Kiting','Poke'],
  },
  splitpush: {
    label: 'Split Push / 1-3-1',
    description: 'Harita baskısı ile kule yı',
    winCondition: '1v1 kazan, harita baskısı yarat, rotasyon',
    tags: ['splitpush','duelist','mobility'],
    strengths: ['1v1','Harita baskısı'],
    weaknesses: ['5v5 teamfight','Yavaş objective'],
  },
  scaling: {
    label: 'Scaling / Geç Oyun',
    description: 'Item tamamlandıkça güç kazan',
    winCondition: 'Geç oyuna kadar hayatta kal, sonra domi et',
    tags: ['scaling','hypercarry','late_game'],
    strengths: ['Geç oyun','Uzun maç'],
    weaknesses: ['Erken baskı','Snowball kompozisyonlar'],
  },
  pick: {
    label: 'Pick / Assassination',
    description: 'Tek hedef ele geçirme, 5v4 yaratma',
    winCondition: 'Pick ile sayısal üstünlük, sonra objective',
    tags: ['pick','assassin','mobility','roam'],
    strengths: ['İzolasyon','Snowball'],
    weaknesses: ['Peel tank','AoE CC','Grouping'],
  },
};

// ============================================================
// YARDIMCI FONKSİYONLAR
// ============================================================

export function getChampionTags(champId) {
  // Statik haritada varsa onu kullan
  if (CHAMPION_TAGS[champId]) return CHAMPION_TAGS[champId];

  // Yoksa istatistiklerden türet
  const champ = championMeta[champId];
  if (!champ) return [];
  const tags = [];

  if (champ.roles.includes('support')) { tags.push('support','utility'); }
  if (champ.roles.includes('adc'))     { tags.push('ad','scaling'); }
  if (champ.roles.includes('jungle'))  { tags.push('early_game','objective'); }
  if (champ.roles.includes('top'))     { tags.push('frontline'); }
  if (champ.roles.includes('mid'))     { tags.push('ap'); }

  if ((champ.blindPickSafety || 5) >= 8) tags.push('blind_safe');
  if (champ.presence >= 50) tags.push('priority_pick');
  if (champ.banRate >= 40)  tags.push('high_impact','cc');

  return tags;
}

// Şampiyonun erken/orta/geç oyun güç puanı (0-10)
export function getPowerSpike(champId) {
  const tags = getChampionTags(champId);

  if (tags.includes('hypercarry') || tags.includes('late_game')) return { early:3, mid:5, late:10 };
  if (tags.includes('scaling') && !tags.includes('early_game'))  return { early:4, mid:6, late:9 };
  if (tags.includes('early_game') && !tags.includes('scaling'))  return { early:9, mid:7, late:5 };
  if (tags.includes('assassin'))   return { early:6, mid:9, late:7 };
  if (tags.includes('poke'))       return { early:7, mid:8, late:7 };
  if (tags.includes('engage'))     return { early:7, mid:8, late:7 };
  if (tags.includes('teamfight'))  return { early:5, mid:8, late:8 };
  if (tags.includes('splitpush'))  return { early:5, mid:7, late:9 };
  return { early:5, mid:7, late:7 };
}

// Takım kompozisyon arketipini tespit et
export function detectCompArchetype(teamPicks) {
  if (teamPicks.length === 0) return null;

  const tagCounts = {};
  for (const pick of teamPicks) {
    const tags = getChampionTags(pick.champId);
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const archetypeScores = {};
  for (const [archetype, info] of Object.entries(COMP_ARCHETYPES)) {
    let score = 0;
    for (const tag of info.tags) {
      score += (tagCounts[tag] || 0) * 2;
    }
    archetypeScores[archetype] = score;
  }

  const best = Object.entries(archetypeScores)
    .sort((a, b) => b[1] - a[1])[0];

  if (!best || best[1] === 0) return null;
  return { type: best[0], score: best[1], info: COMP_ARCHETYPES[best[0]] };
}

// Takımın güç aralığını hesapla
function getTeamPowerProfile(team) {
  if (!team.length) return { early:5, mid:5, late:5, ccCount:0, adCount:0, apCount:0, engageCount:0, peelCount:0 };

  let early = 0, mid = 0, late = 0, cc = 0, ad = 0, ap = 0, engage = 0, peel = 0;

  for (const pick of team) {
    const spike = getPowerSpike(pick.champId);
    const tags  = getChampionTags(pick.champId);
    early += spike.early;
    mid   += spike.mid;
    late  += spike.late;
    if (tags.includes('cc') || tags.includes('engage')) cc++;
    if (tags.includes('ad') || tags.includes('adc')) ad++;
    if (tags.includes('ap')) ap++;
    if (tags.includes('engage')) engage++;
    if (tags.includes('peel') || tags.includes('disengage')) peel++;
  }

  const n = team.length;
  return {
    early: +(early / n).toFixed(1),
    mid:   +(mid / n).toFixed(1),
    late:  +(late / n).toFixed(1),
    ccCount: cc,
    adCount: ad,
    apCount: ap,
    engageCount: engage,
    peelCount: peel,
  };
}

// Draft fazını tespit et
export function getDraftPhaseInfo(bluePicks, redPicks, blueBans, redBans) {
  const totalBans  = blueBans.length + redBans.length;
  const totalPicks = bluePicks.length + redPicks.length;

  if (totalBans < 6) {
    return {
      phase: 'ban1',
      label: '1. Ban Fazı',
      isBlind: true,
      stepNum: totalBans + 1,
      advice: 'Meta tehditleri ve rakibin en iyi şampiyonlarını banla',
    };
  } else if (totalPicks < 6) {
    return {
      phase: 'pick1',
      label: '1. Pick Fazı',
      isBlind: totalPicks < 2,
      stepNum: totalBans + totalPicks + 1,
      advice: totalPicks < 2
        ? 'Blind pick fazı: güvenli, flex ve high-priority seçimler tercih et'
        : 'Rakip draftına göre pozisyonlanmaya başla',
    };
  } else if (totalBans < 10) {
    return {
      phase: 'ban2',
      label: '2. Ban Fazı',
      isBlind: false,
      stepNum: totalBans + totalPicks + 1,
      advice: 'Rakibin kalan flex picklarını ve kompozisyonunu tamamlayacak şampiyonları banla',
    };
  } else {
    return {
      phase: 'pick2',
      label: '2. Pick Fazı (Counter)',
      isBlind: false,
      stepNum: totalBans + totalPicks + 1,
      advice: 'Counter pick aşaması: rakip kompozisyonuna net cevap ver',
    };
  }
}

// ============================================================
// ANA SKORLAMA ALGORİTMASI — 10 Kriter
// ============================================================

// Bayesian WR smoothing: küçük örnek boyutlarını 50%'e çeker
// smoothedWR = (wins + k*0.5) / (games + k)   k=50 ile 50 maçtan az = 50%'ye yakın
function bayesianWR(rawWR, sampleSize, k = 50) {
  if (!sampleSize || sampleSize <= 0) return 50;
  const wins = (rawWR / 100) * sampleSize;
  return ((wins + k * 0.5) / (sampleSize + k)) * 100;
}

// Minimum rol pick count — bu altında role verisi güvenilmez
const MIN_ROLE_PICKS = 20;

export function calculateDraftScore(champId, role, blueTeam, redTeam, userTeam, mode, phaseInfo) {
  const champ = championMeta[champId];
  if (!champ) return { score: 0, breakdown: {}, reasoning: [], tier: 'D' };

  // ── Hard blacklist: Pro modda presence < 4% → asla önerme ──────────────────
  if (mode === 'pro' && isProHardBlacklisted(champId)) {
    return { score: 0, breakdown: {}, reasoning: ['🚫 Pro blacklist: presence < 4%'], tier: 'D' };
  }

  const rolePickCount = champ.rolePickCounts?.[role] || 0;
  const roleFit   = Array.isArray(champ.roles) ? champ.roles.includes(role) : false;
  const allies    = (userTeam === 'blue' ? blueTeam : redTeam).map(p => p.champId);
  const enemies   = (userTeam === 'blue' ? redTeam  : blueTeam).map(p => p.champId);
  const tags      = getChampionTags(champId);
  const isBlind   = phaseInfo?.isBlind ?? true;
  const phase     = phaseInfo?.phase   || 'pick1';
  const presence  = champ.presence    || 0;
  const rawWR     = typeof champ.winRate === 'object'
    ? (champ.winRate[role] ?? Object.values(champ.winRate)[0] ?? 50)
    : (champ.winRate ?? 50);
  const wr        = bayesianWR(rawWR, rolePickCount);
  const tierInfo  = getChampionProTier(champId);

  // ══════════════════════════════════════════════════════════════════════
  // 1. META SCORE (0-15)
  // Pro: Presence 45% | BanRate 15% | WinRate 10% | Flex 10% | Blind 10% | Counter avg 10%
  // SoloQ: orijinal presence + WR formülü
  // ══════════════════════════════════════════════════════════════════════
  let metaScore;
  if (mode === 'pro') {
    metaScore = calculateProMetaScore(champId, role);
  } else {
    const sp = rolePickCount < MIN_ROLE_PICKS && rolePickCount > 0 ? 0.4 : 1.0;
    if      (presence >= 70 && wr >= 48) metaScore = 15;
    else if (presence >= 50 && wr >= 48) metaScore = 12;
    else if (presence >= 35 && wr >= 47) metaScore = 9;
    else if (presence >= 20 && wr >= 46) metaScore = 6;
    else metaScore = Math.max(0, (wr - 44) * 1.5);
    metaScore *= sp;
  }

  // ══════════════════════════════════════════════════════════════════════
  // 2. COUNTER SCORE (0-15)
  // Pro maçlardan çıkarılan matchup verisi — rakibe karşı ne kadar etkili
  // ══════════════════════════════════════════════════════════════════════
  let counterScore = enemies.length > 0 ? 0 : 7;
  if (enemies.length > 0) {
    let total = 0;
    for (const enemy of enemies) total += champ.counters?.[enemy] || 0;
    counterScore = Math.max(0, Math.min(15, (total / enemies.length) * 3));
  }

  // ══════════════════════════════════════════════════════════════════════
  // 3. PAIR SYNERGY (0-12)
  // Pro maçlardan çıkarılan en sık birlikte seçilen ikili kombinasyonlar
  // ══════════════════════════════════════════════════════════════════════
  let pairSyn;
  if (allies.length > 0) {
    const avg = getTeamPairScore(champId, allies);
    pairSyn = Math.max(0, Math.min(12, avg * 3));
  } else {
    pairSyn = 5; // nötr (henüz takım yok)
  }

  // ══════════════════════════════════════════════════════════════════════
  // 4. KOMPOZISYON FIT (0-12)
  //    a) Rakip arketipi sayma
  //    b) Kendi takım arketipi tutarlılığı (Pro)
  //    c) Takım ihtiyaçları: AP/AD dengesi, frontline, engage
  // ══════════════════════════════════════════════════════════════════════
  let compFit = 4;

  // a) Rakip arketipi karşılama
  if (enemies.length >= 2) {
    const enemyArch = detectCompArchetype(enemies.map(id => ({ champId: id })));
    if (enemyArch) {
      const archetypeCounterMap = {
        engage:    ['disengage', 'peel', 'poke', 'anti_engage'],
        poke:      ['engage', 'mobility', 'frontline'],
        teamfight: ['splitpush', 'disengage', 'poke'],
        scaling:   ['early_game', 'pick', 'assassin'],
        splitpush: ['frontline', 'peel', 'teamfight'],
        pick:      ['peel', 'frontline', 'disengage'],
      };
      const ctrs = archetypeCounterMap[enemyArch.type] || [];
      compFit += ctrs.filter(t => tags.includes(t)).length * 2;
    }
  }

  // b) Kendi takım arketip tutarlılığı (Pro)
  if (mode === 'pro' && allies.length >= 1) {
    const allyArch = detectCompArchetype(allies.map(id => ({ champId: id })));
    if (allyArch && allyArch.score >= 3) {
      const archTags = COMP_ARCHETYPES[allyArch.type]?.tags || [];
      compFit += archTags.filter(t => tags.includes(t)).length * 1.5;
    }
  }

  // c) Takım ihtiyaçları: AP/AD + frontline + engage
  const allyPicks = allies.map(id => ({ champId: id }));
  const needs     = analyzeTeamNeeds(allyPicks, getChampionTags);
  if (needs.needsFrontline && (tags.includes('frontline') || tags.includes('tank') || tags.includes('bruiser'))) compFit += 3;
  if (needs.needsEngage    && (tags.includes('engage')    || tags.includes('cc')))                               compFit += 2;
  if (needs.needsAP        && tags.includes('ap'))                                                               compFit += 2;
  if (needs.needsAD        && (tags.includes('ad') || tags.includes('adc')))                                    compFit += 2;
  if (needs.isAPHeavy && tags.includes('ap') && !tags.includes('ad'))                                           compFit -= 2;
  if (needs.isADHeavy && (tags.includes('ad') || tags.includes('adc')) && !tags.includes('ap'))                 compFit -= 2;

  compFit = Math.max(0, Math.min(12, compFit));

  // ══════════════════════════════════════════════════════════════════════
  // 5. LANE PRIORITY (0-10)
  // Pro pick rate × rol uygunluğu
  // ══════════════════════════════════════════════════════════════════════
  let laneScore = 0;
  if (!roleFit) {
    laneScore = 0;
  } else if (rolePickCount < MIN_ROLE_PICKS) {
    laneScore = 2;
  } else {
    const pr = typeof champ.pickRate === 'object'
      ? (champ.pickRate[role] || 0)
      : (champ.pickRate || 0);
    laneScore = Math.min(10, 3 + (pr / 4));
  }

  // ══════════════════════════════════════════════════════════════════════
  // 6. DRAFT POSITION SCORE (0-10)
  // Blind pick: blindSafe + presence + flex gerektirir
  // Counter pick: düşük blindSafe OK
  // Pro pick order uygunluğu (B1, R1R2, B2B3, last pick)
  // ══════════════════════════════════════════════════════════════════════
  const draftPos = getDraftPositionScore(champId, phaseInfo);

  // ══════════════════════════════════════════════════════════════════════
  // 7. TEAM BALANCE (0-10)
  // AP/AD denge profili + frontline ihtiyacı + engage/disengage dengesi + damage profili
  // ══════════════════════════════════════════════════════════════════════
  let balance = 5;
  if (allies.length >= 1) {
    if (needs.needsAP        && tags.includes('ap'))                                  balance += 2;
    if (needs.needsAD        && (tags.includes('ad') || tags.includes('adc')))        balance += 2;
    if (needs.isAPHeavy      && tags.includes('ap') && !tags.includes('ad'))          balance -= 2;
    if (needs.isADHeavy      && (tags.includes('ad') || tags.includes('adc')) && !tags.includes('ap')) balance -= 2;
    if (needs.needsFrontline && (tags.includes('frontline') || tags.includes('tank'))) balance += 2;
    if (needs.needsEngage    && tags.includes('engage'))                               balance += 1;
    if (needs.hasPoke        && tags.includes('disengage'))                            balance += 1; // poke comp + disengage = iyi
  }
  balance = Math.max(0, Math.min(10, balance));

  // ══════════════════════════════════════════════════════════════════════
  // 8. FLEX VALUE + BLINDABILITY (0-8)
  // Kaç rolle oynanabilir × blind pick güvenliği
  // ══════════════════════════════════════════════════════════════════════
  const numRoles = Array.isArray(champ.roles) ? champ.roles.length : 1;
  let flexScore  = Math.min(4, (numRoles - 1) * 3);
  const bs = champ.blindPickSafety || 5;
  if (bs >= 8) flexScore += 4;
  else if (bs >= 7) flexScore += 3;
  else if (bs >= 5) flexScore += 1;
  flexScore = Math.min(8, flexScore);

  // ══════════════════════════════════════════════════════════════════════
  // 9. SCALING + OBJECTIVE (0-8)
  // Geç oyun gücü + objective kontrol kapasitesi
  // ══════════════════════════════════════════════════════════════════════
  const spike = getPowerSpike(champId);
  let scaleObj = Math.min(5, spike.late / 2);
  if (tags.includes('objective')) scaleObj += 2;
  if (tags.includes('cc') || tags.includes('engage')) scaleObj += 1;
  scaleObj = Math.min(8, scaleObj);

  // ══════════════════════════════════════════════════════════════════════
  // 10. ROLE APP (0-6) — Rol uygunluğu
  // ══════════════════════════════════════════════════════════════════════
  const roleApp = roleFit ? 6 : 0;

  // ── Raw score map ──────────────────────────────────────────────────
  const rawScores = {
    meta:     metaScore,
    counter:  counterScore,
    pairSyn:  pairSyn,
    compFit:  compFit,
    lane:     laneScore,
    draftPos: draftPos,
    balance:  balance,
    flex:     flexScore,
    scaling:  scaleObj,
    roleApp:  roleApp,
  };
  const MAX_RAW = {
    meta:15, counter:15, pairSyn:12, compFit:12, lane:10,
    draftPos:10, balance:10, flex:8, scaling:8, roleApp:6,
  };

  // ── Mod bazlı ağırlıklar ───────────────────────────────────────────
  const weights = mode === 'soloq'
    ? { meta:1.1, counter:1.5, pairSyn:0.8, compFit:0.9, lane:1.3,
        draftPos:0.5, balance:0.7, flex:0.6, scaling:0.9, roleApp:1.0 }
    : { meta:1.4, counter:1.0, pairSyn:1.4, compFit:1.3, lane:0.9,
        draftPos:1.2, balance:1.3, flex:1.3, scaling:1.0, roleApp:1.0 };

  // ── Faz farkındalıklı ağırlık ayarları ────────────────────────────
  if (isBlind) {
    if (mode === 'pro') {
      weights.meta    *= 1.8;  // presence dominant
      weights.draftPos *= 2.0; // blind safety kritik
      weights.flex    *= 1.5;  // flex pick değerli
      weights.counter  = Math.max(0.3, weights.counter * 0.5); // rakip henüz bilinmiyor
    } else {
      weights.flex    *= 1.3;
      weights.counter  = Math.max(0.5, weights.counter * 0.7);
    }
  } else if (phase === 'pick2') {
    if (mode === 'pro') {
      weights.counter  *= 2.5;  // counter pick fazı dominant
      weights.compFit  *= 1.8;  // kompozisyon tamamlama kritik
      weights.draftPos *= 1.3;  // last pick pozisyon bonusu
      weights.meta     *= 0.7;  // meta önemi azalır
    } else {
      weights.counter  *= 2.0;
      weights.meta     *= 0.8;
    }
  }

  // ── Normalize 0-100 ────────────────────────────────────────────────
  let total = 0, maxTotal = 0;
  for (const [key, w] of Object.entries(weights)) {
    total    += (rawScores[key] || 0) * w;
    maxTotal += (MAX_RAW[key]   || 10) * w;
  }
  const score = Math.round((total / maxTotal) * 100);

  // ── Gerekçe metinleri ──────────────────────────────────────────────
  const { tier } = tierInfo;
  const reasoning = [];
  if (metaScore >= 12)           reasoning.push(`🔥 Tier ${tier} — presence ${presence.toFixed(0)}%`);
  else if (metaScore >= 7)       reasoning.push(`📊 Tier ${tier} — presence ${presence.toFixed(0)}%`);
  else if (mode === 'pro' && presence < 15) reasoning.push(`⚠️ Tier ${tier} — düşük presence (${presence.toFixed(0)}%)`);
  if (counterScore >= 10)        reasoning.push('⚔️ Rakip şampiyonlara güçlü counter');
  if (pairSyn >= 9)              reasoning.push('🤝 Pro pair sinerji çok güçlü');
  if (compFit >= 9)              reasoning.push('🎯 Kompozisyonu mükemmel tamamlar');
  if (draftPos >= 9)             reasoning.push('🥇 İdeal blind pick: güvenli + meta');
  if (balance >= 8)              reasoning.push('⚖️ Takım AP/AD + frontline dengesini sağlıyor');
  if (flexScore >= 6)            reasoning.push('🔄 Flex pick — role bilgisi gizlenir');
  if (scaleObj >= 6)             reasoning.push('📈 Güçlü objective kontrolü + scaling');
  if (needs.needsFrontline && (tags.includes('frontline') || tags.includes('tank'))) reasoning.push('🛡️ Kritik frontline ihtiyacı karşılanıyor');
  if (needs.needsAP && tags.includes('ap')) reasoning.push('💫 AP eksikliğini kapatıyor');
  if (roleApp === 0)             reasoning.push('⚠️ Off-role — risk yüksek');

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown: rawScores,
    reasoning,
    tier,
  };
}

// ============================================================
// ÖNERİ MOTORU
// ============================================================

export function getRecommendations(role, blueTeam, redTeam, userTeam, mode, limit = 3) {
  const usedChamps = new Set([
    ...blueTeam.map(p => p.champId),
    ...redTeam.map(p => p.champId),
  ]);

  const phaseInfo = getDraftPhaseInfo(blueTeam, redTeam, [], []);
  const results   = [];

  for (const [champId, champData] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (usedChamps.has(champId)) continue;
    if (!Array.isArray(champData.roles) || !champData.roles.includes(role)) continue;

    // Minimum örnek boyutu kontrolü — bu roldeki pick sayısı çok azsa atla
    const rolePickCount = champData.rolePickCounts?.[role] || 0;
    if (rolePickCount > 0 && rolePickCount < MIN_ROLE_PICKS) continue;

    const { score, breakdown, reasoning } = calculateDraftScore(
      champId, role, blueTeam, redTeam, userTeam, mode, phaseInfo
    );

    const rawWR = typeof champData.winRate === 'object'
      ? (champData.winRate[role] ?? Object.values(champData.winRate)[0] ?? 50)
      : (champData.winRate ?? 50);
    const wr = bayesianWR(rawWR, rolePickCount);
    const pr = typeof champData.pickRate === 'object'
      ? (champData.pickRate[role] || Object.values(champData.pickRate)[0] || 0)
      : (champData.pickRate || 0);

    results.push({
      champId,
      name: champData.name,
      role,
      score,
      breakdown,
      reasoning,
      winRate: wr,
      pickRate: pr,
      banRate: champData.banRate || 0,
      presence: champData.presence || 0,
      tags: getChampionTags(champId),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ============================================================
// BAN ÖNERİ ALGORİTMASI — Expected Ban Value (EBV)
// EBV = P(rakip alır) × güç × bizim zayıflığımıza etki
// ============================================================

export function getBanSuggestions(ownTeam, enemyTeam, ownBans, enemyBans, mode, limit = 5) {
  const alreadyBanned = new Set([...ownBans, ...enemyBans]);
  const allPicked     = new Set([
    ...ownTeam.map(p => p.champId),
    ...enemyTeam.map(p => p.champId),
  ]);

  const ownProfile = getTeamPowerProfile(ownTeam);
  const suggestions = [];

  for (const [champId, champ] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (alreadyBanned.has(champId) || allPicked.has(champId)) continue;

    const tierInfo  = getChampionProTier(champId);
    const tierMult  = TIER_BAN_MULT[tierInfo.tier] ?? 1.0;

    // Pro modda D tier şampiyonları asla banlama — ban israfı
    if (mode === 'pro' && tierInfo.tier === 'D') continue;
    // C tier sadece direkt tehdit varsa banlanabilir
    if (mode === 'pro' && tierInfo.tier === 'C' && !enemyTeam.length) continue;

    const tags = getChampionTags(champId);

    // P(rakip alır) ≈ tier-weighted presence
    const pPickedByEnemy = Math.min(1, (champ.presence || 0) / 100);

    // Güç = presence + WR bazlı
    const wr = typeof champ.winRate === 'object'
      ? (Object.values(champ.winRate)[0] || 50)
      : (champ.winRate || 50);
    const power = ((champ.presence || 0) * 0.6 + Math.max(0, wr - 45) * 4) / 100;

    // Bizim zayıflığımıza etki
    let threatToUs = 0;
    if (ownProfile.apCount >= 3  && tags.includes('ad'))         threatToUs += 0.3;
    if (ownProfile.adCount >= 3  && tags.includes('ap'))         threatToUs += 0.3;
    if (ownProfile.ccCount <= 1  && tags.includes('engage'))     threatToUs += 0.4;
    if (ownProfile.peelCount === 0 && tags.includes('assassin')) threatToUs += 0.3;
    if (!getChampionTags(ownTeam[0]?.champId || '').includes('splitpush') && tags.includes('splitpush')) threatToUs += 0.2;

    // EBV × tier multiplier = final ban değeri
    const ebv      = pPickedByEnemy * power * (1 + threatToUs);
    const banBonus = (champ.banRate || 0) / 100;
    const priority = (ebv + banBonus) * tierMult;

    if (priority > 0.02) {
      let reason = `Tier ${tierInfo.tier}: `;
      if (champ.presence >= 60)                                    reason += `Perma pick/ban (${champ.presence.toFixed(0)}% presence)`;
      else if (tags.includes('engage') && ownProfile.ccCount <= 1) reason += 'Engage tehdidi — CC zayıflığımızı sömürür';
      else if (tags.includes('assassin') && ownProfile.peelCount === 0) reason += 'Assassin tehdidi — backline korumasız';
      else if (tags.includes('splitpush'))                         reason += 'Split push tehlikesi — cevap veremeyiz';
      else if (wr >= 53)                                           reason += `Win rate ${wr.toFixed(1)}% — güçlü meta şampiyonu`;
      else reason += 'Meta tehdit';

      suggestions.push({
        champId, name: champ.name, priority, reason,
        presence: champ.presence || 0, banRate: champ.banRate || 0,
        tier: tierInfo.tier, tags,
      });
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

// ============================================================
// KOMPOZİSYON ANALİZİ
// ============================================================

export function analyzeComposition(blueTeam, redTeam, userTeam) {
  const ownTeam   = userTeam === 'blue' ? blueTeam : redTeam;
  const enemyTeam = userTeam === 'blue' ? redTeam  : blueTeam;

  const ownProfile   = getTeamPowerProfile(ownTeam);
  const enemyProfile = getTeamPowerProfile(enemyTeam);

  const ownArch   = detectCompArchetype(ownTeam);
  const enemyArch = detectCompArchetype(enemyTeam);

  // Takım avantajı — meta presence karşılaştırması
  let ownMeta = 0, enemyMeta = 0;
  for (const p of ownTeam)   ownMeta   += (championMeta[p.champId]?.presence || 0);
  for (const p of enemyTeam) enemyMeta += (championMeta[p.champId]?.presence || 0);

  const teamAdvantage =
    ownMeta > enemyMeta + 20 ? 'Own' :
    enemyMeta > ownMeta + 20 ? 'Enemy' : 'Equal';

  // Erken / geç oyun
  const earlyLabel = ownProfile.early > enemyProfile.early + 1
    ? '🔥 Bizde üstünlük' : ownProfile.early < enemyProfile.early - 1
    ? '❄️ Rakipte üstünlük' : '⚖️ Dengeli';

  const lateLabel = ownProfile.late > enemyProfile.late + 1
    ? '📈 Bizde üstünlük' : ownProfile.late < enemyProfile.late - 1
    ? '📉 Rakipte üstünlük' : '⚖️ Dengeli';

  // Teamfight
  const tfScore = (ownProfile.ccCount * 2 + ownProfile.engageCount) -
                  (enemyProfile.ccCount * 2 + enemyProfile.engageCount);
  const teamfight = tfScore > 1 ? '💪 Güçlü' : tfScore < -1 ? '😰 Zayıf' : '⚔️ Nötr';

  // CC
  const ccLabel = `Bizde: ${ownProfile.ccCount} | Rakipte: ${enemyProfile.ccCount}`;

  // AP/AD dengesi
  const ownBalance = `AD:${ownProfile.adCount} AP:${ownProfile.apCount}`;
  const enemyBalance = `AD:${enemyProfile.adCount} AP:${enemyProfile.apCount}`;

  // Scaling
  const scalingDiff = ownProfile.late - enemyProfile.late;
  const scalingLabel =
    scalingDiff > 1.5 ? '📈 Bizde üstünlük' :
    scalingDiff < -1.5 ? '📉 Rakipte üstünlük' : '⚖️ Dengeli';

  // Split push
  const ownHasSplit = ownTeam.some(p => getChampionTags(p.champId).includes('splitpush'));
  const enemyHasSplit = enemyTeam.some(p => getChampionTags(p.champId).includes('splitpush'));

  return {
    teamAdvantage,
    earlyGame: earlyLabel,
    lateGame: lateLabel,
    teamfight,
    splitPush: ownHasSplit ? '✅ Var' : '❌ Yok',
    enemySplitPush: enemyHasSplit ? '⚠️ Rakipte var' : '✅ Rakipte yok',
    scaling: scalingLabel,
    cc: ccLabel,
    ownBalance,
    enemyBalance,
    ownArchetype: ownArch,
    enemyArchetype: enemyArch,
    ownProfile,
    enemyProfile,
    ownMeta: ownMeta.toFixed(0),
    enemyMeta: enemyMeta.toFixed(0),
  };
}

// ============================================================
// UYARI SİSTEMİ
// ============================================================

export function detectWarnings(ownTeam, enemyTeam, mode) {
  const warnings = [];
  const ownProfile   = getTeamPowerProfile(ownTeam);
  const enemyProfile = getTeamPowerProfile(enemyTeam);

  if (ownTeam.length < 2) return warnings;

  // AP/AD dengesi
  if (ownProfile.apCount === 0 && ownTeam.length >= 3)
    warnings.push({ level:'error', text:'Takımda AP hasar yok — rakip armor stacking yapabilir' });
  if (ownProfile.adCount === 0 && ownTeam.length >= 3)
    warnings.push({ level:'error', text:'Takımda AD hasar yok — rakip MR stacking yapabilir' });
  if (ownProfile.adCount >= 4)
    warnings.push({ level:'warn', text:'Tüm hasar AD — 1-2 armor itemi rakibi çok dayanıklı yapar' });
  if (ownProfile.apCount >= 4)
    warnings.push({ level:'warn', text:'Tüm hasar AP — 1-2 MR itemi rakibi çok dayanıklı yapar' });

  // CC eksikliği
  if (ownProfile.ccCount === 0 && ownTeam.length >= 3)
    warnings.push({ level:'error', text:'Hiç CC yok — objective fight ve engage\'e cevap veremezsiniz' });
  else if (ownProfile.ccCount === 1 && ownTeam.length >= 4)
    warnings.push({ level:'warn', text:'CC çok az — engage composition\'lara karşı zayıf' });

  // Engage/peel dengesi
  if (ownProfile.engageCount === 0 && ownTeam.length >= 4)
    warnings.push({ level:'warn', text:'Engage yok — fight başlatmak zor, reactive playstyle zorunlu' });
  if (ownProfile.peelCount === 0 && ownTeam.length >= 3) {
    const hasAssassin = enemyTeam.some(p => getChampionTags(p.champId).includes('assassin'));
    if (hasAssassin)
      warnings.push({ level:'error', text:'Peel/disengage yok — rakip assassin backline\'ı siler' });
  }

  // Frontline eksikliği
  const ownFrontline = ownTeam.filter(p => {
    const t = getChampionTags(p.champId);
    return t.includes('frontline') || t.includes('tank');
  }).length;
  if (ownFrontline === 0 && ownTeam.length >= 4)
    warnings.push({ level:'warn', text:'Frontline yok — squishly comp, dive\'a karşı savunmasız' });

  // Erken oyun zayıflığı
  if (ownProfile.early < 4 && ownTeam.length >= 4 && enemyProfile.early > 7)
    warnings.push({ level:'warn', text:'Erken oyun çok zayıf — first dragon/herald kaybedebilirsiniz' });

  // Scaling eksikliği (pro mode)
  if (mode === 'pro' && ownProfile.late < 6 && ownTeam.length >= 4)
    warnings.push({ level:'info', text:'Geç oyun gücü sınırlı — erken kapatma stratejisi gerekli' });

  // Rakip split push tehlikesi
  const enemyHasSplit = enemyTeam.some(p => getChampionTags(p.champId).includes('splitpush'));
  const ownHasSplitAnswer = ownTeam.some(p => {
    const t = getChampionTags(p.champId);
    return t.includes('splitpush') || t.includes('frontline');
  });
  if (enemyHasSplit && !ownHasSplitAnswer && ownTeam.length >= 3)
    warnings.push({ level:'warn', text:'Rakip split push yapıyor — 1v1 cevap verecek şampiyon gerekli' });

  return warnings;
}

// ============================================================
// RAKİP TAHMİN ALGORİTMASI — Minimax Temelli
// "Rakibin optimal hamlesi ne olurdu?"
// ============================================================

export function predictEnemyNextPicks(enemyTeam, ownTeam, enemyBans) {
  const usedOrBanned = new Set([
    ...enemyTeam.map(p => p.champId),
    ...ownTeam.map(p => p.champId),
    ...enemyBans,
  ]);

  const enemyArch = detectCompArchetype(enemyTeam);
  const predictions = [];

  for (const [champId, champ] of Object.entries(championMeta)) {
    if (champId === '_meta') continue;
    if (usedOrBanned.has(champId)) continue;

    const tags = getChampionTags(champId);

    // Meta ağırlığı
    const metaWeight = (champ.presence || 0) / 100;

    // Takım uyumu — rakibin kendi kompozisyonuna uyuyor mu?
    let synergyWithEnemy = 0;
    for (const ep of enemyTeam) {
      synergyWithEnemy += champ.synergies?.[ep.champId] || 0;
    }
    const avgSynergy = enemyTeam.length > 0 ? synergyWithEnemy / enemyTeam.length : 0;

    // Arketip tamamlama skoru
    let archCompletionBonus = 0;
    if (enemyArch) {
      const archTags = COMP_ARCHETYPES[enemyArch.type]?.tags || [];
      archCompletionBonus = archTags.filter(t => tags.includes(t)).length * 0.2;
    }

    // Bize karşı counter değeri (rakibin perspektifinden)
    let counterUs = 0;
    for (const op of ownTeam) {
      counterUs += champ.counters?.[op.champId] || 0;
    }
    const avgCounterUs = ownTeam.length > 0 ? counterUs / ownTeam.length : 0;

    const totalScore = metaWeight * 0.4 + (avgSynergy / 5) * 0.3 + archCompletionBonus * 0.2 + (avgCounterUs / 5) * 0.1;

    if (totalScore > 0.05) {
      let reason = '';
      if (champ.presence >= 50) reason = `Meta dominant (${champ.presence.toFixed(0)}% presence)`;
      else if (avgSynergy > 2)  reason = `Takımıyla iyi sinerji (${avgSynergy.toFixed(1)} avg)`;
      else if (avgCounterUs > 2) reason = 'Bizim kompozisyona güçlü counter';
      else reason = 'Kompozisyonunu tamamlar';

      predictions.push({
        champId,
        name: champ.name,
        confidence: Math.round(totalScore * 100),
        reason,
        tags,
      });
    }
  }

  return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// ============================================================
// KOÇLUK RAPORU — Ana Fonksiyon
// Tüm analizi bir arada döndürür
// ============================================================

export function generateProDraftAnalysis(blueTeam, redTeam, blueBans, redBans, userTeam, userRole, mode) {
  const ownTeam   = userTeam === 'blue' ? blueTeam  : redTeam;
  const enemyTeam = userTeam === 'blue' ? redTeam   : blueTeam;
  const ownBans   = userTeam === 'blue' ? blueBans  : redBans;
  const enemyBans = userTeam === 'blue' ? redBans   : blueBans;

  const phase           = getDraftPhaseInfo(blueTeam, redTeam, blueBans, redBans);
  const composition     = analyzeComposition(blueTeam, redTeam, userTeam);
  const recommendations = userRole
    ? getRecommendations(userRole, blueTeam, redTeam, userTeam, mode, 3)
    : [];
  const banSuggestions     = getBanSuggestions(ownTeam, enemyTeam, ownBans, enemyBans, mode, 5);
  const warnings           = detectWarnings(ownTeam, enemyTeam, mode);
  const predictedEnemyPicks = predictEnemyNextPicks(enemyTeam, ownTeam, enemyBans);

  // Koç özet yorumu
  let coachComment = '';
  if (ownTeam.length === 0 && enemyTeam.length === 0) {
    coachComment = 'Draft başlamayı bekliyor. Ban önerilerini uygula ve ilk pick\'ini planla.';
  } else if (phase.phase === 'ban1') {
    coachComment = `${phase.advice} — Şu an ${phase.label} aşamasındasın.`;
  } else if (phase.phase === 'pick1') {
    const arch = composition.ownArchetype;
    coachComment = arch
      ? `${arch.info.label} inşa ediyorsunuz. ${arch.info.winCondition}.`
      : 'Kompozisyon şekilleniyor — flex pick ve meta priority değerlendirin.';
  } else if (phase.phase === 'ban2') {
    coachComment = 'İkinci ban fazı: rakibin kalan flex pick\'lerini ve sizin planınızı bozan şampiyonları banla.';
  } else {
    const enemyArch = composition.enemyArchetype;
    coachComment = enemyArch
      ? `Rakip ${enemyArch.info.label} oynuyor. Cevap: ${enemyArch.info.strengths.join(', ')} dışında kal.`
      : 'Counter pick fazı — rakip kompozisyonuna net cevap ver.';
  }

  return {
    phase,
    composition,
    recommendations,
    banSuggestions,
    warnings,
    predictedEnemyPicks,
    coachComment,
    timestamp: new Date(),
  };
}

export default {
  generateProDraftAnalysis,
  calculateDraftScore,
  getRecommendations,
  getBanSuggestions,
  analyzeComposition,
  detectWarnings,
  predictEnemyNextPicks,
  getDraftPhaseInfo,
  getChampionTags,
  getPowerSpike,
  detectCompArchetype,
};
