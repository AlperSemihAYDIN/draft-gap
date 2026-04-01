// Canlı Oyun Tespiti — Riot ID ile otomatik draft algılama
import { useState } from 'react';
import { getAccountByRiotId, getActiveGame, REGIONS } from '../services/riotApi';
import { useLanguage } from '../i18n/LanguageContext';

export default function LiveGameDetector({ champions, onGameDetected }) {
  const { t } = useLanguage();
  const [riotId, setRiotId] = useState('');
  const [region, setRegion] = useState('tr');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [notInGame, setNotInGame] = useState(false);

  async function handleDetect() {
    setError(null);
    setGameData(null);
    setNotInGame(false);

    const parts = riotId.split('#');
    if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
      setError(t('liveInvalidId'));
      return;
    }

    const [gameName, tagLine] = [parts[0].trim(), parts[1].trim()];
    setLoading(true);

    try {
      const account = await getAccountByRiotId(gameName, tagLine, region);
      const game = await getActiveGame(account.puuid, region);

      if (!game) {
        setNotInGame(true);
        return;
      }

      setGameData(game);
    } catch (err) {
      setError(err.message || t('liveError'));
    } finally {
      setLoading(false);
    }
  }

  function handleApplyDraft() {
    if (!gameData || !champions) return;

    // Champion key → champion data eşleme
    const champByKey = {};
    Object.values(champions).forEach((c) => {
      champByKey[String(c.key)] = c;
    });

    // Oyuncunun takımını bul
    const gameName = riotId.split('#')[0].trim().toLowerCase();
    const player = gameData.participants.find(
      (p) => (p.riotId || '').toLowerCase().startsWith(gameName)
    );
    const playerTeam = player?.teamId || 100;

    // Takımları ayır
    const enemyParticipants = gameData.participants.filter((p) => p.teamId !== playerTeam);
    const allyParticipants = gameData.participants.filter(
      (p) => p.teamId === playerTeam && !(p.riotId || '').toLowerCase().startsWith(gameName)
    );

    const enemies = enemyParticipants
      .map((p) => champByKey[String(p.championId)])
      .filter(Boolean);

    const allies = allyParticipants
      .map((p) => champByKey[String(p.championId)])
      .filter(Boolean);

    onGameDetected({ enemies, allies });
  }

  const regionEntries = Object.entries(REGIONS);

  return (
    <div className="bg-lol-dark/40 border border-lol-blue/20 rounded-xl p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2 text-lol-blue font-medium text-sm">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {t('liveTitle')}
      </div>

      <p className="text-lol-light/40 text-xs">{t('liveDesc')}</p>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Region */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="bg-lol-gray border border-lol-light/10 rounded-lg px-3 py-2.5 text-sm
                     text-white focus:outline-none focus:border-lol-blue/50 sm:w-40"
        >
          {regionEntries.map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        {/* Riot ID */}
        <input
          type="text"
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleDetect()}
          placeholder={t('livePlaceholder')}
          className="flex-1 bg-lol-gray border border-lol-light/10 rounded-lg px-4 py-2.5 text-sm
                     text-white placeholder-lol-light/30 focus:outline-none focus:border-lol-blue/50"
        />

        {/* Detect */}
        <button
          onClick={handleDetect}
          disabled={loading || !riotId.includes('#')}
          className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap
            ${loading || !riotId.includes('#')
              ? 'bg-lol-gray/40 text-lol-light/30 cursor-not-allowed'
              : 'bg-lol-blue/20 text-lol-blue hover:bg-lol-blue/30 border border-lol-blue/30'
            }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-lol-blue/30 border-t-lol-blue rounded-full animate-spin" />
              {t('liveSearching')}
            </span>
          ) : (
            t('liveDetect')
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-lol-red/10 border border-lol-red/20 rounded-lg px-4 py-2 text-lol-red text-sm">
          {error}
        </div>
      )}

      {/* Not in game */}
      {notInGame && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-3 text-yellow-400 text-sm">
          <p className="font-medium">{t('liveNotInGame')}</p>
          <p className="text-yellow-400/60 text-xs mt-1">{t('liveNotInGameHint')}</p>
        </div>
      )}

      {/* Game found */}
      {gameData && (
        <div className="space-y-3">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
            <p className="text-green-400 font-medium text-sm">{t('liveGameFound')}</p>
            <p className="text-green-400/60 text-xs mt-1">
              {gameData.participants.length} {t('livePlayers')} • {gameData.gameMode}
            </p>
          </div>

          <button
            onClick={handleApplyDraft}
            className="w-full py-3 rounded-lg font-bold text-sm bg-gradient-to-r from-lol-blue to-teal-500
                       text-lol-dark hover:shadow-lg hover:shadow-lol-blue/30 transition-all"
          >
            {t('liveApply')}
          </button>
        </div>
      )}

      <p className="text-lol-light/20 text-[10px]">{t('liveApiNote')}</p>
    </div>
  );
}
