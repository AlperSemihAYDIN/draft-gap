import { useState, useEffect, useMemo } from 'react';
import { getCountersFor, getCounteredBy, getAllChampions } from '../services/recommendation';
import { getLatestVersion, getChampions } from '../services/dataDragon';
import { useLanguage } from '../i18n/LanguageContext';

const ROLES = [
  { id: 'all', label: 'Tümü', icon: '🌐' },
  { id: 'top', label: 'Top', icon: '🏔️' },
  { id: 'jungle', label: 'Jungle', icon: '🌿' },
  { id: 'mid', label: 'Mid', icon: '⚡' },
  { id: 'adc', label: 'ADC', icon: '🏹' },
  { id: 'support', label: 'Support', icon: '🛡️' },
];

const TIER_BADGE = {
  S: 'bg-yellow-500 text-black',
  A: 'bg-blue-500 text-white',
  B: 'bg-green-600 text-white',
  C: 'bg-gray-500 text-white',
};

export default function CounterPick() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChamp, setSelectedChamp] = useState(null);
  const [selectedRole, setSelectedRole] = useState('all');
  const [version, setVersion] = useState(null);
  const [ddChampions, setDdChampions] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [v, champs] = await Promise.all([getLatestVersion(), getChampions()]);
        setVersion(v);
        setDdChampions(champs);
      } catch (e) {
        console.error('Data yüklenemedi:', e);
      }
    })();
  }, []);

  const allChamps = useMemo(() => getAllChampions(), []);

  const filteredChamps = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allChamps
      .filter(c => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .slice(0, 8);
  }, [searchQuery, allChamps]);

  const counters = useMemo(() => {
    if (!selectedChamp) return [];
    const role = selectedRole === 'all' ? null : selectedRole;
    return getCountersFor(selectedChamp.id, role);
  }, [selectedChamp, selectedRole]);

  const countered = useMemo(() => {
    if (!selectedChamp) return [];
    const role = selectedRole === 'all' ? null : selectedRole;
    return getCounteredBy(selectedChamp.id, role);
  }, [selectedChamp, selectedRole]);

  function selectChamp(champ) {
    setSelectedChamp(champ);
    setSearchQuery('');
    setShowDropdown(false);
  }

  function getImgUrl(champId) {
    return version ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png` : null;
  }

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-lol-gold mb-2">
          ⚔️ {t('counterPickTitle')}
        </h2>
        <p className="text-sm text-lol-light/60 max-w-2xl mx-auto">
          {t('counterPickDesc')}
        </p>
      </div>

      {/* Şampiyon Arama */}
      <div className="relative max-w-md mx-auto mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder={t('counterPickSearch')}
          className="w-full bg-lol-gray border border-lol-light/20 rounded-xl px-4 py-3 text-white
                     placeholder-lol-light/30 focus:outline-none focus:border-lol-gold/50 text-center"
        />
        {showDropdown && filteredChamps.length > 0 && (
          <div className="absolute z-30 w-full mt-1 bg-lol-gray border border-lol-light/20 rounded-xl overflow-hidden shadow-xl">
            {filteredChamps.map((champ) => (
              <button
                key={champ.id}
                onClick={() => selectChamp(champ)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-lol-blue/20 transition-colors text-left"
              >
                {getImgUrl(champ.id) && (
                  <img src={getImgUrl(champ.id)} alt="" className="w-8 h-8 rounded" onError={e => e.target.style.display='none'} />
                )}
                <span className="text-white text-sm">{champ.name}</span>
                <span className="text-lol-light/30 text-xs ml-auto">{champ.roles.join(', ')}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Seçili Şampiyon */}
      {selectedChamp && (
        <>
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-4 bg-lol-dark/60 border border-lol-gold/30 rounded-2xl px-6 py-4">
              {getImgUrl(selectedChamp.id) && (
                <img src={getImgUrl(selectedChamp.id)} alt="" className="w-16 h-16 rounded-xl border border-lol-gold/30" />
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{selectedChamp.name}</h3>
                <p className="text-lol-light/40 text-xs">{selectedChamp.roles.join(' • ')}</p>
              </div>
              <button
                onClick={() => setSelectedChamp(null)}
                className="ml-4 text-lol-light/30 hover:text-lol-red transition-colors"
              >✕</button>
            </div>
          </div>

          {/* Rol Filtresi */}
          <div className="flex justify-center gap-2 mb-6">
            {ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${selectedRole === role.id
                    ? 'bg-lol-gold/20 border border-lol-gold text-lol-gold'
                    : 'bg-lol-gray/50 border border-lol-light/10 text-lol-light/60 hover:text-lol-light'
                  }`}
              >
                <span>{role.icon}</span>
                <span>{role.label}</span>
              </button>
            ))}
          </div>

          {/* Counter Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bu şampiyona karşı ne iyi */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                🗡️ {t('counterWhoBeats')} {selectedChamp.name}?
              </h3>
              {counters.length === 0 && (
                <p className="text-lol-light/40 text-sm py-4">{t('counterNoData')}</p>
              )}
              {counters.slice(0, 10).map((c, idx) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${idx < 3 ? 'bg-red-500/30 text-red-300' : 'bg-lol-gray/50 text-lol-light/40'}`}>{idx + 1}</span>
                  {getImgUrl(c.id) && (
                    <img src={getImgUrl(c.id)} alt="" className="w-10 h-10 rounded-lg border border-lol-light/15" onError={e => e.target.style.display='none'} />
                  )}
                  <div className="flex-1">
                    <span className="text-white font-medium text-sm">{c.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${TIER_BADGE[c.tier]}`}>{c.tier}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-bold text-sm">+{c.score}</div>
                    {c.winRate && <span className="text-lol-light/40 text-[10px]">WR: {c.winRate}%</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Bu şampiyon neyi yener */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                💪 {selectedChamp.name} {t('counterBeatsWho')}
              </h3>
              {countered.length === 0 && (
                <p className="text-lol-light/40 text-sm py-4">{t('counterNoData')}</p>
              )}
              {countered.slice(0, 10).map((c, idx) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${idx < 3 ? 'bg-green-500/30 text-green-300' : 'bg-lol-gray/50 text-lol-light/40'}`}>{idx + 1}</span>
                  {getImgUrl(c.id) && (
                    <img src={getImgUrl(c.id)} alt="" className="w-10 h-10 rounded-lg border border-lol-light/15" onError={e => e.target.style.display='none'} />
                  )}
                  <div className="flex-1">
                    <span className="text-white font-medium text-sm">{c.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${TIER_BADGE[c.tier]}`}>{c.tier}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-sm">+{c.score}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!selectedChamp && (
        <div className="text-center py-16 text-lol-light/30">
          <p className="text-4xl mb-4">⚔️</p>
          <p>{t('counterPickHint')}</p>
        </div>
      )}
    </div>
  );
}
