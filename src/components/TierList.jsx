import { useState, useEffect, useMemo } from 'react';
import championMeta from '../data/championMeta.json';
import { getChampionImageUrl, getChampions, getLatestVersion } from '../services/dataDragon';

const ROLES = [
  { id: 'top', label: 'Top', icon: '🏔️' },
  { id: 'jungle', label: 'Jungle', icon: '🌿' },
  { id: 'mid', label: 'Mid', icon: '⚡' },
  { id: 'adc', label: 'ADC', icon: '🏹' },
  { id: 'support', label: 'Support', icon: '🛡️' },
];

const TIERS = ['S', 'A', 'B', 'C'];

const TIER_COLORS = {
  S: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/50',
  A: 'from-blue-500/20 to-blue-600/5 border-blue-500/50',
  B: 'from-green-500/20 to-green-600/5 border-green-500/50',
  C: 'from-gray-500/20 to-gray-600/5 border-gray-500/50',
};

const TIER_BADGE = {
  S: 'bg-yellow-500 text-black',
  A: 'bg-blue-500 text-white',
  B: 'bg-green-600 text-white',
  C: 'bg-gray-500 text-white',
};

function ChampionIcon({ champId, champData, version }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [displayName, setDisplayName] = useState(champData.name);

  useEffect(() => {
    if (version) {
      setImgUrl(
        `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png`
      );
    }
  }, [champId, version]);

  return (
    <div className="flex flex-col items-center gap-1 w-16 sm:w-20 group" title={champData.description}>
      <div className="relative">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={displayName}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-lol-light/20 
                       group-hover:border-lol-gold/60 group-hover:scale-110 transition-all duration-200"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-lol-gray/50 border border-lol-light/20 
                          flex items-center justify-center text-xs text-lol-light/50">
            {champData.name.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-[10px] sm:text-xs text-lol-light/80 text-center leading-tight truncate w-full">
        {displayName}
      </span>
      <div className="flex gap-1 text-[9px] text-lol-light/50">
        {champData.winRate && champData.winRate[champData._currentRole] && (
          <span className={
            champData.winRate[champData._currentRole] >= 51 
              ? 'text-green-400' 
              : champData.winRate[champData._currentRole] < 49 
                ? 'text-lol-red' 
                : 'text-lol-light/50'
          }>
            {champData.winRate[champData._currentRole]}%
          </span>
        )}
        {champData.pickRate && champData.pickRate[champData._currentRole] && (
          <span className="text-lol-light/40">
            | {champData.pickRate[champData._currentRole]}%
          </span>
        )}
      </div>
    </div>
  );
}

export default function TierList() {
  const [selectedRole, setSelectedRole] = useState('mid');
  const [version, setVersion] = useState(null);
  const [ddChampions, setDdChampions] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const champs = await getChampions();
        setDdChampions(champs);
        const v = await getLatestVersion();
        setVersion(v);
      } catch (e) {
        console.error('Data Dragon yüklenemedi:', e);
      }
    })();
  }, []);

  const tierGroups = useMemo(() => {
    const groups = { S: [], A: [], B: [], C: [] };

    for (const [champId, champData] of Object.entries(championMeta)) {
      if (champId === '_meta') continue;
      if (!champData.roles.includes(selectedRole)) continue;

      const tier = champData.tier[selectedRole] || 'C';
      const enriched = {
        ...champData,
        _id: champId,
        _currentRole: selectedRole,
        _displayName: ddChampions?.[champId]?.name || champData.name,
      };
      if (groups[tier]) {
        groups[tier].push(enriched);
      }
    }

    // Her tier içinde win rate'e göre sırala
    for (const tier of TIERS) {
      groups[tier].sort((a, b) => {
        const wrA = a.winRate?.[selectedRole] || 0;
        const wrB = b.winRate?.[selectedRole] || 0;
        return wrB - wrA;
      });
    }

    return groups;
  }, [selectedRole, ddChampions]);

  const meta = championMeta._meta;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Başlık */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-lol-gold mb-2">
          Tier List — Patch {meta?.patch || '26.6'}
        </h2>
        <p className="text-sm text-lol-light/60 max-w-2xl mx-auto">
          Plat+ ranked solo/duo verilerine dayanan şampiyon sıralaması. 
          Win rate ve pick rate değerleri gösterilmektedir.
        </p>
      </div>

      {/* Rol Seçici */}
      <div className="flex justify-center gap-2 mb-6">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${selectedRole === role.id
                ? 'bg-lol-gold/20 border border-lol-gold text-lol-gold shadow-lg shadow-lol-gold/10'
                : 'bg-lol-gray/50 border border-lol-light/10 text-lol-light/60 hover:bg-lol-gray hover:text-lol-light'
              }
            `}
          >
            <span>{role.icon}</span>
            <span className="hidden sm:inline">{role.label}</span>
          </button>
        ))}
      </div>

      {/* Tier Grupları */}
      <div className="space-y-4">
        {TIERS.map((tier) => {
          const champs = tierGroups[tier];
          if (champs.length === 0) return null;

          return (
            <div
              key={tier}
              className={`bg-gradient-to-r ${TIER_COLORS[tier]} border rounded-xl p-4`}
            >
              {/* Tier Başlığı */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`${TIER_BADGE[tier]} font-bold text-lg w-8 h-8 flex items-center justify-center rounded-md`}>
                  {tier}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-lol-light/60">
                    {tier === 'S' && 'OP / Meta Tanımlayan'}
                    {tier === 'A' && 'Güçlü / Tutarlı Performans'}
                    {tier === 'B' && 'Orta / Durumsal'}
                    {tier === 'C' && 'Zayıf / Meta Dışı'}
                  </span>
                  <span className="text-xs text-lol-light/30">({champs.length} şampiyon)</span>
                </div>
              </div>

              {/* Şampiyon Iconları */}
              <div className="flex flex-wrap gap-3">
                {champs.map((champ) => (
                  <ChampionIcon
                    key={champ._id}
                    champId={champ._id}
                    champData={champ}
                    version={version}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Metodoloji Notu */}
      <div className="mt-8 bg-lol-gray/30 border border-lol-light/10 rounded-xl p-5">
        <h3 className="text-lol-gold font-semibold mb-3 flex items-center gap-2">
          <span>📊</span> Metodoloji
        </h3>
        <div className="text-sm text-lol-light/70 space-y-2">
          <p>{meta?.methodology}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
            {meta?.tierCriteria && Object.entries(meta.tierCriteria).map(([t, desc]) => (
              <div key={t} className="flex items-start gap-2">
                <span className={`${TIER_BADGE[t]} text-xs font-bold w-5 h-5 flex items-center justify-center rounded shrink-0 mt-0.5`}>
                  {t}
                </span>
                <span className="text-xs text-lol-light/60">{desc}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-lol-light/40 mt-3">
          Son güncelleme: {meta?.lastUpdated} | Kaynak: op.gg, u.gg, lolalytics.com topluluk verileri (Plat+)
        </p>
      </div>
    </div>
  );
}
