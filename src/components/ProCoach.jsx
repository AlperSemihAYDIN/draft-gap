import { useState, useEffect, useMemo, useCallback } from 'react';
import { getRecommendations, getAllChampions } from '../services/recommendation';
import { getLatestVersion, getChampions } from '../services/dataDragon';
import ChampionSearch from './ChampionSearch';
import RoleSelector from './RoleSelector';
import SelectedChampions from './SelectedChampions';
import RecommendationCard from './RecommendationCard';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProCoach() {
  const { t } = useLanguage();
  const [champions, setChampions] = useState({});
  const [version, setVersion] = useState('');

  // Draft state
  const [enemyChampions, setEnemyChampions] = useState([]);
  const [allyChampions, setAllyChampions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('mid');
  const [recommendations, setRecommendations] = useState(null);

  // Fearless draft state
  const [fearlessMode, setFearlessMode] = useState(false);
  const [fearlessBanned, setFearlessBanned] = useState([]);
  const [gameNumber, setGameNumber] = useState(1);
  const [teamName, setTeamName] = useState('');

  // Draft history
  const [draftHistory, setDraftHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [v, champs] = await Promise.all([getLatestVersion(), getChampions()]);
        setVersion(v);
        setChampions(champs);
      } catch (e) {
        console.error('Veri yüklenemedi:', e);
      }
    })();
  }, []);

  function addEnemy(champ) {
    if (enemyChampions.length >= 5) return;
    if (enemyChampions.find(c => c.id === champ.id)) return;
    setEnemyChampions([...enemyChampions, champ]);
  }
  function removeEnemy(id) { setEnemyChampions(enemyChampions.filter(c => c.id !== id)); }
  function addAlly(champ) {
    if (allyChampions.length >= 4) return;
    if (allyChampions.find(c => c.id === champ.id)) return;
    setAllyChampions([...allyChampions, champ]);
  }
  function removeAlly(id) { setAllyChampions(allyChampions.filter(c => c.id !== id)); }

  const allSelectedIds = [
    ...enemyChampions.map(c => c.id),
    ...allyChampions.map(c => c.id),
    ...(fearlessMode ? fearlessBanned : []),
  ];

  function handleRecommend() {
    const enemyIds = enemyChampions.map(c => c.id);
    const allyIds = allyChampions.map(c => c.id);
    const results = getRecommendations(enemyIds, allyIds, selectedRole, t, {
      fearless: fearlessMode,
      bannedChamps: fearlessBanned,
    });
    setRecommendations(results);
  }

  function handleSaveGame() {
    const gameData = {
      game: gameNumber,
      team: teamName,
      enemies: enemyChampions.map(c => ({ id: c.id, name: c.name })),
      allies: allyChampions.map(c => ({ id: c.id, name: c.name })),
      role: selectedRole,
      timestamp: new Date().toISOString(),
    };
    setDraftHistory([...draftHistory, gameData]);

    // Fearless: seçilmiş şampiyonları yasaklı listeye ekle
    if (fearlessMode) {
      const newBanned = [
        ...fearlessBanned,
        ...enemyChampions.map(c => c.id),
        ...allyChampions.map(c => c.id),
      ];
      setFearlessBanned([...new Set(newBanned)]);
    }

    setGameNumber(gameNumber + 1);
    setEnemyChampions([]);
    setAllyChampions([]);
    setRecommendations(null);
  }

  function handleResetFearless() {
    setFearlessBanned([]);
    setGameNumber(1);
    setDraftHistory([]);
    setEnemyChampions([]);
    setAllyChampions([]);
    setRecommendations(null);
  }

  const isFormValid = selectedRole && (enemyChampions.length > 0 || allyChampions.length > 0 || selectedRole);

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      {/* Başlık */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-lol-gold mb-2">
          🏆 {t('proCoachTitle')}
        </h2>
        <p className="text-sm text-lol-light/60 max-w-2xl mx-auto">
          {t('proCoachDesc')}
        </p>
      </div>

      {/* Fearless Draft Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setFearlessMode(!fearlessMode)}
          className={`px-6 py-3 rounded-xl font-bold text-sm transition-all border
            ${fearlessMode
              ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-purple-500/50 text-purple-300 shadow-lg shadow-purple-500/10'
              : 'bg-lol-gray/50 border-lol-light/15 text-lol-light/50 hover:border-purple-500/30'
            }`}
        >
          {fearlessMode ? '🔥' : '⚔️'} Fearless Draft {fearlessMode ? 'ON' : 'OFF'}
        </button>

        {fearlessMode && (
          <div className="flex items-center gap-3">
            <span className="text-purple-300 text-sm font-medium">
              {t('proGameNumber')}: {gameNumber}
            </span>
            <span className="text-lol-light/30 text-xs">
              ({fearlessBanned.length} {t('proBannedChamps')})
            </span>
          </div>
        )}

        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder={t('proTeamName')}
          className="bg-lol-gray border border-lol-light/10 rounded-lg px-4 py-2 text-sm text-white
                     placeholder-lol-light/30 focus:outline-none focus:border-lol-gold/50 w-48"
        />
      </div>

      {/* Fearless Banned Champions */}
      {fearlessMode && fearlessBanned.length > 0 && (
        <div className="mb-6 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
          <h4 className="text-purple-300 text-sm font-medium mb-2">
            🚫 {t('proFearlessBanned')} ({fearlessBanned.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {fearlessBanned.map(champId => {
              const imgUrl = version
                ? `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champId}.png`
                : null;
              return (
                <div key={champId} className="relative group">
                  {imgUrl ? (
                    <img src={imgUrl} alt={champId} className="w-10 h-10 rounded-lg border border-purple-500/30 opacity-50 grayscale"
                         onError={e => e.target.style.display='none'} />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-lol-gray/50 border border-purple-500/30 flex items-center justify-center text-xs text-lol-light/30">
                      {champId.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-red-400 text-lg font-bold">✕</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Draft Form */}
      <div className="space-y-6">
        <section className="space-y-3">
          <label className="block text-sm font-medium text-lol-gold">{t('selectRole')}</label>
          <RoleSelector selectedRole={selectedRole} onSelect={setSelectedRole} />
        </section>

        <section className="space-y-3 bg-lol-dark/40 border border-lol-light/5 rounded-xl p-4 sm:p-6">
          <label className="block text-sm font-medium text-lol-red">{t('enemyTeam')}</label>
          <ChampionSearch champions={champions} version={version} onSelect={addEnemy}
            placeholder={t('enemyPlaceholder')} disabledIds={allSelectedIds} />
          <SelectedChampions champions={enemyChampions} version={version} onRemove={removeEnemy}
            label={t('enemyLabel')} maxCount={5} />
        </section>

        <section className="space-y-3 bg-lol-dark/40 border border-lol-light/5 rounded-xl p-4 sm:p-6">
          <label className="block text-sm font-medium text-lol-blue">{t('allyTeam')}</label>
          <ChampionSearch champions={champions} version={version} onSelect={addAlly}
            placeholder={t('allyPlaceholder')} disabledIds={allSelectedIds} />
          <SelectedChampions champions={allyChampions} version={version} onRemove={removeAlly}
            label={t('allyLabel')} maxCount={4} />
        </section>

        {/* Butonlar */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button onClick={handleRecommend} disabled={!isFormValid}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all
              ${isFormValid
                ? 'bg-gradient-to-r from-lol-blue to-teal-500 text-lol-dark hover:shadow-lg hover:scale-105'
                : 'bg-lol-gray/40 text-lol-light/30 cursor-not-allowed'}`}>
            {t('recommend')}
          </button>

          {fearlessMode && (enemyChampions.length > 0 || allyChampions.length > 0) && (
            <button onClick={handleSaveGame}
              className="px-6 py-4 rounded-xl font-bold text-sm bg-purple-600/20 text-purple-300 border border-purple-500/30
                         hover:bg-purple-600/30 transition-all">
              💾 {t('proSaveGame')} #{gameNumber}
            </button>
          )}

          {fearlessMode && fearlessBanned.length > 0 && (
            <button onClick={handleResetFearless}
              className="px-6 py-4 rounded-xl font-bold text-sm bg-red-600/10 text-red-400 border border-red-500/20
                         hover:bg-red-600/20 transition-all">
              🔄 {t('proResetFearless')}
            </button>
          )}
        </div>
      </div>

      {/* Sonuçlar */}
      {recommendations && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-bold text-white">{t('resultsTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <RecommendationCard key={rec.id} recommendation={rec} version={version} rank={idx + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Draft Geçmişi */}
      {draftHistory.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-bold text-lol-gold flex items-center gap-2">
            📋 {t('proDraftHistory')}
          </h3>
          <div className="space-y-3">
            {draftHistory.map((game, idx) => (
              <div key={idx} className="bg-lol-dark/40 border border-lol-light/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium text-sm">
                    {t('proGame')} #{game.game} {game.team && `— ${game.team}`}
                  </span>
                  <span className="text-lol-light/30 text-xs">{game.role.toUpperCase()}</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-red-400">{t('enemyLabel')}:</span>
                    <span className="text-lol-light/60 ml-1">{game.enemies.map(e => e.name).join(', ') || '-'}</span>
                  </div>
                  <div>
                    <span className="text-blue-400">{t('allyLabel')}:</span>
                    <span className="text-lol-light/60 ml-1">{game.allies.map(a => a.name).join(', ') || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fearless Draft Açıklama */}
      <div className="mt-8 bg-lol-gray/30 border border-lol-light/10 rounded-xl p-5">
        <h3 className="text-lol-gold font-semibold mb-2">💡 {t('proFearlessInfo')}</h3>
        <p className="text-sm text-lol-light/60">{t('proFearlessInfoDesc')}</p>
      </div>
    </div>
  );
}
