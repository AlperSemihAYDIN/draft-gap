import { useState, useEffect, useRef, useMemo } from 'react';
import { runFullSimulation, DRAFT_ORDER } from '../services/autoDraftEngine';
import { useDraftContext } from '../contexts/DraftContext';
import { getLatestVersion } from '../services/dataDragon';
import championMeta from '../data/championMeta.json';

// Sürümü dinamik olarak DDragon'dan çeker; fallback olarak güncel bilinen versiyon
let _ddVer = '16.12.1';
getLatestVersion().then(v => { _ddVer = v; }).catch(() => {});
const IMG = id => `https://ddragon.leagueoflegends.com/cdn/${_ddVer}/img/champion/${id}.png`;
const ROLES_ORD  = ['top', 'jungle', 'mid', 'adc', 'support'];
const ROLE_ICON  = { top:'🏔️', jungle:'🌿', mid:'⚡', adc:'🏹', support:'🛡️' };
const ROLE_LBL   = { top:'Top', jungle:'Jungle', mid:'Mid', adc:'ADC', support:'Support' };
const SPEEDS     = { slow: 2200, normal: 900, fast: 300, instant: 0 };
const PHASE_LBLS = {
  ban1:  'Ban Fazı 1',
  pick1: 'Pick Fazı 1',
  ban2:  'Ban Fazı 2',
  pick2: 'Pick Fazı 2 (Counter)',
};

