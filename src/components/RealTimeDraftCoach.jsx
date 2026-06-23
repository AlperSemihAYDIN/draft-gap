import { useMemo, useState, useRef, useEffect } from 'react';
import { useDraftContext } from '../contexts/DraftContext';
import {
  generateProDraftAnalysis,
  getDraftPhaseInfo,
  getChampionTags,
} from '../services/draftAnalysis';
import championMeta from '../data/championMeta.json';

import { getLatestVersion } from '../services/dataDragon';

// Sürümü dinamik olarak DDragon'dan çeker; fallback olarak güncel bilinen versiyon
let _ddVer = '16.12.1';
getLatestVersion().then(v => { _ddVer = v; }).catch(() => {});
const IMG = (id) => `https://ddragon.leagueoflegends.com/cdn/${_ddVer}/img/champion/${id}.png`;

const ROLES = [
  { id:'top',     label:'Top',     icon:'🏔️' },
  { id:'jungle',  label:'Jungle',  icon:'🌿' },
  { id:'mid',     label:'Mid',     icon:'⚡' },
  { id:'adc',     label:'ADC',     icon:'🏹' },
  { id:'support', label:'Support', icon:'🛡️' },
];

const ROLE_COLORS = {
  top:'border-red-400/40 bg-red-500/10',
  jungle:'border-green-400/40 bg-green-500/10',
  mid:'border-purple-400/40 bg-purple-500/10',
  adc:'border-yellow-400/40 bg-yellow-500/10',
  support:'border-blue-400/40 bg-blue-500/10',
};

