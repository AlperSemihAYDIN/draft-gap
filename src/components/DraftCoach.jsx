import { useMemo } from 'react';
import { useDraftContext } from '../contexts/DraftContext';
import { getRecommendations, analyzeComposition } from '../services/draftAnalysis';
import { useLanguage } from '../i18n/LanguageContext';
import championMeta from '../data/championMeta.json';

const ROLE_LABELS = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  adc: 'ADC',
  support: 'Support',
};

const ROLE_COLORS = {
  top: 'from-red-500/20 to-red-600/5',
  jungle: 'from-green-500/20 to-green-600/5',
  mid: 'from-purple-500/20 to-purple-600/5',
  adc: 'from-yellow-500/20 to-yellow-600/5',
  support: 'from-blue-500/20 to-blue-600/5',
};

export default function DraftCoach() {
  const { t } = useLanguage();
  const {
    blueTeam,
    redTeam,
    blueBans,
    redBans,
    userRole,
    draftMode,
    userTeam,
  } = useDraftContext();

  const analysis = useMemo(() => {
    if (blueTeam.length === 0 && redTeam.length === 0) {
      return null; // Henüz draft başlamamış
    }

    const recs = getRecommendations(
      userRole,
      blueTeam,
      redTeam,
      userTeam,
      draftMode,
      3
    );

    const comp = analyzeComposition(blueTeam, redTeam, userTeam);

    return { recommendations: recs, composition: comp };
  }, [blueTeam, redTeam, userRole, draftMode, userTeam]);

  if (!analysis) {
    return (
      <div className="text-center py-8 text-lol-light/40">
        <p>{t('draftWait')}</p>
      </div>
    );
  }

  const ownTeam = userTeam === 'blue' ? blueTeam : redTeam;
  const enemyTeam = userTeam === 'blue' ? redTeam : blueTeam;
  const ownBans = userTeam === 'blue' ? blueBans : redBans;
  const enemyBans = userTeam === 'blue' ? redBans : blueBans;

  return (
    <div className="space-y-8">
      {/* ===== DRAFT DURUMU ===== */}
      <div className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6 space-y-6">
        <h3 className="text-xl font-bold text-lol-gold">📊 DRAFT DURUMU</h3>

        <div className="grid grid-cols-2 gap-6">
          {/* Kendi Takım */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-lol-blue">
              {userTeam === 'blue' ? '🔵 MAVİ TAKIM' : '🔴 KIRMIZI TAKIM'}
            </div>
            <div className="space-y-2">
              {ownTeam.map((pick, i) => {
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
                  </div>
                );
              })}
              {ownTeam.length === 0 && (
                <p className="text-lol-light/30 text-xs italic">
                  {t('draftWait')}
                </p>
              )}
            </div>

            {/* Banlar */}
            {ownBans.length > 0 && (
              <div className="pt-2 border-t border-lol-light/5">
                <p className="text-xs text-lol-light/40 mb-1">🚫 Banlanmış:</p>
                <div className="flex flex-wrap gap-1">
                  {ownBans.map((bannedId, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-lg overflow-hidden border border-lol-red/40"
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

          {/* Rakip Takım */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-lol-red">
              {userTeam === 'blue' ? '🔴 KIRMIZI TAKIM' : '🔵 MAVİ TAKIM'}
            </div>
            <div className="space-y-2">
              {enemyTeam.map((pick, i) => {
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
              })}
              {enemyTeam.length === 0 && (
                <p className="text-lol-light/30 text-xs italic">
                  Bekleniyor...
                </p>
              )}
            </div>

            {/* Rakip Banları */}
            {enemyBans.length > 0 && (
              <div className="pt-2 border-t border-lol-light/5">
                <p className="text-xs text-lol-light/40 mb-1">🚫 Banladı:</p>
                <div className="flex flex-wrap gap-1">
                  {enemyBans.map((bannedId, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-lg overflow-hidden border border-lol-red/40"
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
      </div>

      {/* ===== ANLIK ANALİZ ===== */}
      <div className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-lol-gold mb-4">⚡ ANLIK ANALİZ</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-lol-light/50">Takım Avantajı:</span>
            <p className="text-white font-medium">
              {analysis.composition.teamAdvantage === 'Own' && '✅ Olumlu'}
              {analysis.composition.teamAdvantage === 'Enemy' && '❌ Olumsuz'}
              {analysis.composition.teamAdvantage === 'Equal' && '⚪ Eşit'}
            </p>
          </div>
          <div>
            <span className="text-lol-light/50">Teamfight:</span>
            <p className="text-white font-medium">
              {analysis.composition.teamfight === 'Favorable' && '💪 Güçlü'}
              {analysis.composition.teamfight === 'Unfavorable' && '😰 Zayıf'}
            </p>
          </div>
          <div>
            <span className="text-lol-light/50">CC Kontrol:</span>
            <p className="text-white font-medium">{analysis.composition.cc}</p>
          </div>
        </div>
      </div>

      {/* ===== EN İYİ ÖNERİLER ===== */}
      <div className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6">
        <h3 className="text-xl font-bold text-lol-gold mb-4">🎯 TOP 3 ÖNERİ</h3>
        <div className="space-y-4">
          {analysis.recommendations.map((rec, idx) => {
            const champ = championMeta[rec.champId];
            return (
              <div
                key={rec.champId}
                className="bg-lol-dark/40 border border-lol-blue/20 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/${championMeta._meta?.patch || '16.11'}/img/champion/${rec.champId}.png`}
                      alt={rec.name}
                      className="w-10 h-10 rounded-lg"
                    />
                    <div>
                      <p className="text-white font-bold text-lg">
                        #{idx + 1} — {rec.name}
                      </p>
                      <p className="text-lol-light/50 text-sm">
                        {ROLE_LABELS[rec.role]} • WR {rec.winRate}% • PR {rec.pickRate}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-lol-gold">{rec.score}</div>
                    <p className="text-lol-light/40 text-xs">Draft Score</p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-lol-light/50">
                    Meta: <span className="text-white">{rec.breakdown.meta.toFixed(1)}</span>
                  </div>
                  <div className="text-lol-light/50">
                    Counter: <span className="text-white">{rec.breakdown.counter.toFixed(1)}</span>
                  </div>
                  <div className="text-lol-light/50">
                    Synergy: <span className="text-white">{rec.breakdown.synergy.toFixed(1)}</span>
                  </div>
                  <div className="text-lol-light/50">
                    Carry: <span className="text-white">{rec.breakdown.carry.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode indicator */}
      <div className="text-center text-xs text-lol-light/30 pt-4 border-t border-lol-light/5">
        {draftMode === 'soloq' && '🎮 SoloQ Mode — Kişisel kazanma odaklı'}
        {draftMode === 'pro' && '🏆 Pro Arena Mode — Takım sinerji odaklı'}
      </div>
    </div>
  );
}
