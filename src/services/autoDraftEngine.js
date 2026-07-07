import championMeta from '../data/championMeta.json';
import {
  calculateDraftScore,
  getBanSuggestions,
  generateProDraftAnalysis,
} from './draftAnalysis.js';
import { isProHardBlacklisted } from './proMetaEngine.js';

// Standard LoL tournament draft order
// Ban Phase 1: B-R-B-R-B-R (6 bans)
// Pick Phase 1: B-R-R-B-B-R (6 picks)
// Ban Phase 2: R-B-R-B     (4 bans)
// Pick Phase 2: R-B-B-R    (4 picks)

export const DRAFT_ORDER = [
  { type: 'ban',  team: 'blue', phase: 'ban1',  label: 'Ban 1',   num: 1  },
  { type: 'ban',  team: 'red',  phase: 'ban1',  label: 'Ban 2',   num: 2  },
  { type: 'ban',  team: 'blue', phase: 'ban1',  label: 'Ban 3',   num: 3  },
  { type: 'ban',  team: 'red',  phase: 'ban1',  label: 'Ban 4',   num: 4  },
  { type: 'ban',  team: 'blue', phase: 'ban1',  label: 'Ban 5',   num: 5  },
  { type: 'ban',  team: 'red',  phase: 'ban1',  label: 'Ban 6',   num: 6  },
  { type: 'pick', team: 'blue', phase: 'pick1', label: 'Pick 1',  num: 7  },
  { type: 'pick', team: 'red',  phase: 'pick1', label: 'Pick 2',  num: 8  },
  { type: 'pick', team: 'red',  phase: 'pick1', label: 'Pick 3',  num: 9  },
  { type: 'pick', team: 'blue', phase: 'pick1', label: 'Pick 4',  num: 10 },
  { type: 'pick', team: 'blue', phase: 'pick1', label: 'Pick 5',  num: 11 },
  { type: 'pick', team: 'red',  phase: 'pick1', label: 'Pick 6',  num: 12 },
  { type: 'ban',  team: 'red',  phase: 'ban2',  label: 'Ban 7',   num: 13 },
  { type: 'ban',  team: 'blue', phase: 'ban2',  label: 'Ban 8',   num: 14 },
  { type: 'ban',  team: 'red',  phase: 'ban2',  label: 'Ban 9',   num: 15 },
  { type: 'ban',  team: 'blue', phase: 'ban2',  label: 'Ban 10',  num: 16 },
  { type: 'pick', team: 'red',  phase: 'pick2', label: 'Pick 7',  num: 17 },
  { type: 'pick', team: 'blue', phase: 'pick2', label: 'Pick 8',  num: 18 },
  { type: 'pick', team: 'blue', phase: 'pick2', label: 'Pick 9',  num: 19 },
  { type: 'pick', team: 'red',  phase: 'pick2', label: 'Pick 10', num: 20 },
];

const ALL_ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];

// ============================================================
// BAN AI
// Her ban kararinda: rakibin alabilecegi en tehlikeli sampiyonu yasak et
// Expected Ban Value (EBV) = P(rakip alir) x guc x bizim zayifligimiza etki
// ============================================================

function computeAIBan(actingTeam, blueTeam, redTeam, blueBans, redBans) {
  const ownTeam   = actingTeam === 'blue' ? blueTeam  : redTeam;
  const enemyTeam = actingTeam === 'blue' ? redTeam   : blueTeam;
  const ownBans   = actingTeam === 'blue' ? blueBans  : redBans;
  const enemyBans = actingTeam === 'blue' ? redBans   : blueBans;

  const suggestions = getBanSuggestions(ownTeam, enemyTeam, ownBans, enemyBans, 'pro', 3);

  if (suggestions.length > 0) {
    const top = suggestions[0];
    return {
      champId: top.champId,
      name: top.name || championMeta[top.champId]?.name || top.champId,
      reason: top.reason || 'EBV analizi',
      priority: top.priority,
    };
  }

  // Fallback: ban en yuksek presence'li musait sampiyonu
  const used = new Set([
    ...blueBans, ...redBans,
    ...blueTeam.map(p => p.champId),
    ...redTeam.map(p => p.champId),
  ]);
  const fallback = Object.entries(championMeta)
    .filter(([id]) => id !== '_meta' && !used.has(id))
    .sort((a, b) => (b[1].presence || 0) - (a[1].presence || 0))[0];

  if (!fallback) return null;
  return {
    champId: fallback[0],
    name: fallback[1].name,
    reason: `Presence ${(fallback[1].presence || 0).toFixed(0)}% — meta tehdidi`,
    priority: (fallback[1].presence || 0) / 100,
  };
}

// ============================================================
// PICK AI — Greedy Best-First
// Kalan roller icin en iyi (sampiyon, rol) cifti secilir
// Blind fazda: yuksek flex/safety + meta, counter fazda: karsi kompozisyon analizi
// ============================================================

