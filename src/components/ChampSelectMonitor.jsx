import { useEffect, useRef, useCallback, useState } from 'react';
import { useDraftContext } from '../contexts/DraftContext';
import GameEventHandler from '../services/gameEventHandler';
import { calculateDraftScore, getRecommendations, analyzeComposition } from '../services/draftAnalysis';

/**
 * Champ Select Monitoring
 * 500ms aralığıyla Riot Spectator API'yi polling'le
 * Ban/pick olaylarını detect et ve analizi güncelle
 */
export default function ChampSelectMonitor({
  spectatorData,
  onEventDetected,
  pollInterval = 500,
}) {
  const draftContext = useDraftContext();
  const eventHandlerRef = useRef(null);
  const pollingRef = useRef(null);
  const lastStateRef = useRef(null);
  const [isPolling, setIsPolling] = useState(false);
  const [eventCount, setEventCount] = useState(0);

  // Event handler'ı başlat
  useEffect(() => {
    if (!eventHandlerRef.current) {
      eventHandlerRef.current = new GameEventHandler(
        draftContext,
        { calculateDraftScore, getRecommendations, analyzeComposition }
      );
    }
  }, [draftContext]);

  // Spectator verilerini karşılaştır ve değişiklikleri tespit et
  const detectChampSelectChanges = useCallback((currentData) => {
    if (!lastStateRef.current) {
      lastStateRef.current = JSON.parse(JSON.stringify(currentData));
      return null;
    }

    const lastState = lastStateRef.current;
    const changes = [];

    // Ban kontrolü
    if (currentData.bannedChampions) {
      const lastBans = lastState.bannedChampions || [];

      // Yeni ban mı?
      for (const ban of currentData.bannedChampions) {
        const exists = lastBans.some(b => b.championId === ban.championId);
        if (!exists) {
          changes.push({
            type: 'ban',
            championId: ban.championId,
            teamId: ban.teamId,
            timestamp: new Date(),
          });
        }
      }
    }

    // Pick kontrolü (participants)
    if (currentData.participants) {
      const lastParticipants = lastState.participants || [];

      for (let i = 0; i < currentData.participants.length; i++) {
        const current = currentData.participants[i];
        const last = lastParticipants[i] || {};

        // Şampiyon seçildi mi?
        if (current.championId && current.championId !== last.championId && current.championId !== 0) {
          changes.push({
            type: 'pick',
            championId: current.championId,
            summonerId: current.summonerId,
            teamId: current.teamId,
            slot: i, // Slot = role indicator
            timestamp: new Date(),
          });
        }

        // Şampiyon hover edildi mi? (hover preview)
        if (current.championPickIntent && current.championPickIntent !== last.championPickIntent) {
          changes.push({
            type: 'hover',
            championId: current.championPickIntent,
            summonerId: current.summonerId,
            teamId: current.teamId,
            timestamp: new Date(),
          });
        }
      }
    }

    // Draft phase değişti mi?
    if (currentData.gameData) {
      if (
        currentData.gameData.turnNum !== lastState.gameData?.turnNum ||
        currentData.gameData.turn !== lastState.gameData?.turn
      ) {
        changes.push({
          type: 'phase-change',
          phase: currentData.gameData.turnNum < 10 ? 'ban' : 'pick',
          turn: currentData.gameData.turn,
          turnNum: currentData.gameData.turnNum,
          timestamp: new Date(),
        });
      }
    }

    // State'i güncelle
    lastStateRef.current = JSON.parse(JSON.stringify(currentData));

    return changes.length > 0 ? changes : null;
  }, []);

  // Değişiklikleri işle
  const processChanges = useCallback((changes) => {
    if (!changes || !eventHandlerRef.current) return;

    for (const change of changes) {
      switch (change.type) {
        case 'ban':
          const banTeam = change.teamId === 100 ? 'blue' : 'red';
          eventHandlerRef.current.handleBan(change.championId, banTeam);
          setEventCount(prev => prev + 1);
          if (onEventDetected) {
            onEventDetected({
              type: 'ban',
              championId: change.championId,
              team: banTeam,
              timestamp: change.timestamp,
            });
          }
          break;

        case 'pick':
          const pickTeam = change.teamId === 100 ? 'blue' : 'red';
          const role = mapSlotToRole(change.slot);
          eventHandlerRef.current.handlePick(change.championId, role, pickTeam);
          setEventCount(prev => prev + 1);
          if (onEventDetected) {
            onEventDetected({
              type: 'pick',
              championId: change.championId,
              role,
              team: pickTeam,
              timestamp: change.timestamp,
            });
          }
          break;

        case 'hover':
          if (onEventDetected) {
            onEventDetected({
              type: 'hover',
              championId: change.championId,
              summonerId: change.summonerId,
              timestamp: change.timestamp,
            });
          }
          break;

        case 'phase-change':
          eventHandlerRef.current.handlePhaseChange(
            change.phase,
            change.turn,
            change.turnNum
          );
          if (onEventDetected) {
            onEventDetected({
              type: 'phase-change',
              phase: change.phase,
              turn: change.turn,
              timestamp: change.timestamp,
            });
          }
          break;

        default:
          break;
      }
    }
  }, [onEventDetected]);

  // Polling loop
  useEffect(() => {
    if (!spectatorData) return;

    setIsPolling(true);

    const poll = () => {
      const changes = detectChampSelectChanges(spectatorData);
      if (changes) {
        processChanges(changes);
      }

      pollingRef.current = setTimeout(poll, pollInterval);
    };

    pollingRef.current = setTimeout(poll, pollInterval);

    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current);
      setIsPolling(false);
    };
  }, [spectatorData, pollInterval, detectChampSelectChanges, processChanges]);

  return (
    <div className="fixed bottom-4 left-4 bg-lol-dark/90 border border-lol-blue/30 rounded-lg p-3 text-xs text-lol-light/60 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
        <p className="font-medium">Gerçek Zamanlı Takip</p>
      </div>
      <p>Olaylar: {eventCount}</p>
      <p>Polling: {pollInterval}ms</p>
    </div>
  );
}

/**
 * Participant slot'u role'e çevir
 * 0=Top, 1=Jungle, 2=Mid, 3=ADC, 4=Support
 */
function mapSlotToRole(slot) {
  const roleMap = {
    0: 'top',
    1: 'jungle',
    2: 'mid',
    3: 'adc',
    4: 'support',
  };
  return roleMap[slot] || 'mid';
}
