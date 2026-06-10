import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useDraftContext } from '../contexts/DraftContext';
import riotApi from '../services/riotApi';
import { parseRiotId, getRegionInfo, detectGameMode } from '../services/gameDetection';

export default function LiveGameDetectorV2({ onGameDetected }) {
  const { t } = useLanguage();
  const { setDraftMode, setUserRole, setUserTeam, setIsMonitoring } = useDraftContext();

  const [riotId, setRiotId] = useState('');
  const [region, setRegion] = useState('tr');
  const [isSearching, setIsSearching] = useState(false);
  const [gameStatus, setGameStatus] = useState(null); // 'not-found', 'champ-select', 'in-game', 'error'
  const [gameInfo, setGameInfo] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null); // Eğer otomatik belirlenemiyorsa

  // Riot ID girişi yönetimi
  const handleRiotIdChange = (e) => {
    setRiotId(e.target.value);
  };

  // Canlı oyun ara
  const handleSearchGame = async () => {
    if (!riotId.trim()) {
      setGameStatus('error');
      return;
    }

    const parsed = parseRiotId(riotId);
    if (!parsed) {
      setGameStatus('error');
      return;
    }

    setIsSearching(true);
    setGameStatus(null);

    try {
      // 1. Oyuncu hesabını bul
      const account = await riotApi.getAccountByRiotId(
        parsed.gameName,
        parsed.tagLine,
        region
      );

      if (!account) {
        setGameStatus('not-found');
        setIsSearching(false);
        return;
      }

      // 2. Canlı oyun ara
      const spectatorData = await riotApi.getActiveGame(account.puuid, region);

      if (!spectatorData) {
        setGameStatus('not-in-game');
        setIsSearching(false);
        return;
      }

      // 3. Oyun türünü belirle
      const queueType = detectGameMode(spectatorData.queueId);

      // Eğer Clash ise otomatik Pro Arena mode
      // Eğer SoloQ ise otomatik SoloQ mode
      // Aksi taktirde kullanıcıya sor
      if (queueType.suggestedMode) {
        setDraftMode(queueType.suggestedMode);
        await initializeGame(spectatorData, account, queueType, queueType.suggestedMode);
      } else {
        // Mod seçim UI'ını göster
        setGameInfo({
          account,
          spectatorData,
          queueType,
        });
        setGameStatus('need-mode-selection');
      }
    } catch (error) {
      console.error('Game detection error:', error);
      setGameStatus('error');
    } finally {
      setIsSearching(false);
    }
  };

  // Oyunu başlat
  const initializeGame = async (spectatorData, account, queueType, draftMode) => {
    try {
      // Oyuncunun takım tarafını belirle
      const userTeam = spectatorData.teamId === 100 ? 'blue' : 'red';
      setUserTeam(userTeam);

      // Oyuncunun rolünü tahmin et (kimi olduğuna bakarak)
      const userRole = detectPlayerRole(spectatorData, account);
      setUserRole(userRole);

      // Mode belirle
      setDraftMode(draftMode);

      // Canlı monitoring başlat
      setIsMonitoring(true);

      // Callback'i çağır
      if (onGameDetected) {
        onGameDetected({
          account,
          queueType,
          draftMode,
          userTeam,
          userRole,
          spectatorData,
        });
      }

      setGameStatus('champ-select');
      setGameInfo({
        account,
        queueType,
        draftMode,
        userTeam,
        userRole,
      });
    } catch (error) {
      console.error('Game initialization error:', error);
      setGameStatus('error');
    }
  };

  // Oyuncunun rolünü tahmin et
  const detectPlayerRole = (spectatorData, account) => {
    // Basit heuristic: participant position'a göre
    // Bu gerçek uygulamada LCU API'den daha doğru bilgi alır
    const participants = spectatorData.participants || [];
    const userTeamId = account.summonerId; // simplified

    // Açısından bakılan rolü tahmin et
    // Bunun yerine ChampionSelect endpoint'ini kullanmak daha iyi olur
    return 'mid'; // default
  };

  // Mod seçimi yap
  const handleModeSelection = async (mode) => {
    setSelectedMode(mode);
    setDraftMode(mode);

    await initializeGame(
      gameInfo.spectatorData,
      gameInfo.account,
      gameInfo.queueType,
      mode
    );
  };

  return (
    <div className="space-y-6">
      {/* Oyuncu Girişi */}
      {!gameStatus && (
        <div className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-lol-gold">⚡ Canlı Oyun Tespiti</h3>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-lol-light/70">
              Riot ID
            </label>
            <input
              type="text"
              placeholder="OyuncuAdi#TAG (örn: AlperSemih#TR1)"
              value={riotId}
              onChange={handleRiotIdChange}
              className="w-full px-4 py-2 bg-lol-dark/40 border border-lol-light/10 rounded-lg text-white placeholder-lol-light/30 focus:outline-none focus:border-lol-blue/30"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-lol-light/70">
              Bölge
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2 bg-lol-dark/40 border border-lol-light/10 rounded-lg text-white focus:outline-none focus:border-lol-blue/30"
            >
              <option value="tr">Türkiye (TR1)</option>
              <option value="euw">EU West (EUW1)</option>
              <option value="eune">EU Nordic & East (EUNE1)</option>
              <option value="na">North America (NA1)</option>
              <option value="kr">Korea (KR)</option>
              <option value="jp">Japan (JP1)</option>
              <option value="br">Brazil (BR1)</option>
              <option value="lan">LAN (LA1)</option>
              <option value="las">LAS (LA2)</option>
              <option value="oce">Oceania (OC1)</option>
              <option value="ru">Russia (RU)</option>
              <option value="ph">Philippines (PH2)</option>
              <option value="sg">Singapore (SG2)</option>
              <option value="vn">Vietnam (VN2)</option>
            </select>
          </div>

          <button
            onClick={handleSearchGame}
            disabled={isSearching || !riotId.trim()}
            className="w-full px-4 py-3 bg-lol-blue text-white rounded-lg font-medium hover:bg-lol-blue/80 disabled:opacity-50 transition-all"
          >
            {isSearching ? '🔍 Aranıyor...' : '🔍 Oyun Ara'}
          </button>

          <p className="text-xs text-lol-light/40">
            {t('liveApiNote')}
          </p>
        </div>
      )}

      {/* Durumlar */}
      {gameStatus === 'not-found' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300 text-sm">
          ❌ Bu oyuncu bulunamadı. Riot ID'yi doğru yazdığınızdan emin olun.
        </div>
      )}

      {gameStatus === 'not-in-game' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-300 text-sm">
          ⏳ Bu oyuncu şu an bir maçta değil.
          <p className="mt-2 text-xs">Maçı başlatıp champ select ekranına girince tekrar deneyin.</p>
        </div>
      )}

      {gameStatus === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-300 text-sm">
          ⚠️ Hata oluştu. Lütfen tekrar deneyin.
        </div>
      )}

      {/* Mod Seçimi */}
      {gameStatus === 'need-mode-selection' && gameInfo && (
        <div className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-lol-gold">
            ⚙️ Analiz Modunu Seçin
          </h3>
          <p className="text-sm text-lol-light/60">
            "{gameInfo.account.gameName}#{gameInfo.account.tagLine}" için
            <br />
            {gameInfo.queueType.label} oyununa başladı
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleModeSelection('soloq')}
              className="px-4 py-3 rounded-lg bg-lol-blue/20 border border-lol-blue/30 text-white font-medium hover:bg-lol-blue/30 transition-all"
            >
              🎮 SoloQ
              <p className="text-xs opacity-70 mt-1">Kişisel kazanma odaklı</p>
            </button>
            <button
              onClick={() => handleModeSelection('pro')}
              className="px-4 py-3 rounded-lg bg-lol-gold/20 border border-lol-gold/30 text-white font-medium hover:bg-lol-gold/30 transition-all"
            >
              🏆 Pro Arena
              <p className="text-xs opacity-70 mt-1">Takım sinerji odaklı</p>
            </button>
          </div>
        </div>
      )}

      {/* Canlı Oyun Durumu */}
      {gameStatus === 'champ-select' && gameInfo && (
        <div className="bg-lol-dark/40 border border-lol-blue/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-sm font-medium text-lol-light">
              ✅ Canlı oyun takibi aktif
            </p>
          </div>
          <p className="text-xs text-lol-light/60">
            🎮 {gameInfo.account.gameName}#{gameInfo.account.tagLine}
            <br />
            📊 {gameInfo.queueType.label} • {gameInfo.draftMode === 'soloq' ? 'SoloQ Mode' : 'Pro Arena Mode'}
            <br />
            👥 {gameInfo.userTeam === 'blue' ? '🔵 Mavi' : '🔴 Kırmızı'} • {gameInfo.userRole.toUpperCase()}
          </p>
        </div>
      )}
    </div>
  );
}