function computeAIPick(actingTeam, blueTeam, redTeam, blueBans, redBans, phase) {
  const ownTeam = actingTeam === 'blue' ? blueTeam : redTeam;

  const used = new Set([
    ...blueBans, ...redBans,
    ...blueTeam.map(p => p.champId),
    ...redTeam.map(p => p.champId),
  ]);

  const filledRoles = new Set(ownTeam.map(p => p.role));
  const remaining   = ALL_ROLES.filter(r => !filledRoles.has(r));

  if (!remaining.length) return null;

  // Faz bilgisi: blind pick (ilk seçim) mi, counter faz mı?
  const isBlind   = phase === 'pick1' && ownTeam.length === 0;
  const phaseInfo = { isBlind, phase };

  let best      = null;
  let bestScore = -Infinity;

  for (const role of remaining) {
    for (const [champId, champ] of Object.entries(championMeta)) {
      if (champId === '_meta') continue;
      if (used.has(champId)) continue;
      if (!Array.isArray(champ.roles) || !champ.roles.includes(role)) continue;

      // Pro hard blacklist: bu roldeki presence < 4% → asla seçme
      // (rol-spesifik kontrol — başka rolde güçlü bir şampiyon bu role sızmasın)
      if (isProHardBlacklisted(champId, role)) continue;

      const { score, reasoning, tier } = calculateDraftScore(
        champId, role, blueTeam, redTeam, actingTeam, 'pro', phaseInfo
      );

      // calculateDraftScore artık phase-aware weighting içeriyor;
      // fazladan counter bonusu kaldırıldı (çifte sayım önlendi)
      if (score > bestScore) {
        bestScore = score;
        best = {
          champId,
          name: champ.name,
          role,
          score: Math.round(score),
          reasoning,
          tier,
          presence: champ.presence || 0,
        };
      }
    }
  }

  return best;
}

// ============================================================
// TAM SIMULASYON — 20 adim, durum snapshoti her adimda kayit
// ============================================================

export function runFullSimulation(mode = 'pro') {
  const state = {
    blueTeam: [],
    redTeam:  [],
    blueBans: [],
    redBans:  [],
  };

  const steps = [];

  for (const order of DRAFT_ORDER) {
    const { type, team, phase, label, num } = order;

    if (type === 'ban') {
      const ban = computeAIBan(
        team, state.blueTeam, state.redTeam, state.blueBans, state.redBans
      );
      if (!ban) continue;

      if (team === 'blue') state.blueBans.push(ban.champId);
      else                 state.redBans.push(ban.champId);

      steps.push({
        stepNum:   steps.length + 1,
        orderNum:  num,
        type:      'ban',
        team,
        phase,
        label,
        champId:   ban.champId,
        champName: ban.name,
        reason:    ban.reason,
        // Durum snapshoti
        blueTeam:  state.blueTeam.map(p => ({ ...p })),
        redTeam:   state.redTeam.map(p => ({ ...p })),
        blueBans:  [...state.blueBans],
        redBans:   [...state.redBans],
      });

    } else {
      const pick = computeAIPick(
        team, state.blueTeam, state.redTeam, state.blueBans, state.redBans, phase
      );
      if (!pick) continue;

      if (team === 'blue') state.blueTeam.push({ champId: pick.champId, role: pick.role });
      else                 state.redTeam.push({ champId: pick.champId, role: pick.role });

      // Aciklama: en iyi reasoning veya otomatik uret
      const reasonText = pick.reasoning?.[0] ||
        `Draft Score ${pick.score} — ${pick.presence >= 50 ? 'Meta dominant' : 'En iyi rol secimi'}`;

      steps.push({
        stepNum:   steps.length + 1,
        orderNum:  num,
        type:      'pick',
        team,
        phase,
        label,
        champId:   pick.champId,
        champName: pick.name,
        role:      pick.role,
        score:     pick.score,
        reasoning: pick.reasoning || [],
        reason:    reasonText,
        // Durum snapshoti
        blueTeam:  state.blueTeam.map(p => ({ ...p })),
        redTeam:   state.redTeam.map(p => ({ ...p })),
        blueBans:  [...state.blueBans],
        redBans:   [...state.redBans],
      });
    }
  }

  // Final analiz
  const finalAnalysis = generateProDraftAnalysis(
    state.blueTeam, state.redTeam, state.blueBans, state.redBans, 'blue', null, mode
  );

  // Takimlarin toplam draft skorunu hesapla
  const blueScore = state.blueTeam.reduce((sum, p) => {
    const res = calculateDraftScore(p.champId, p.role, state.blueTeam, state.redTeam, 'blue', mode, { isBlind: false });
    return sum + res.score;
  }, 0);

  const redScore = state.redTeam.reduce((sum, p) => {
    const res = calculateDraftScore(p.champId, p.role, state.blueTeam, state.redTeam, 'red', mode, { isBlind: false });
    return sum + res.score;
  }, 0);

  return {
    steps,
    finalState: state,
    finalAnalysis,
    blueScore: Math.round(blueScore / Math.max(1, state.blueTeam.length)),
    redScore:  Math.round(redScore  / Math.max(1, state.redTeam.length)),
  };
}
