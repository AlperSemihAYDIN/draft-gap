import { useEffect, useRef, useCallback } from 'react';
import { useDraftContext } from '../contexts/DraftContext';
import { useLanguage } from '../i18n/LanguageContext';

// Real-time draft event monitor
// Polls Riot Spectator API for active champ select
export default function DraftMonitor() {
  const { t } = useLanguage();
  const {
    addPick,
    addBan,
    updateDraftPhase,
    setUserRole,
    setUserTeam,
    isMonitoring,
    setIsMonitoring,
  } = useDraftContext();

  const pollingRef = useRef(null);
  const lastStateRef = useRef(null);

  // Parse Spectator data into draft actions
  const processDraftPhase = useCallback((spectatorData) => {
    if (!spectatorData) return;

    const { gameData, bannedChampions, participants } = spectatorData;
    if (!gameData) return;

    const turn = gameData.turn; // 'PICK' or 'BAN'
    const pickIndex = gameData.pickTurn || 0;

    // Calculate phase: bans phase = 0-9, picks phase = 10-19
    const phaseNum = gameData.turnNum || 0;
    const isPickPhase = phaseNum >= 10;
    const isBanPhase = phaseNum < 10;

    // Update draft phase
    if (isPickPhase) {
      updateDraftPhase('pick', turn.toLowerCase(), pickIndex);
    } else if (isBanPhase) {
      updateDraftPhase('ban', turn.toLowerCase(), pickIndex);
    }

    // Process bans (first 10 turns)
    if (bannedChampions) {
      bannedChampions.forEach((banData) => {
        const { championId, teamId } = banData;
        const team = teamId === 100 ? 'blue' : 'red';
        addBan(championId, team);
      });
    }

    // Process picks
    if (participants && participants.length > 0) {
      // Group participants by team
      const teams = { blue: [], red: [] };
      participants.forEach((p) => {
        const team = p.teamId === 100 ? 'blue' : 'red';
        teams[team].push({
          champId: p.championId,
          summonerId: p.summonerId,
          slot: p.spell1Id, // hack - using spell to track
        });
      });

      // Add picks
      Object.entries(teams).forEach(([team, players]) => {
        players.forEach((player) => {
          if (player.champId && player.champId !== 0) {
            // Determine role (Top/Jungle/Mid/ADC/Support based on lane)
            // This is simplified - actual role detection needs more logic
            const roleMap = {
              0: 'top',
              1: 'jungle',
              2: 'mid',
              3: 'adc',
              4: 'support',
            };
            const role = roleMap[player.slot] || 'mid';
            addPick(player.champId, role, team);
          }
        });
      });
    }
  }, [addPick, addBan, updateDraftPhase]);

  // Poll Spectator API
  useEffect(() => {
    if (!isMonitoring) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const pollSpectator = async () => {
      try {
        // Call serverless function via Vercel
        const response = await fetch('/api/spectator', {
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();

          // Avoid reprocessing same state
          const stateKey = JSON.stringify(data);
          if (stateKey === lastStateRef.current) return;
          lastStateRef.current = stateKey;

          processDraftPhase(data);
        }
      } catch (error) {
        console.debug('Spectator poll error (expected when not in game):', error.message);
      }
    };

    // Poll every 1 second during picks/bans
    pollingRef.current = setInterval(pollSpectator, 1000);

    return () => clearInterval(pollingRef.current);
  }, [isMonitoring, processDraftPhase]);

  if (!isMonitoring) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-lol-dark/90 border border-lol-blue/30 rounded-lg p-3 text-xs text-lol-light/60">
      <p>🔍 Canlı draft tespiti aktif...</p>
    </div>
  );
}