export default function AutoDraftSimulator() {
  const { draftMode, userRole, setDraftMode, setUserRole } = useDraftContext();

  const [simResult,   setSimResult]   = useState(null);
  const [visible,     setVisible]     = useState(0);
  const [isPlaying,   setIsPlaying]   = useState(false);
  const [speed,       setSpeed]       = useState('normal');
  const timerRef = useRef(null);
  const feedRef  = useRef(null);

  // ------- Kontroller -------

  function startSim() {
    clearTimeout(timerRef.current);
    const result = runFullSimulation(draftMode);
    setSimResult(result);
    setVisible(0);
    if (speed === 'instant') {
      setVisible(result.steps.length);
    } else {
      setIsPlaying(true);
    }
  }

  function skipToEnd() {
    clearTimeout(timerRef.current);
    if (!simResult) {
      const result = runFullSimulation(draftMode);
      setSimResult(result);
      setVisible(result.steps.length);
    } else {
      setVisible(simResult.steps.length);
    }
    setIsPlaying(false);
  }

  function resetSim() {
    clearTimeout(timerRef.current);
    setSimResult(null);
    setVisible(0);
    setIsPlaying(false);
  }

  function togglePause() {
    setIsPlaying(p => !p);
  }

  // ------- Animasyon motoru -------
  useEffect(() => {
    if (!isPlaying || !simResult) return;
    const delay = SPEEDS[speed] ?? 900;
    timerRef.current = setTimeout(() => {
      setVisible(prev => {
        const next = prev + 1;
        if (next >= simResult.steps.length) setIsPlaying(false);
        return next;
      });
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, visible, simResult, speed]);

  // Auto-scroll
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [visible]);

  // ------- Hesaplamalar -------
  const currentStep   = simResult && visible > 0 ? simResult.steps[visible - 1] : null;
  const nextOrder     = simResult && visible < simResult.steps.length ? DRAFT_ORDER[visible] : null;
  const shownSteps    = simResult ? simResult.steps.slice(0, visible) : [];
  const isComplete    = simResult && visible >= simResult.steps.length;
  const totalSteps    = simResult?.steps.length ?? 20;
  const progress      = Math.round((visible / totalSteps) * 100);

  const blueTeam = currentStep?.blueTeam ?? [];
  const redTeam  = currentStep?.redTeam  ?? [];
  const blueBans = currentStep?.blueBans ?? [];
  const redBans  = currentStep?.redBans  ?? [];

  const bluePicksByRole = useMemo(() => {
    const m = {};
    for (const p of blueTeam) m[p.role] = p;
    return m;
  }, [blueTeam]);

  const redPicksByRole = useMemo(() => {
    const m = {};
    for (const p of redTeam) m[p.role] = p;
    return m;
  }, [redTeam]);

  // Aktif hamle
  const activeTeam = nextOrder?.team;
  const activeType = nextOrder?.type;

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* ══ BAŞLIK VE AYARLAR ══════════════════════════════════ */}
      <div className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl flex-shrink-0">🤖</span>
          <div>
            <h2 className="text-white font-bold text-xl">AI vs AI — Optimal Draft Simülatörü</h2>
            <p className="text-lol-light/40 text-sm mt-0.5">
              İki AI sistemi optimal draft için birbirine karşı oynuyor. Satranç makineleri gibi her hamle hesaplanıyor.
            </p>
          </div>
        </div>

        {/* Ayarlar satırı */}
        <div className="flex flex-wrap gap-4 items-center pt-1 border-t border-lol-light/5">
          {/* Mod */}
          <div className="flex items-center gap-2">
            <span className="text-lol-light/40 text-xs font-medium">Mod:</span>
            {[['pro','🏆 Pro Arena'],['soloq','🎮 SoloQ']].map(([m, lbl]) => (
              <button key={m} onClick={() => setDraftMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                  ${draftMode === m
                    ? m === 'pro'
                      ? 'bg-lol-blue/20 text-lol-blue border-lol-blue/40'
                      : 'bg-lol-gold/20 text-lol-gold border-lol-gold/40'
                    : 'text-lol-light/40 border-transparent hover:text-white'}`}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Rolünüz */}
          <div className="flex items-center gap-1.5">
            <span className="text-lol-light/40 text-xs font-medium">Rolünüz (Mavi takım):</span>
            {ROLES_ORD.map(r => (
              <button key={r} onClick={() => setUserRole(r)} title={ROLE_LBL[r]}
                className={`w-8 h-8 rounded-lg text-base transition-all
                  ${userRole === r ? 'bg-lol-gold/25 border border-lol-gold/50' : 'hover:bg-lol-light/10 border border-transparent'}`}>
                {ROLE_ICON[r]}
              </button>
            ))}
          </div>

          {/* Hız */}
          <div className="flex items-center gap-1.5">
            <span className="text-lol-light/40 text-xs font-medium">Hız:</span>
            {[['slow','🐢'],['normal','⚡'],['fast','🚀'],['instant','⏩']].map(([k, icon]) => (
              <button key={k} onClick={() => setSpeed(k)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all border
                  ${speed === k ? 'bg-lol-gold/20 text-lol-gold border-lol-gold/30' : 'text-lol-light/30 border-transparent hover:text-white'}`}>
                {icon} {k === 'slow' ? 'Yavaş' : k === 'normal' ? 'Normal' : k === 'fast' ? 'Hızlı' : 'Anında'}
              </button>
            ))}
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex flex-wrap items-center gap-2">
          {!simResult ? (
            <button onClick={startSim}
              className="px-6 py-2.5 bg-lol-gold/20 hover:bg-lol-gold/30 border border-lol-gold/50 text-lol-gold rounded-xl text-sm font-bold transition-all shadow-lg shadow-lol-gold/10">
              ▶ Simülasyonu Başlat
            </button>
          ) : isComplete ? (
            <button onClick={resetSim}
              className="px-6 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-300 rounded-xl text-sm font-bold transition-all">
              ↺ Yeni Simülasyon
            </button>
          ) : (
            <>
              <button onClick={togglePause}
                className="px-5 py-2.5 bg-lol-blue/20 hover:bg-lol-blue/30 border border-lol-blue/40 text-lol-blue rounded-xl text-sm font-bold transition-all">
                {isPlaying ? '⏸ Duraklat' : '▶ Devam Et'}
              </button>
              <button onClick={skipToEnd}
                className="px-4 py-2.5 bg-lol-light/5 hover:bg-lol-light/10 border border-lol-light/10 text-lol-light/50 rounded-xl text-sm transition-all">
                ⏩ Sona Atla
              </button>
              <button onClick={resetSim}
                className="px-4 py-2.5 text-lol-light/30 hover:text-red-400 text-sm transition-all rounded-xl">
                ↺ Sıfırla
              </button>
            </>
          )}

          {/* Progress bar */}
          {simResult && (
            <div className="flex items-center gap-3 ml-auto">
              <div className="w-40 h-2 bg-lol-light/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-lol-blue to-lol-gold rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }} />
              </div>
              <span className="text-lol-light/40 text-xs font-mono">{visible}/{totalSteps}</span>
            </div>
          )}
        </div>

        {/* Aktif hamle göstergesi */}
        {nextOrder && !isComplete && (
          <div className="flex items-center gap-3 bg-lol-dark/60 border border-lol-light/5 rounded-lg p-3">
            <div className={`w-2 h-2 rounded-full animate-pulse ${activeTeam === 'blue' ? 'bg-blue-400' : 'bg-red-400'}`} />
            <span className="text-lol-light/50 text-xs">
              Şu an:
            </span>
            <span className={`text-xs font-bold ${activeTeam === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
              {activeTeam === 'blue' ? '🔵 Mavi AI' : '🔴 Kırmızı AI'}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${activeType === 'ban' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
              {activeType === 'ban' ? '🚫 Yasaklama' : '✅ Seçim'}
            </span>
            <span className="text-lol-light/30 text-xs">{PHASE_LBLS[nextOrder.phase]}</span>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <span>🏆</span>
            <span className="text-green-300 text-sm font-medium">Draft tamamlandı! Analiz aşağıda.</span>
          </div>
        )}
      </div>

      {/* ══ DRAFT TAHTASI ══════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr,56px,1fr] gap-3">

        {/* Mavi Takım */}
        <TeamPanel
          team="blue"
          label="🔵 MAVİ TAKIM"
          subLabel="AI Alpha"
          picks={bluePicksByRole}
          bans={blueBans}
          userRole={userRole}
          isActive={activeTeam === 'blue'}
          activeType={activeType}
          scoreLabel={isComplete && simResult ? `${simResult.blueScore}` : null}
        />

        {/* Orta panel */}
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <span className="text-lol-light/20 text-lg font-bold">VS</span>
          {activeTeam && !isComplete && (
            <div className={`text-[10px] text-center px-1.5 py-1 rounded-lg font-bold animate-pulse
              ${activeTeam === 'blue' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
              {nextOrder?.label}
            </div>
          )}
          {isComplete && simResult && (
            <div className="text-center space-y-1">
              <div className="text-[10px] text-lol-light/30">Final</div>
              {simResult.blueScore > simResult.redScore
                ? <div className="text-[10px] text-blue-300 font-bold">MAVİ<br/>ÜSTÜNLİK</div>
                : simResult.redScore > simResult.blueScore
                ? <div className="text-[10px] text-red-300 font-bold">KIRMIZI<br/>ÜSTÜNLİK</div>
                : <div className="text-[10px] text-lol-light/40 font-bold">EŞİT</div>
              }
            </div>
          )}
        </div>

        {/* Kırmızı Takım */}
        <TeamPanel
          team="red"
          label="🔴 KIRMIZI TAKIM"
          subLabel="AI Beta"
          picks={redPicksByRole}
          bans={redBans}
          userRole={null}
          isActive={activeTeam === 'red'}
          activeType={activeType}
          scoreLabel={isComplete && simResult ? `${simResult.redScore}` : null}
        />
      </div>

      {/* ══ HAMLE GEÇMİŞİ ══════════════════════════════════════ */}
      {shownSteps.length > 0 && (
        <div className="bg-lol-dark/70 border border-lol-light/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-lol-light/5 flex items-center justify-between">
            <h3 className="text-lol-gold font-bold text-sm">📋 Hamle Geçmişi</h3>
            <div className="flex gap-2 text-xs text-lol-light/30">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Mavi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Kırmızı
              </span>
            </div>
          </div>

          <div ref={feedRef} className="p-3 space-y-1.5 max-h-80 overflow-y-auto">
            {shownSteps.map((step, idx) => (
              <StepCard
                key={idx}
                step={step}
                isLatest={idx === shownSteps.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ BAŞLAMADIYSA YÖNLENDİRME ═══════════════════════════ */}
      {!simResult && (
        <div className="text-center py-10 text-lol-light/30">
          <p className="text-5xl mb-4">♟️</p>
          <p className="font-bold text-lg text-white/60">İki AI, tam tournament draftı oynuyor</p>
          <p className="text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Ban Fazı 1 → Pick Fazı 1 → Ban Fazı 2 → Pick Fazı 2<br />
            Her hamle EBV analizi ve 10 kriterli Draft Score ile hesaplanır
          </p>
          <div className="mt-4 flex justify-center gap-4 text-xs text-lol-light/20">
            <span>10 yasak</span>
            <span>·</span>
            <span>10 seçim</span>
            <span>·</span>
            <span>20 toplam hamle</span>
          </div>
        </div>
      )}

      {/* ══ FINAL ANALİZ ═══════════════════════════════════════ */}
      {isComplete && simResult?.finalAnalysis && (
        <FinalAnalysis
          analysis={simResult.finalAnalysis}
          userRole={userRole}
          blueScore={simResult.blueScore}
          redScore={simResult.redScore}
          finalState={simResult.finalState}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Takım Paneli
// ----------------------------------------------------------------
function TeamPanel({ team, label, subLabel, picks, bans, userRole, isActive, activeType, scoreLabel }) {
  const isBlue = team === 'blue';
  const borderColor = isActive
    ? isBlue ? 'border-blue-400/60 ring-1 ring-blue-400/20' : 'border-red-400/60 ring-1 ring-red-400/20'
    : 'border-lol-light/10';

  return (
    <div className={`bg-lol-dark/70 border rounded-xl p-4 space-y-3 transition-all ${borderColor}`}>
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-bold text-sm ${isBlue ? 'text-blue-400' : 'text-red-400'}`}>{label}</p>
          <p className="text-lol-light/30 text-[10px]">{subLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {scoreLabel && (
            <div className={`text-2xl font-bold ${isBlue ? 'text-blue-400' : 'text-red-400'}`}>
              {scoreLabel}
            </div>
          )}
          {isActive && (
            <span className={`text-[10px] px-2 py-0.5 rounded animate-pulse font-bold
              ${activeType === 'ban' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
              {activeType === 'ban' ? '🚫' : '✅'}
            </span>
          )}
        </div>
      </div>

      {/* Banlar */}
      <div>
        <p className="text-lol-light/20 text-[10px] uppercase tracking-wider mb-1.5">Yasaklar</p>
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <BanSlot key={i} champId={bans[i]} />
          ))}
        </div>
      </div>

      {/* Seçimler */}
      <div>
        <p className="text-lol-light/20 text-[10px] uppercase tracking-wider mb-1.5">Seçimler</p>
        <div className="space-y-1.5">
          {ROLES_ORD.map(role => (
            <PickSlot
              key={role}
              role={role}
              pick={picks[role]}
              isUserSlot={isBlue && role === userRole}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BanSlot({ champId }) {
  const champ = champId ? championMeta[champId] : null;
  return (
    <div className={`w-10 h-10 rounded-lg border overflow-hidden flex-shrink-0
      ${champId ? 'border-lol-light/15 opacity-55' : 'border-lol-light/8 border-dashed bg-lol-dark/30'}`}
      title={champ?.name}>
      {champId
        ? <img src={IMG(champId)} alt="" className="w-full h-full object-cover grayscale" />
        : <div className="w-full h-full flex items-center justify-center text-lol-light/10 text-xs">—</div>
      }
    </div>
  );
}

function PickSlot({ role, pick, isUserSlot }) {
  const champ = pick?.champId ? championMeta[pick.champId] : null;
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 border min-h-[44px] transition-all
      ${pick
        ? isUserSlot
          ? 'border-lol-gold/40 bg-lol-gold/8 ring-1 ring-lol-gold/20'
          : 'border-lol-light/10 bg-lol-light/3'
        : 'border-lol-light/5 border-dashed'}`}>
      <span className="text-base flex-shrink-0">{ROLE_ICON[role]}</span>
      {pick ? (
        <>
          <img src={IMG(pick.champId)} alt="" className="w-8 h-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${isUserSlot ? 'text-lol-gold' : 'text-white'}`}>
              {champ?.name || pick.champId}
            </p>
            <p className="text-lol-light/30 text-[10px]">{ROLE_LBL[role]}</p>
          </div>
          {isUserSlot && (
            <span className="text-[10px] text-lol-gold font-bold flex-shrink-0">★ SİZ</span>
          )}
        </>
      ) : (
        <span className="text-lol-light/20 text-xs">{ROLE_LBL[role]}</span>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Adım Kartı
// ----------------------------------------------------------------
function StepCard({ step, isLatest }) {
  const isBlue = step.team === 'blue';
  const isBan  = step.type === 'ban';

  return (
    <div className={`flex items-start gap-2.5 rounded-lg p-2.5 border transition-all
      ${isLatest
        ? isBlue
          ? 'bg-blue-500/8 border-blue-400/30 shadow-sm'
          : 'bg-red-500/8 border-red-400/30 shadow-sm'
        : 'bg-lol-dark/20 border-lol-light/5'}`}>

      {/* Numara */}
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 w-5">
        <span className={`text-[10px] font-bold ${isBlue ? 'text-blue-400/70' : 'text-red-400/70'}`}>
          {step.stepNum}
        </span>
        <div className={`w-1 h-4 rounded-full ${isBlue ? 'bg-blue-400/40' : 'bg-red-400/40'}`} />
      </div>

      {/* Şampiyon resmi */}
      <img
        src={IMG(step.champId)}
        alt=""
        className={`w-9 h-9 rounded-lg border flex-shrink-0
          ${isBan
            ? 'grayscale opacity-45 border-lol-light/10'
            : isBlue ? 'border-blue-400/30' : 'border-red-400/30'}`}
      />

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
            ${isBan ? 'bg-red-500/15 text-red-300' : 'bg-green-500/15 text-green-300'}`}>
            {isBan ? 'BAN' : 'PİCK'}
          </span>
          <span className="text-white text-xs font-medium">{step.champName}</span>
          {step.role && (
            <span className="text-lol-light/35 text-[10px]">
              {ROLE_ICON[step.role]} {ROLE_LBL[step.role]}
            </span>
          )}
          {step.score !== undefined && (
            <span className="text-lol-gold text-[10px] font-bold ml-auto flex-shrink-0">
              {step.score}
            </span>
          )}
        </div>
        <p className="text-lol-light/35 text-[10px] mt-0.5 leading-relaxed line-clamp-2">
          {step.reason}
        </p>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// Final Analiz Bölümü
// ----------------------------------------------------------------
function FinalAnalysis({ analysis, userRole, blueScore, redScore, finalState }) {
  const { composition, warnings, coachComment } = analysis;
  const [showDetail, setShowDetail] = useState(false);

  const blueWins = blueScore > redScore;
  const redWins  = redScore  > blueScore;

  return (
    <div className="space-y-4">

      {/* Sonuç banner */}
      <div className={`rounded-xl p-5 border ${
        blueWins ? 'bg-blue-500/10 border-blue-500/30'
        : redWins ? 'bg-red-500/10 border-red-500/30'
        : 'bg-lol-light/5 border-lol-light/10'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lol-light/50 text-xs font-bold uppercase tracking-wide mb-1">
              🏆 Draft Sonucu
            </p>
            <p className="text-white font-bold text-xl">
              {blueWins ? '🔵 Mavi Takım Üstün' : redWins ? '🔴 Kırmızı Takım Üstün' : '⚖️ Dengeli Draft'}
            </p>
            <p className="text-lol-light/50 text-sm mt-1">{coachComment}</p>
          </div>
          <div className="text-center flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${blueWins ? 'text-blue-400' : 'text-lol-light/40'}`}>{blueScore}</div>
                <div className="text-[10px] text-lol-light/30">Mavi</div>
              </div>
              <div className="text-lol-light/20 font-bold">—</div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${redWins ? 'text-red-400' : 'text-lol-light/40'}`}>{redScore}</div>
                <div className="text-[10px] text-lol-light/30">Kırmızı</div>
              </div>
            </div>
            <div className="text-[10px] text-lol-light/20 mt-1">Ort. Draft Score</div>
          </div>
        </div>
      </div>

      {/* Kompozisyon karşılaştırması */}
      <div className="bg-lol-dark/70 border border-lol-light/10 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowDetail(v => !v)}
          className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-lol-light/5 transition-colors">
          <span className="text-lol-gold font-bold text-sm">📊 Detaylı Kompozisyon Analizi</span>
          <span className="text-lol-light/40 text-sm">{showDetail ? '▲' : '▼'}</span>
        </button>

        {showDetail && (
          <div className="px-5 pb-5 space-y-4">
            {/* Metrik grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                ['Takım Avantajı',
                  composition.teamAdvantage === 'Own' ? '🔵 Mavi' :
                  composition.teamAdvantage === 'Enemy' ? '🔴 Kırmızı' : '⚪ Eşit'],
                ['Erken Oyun',   composition.earlyGame],
                ['Geç Oyun',     composition.lateGame],
                ['Teamfight',    composition.teamfight],
                ['Scaling',      composition.scaling],
                ['CC / Engage',  composition.cc],
                ['Mavi AP/AD',   composition.ownBalance],
                ['Kırmızı AP/AD',composition.enemyBalance],
              ].map(([label, value]) => (
                <div key={label} className="bg-lol-dark/60 border border-lol-light/5 rounded-lg p-2.5">
                  <p className="text-lol-light/35 text-[10px] uppercase">{label}</p>
                  <p className="text-white text-xs font-medium mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Arketip karşılaştırması */}
            {(composition.ownArchetype || composition.enemyArchetype) && (
              <div className="grid grid-cols-2 gap-3">
                {composition.ownArchetype && (
                  <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 text-[10px] font-bold uppercase mb-1">🔵 Mavi Arketip</p>
                    <p className="text-white font-bold">{composition.ownArchetype.info.label}</p>
                    <p className="text-lol-light/50 text-xs mt-1">{composition.ownArchetype.info.winCondition}</p>
                    <div className="mt-2 space-y-1">
                      {composition.ownArchetype.info.strengths.map(s => (
                        <p key={s} className="text-green-300/70 text-[10px]">✅ {s}</p>
                      ))}
                      {composition.ownArchetype.info.weaknesses.map(w => (
                        <p key={w} className="text-red-300/70 text-[10px]">⚠️ {w}</p>
                      ))}
                    </div>
                  </div>
                )}
                {composition.enemyArchetype && (
                  <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-[10px] font-bold uppercase mb-1">🔴 Kırmızı Arketip</p>
                    <p className="text-white font-bold">{composition.enemyArchetype.info.label}</p>
                    <p className="text-lol-light/50 text-xs mt-1">{composition.enemyArchetype.info.winCondition}</p>
                    <div className="mt-2 space-y-1">
                      {composition.enemyArchetype.info.strengths.map(s => (
                        <p key={s} className="text-green-300/70 text-[10px]">✅ {s}</p>
                      ))}
                      {composition.enemyArchetype.info.weaknesses.map(w => (
                        <p key={w} className="text-red-300/70 text-[10px]">⚠️ {w}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Uyarılar */}
            {warnings && warnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-lol-gold text-xs font-bold">⚠️ Tespit Edilen Sorunlar</p>
                {warnings.map((w, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs p-2.5 rounded-lg border
                    ${w.level === 'error' ? 'bg-red-500/8 border-red-500/25 text-red-300'
                      : w.level === 'warn' ? 'bg-yellow-500/8 border-yellow-500/25 text-yellow-300'
                      : 'bg-blue-500/8 border-blue-500/25 text-blue-300'}`}>
                    <span className="flex-shrink-0">{w.level === 'error' ? '❌' : w.level === 'warn' ? '⚠️' : 'ℹ️'}</span>
                    <span>{w.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Full team display */}
            <div className="grid grid-cols-2 gap-3">
              {[['blue','🔵 Mavi Takım', finalState.blueTeam],['red','🔴 Kırmızı Takım', finalState.redTeam]].map(([team, lbl, picks]) => (
                <div key={team} className="space-y-1.5">
                  <p className={`text-xs font-bold ${team === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{lbl}</p>
                  {picks.map(p => {
                    const champ = championMeta[p.champId];
                    return (
                      <div key={p.champId} className="flex items-center gap-2">
                        <img src={IMG(p.champId)} alt="" className="w-7 h-7 rounded" />
                        <span className="text-white text-xs">{champ?.name}</span>
                        <span className="text-lol-light/30 text-[10px] ml-auto">{ROLE_ICON[p.role]} {ROLE_LBL[p.role]}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
