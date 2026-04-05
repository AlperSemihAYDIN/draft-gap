import { useState, useEffect, useMemo } from 'react';
import { getBlindPickTierList } from '../services/recommendation';
import { getLatestVersion, getChampions } from '../services/dataDragon';
import { useLanguage } from '../i18n/LanguageContext';

const ROLES = [
  { id: 'top', label: 'Top', icon: '🏔️' },
  { id: 'jungle', label: 'Jungle', icon: '🌿' },
  { id: 'mid', label: 'Mid', icon: '⚡' },
  { id: 'adc', label: 'ADC', icon: '🏹' },
  { id: 'support', label: 'Support', icon: '🛡️' },
];

const SAFETY_COLORS = {
  high: 'text-green-400 bg-green-500/10 border-green-500/30',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  low: 'text-red-400 bg-red-500/10 border-red-500/30',
};

function getSafetyLevel(score) {
  if (score >= 4) return 'high';
  if (score >= 2.5) return 'medium';
  return 'low';
}

export default function BlindPickList() {
  const { t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState('mid');
  const [version, setVersion] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const v = await getLatestVersion();
        setVersion(v);
      } catch (e) {
        console.error('Version yüklenemedi:', e);
      }
    })();
  }, []);

  const blindPicks = useMemo(() => {
    return getBlindPickTierList(selectedRole);
  }, [selectedRole]);

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-lol-gold mb-2">
          🛡️ {t('blindPickTitle')}
        </h2>
        <p className="text-sm text-lol-light/60 max-w-2xl mx-auto">
          {t('blindPickDesc')}
        </p>
      </div>

      {/* Rol Seçici */}
      <div className="flex justify-center gap-2 mb-6">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${selectedRole === role.id
                ? 'bg-lol-gold/20 border border-lol-gold text-lol-gold shadow-lg shadow-lol-gold/10'
                : 'bg-lol-gray/50 border border-lol-light/10 text-lol-light/60 hover:bg-lol-gray hover:text-lol-light'
              }`}
          >
            <span>{role.icon}</span>
            <span className="hidden sm:inline">{role.label}</span>
          </button>
        ))}
      </div>

      {/* Blind Pick Listesi */}
      <div className="space-y-3">
        {blindPicks.slice(0, 15).map((champ, idx) => {
          const level = getSafetyLevel(champ.blindScore);
          const imgUrl = version
            ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.id}.png`
            : null;

          return (
            <div
              key={champ.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01]
                ${idx < 3
                  ? 'bg-gradient-to-r from-yellow-500/10 to-transparent border-yellow-500/30'
                  : idx < 7
                    ? 'bg-gradient-to-r from-blue-500/10 to-transparent border-blue-500/20'
                    : 'bg-lol-dark/40 border-lol-light/10'
                }`}
            >
              {/* Sıra */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                ${idx < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-lol-gray/50 text-lol-light/50'}`}>
                {idx + 1}
              </div>

              {/* Şampiyon ikonu */}
              {imgUrl && (
                <img
                  src={imgUrl}
                  alt={champ.name}
                  className="w-12 h-12 rounded-lg border border-lol-light/20"
                  onError={(e) => e.target.style.display = 'none'}
                />
              )}

              {/* Bilgi */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{champ.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${SAFETY_COLORS[level]}`}>
                    {level === 'high' ? t('blindSafe') : level === 'medium' ? t('blindOk') : t('blindRisky')}
                  </span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-lol-light/50">
                  <span className={champ.winRate >= 52 ? 'text-green-400' : champ.winRate >= 48 ? 'text-lol-light/60' : 'text-red-400'}>
                    WR: {champ.winRate.toFixed(1)}%
                  </span>
                  <span>PR: {champ.pickRate.toFixed(1)}%</span>
                  <span className={champ.banRate >= 15 ? 'text-red-400' : ''}>
                    Ban: {champ.banRate.toFixed(1)}%
                  </span>
                  <span>{t('blindCounters')}: {champ.counterCount}</span>
                </div>
              </div>

              {/* Skor */}
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-lol-gold">{champ.blindScore.toFixed(1)}</div>
                <div className="text-[10px] text-lol-light/30">{t('blindScoreLabel')}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Açıklama */}
      <div className="mt-8 bg-lol-gray/30 border border-lol-light/10 rounded-xl p-5">
        <h3 className="text-lol-gold font-semibold mb-2">💡 {t('blindPickInfo')}</h3>
        <p className="text-sm text-lol-light/60">{t('blindPickInfoDesc')}</p>
      </div>
    </div>
  );
}
