import { useMemo } from 'react';
import { useDraftContext } from '../contexts/DraftContext';
import { useLanguage } from '../i18n/LanguageContext';
import championMeta from '../data/championMeta.json';

const ROLE_COLORS = {
  top: 'from-red-500/20 to-red-600/5',
  jungle: 'from-green-500/20 to-green-600/5',
  mid: 'from-purple-500/20 to-purple-600/5',
  adc: 'from-yellow-500/20 to-yellow-600/5',
  support: 'from-blue-500/20 to-blue-600/5',
};

const ROLE_LABELS = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  adc: 'ADC',
  support: 'Support',
};

export default function RealTimeDraftCoach() {
  const { t } = useLanguage();
  const {
    blueTeam,
    redTeam,
    blueBans,
    redBans,
    draftMode,
    userTeam,
    userRole,
    analysis,
  } = useDraftContext();

  const ownTeam = userTeam === 'blue' ? blueTeam : redTeam;
  const enemyTeam = userTeam === 'blue' ? redTeam : blueTeam;
  const ownBans = userTeam === 'blue' ? blueBans : redBans;
  const enemyBans = userTeam === 'blue' ? redBans : blueBans;

  if (!analysis) {
    return (
      <div className="text-center py-12 text-lol-light/40">
        <p>⏳ Draft bekleniyor...</p>
      </div>
    );
  }

  const { recommendations, composition, predictedEnemyPicks, nextMoves } = analysis;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* === DRAFT DURUMU === */}
      <section className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-lol-gold">📊 DRAFT DURUMU</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Kendi Takımı */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-lol-blue">
              {userTeam === 'blue' ? '🔵 MAVİ TAKIM' : '🔴 KIRMIZI TAKIM'}
            </div>

            {/* Pickler */}
            <div className="space-y-2">
              {ownTeam.length > 0 ? (
                ownTeam.map((pick, i) => {
                  const champ = championMeta[pick.champId];
                  return (
                    <div
                      key={i}
                      className={`bg-gradient-to-r ${ROLE_COLORS[pick.role]} border border-lol-light/10 rounded-lg p-2 flex items-center gap-2`}
                    >
                      <img
                        src={`https://ddragon.leagueoflegends.com/cdn/${championMeta._meta?.patch || '16.11'}/img/champion/${pick.champId}.png`}
                        alt={champ?.name}
                        className="w-8 h-8 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{champ?.name}</p>
                        <p className="text-lol-light/40 text-xs">{ROLE_LABELS[pick.role]}</p>
                      </div>
                      {pick.role === userRole && (
                        <span className="text-xs bg-lol-gold/30 px-2 py-1 rounded">Sizin</span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-lol-light/30 text-xs italic">Henüz seçim yok</p>
              )}
            </div>

            {/* Banlar */}
            {ownBans.length > 0 && (
              <div className="pt-2 border-t border-lol-light/5">
                <p className="text-xs text-lol-light/40 mb-2">🚫 Banlanmış ({ownBans.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {ownBans.map((bannedId, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg overflow-hidden border border-lol-gold/40"
                      title={championMeta[bannedId]?.name}
                    >
                      <img
                        src={`https://ddragon.leagueoflegends.com/cdn/${championMeta._meta?.patch || '16.11'}/img/champion/${bannedId}.png`}
                        alt="banned"
                        className="w-full h-full object-cover opacity-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rakip Takımı */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-lol-red">
              {userTeam === 'blue' ? '🔴 KIRMIZI TAKIM' : '🔵 MAVİ TAKIM'}
            </div>

            {/* Pickler */}
            <div className="space-y-2">
              {enemyTeam.length > 0 ? (
                enemyTeam.map((pick, i) => {
                  const champ = championMeta[pick.champId];
                  return (
                    <div
                      key={i}
                      className={`bg-gradient-to-r ${ROLE_COLORS[pick.role]} border border-lol-light/10 rounded-lg p-2 flex items-center gap-2 opacity-75`}
                    >
                      <img
                        src={`https://ddragon.leagueoflegends.com/cdn/${championMeta._meta?.patch || '16.11'}/img/champion/${pick.champId}.png`}
                        alt={champ?.name}
                        className="w-8 h-8 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{champ?.name}</p>
                        <p className="text-lol-light/40 text-xs">{ROLE_LABELS[pick.role]}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-lol-light/30 text-xs italic">Henüz seçim yok</p>
              )}
            </div>

            {/* Rakip Banları */}
            {enemyBans.length > 0 && (
              <div className="pt-2 border-t border-lol-light/5">
                <p className="text-xs text-lol-light/40 mb-2">🚫 Banladı ({enemyBans.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {enemyBans.map((bannedId, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-lg overflow-hidden border border-lol-red/40"
                      title={championMeta[bannedId]?.name}
                    >
                      <img
                        src={`https://ddragon.leagueoflegends.com/cdn/${championMeta._meta?.patch || '16.11'}/img/champion/${bannedId}.png`}
                        alt="banned"
                        className="w-full h-full object-cover opacity-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* === ANLIK ANALİZ === */}
      <section className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-lol-gold mb-4">⚡ ANLIK ANALİZ</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-lol-dark/40 border border-lol-light/5 rounded-lg p-3">
            <p className="text-lol-light/50">Takım Avantajı</p>
            <p className="text-white font-bold mt-1">
              {composition.teamAdvantage === 'Own' && '✅ Olumlu'}
              {composition.teamAdvantage === 'Enemy' && '❌ Olumsuz'}
              {composition.teamAdvantage === 'Equal' && '⚪ Eşit'}
            </p>
          </div>

          <div className="bg-lol-dark/40 border border-lol-light/5 rounded-lg p-3">
            <p className="text-lol-light/50">Teamfight</p>
            <p className="text-white font-bold mt-1">
              {composition.teamfight === 'Favorable' && '💪 Güçlü'}
              {composition.teamfight === 'Unfavorable' && '😰 Zayıf'}
              {composition.teamfight === 'Neutral' && '⚔️ Nötr'}
            </p>
          </div>

          <div className="bg-lol-dark/40 border border-lol-light/5 rounded-lg p-3">
            <p className="text-lol-light/50">Scaling</p>
            <p className="text-white font-bold mt-1">
              {composition.scaling === 'Weak' && '📉 Zayıf'}
              {composition.scaling === 'Strong' && '📈 Güçlü'}
              {composition.scaling === 'Balanced' && '⚖️ Dengeli'}
            </p>
          </div>

          <div className="bg-lol-dark/40 border border-lol-light/5 rounded-lg p-3">
            <p className="text-lol-light/50">CC / Engage</p>
            <p className="text-white font-bold mt-1">{composition.cc}</p>
          </div>

          <div className="bg-lol-dark/40 border border-lol-light/5 rounded-lg p-3">
            <p className="text-lol-light/50">AP / AD</p>
            <p className="text-white font-bold mt-1">{composition.balance}</p>
          </div>

          <div className="bg-lol-dark/40 border border-lol-light/5 rounded-lg p-3">
            <p className="text-lol-light/50">Early Game</p>
            <p className="text-white font-bold mt-1">
              {composition.earlyGame === 'Strong' && '🔥 Güçlü'}
              {composition.earlyGame === 'Weak' && '🐢 Zayıf'}
            </p>
          </div>
        </div>
      </section>

      {/* === EN İYİ ÖNERİLER === */}
      <section className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-lol-gold mb-4">🎯 EN İYİ ÖNERİLER</h2>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const champ = championMeta[rec.champId];
            const isHighPriority = idx === 0;

            return (
              <div
                key={rec.champId}
                className={`bg-lol-dark/40 border rounded-lg p-4 space-y-3 transition-all ${
                  isHighPriority
                    ? 'border-lol-gold/50 ring-1 ring-lol-gold/20'
                    : 'border-lol-light/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/${championMeta._meta?.patch || '16.11'}/img/champion/${rec.champId}.png`}
                      alt={rec.name}
                      className="w-12 h-12 rounded-lg border border-lol-light/10"
                    />
                    <div>
                      <p className="text-white font-bold text-lg">
                        {isHighPriority && '⭐ '}#{idx + 1} — {rec.name}
                      </p>
                      <p className="text-lol-light/50 text-sm">
                        {ROLE_LABELS[rec.role]} • WR {rec.winRate?.toFixed(1)}% • PR {rec.pickRate?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${isHighPriority ? 'text-lol-gold' : 'text-lol-blue'}`}>
                      {rec.score}
                    </div>
                    <p className="text-lol-light/40 text-xs">Draft Score</p>
                  </div>
                </div>

                {/* Analiz Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="bg-lol-dark/60 rounded p-2 border border-lol-light/5">
                    <p className="text-lol-light/40">Meta</p>
                    <p className="text-white font-semibold">{rec.breakdown.meta.toFixed(1)}</p>
                  </div>
                  <div className="bg-lol-dark/60 rounded p-2 border border-lol-light/5">
                    <p className="text-lol-light/40">Counter</p>
                    <p className="text-white font-semibold">{rec.breakdown.counter.toFixed(1)}</p>
                  </div>
                  <div className="bg-lol-dark/60 rounded p-2 border border-lol-light/5">
                    <p className="text-lol-light/40">Synergy</p>
                    <p className="text-white font-semibold">{rec.breakdown.synergy.toFixed(1)}</p>
                  </div>
                  <div className="bg-lol-dark/60 rounded p-2 border border-lol-light/5">
                    <p className="text-lol-light/40">Carry</p>
                    <p className="text-white font-semibold">{rec.breakdown.carry.toFixed(1)}</p>
                  </div>
                </div>

                {/* Seçim Sebebi */}
                <div className="bg-lol-dark/60 border border-lol-light/5 rounded p-3 text-xs space-y-1 text-lol-light/70">
                  {rec.breakdown.meta > 10 && (
                    <p>🔥 Meta gücü yüksek (presence: {rec.breakdown.meta.toFixed(1)})</p>
                  )}
                  {rec.breakdown.counter > 5 && (
                    <p>⚔️ Rakip takıma karşı güçlü counter olanakları</p>
                  )}
                  {rec.breakdown.synergy > 5 && (
                    <p>🤝 Takım arkadaşlarıyla iyi uyum</p>
                  )}
                  {rec.breakdown.carry > 10 && (
                    <p>💪 Güçlü carry potansiyeli — kazanma ihtimalini artırır</p>
                  )}
                  {rec.breakdown.roleApp === 10 && (
                    <p>✅ Rol için mükemmel uyum</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* === GELECEK MUHTEMEL HAMLELER === */}
      <section className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-lol-gold mb-4">🔮 GELECEK MUHTEMEL HAMLELER</h2>

        <div className="space-y-4">
          {/* Rakip Tahminleri */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-lol-red">
              ❌ Rakibin Muhtemel Sonraki Seçimi
            </h3>
            {predictedEnemyPicks.map((pred, idx) => {
              const champ = championMeta[pred.champId];
              return (
                <div
                  key={idx}
                  className="bg-lol-dark/40 border border-lol-red/20 rounded-lg p-3 flex items-start gap-3"
                >
                  <img
                    src={`https://ddragon.leagueoflegends.com/cdn/${championMeta._meta?.patch || '16.11'}/img/champion/${pred.champId}.png`}
                    alt={pred.name}
                    className="w-10 h-10 rounded-lg opacity-60"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      #{idx + 1} — {pred.name}
                    </p>
                    <p className="text-xs text-lol-light/60 mt-1">{pred.reason}</p>
                    <div className="text-xs text-lol-red mt-2 font-semibold">
                      Tahmini %: {pred.predictionScore}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sonraki Hamle Önerisi */}
          <div className="space-y-3 pt-4 border-t border-lol-light/5">
            <h3 className="text-sm font-semibold text-lol-gold">
              ✅ Bizim Sonraki Hamlesi
            </h3>
            {draftMode === 'soloq' ? (
              <div className="bg-lol-blue/10 border border-lol-blue/30 rounded-lg p-4 space-y-2">
                <p className="text-white font-medium">{nextMoves.priority}</p>
                <p className="text-xs text-lol-light/60">{nextMoves.reason}</p>
                <p className="text-xs text-lol-blue font-semibold mt-2">💡 {nextMoves.nextMove}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-lol-gold/10 border border-lol-gold/30 rounded-lg p-4 space-y-2">
                  <p className="text-white font-medium">{nextMoves.priority}</p>
                  <p className="text-xs text-lol-light/60">{nextMoves.reason}</p>
                  <p className="text-xs text-lol-gold font-semibold mt-2">🎯 {nextMoves.nextMove}</p>
                </div>

                {/* Uyarılar */}
                {nextMoves.warnings && nextMoves.warnings.length > 0 && (
                  <div className="space-y-2">
                    {nextMoves.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300"
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mode Indicator */}
      <div className="text-center text-xs text-lol-light/30 py-4 border-t border-lol-light/5">
        {draftMode === 'soloq' && '🎮 SoloQ Mode — Kişisel kazanma odaklı analiz'}
        {draftMode === 'pro' && '🏆 Pro Arena Mode — Takım sinerji ve stratejik analiz'}
      </div>
    </div>
  );
}
