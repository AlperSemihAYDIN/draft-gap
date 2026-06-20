import { createContext, useContext, useState, useCallback } from 'react';

const DraftContext = createContext();

export function DraftProvider({ children }) {
  // Draft state
  const [blueTeam, setBlueTeam] = useState([]); // { champId, role, playerId }
  const [redTeam, setRedTeam] = useState([]);
  const [blueBans, setBlueBans] = useState([]);
  const [redBans, setRedBans] = useState([]);
  
  // Draft phase
  const [phase, setPhase] = useState(''); // 'planning', 'ban', 'pick', 'finished'
  const [turn, setTurn] = useState(''); // 'blue' or 'red'
  const [pickOrder, setPickOrder] = useState(0); // 0-9
  
  // User context
  const [userRole, setUserRole] = useState('mid'); // Kullanıcının rolü
  const [draftMode, setDraftMode] = useState('soloq'); // 'soloq' or 'pro'
  const [userTeam, setUserTeam] = useState('blue'); // Hangi taraftan
  
  // Live monitoring
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Composition analysis cache
  const [analysis, setAnalysis] = useState(null);

  const addPick = useCallback((champId, role, team = 'blue') => {
    if (team === 'blue') {
      setBlueTeam(prev => [...prev, { champId, role }]);
    } else {
      setRedTeam(prev => [...prev, { champId, role }]);
    }
    setLastUpdate(new Date());
  }, []);

  const addBan = useCallback((champId, team = 'blue') => {
    if (team === 'blue') {
      setBlueBans(prev => [...prev, champId]);
    } else {
      setRedBans(prev => [...prev, champId]);
    }
    setLastUpdate(new Date());
  }, []);

  const updateDraftPhase = useCallback((newPhase, newTurn, newPickOrder) => {
    setPhase(newPhase);
    setTurn(newTurn);
    setPickOrder(newPickOrder);
    setLastUpdate(new Date());
  }, []);

  const resetDraft = useCallback(() => {
    setBlueTeam([]);
    setRedTeam([]);
    setBlueBans([]);
    setRedBans([]);
    setPhase('');
    setTurn('');
    setPickOrder(0);
    setAnalysis(null);
    setLastUpdate(null);
  }, []);

  const removePick = useCallback((champId, team = 'blue') => {
    if (team === 'blue') {
      setBlueTeam(prev => prev.filter(p => p.champId !== champId));
    } else {
      setRedTeam(prev => prev.filter(p => p.champId !== champId));
    }
    setLastUpdate(new Date());
  }, []);

  const removeBan = useCallback((champId, team = 'blue') => {
    if (team === 'blue') {
      setBlueBans(prev => prev.filter(id => id !== champId));
    } else {
      setRedBans(prev => prev.filter(id => id !== champId));
    }
    setLastUpdate(new Date());
  }, []);

  const value = {
    // State
    blueTeam,
    redTeam,
    blueBans,
    redBans,
    phase,
    turn,
    pickOrder,
    userRole,
    draftMode,
    userTeam,
    isMonitoring,
    lastUpdate,
    analysis,

    // Actions
    addPick,
    addBan,
    removePick,
    removeBan,
    updateDraftPhase,
    resetDraft,
    setUserRole,
    setDraftMode,
    setUserTeam,
    setIsMonitoring,
    setAnalysis,
  };

  return (
    <DraftContext.Provider value={value}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDraftContext() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraftContext must be used within DraftProvider');
  return ctx;
}