// ----------------------------------------------------------------
// Şampiyon Arama Kutusu
// ----------------------------------------------------------------
function ChampionSearch({ onSelect, usedChamps }) {
  const [search, setSearch]   = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (search.length < 1) { setResults([]); return; }
    const q = search.toLowerCase();
    const found = Object.entries(championMeta)
      .filter(([id, c]) => id !== '_meta' && !usedChamps.has(id) && c.name.toLowerCase().includes(q))
      .slice(0, 8)
      .map(([id, c]) => ({ id, name: c.name, roles: c.roles, presence: c.presence || 0, banRate: c.banRate || 0 }));
    setResults(found);
  }, [search, usedChamps]);

  function pick(champ) {
    onSelect(champ);
    setSearch('');
    setResults([]);
    inputRef.current?.focus();
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Şampiyon ara... (örn: Orianna)"
        className="w-full bg-lol-dark/80 border border-lol-light/20 rounded-lg px-3 py-2 text-white text-sm placeholder:text-lol-light/30 focus:outline-none focus:border-lol-gold/50"
      />
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-lol-gray border border-lol-light/20 rounded-lg shadow-xl mt-1 overflow-hidden">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => pick(c)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-lol-dark/60 transition-colors text-left"
            >
              <img src={IMG(c.id)} alt={c.name} className="w-7 h-7 rounded" />
              <div className="flex-1 min-w-0">
                <span className="text-white text-sm font-medium">{c.name}</span>
                <span className="text-lol-light/40 text-xs ml-2">
                  {c.roles.slice(0,2).join(' / ')}
                </span>
              </div>
              {c.presence >= 40 && (
                <span className="text-xs text-lol-gold font-medium">{c.presence.toFixed(0)}%</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Şampiyon Slot (pick veya ban)
// ----------------------------------------------------------------
function ChampSlot({ champId, role, onClick, isUser, type = 'pick' }) {
  const champ = champId ? championMeta[champId] : null;

  if (type === 'ban') {
    return (
      <div
        onClick={onClick}
        title={champ?.name}
        className={`w-9 h-9 rounded-lg border cursor-pointer transition-all relative overflow-hidden
          ${champId ? 'border-lol-light/30 opacity-60' : 'border-lol-light/10 bg-lol-dark/40 border-dashed hover:border-lol-light/30'}`}
      >
        {champId
          ? <img src={IMG(champId)} alt={champ?.name} className="w-full h-full object-cover grayscale" />
          : <span className="text-lol-light/20 text-xs flex items-center justify-center h-full">+</span>
        }
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-pointer transition-all min-h-[44px]
        ${champId
          ? (role ? ROLE_COLORS[role] : 'border-lol-light/20 bg-lol-dark/40')
          : 'border-lol-light/10 bg-lol-dark/20 border-dashed hover:border-lol-light/30'
        }`}
    >
      {champId ? (
        <>
          <img src={IMG(champId)} alt={champ?.name} className="w-8 h-8 rounded" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{champ?.name}</p>
            {role && <p className="text-lol-light/40 text-[10px]">{ROLES.find(r=>r.id===role)?.label}</p>}
          </div>
          {isUser && (
            <span className="text-[10px] bg-lol-gold/30 text-lol-gold px-1 py-0.5 rounded">Siz</span>
          )}
        </>
      ) : (
        <span className="text-lol-light/20 text-xs w-full text-center">Boş slot</span>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// ANA BILEŞEN
// ----------------------------------------------------------------
export default function RealTimeDraftCoach() {
  const {
    blueTeam, redTeam, blueBans, redBans,
    draftMode, userTeam, userRole,
    addPick, addBan, removePick, removeBan, resetDraft,
    setDraftMode, setUserRole, setUserTeam,
  } = useDraftContext();

  // Yerel giriş durumu
  const [addMode,   setAddMode]   = useState('pick');  // 'pick' | 'ban'
  const [addTeam,   setAddTeam]   = useState('blue');
  const [addRole,   setAddRole]   = useState('mid');
  const [pendingChamp, setPendingChamp] = useState(null);

  // Kullanılan şampiyonlar seti
  const usedChamps = useMemo(() => new Set([
    ...blueTeam.map(p => p.champId),
    ...redTeam.map(p => p.champId),
    ...blueBans, ...redBans,
  ]), [blueTeam, redTeam, blueBans, redBans]);

  const hasDraft = blueTeam.length > 0 || redTeam.length > 0 || blueBans.length > 0 || redBans.length > 0;

  // Analiz — useMemo ile otomatik yenilenir
  const analysis = useMemo(() => {
    if (!hasDraft) return null;
    return generateProDraftAnalysis(blueTeam, redTeam, blueBans, redBans, userTeam, userRole, draftMode);
  }, [blueTeam, redTeam, blueBans, redBans, userTeam, userRole, draftMode, hasDraft]);

  const phase = useMemo(
    () => getDraftPhaseInfo(blueTeam, redTeam, blueBans, redBans),
    [blueTeam, redTeam, blueBans, redBans]
  );

  // Şampiyon seçildiğinde
  function handleChampSelected(champ) {
    setPendingChamp(champ);
  }

  // Onayla / Ekle
  function confirmAdd() {
    if (!pendingChamp) return;
    if (addMode === 'ban') {
      addBan(pendingChamp.id, addTeam);
    } else {
      addPick(pendingChamp.id, addRole, addTeam);
    }
    setPendingChamp(null);
  }

  // Slot tıklama (kaldır)
  function removeChamp(champId, type, team) {
    if (type === 'ban') {
      removeBan(champId, team);
    } else {
      removePick(champId, team);
    }
  }

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* ══ AYARLAR ═══════════════════════════════════════════ */}
      <div className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Mod */}
          <div className="flex items-center gap-2">
            <span className="text-lol-light/50 text-xs">Mod:</span>
            <button onClick={() => setDraftMode('soloq')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all
                ${draftMode==='soloq' ? 'bg-lol-gold/20 text-lol-gold border border-lol-gold/40' : 'text-lol-light/40 hover:text-white'}`}>
              🎮 SoloQ
            </button>
            <button onClick={() => setDraftMode('pro')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all
                ${draftMode==='pro' ? 'bg-lol-blue/20 text-lol-blue border border-lol-blue/40' : 'text-lol-light/40 hover:text-white'}`}>
              🏆 Pro Arena
            </button>
          </div>

          {/* Takım */}
          <div className="flex items-center gap-2">
            <span className="text-lol-light/50 text-xs">Takım:</span>
            <button onClick={() => setUserTeam('blue')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all
                ${userTeam==='blue' ? 'bg-blue-500/20 text-blue-400 border border-blue-400/40' : 'text-lol-light/40 hover:text-white'}`}>
              🔵 Mavi
            </button>
            <button onClick={() => setUserTeam('red')}
              className={`px-3 py-1 rounded text-xs font-medium transition-all
                ${userTeam==='red' ? 'bg-red-500/20 text-red-400 border border-red-400/40' : 'text-lol-light/40 hover:text-white'}`}>
              🔴 Kırmızı
            </button>
          </div>

          {/* Rol */}
          <div className="flex items-center gap-1">
            <span className="text-lol-light/50 text-xs">Rolün:</span>
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setUserRole(r.id)} title={r.label}
                className={`w-7 h-7 rounded text-sm transition-all
                  ${userRole===r.id ? 'bg-lol-gold/20 border border-lol-gold/50' : 'hover:bg-lol-light/10'}`}>
                {r.icon}
              </button>
            ))}
          </div>

          {/* Sıfırla */}
          {hasDraft && (
            <button onClick={resetDraft}
              className="ml-auto px-3 py-1 rounded text-xs text-lol-light/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-400/30 transition-all">
              ↺ Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* ══ DRAFT EKLE BÖLÜMÜ ══════════════════════════════════ */}
      <div className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            phase.phase.startsWith('ban') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
          }`}>
            {phase.label}
          </span>
          <span className="text-lol-light/40 text-xs">{phase.advice}</span>
        </div>

        <div className="flex flex-wrap gap-2 items-start">
          {/* Giriş türü */}
          <div className="flex rounded-lg overflow-hidden border border-lol-light/10">
            <button onClick={() => setAddMode('pick')}
              className={`px-3 py-2 text-xs font-medium transition-all ${addMode==='pick' ? 'bg-green-600/30 text-green-300' : 'text-lol-light/40 hover:bg-lol-light/10'}`}>
              ✅ Pick
            </button>
            <button onClick={() => setAddMode('ban')}
              className={`px-3 py-2 text-xs font-medium transition-all ${addMode==='ban' ? 'bg-red-600/30 text-red-300' : 'text-lol-light/40 hover:bg-lol-light/10'}`}>
              🚫 Ban
            </button>
          </div>

          {/* Takım seç */}
          <div className="flex rounded-lg overflow-hidden border border-lol-light/10">
            <button onClick={() => setAddTeam('blue')}
              className={`px-3 py-2 text-xs transition-all ${addTeam==='blue' ? 'bg-blue-600/30 text-blue-300' : 'text-lol-light/40 hover:bg-lol-light/10'}`}>
              🔵 Mavi
            </button>
            <button onClick={() => setAddTeam('red')}
              className={`px-3 py-2 text-xs transition-all ${addTeam==='red' ? 'bg-red-600/30 text-red-300' : 'text-lol-light/40 hover:bg-lol-light/10'}`}>
              🔴 Kırmızı
            </button>
          </div>

          {/* Rol (sadece pick'te) */}
          {addMode === 'pick' && (
            <div className="flex rounded-lg overflow-hidden border border-lol-light/10">
              {ROLES.map(r => (
                <button key={r.id} onClick={() => setAddRole(r.id)} title={r.label}
                  className={`px-2 py-2 text-sm transition-all ${addRole===r.id ? 'bg-lol-gold/20 text-lol-gold' : 'text-lol-light/40 hover:bg-lol-light/10'}`}>
                  {r.icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Arama */}
        <div className="flex gap-2">
          <div className="flex-1">
            <ChampionSearch onSelect={handleChampSelected} usedChamps={usedChamps} />
          </div>
        </div>

        {/* Seçilen şampiyon onay */}
        {pendingChamp && (
          <div className="flex items-center gap-3 bg-lol-gold/10 border border-lol-gold/30 rounded-lg p-3">
            <img src={IMG(pendingChamp.id)} alt={pendingChamp.name} className="w-10 h-10 rounded-lg" />
            <div className="flex-1">
              <p className="text-white font-medium">{pendingChamp.name}</p>
              <p className="text-lol-light/50 text-xs">
                {addMode === 'ban' ? `🚫 ${addTeam === 'blue' ? 'Mavi' : 'Kırmızı'} taraf banı`
                  : `✅ ${addTeam === 'blue' ? 'Mavi' : 'Kırmızı'} — ${ROLES.find(r=>r.id===addRole)?.label}`}
              </p>
            </div>
            <button onClick={confirmAdd}
              className="px-4 py-2 bg-lol-gold/20 hover:bg-lol-gold/30 border border-lol-gold/40 text-lol-gold rounded-lg text-sm font-medium transition-all">
              Ekle ✓
            </button>
            <button onClick={() => setPendingChamp(null)}
              className="px-2 py-2 text-lol-light/40 hover:text-red-400 transition-all text-sm">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ══ SECTION 1: DRAFT DURUMU ════════════════════════════ */}
      <section className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-5">
        <h2 className="text-lol-gold font-bold text-lg mb-4">📊 DRAFT DURUMU</h2>
        <div className="grid grid-cols-2 gap-4">

          {/* Mavi Takim */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-400 font-semibold text-sm">🔵 MAVİ TAKIM</span>
              {userTeam === 'blue' && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 rounded">Sizin</span>}
            </div>
            {/* Banlar */}
            <div>
              <p className="text-lol-light/30 text-[10px] mb-1">BANLARI</p>
              <div className="flex flex-wrap gap-1">
                {[...Array(5)].map((_, i) => (
                  <ChampSlot key={i} champId={blueBans[i]} type="ban"
                    onClick={() => blueBans[i] && removeChamp(blueBans[i], 'ban', 'blue')} />
                ))}
              </div>
            </div>
            {/* Pickler */}
            <div className="space-y-1">
              <p className="text-lol-light/30 text-[10px] mb-1">PİCKLER</p>
              {[...Array(5)].map((_, i) => (
                <ChampSlot key={i}
                  champId={blueTeam[i]?.champId}
                  role={blueTeam[i]?.role}
                  isUser={userTeam==='blue' && blueTeam[i]?.role === userRole}
                  onClick={() => blueTeam[i] && removeChamp(blueTeam[i].champId, 'pick', 'blue')}
                />
              ))}
            </div>
          </div>

          {/* Kırmızı Takim */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-red-400 font-semibold text-sm">🔴 KIRMIZI TAKIM</span>
              {userTeam === 'red' && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 rounded">Sizin</span>}
            </div>
            <div>
              <p className="text-lol-light/30 text-[10px] mb-1">BANLARI</p>
              <div className="flex flex-wrap gap-1">
                {[...Array(5)].map((_, i) => (
                  <ChampSlot key={i} champId={redBans[i]} type="ban"
                    onClick={() => redBans[i] && removeChamp(redBans[i], 'ban', 'red')} />
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lol-light/30 text-[10px] mb-1">PİCKLER</p>
              {[...Array(5)].map((_, i) => (
                <ChampSlot key={i}
                  champId={redTeam[i]?.champId}
                  role={redTeam[i]?.role}
                  isUser={userTeam==='red' && redTeam[i]?.role === userRole}
                  onClick={() => redTeam[i] && removeChamp(redTeam[i].champId, 'pick', 'red')}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {!hasDraft && (
        <div className="text-center py-8 text-lol-light/30">
          <p className="text-4xl mb-3">⚔️</p>
          <p className="font-medium">Draft Koçu Hazır</p>
          <p className="text-sm mt-1">Yukarıdan şampiyon ekleyerek analizi başlat</p>
          <p className="text-xs mt-3 text-lol-light/20">
            {draftMode === 'soloq' ? '🎮 SoloQ: Kişisel carry odaklı analiz' : '🏆 Pro: Takım stratejisi ve optimal draft'}
          </p>
        </div>
      )}

      {analysis && (
        <>
          {/* Koç Yorumu Banner */}
          <div className="bg-lol-blue/10 border border-lol-blue/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎙️</span>
              <div>
                <p className="text-lol-blue text-xs font-bold mb-1">KOÇLUK YORUMU</p>
                <p className="text-white text-sm leading-relaxed">{analysis.coachComment}</p>
              </div>
            </div>
          </div>

          {/* ══ SECTION 2: ANLIK ANALİZ ══════════════════════════ */}
          <section className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-5">
            <h2 className="text-lol-gold font-bold text-lg mb-4">⚡ ANLIK ANALİZ</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <MetricCard label="Takım Avantajı" value={
                analysis.composition.teamAdvantage === 'Own' ? '✅ Bizde' :
                analysis.composition.teamAdvantage === 'Enemy' ? '❌ Rakipte' : '⚪ Eşit'
              } />
              <MetricCard label="Erken Oyun" value={analysis.composition.earlyGame} />
              <MetricCard label="Geç Oyun" value={analysis.composition.lateGame} />
              <MetricCard label="Teamfight" value={analysis.composition.teamfight} />
              <MetricCard label="Split Push" value={analysis.composition.splitPush} />
              <MetricCard label="Scaling" value={analysis.composition.scaling} />
              <MetricCard label="CC / Engage" value={analysis.composition.cc} />
              <MetricCard label="AP/AD (Bizim)" value={analysis.composition.ownBalance} />
            </div>

            {/* Kompozisyon arketipleri */}
            {(analysis.composition.ownArchetype || analysis.composition.enemyArchetype) && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {analysis.composition.ownArchetype && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-blue-400 text-xs font-bold">Bizim Arketip</p>
                    <p className="text-white text-sm font-medium mt-1">
                      {analysis.composition.ownArchetype.info.label}
                    </p>
                    <p className="text-lol-light/50 text-xs mt-1">
                      {analysis.composition.ownArchetype.info.winCondition}
                    </p>
                  </div>
                )}
                {analysis.composition.enemyArchetype && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-xs font-bold">Rakip Arketip</p>
                    <p className="text-white text-sm font-medium mt-1">
                      {analysis.composition.enemyArchetype.info.label}
                    </p>
                    <p className="text-lol-light/50 text-xs mt-1">
                      {analysis.composition.enemyArchetype.info.winCondition}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ══ SECTION 3: BAN ÖNERİSİ ═══════════════════════════ */}
          {analysis.banSuggestions.length > 0 && (
            <section className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-5">
              <h2 className="text-lol-gold font-bold text-lg mb-4">🚫 BAN ÖNERİSİ</h2>
              <div className="space-y-2">
                {analysis.banSuggestions.map((ban, i) => (
                  <div key={ban.champId}
                    className="flex items-center gap-3 bg-red-500/5 border border-red-400/20 rounded-lg p-3">
                    <span className="text-red-400/60 font-bold text-sm w-4">{i+1}</span>
                    <img src={IMG(ban.champId)} alt={ban.name} className="w-9 h-9 rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{ban.name}</span>
                        <span className="text-lol-light/40 text-xs">
                          {ban.presence.toFixed(0)}% presence
                        </span>
                      </div>
                      <p className="text-lol-light/50 text-xs mt-0.5">{ban.reason}</p>
                    </div>
                    <div className="text-right">
                      <PriorityBar value={Math.min(1, ban.priority)} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-lol-light/20 text-xs mt-3">
                * Ban öncelikleri: Beklenen Ban Değeri = P(rakip alır) × güç × bizim zayıflığımıza etki
              </p>
            </section>
          )}

          {/* ══ SECTION 4: EN İYİ ÖNERİLER ══════════════════════ */}
          {analysis.recommendations.length > 0 && (
            <section className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-5">
              <h2 className="text-lol-gold font-bold text-lg mb-4">
                🎯 EN İYİ ÖNERİLER
                <span className="text-lol-light/30 font-normal text-sm ml-2">
                  — {ROLES.find(r=>r.id===userRole)?.label} için
                </span>
              </h2>
              <div className="space-y-4">
                {analysis.recommendations.map((rec, idx) => (
                  <RecommendationCard key={rec.champId} rec={rec} rank={idx+1} mode={draftMode} />
                ))}
              </div>
            </section>
          )}

          {/* ══ SECTION 5: DİKKAT EDİLMESİ GEREKENLER ══════════ */}
          {analysis.warnings.length > 0 && (
            <section className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-5">
              <h2 className="text-lol-gold font-bold text-lg mb-4">⚠️ DİKKAT EDİLMESİ GEREKENLER</h2>
              <div className="space-y-2">
                {analysis.warnings.map((w, i) => (
                  <div key={i}
                    className={`flex items-start gap-3 rounded-lg p-3 border
                      ${w.level==='error'
                        ? 'bg-red-500/10 border-red-500/30'
                        : w.level==='warn'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                      }`}>
                    <span className="text-lg flex-shrink-0">
                      {w.level==='error' ? '❌' : w.level==='warn' ? '⚠️' : 'ℹ️'}
                    </span>
                    <p className={`text-sm ${
                      w.level==='error' ? 'text-red-300'
                      : w.level==='warn' ? 'text-yellow-300'
                      : 'text-blue-300'
                    }`}>{w.text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ══ SECTION 6: GELECEK MUHTEMEL HAMLELER ════════════ */}
          {analysis.predictedEnemyPicks.length > 0 && (
            <section className="bg-lol-dark/70 border border-lol-light/10 rounded-xl p-5">
              <h2 className="text-lol-gold font-bold text-lg mb-4">🔮 GELECEK MUHTEMEL HAMLELER</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-red-400 text-sm font-semibold mb-2">❌ Rakip Muhtemelen Seçer:</h3>
                  <div className="space-y-2">
                    {analysis.predictedEnemyPicks.slice(0,3).map((pred, i) => (
                      <div key={pred.champId}
                        className="flex items-center gap-3 bg-red-500/5 border border-red-400/20 rounded-lg p-3">
                        <img src={IMG(pred.champId)} alt={pred.name} className="w-10 h-10 rounded-lg opacity-70" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">#{i+1} {pred.name}</span>
                            <span className="text-xs text-red-300/70">{pred.confidence}% olasılık</span>
                          </div>
                          <p className="text-lol-light/50 text-xs mt-0.5">{pred.reason}</p>
                        </div>
                        <PriorityBar value={pred.confidence / 100} color="red" />
                      </div>
                    ))}
                  </div>
                </div>

                {analysis.predictedEnemyPicks.length > 0 && (
                  <div className="bg-lol-blue/10 border border-lol-blue/30 rounded-lg p-4">
                    <h3 className="text-lol-blue text-sm font-semibold mb-2">
                      ✅ Buna Karşı Cevap:
                    </h3>
                    <EnemyResponse prediction={analysis.predictedEnemyPicks[0]} mode={draftMode} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Footer */}
          <div className="text-center text-lol-light/20 text-xs py-3 border-t border-lol-light/5">
            {draftMode === 'soloq'
              ? '🎮 SoloQ Modu — Kişisel kazanma ihtimali maksimize ediliyor'
              : '🏆 Pro Arena Modu — Takım stratejisi ve optimal kompozisyon analizi'}
            {' · '}Patch {championMeta._meta?.patch || _ddVer} · {analysis.timestamp.toLocaleTimeString('tr-TR')}
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Alt Bileşenler
// ----------------------------------------------------------------

function MetricCard({ label, value }) {
  return (
    <div className="bg-lol-dark/50 border border-lol-light/5 rounded-lg p-2.5">
      <p className="text-lol-light/40 text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-white text-xs font-medium mt-1">{value}</p>
    </div>
  );
}

function PriorityBar({ value = 0, color = 'gold' }) {
  const pct = Math.round(value * 100);
  const colorClass = color === 'red'
    ? 'bg-red-400'
    : pct >= 70 ? 'bg-red-400' : pct >= 40 ? 'bg-yellow-400' : 'bg-green-400';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-lol-light/50">{pct}%</span>
      <div className="w-12 h-1.5 bg-lol-light/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function RecommendationCard({ rec, rank, mode }) {
  const isTop = rank === 1;
  return (
    <div className={`rounded-xl border p-4 space-y-3 transition-all ${
      isTop ? 'border-lol-gold/50 bg-lol-gold/5' : 'border-lol-light/10 bg-lol-dark/40'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <img src={IMG(rec.champId)} alt={rec.name}
            className={`w-14 h-14 rounded-xl border ${isTop ? 'border-lol-gold/50' : 'border-lol-light/10'}`} />
          {isTop && <span className="absolute -top-1.5 -right-1.5 text-sm">⭐</span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-bold text-base">#{rank} — {rec.name}</span>
            {rec.tags.includes('priority_pick') && (
              <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">META</span>
            )}
          </div>
          <p className="text-lol-light/50 text-xs mt-0.5">
            {ROLES.find(r=>r.id===rec.role)?.label}
            {' · '}WR {rec.winRate.toFixed(1)}%
            {' · '}PR {rec.pickRate.toFixed(1)}%
            {rec.presence > 0 && <span className="ml-1">· Presence {rec.presence.toFixed(0)}%</span>}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-3xl font-bold ${isTop ? 'text-lol-gold' : 'text-lol-blue'}`}>
            {rec.score}
          </div>
          <p className="text-lol-light/30 text-[10px]">Draft Score</p>
        </div>
      </div>

      {/* Kriter Breakdown */}
      <div className="grid grid-cols-5 gap-1.5 text-center">
        {[
          ['Meta', rec.breakdown.meta, 15],
          ['Counter', rec.breakdown.counter, 15],
          ['Synergy', rec.breakdown.synergy, 12],
          ['Carry', rec.breakdown.carry, 12],
          ['Flex', rec.breakdown.flex, 8],
        ].map(([label, val, max]) => (
          <div key={label} className="bg-lol-dark/60 rounded-lg p-1.5 border border-lol-light/5">
            <p className="text-lol-light/30 text-[10px]">{label}</p>
            <p className="text-white text-xs font-semibold">{(val||0).toFixed(1)}</p>
            <div className="w-full h-0.5 bg-lol-light/10 rounded mt-1">
              <div className="h-full bg-lol-blue rounded" style={{ width: `${((val||0)/max)*100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Gerekçe */}
      {rec.reasoning.length > 0 && (
        <div className="bg-lol-dark/60 border border-lol-light/5 rounded-lg p-3 space-y-1">
          {rec.reasoning.map((r, i) => (
            <p key={i} className="text-lol-light/60 text-xs">{r}</p>
          ))}
        </div>
      )}

      {/* Mod bazlı tavsiye */}
      <div className={`rounded-lg p-3 border text-xs ${
        mode === 'soloq'
          ? 'bg-lol-gold/5 border-lol-gold/20 text-lol-gold/80'
          : 'bg-lol-blue/5 border-lol-blue/20 text-lol-blue/80'
      }`}>
        {mode === 'soloq'
          ? `🎮 SoloQ: ${rec.breakdown.carry >= 10 ? 'Güçlü carry potansiyeli — maçı omuzlayabilir.' : rec.breakdown.counter >= 10 ? 'Rakibe güçlü counter — lane hakimiyeti sağlar.' : 'Stabil meta seçim, tutarlı performans.'}`
          : `🏆 Pro: ${rec.breakdown.synergy >= 8 ? 'Takım kompozisyonuyla güçlü sinerji.' : rec.breakdown.flex >= 6 ? 'Flex pick değeri yüksek — rakibe bilgi verme.' : 'Kompozisyonu tamamlayan kritik rol.'}`
        }
      </div>
    </div>
  );
}

function EnemyResponse({ prediction, mode }) {
  const tags = prediction.tags || [];
  const isEngage   = tags.includes('engage');
  const isPoke     = tags.includes('poke');
  const isAssassin = tags.includes('assassin');
  const isSplit    = tags.includes('splitpush');
  const isScaling  = tags.includes('scaling');

  let response = '';
  if (isEngage && mode === 'soloq')
    response = 'Disengage veya peel destekli şampiyon seç. Engage\'e karşı kiting ability olan ADC/mage tercih et.';
  else if (isEngage && mode === 'pro')
    response = 'Disengage composition güçlendir. Engage\'e karşı: Janna, Poppy, Sivir (E) gibi anti-engage seç.';
  else if (isPoke)
    response = 'Poke\'a karşı dash/mobility olan şampiyon al. Ya da kendi poke\'unu artır — orta vadede siege\'i reddet.';
  else if (isAssassin)
    response = 'Peel destekli support ve tank/bruiser al. Backline\'ı kapat, assassin\'e hedef verme.';
  else if (isSplit)
    response = '1v1 kazan veya 5v4 teamfight yap. Split push\'a cevap: teleport veya global ulti şampiyonu seç.';
  else if (isScaling)
    response = 'Erken snowball — 15-20 dakikada maçı bitir. Rakip geç oyuna taşımasın.';
  else
    response = 'Meta pick ile karşılık ver. Rakibin kompozisyon temasını boz.';

  return <p className="text-sm text-white/80 leading-relaxed">{response}</p>;
}
