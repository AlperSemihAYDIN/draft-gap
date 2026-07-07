// Leaguepedia Cargo API'den pro play verisi çeker ve championMeta.json oluşturur
// Kaynak: https://lol.fandom.com (Leaguepedia)
//
// GÜNCELLİK (recency) MODELİ
// ==========================
// Amaç: "istatistiksel olarak sık oynanmış" değil, "GÜNCEL profesyonel metada
// gerçekten oynanan" şampiyonları önceliklendirmek. Bunun için her turnuvanın
// maçlarına bir AĞIRLIK atanır. Ağırlık iki faktörden oluşur:
//   1) Seviye: Uluslararası (MSI) > Büyük bölge (LCK/LPL/LEC/LTA) > İkincil bölge > Minor/Qualifier
//   2) Güncellik: MSI'a yakın zamanlı split/playoff > sezon başı (First Stand/Kickoff/Winter)
// Her istatistik (presence, winRate, pickRate, banRate, tier, counters, synergies)
// bu ağırlıklarla hesaplanır; ancak "yeterli örneklem var mı" kontrolleri HAM
// (ağırlıksız) maç sayısı üzerinden yapılır — az oynanmış ama yüksek ağırlıklı
// (örn. tek bir MSI maçı) bir şampiyonun yapay olarak öne çıkması engellenir.

const TOURNAMENTS = [
  // ══ Uluslararası — en güncel & en yüksek seviye ══
  '2026 Mid-Season Invitational',
  'LCK/2026 Season/Road to MSI',
  // LCK 2026
  'LCK/2026 Season/Rounds 1-2',
  'LCK/2026 Season/Cup',
  // LPL 2026
  'LPL/2026 Season/Split 1',
  'LPL/2026 Season/Split 1 Playoffs',
  'LPL/2026 Season/Split 2',
  'LPL/2026 Season/Split 2 Playoffs',
  // LEC 2026
  'LEC/2026 Season/Spring Season',
  'LEC/2026 Season/Spring Playoffs',
  'LEC/2026 Season/Versus Season',
  'LEC/2026 Season/Versus Playoffs',
  // LTA North/South 2026 (LCS/CBLOL'ün devamı — henüz yayınlanmamışsa 0 satır döner, zararsız)
  'LTA North/2026 Season/Split 1',
  'LTA North/2026 Season/Split 1 Playoffs',
  'LTA North/2026 Season/Promotion',
  'LTA South/2026 Season/Split 1',
  'LTA South/2026 Season/Split 1 Playoffs',
  'LTA South/2026 Season/Promotion',
  // LCP 2026
  'LCP/2026 Season/Split 1',
  'LCP/2026 Season/Split 1 Playoffs',
  'LCP/2026 Season/Split 2',
  'LCP/2026 Season/Split 2 Playoffs',
  // VCS 2026
  'VCS/2026 Season/Spring Season',
  'VCS/2026 Season/Spring Playoffs',
  'VCS/2026 Season/Summer Season',
  // CBLOL 2026
  'CBLOL/2026 Season/Split 1',
  'CBLOL/2026 Season/Split 1 Playoffs',
  'CBLOL/2026 Season/Cup',
  // Uluslararası (erken sezon)
  '2026 Americas Cup',
  '2026 First Stand',
  // Akademi / Challenger
  'LCK CL/2026 Season/Rounds 1-2',
  'LCK CL/2026 Season/Kickoff',
  'EMEA Masters/2026 Season/Winter',
];

// Turnuva ağırlıkları — bkz. yukarıdaki "GÜNCELLİK MODELİ" açıklaması.
// Listede olmayan bir turnuva DEFAULT_WEIGHT alır.
const TOURNAMENT_WEIGHT = {
  // ═══ S: Uluslararası zirve — güncel metanın en güvenilir göstergesi ═══
  '2026 Mid-Season Invitational': 3.0,

  // ═══ A: MSI'a en yakın büyük bölge verisi ═══
  'LCK/2026 Season/Road to MSI': 2.2,
  'LPL/2026 Season/Split 2 Playoffs': 2.0,
  'LEC/2026 Season/Versus Playoffs': 2.0,
  'LTA North/2026 Season/Split 1 Playoffs': 1.8,
  'LTA South/2026 Season/Split 1 Playoffs': 1.8,
  'LPL/2026 Season/Split 2': 1.5,
  'LEC/2026 Season/Versus Season': 1.5,
  'LTA North/2026 Season/Split 1': 1.3,
  'LTA South/2026 Season/Split 1': 1.3,

  // ═══ B: Büyük bölge — erken sezon ═══
  'LCK/2026 Season/Cup': 1.2,
  'LPL/2026 Season/Split 1 Playoffs': 1.0,
  'LEC/2026 Season/Spring Playoffs': 1.0,
  'LCK/2026 Season/Rounds 1-2': 0.9,
  'LPL/2026 Season/Split 1': 0.7,
  'LEC/2026 Season/Spring Season': 0.7,

  // ═══ C: İkincil bölgeler — güncel ═══
  'LCP/2026 Season/Split 2 Playoffs': 1.0,
  'LCP/2026 Season/Split 2': 0.7,
  'VCS/2026 Season/Summer Season': 0.6,
  'LTA North/2026 Season/Promotion': 0.5,
  'LTA South/2026 Season/Promotion': 0.5,

  // ═══ D: İkincil bölgeler (erken sezon) + minor/qualifier ═══
  'LCP/2026 Season/Split 1 Playoffs': 0.6,
  'VCS/2026 Season/Spring Playoffs': 0.5,
  '2026 Americas Cup': 0.45,
  '2026 First Stand': 0.45,
  'LCP/2026 Season/Split 1': 0.4,
  'CBLOL/2026 Season/Split 1 Playoffs': 0.5,
  'VCS/2026 Season/Spring Season': 0.35,
  'CBLOL/2026 Season/Split 1': 0.35,
  'CBLOL/2026 Season/Cup': 0.35,
  'LCK CL/2026 Season/Rounds 1-2': 0.3,
  'LCK CL/2026 Season/Kickoff': 0.25,
  'EMEA Masters/2026 Season/Winter': 0.25,
};
const DEFAULT_WEIGHT = 0.4;

function getWeight(overviewPage) {
  return TOURNAMENT_WEIGHT[overviewPage] ?? DEFAULT_WEIGHT;
}

const FIELDS = [
  'Team1Ban1','Team1Ban2','Team1Ban3','Team1Ban4','Team1Ban5',
  'Team2Ban1','Team2Ban2','Team2Ban3','Team2Ban4','Team2Ban5',
  'Team1Pick1','Team1Pick2','Team1Pick3','Team1Pick4','Team1Pick5',
  'Team2Pick1','Team2Pick2','Team2Pick3','Team2Pick4','Team2Pick5',
  'Team1Role1','Team1Role2','Team1Role3','Team1Role4','Team1Role5',
  'Team2Role1','Team2Role2','Team2Role3','Team2Role4','Team2Role5',
  'Winner','OverviewPage'
].map(f => `PicksAndBansS7.${f}`).join(',');

const BASE = 'https://lol.fandom.com/wiki/Special:CargoExport';

async function fetchTournament(tournament, offset = 0) {
  const where = `PicksAndBansS7.OverviewPage='${tournament}'`;
  const url = `${BASE}?tables=PicksAndBansS7&fields=${FIELDS}&where=${encodeURIComponent(where)}&limit=500&offset=${offset}&format=json`;
  
  console.log(`  Fetching ${tournament} offset=${offset}...`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  HTTP ${res.status} for ${tournament}`);
    return [];
  }
  const data = await res.json();
  console.log(`  Got ${data.length} rows`);
  
  // Eğer 500 satır geldiyse daha fazla olabilir
  if (data.length === 500) {
    const more = await fetchTournament(tournament, offset + 500);
    return [...data, ...more];
  }
  return data;
}

// Role normalization
function normalizeRole(role) {
  if (!role) return null;
  const r = role.toLowerCase().trim();
  if (r === 'top') return 'top';
  if (r === 'jungle' || r === 'jng') return 'jungle';
  if (r === 'mid' || r === 'middle') return 'mid';
  if (r === 'bot' || r === 'adc' || r === 'bottom') return 'adc';
  if (r === 'support' || r === 'sup') return 'support';
  return null;
}

// Champion ID formatter (Data Dragon key)
function champKey(name) {
  if (!name) return null;
  // Özel durumlar
  const specials = {
    "Nunu & Willump": "Nunu",
    "Wukong": "MonkeyKing",
    "Renata Glasc": "Renata",
    "K'Sante": "KSante",
    "Bel'Veth": "Belveth",
    "Kai'Sa": "Kaisa",
    "Kha'Zix": "Khazix", 
    "Cho'Gath": "Chogath",
    "Vel'Koz": "Velkoz",
    "Rek'Sai": "RekSai",
    "Kog'Maw": "KogMaw",
    "Xin Zhao": "XinZhao",
    "Lee Sin": "LeeSin",
    "Master Yi": "MasterYi",
    "Miss Fortune": "MissFortune",
    "Tahm Kench": "TahmKench",
    "Twisted Fate": "TwistedFate",
    "Jarvan IV": "JarvanIV",
    "Dr. Mundo": "DrMundo",
    "Aurelion Sol": "AurelionSol",
  };
  if (specials[name]) return specials[name];
  // Boşluk ve özel karakter kaldır
  return name.replace(/[' .]/g, '');
}

// Data Dragon'dan en son yama numarasını çek
async function fetchLatestPatch() {
  try {
    const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await res.json();
    // versions[0] = '16.11.1' → '16.11'
    const latest = versions[0].split('.').slice(0, 2).join('.');
    const prev   = versions[1].split('.').slice(0, 2).join('.');
    console.log(`Son yamalar: ${prev} ve ${latest}`);
    return { latest, prev };
  } catch {
    return { latest: '16.11', prev: '16.10' };
  }
}

async function main() {
  console.log('=== Leaguepedia Pro Play Data Fetcher ===\n');

  // Patch bilgisini al
  const { latest, prev } = await fetchLatestPatch();
  
  // Tüm turnuvalardan veri çek
  let allGames = [];
  for (const t of TOURNAMENTS) {
    const games = await fetchTournament(t);
    allGames = allGames.concat(games);
    // Rate limit - 1s bekle
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\nToplam ${allGames.length} oyun verisi çekildi\n`);
  
  if (allGames.length === 0) {
    console.error('Hiç veri çekilemedi! Çıkılıyor.');
    process.exit(1);
  }
  
  // İstatistik hesapla
  // Her şampiyon için HEM ham (raw) HEM ağırlıklı (weighted) sayaçlar tutulur:
  //  - raw    → örneklem büyüklüğü / güvenilirlik kontrolleri için (ör. "en az 20 maç")
  //  - w*     → güncellik ağırlıklı — presence/winRate/banRate/tier hesaplarının kaynağı
  const stats = {}; // champKey -> { name, picks, bans, wins, losses, wPicks, wBans, wWins, wLosses, roles }

  function blankStat(name) {
    return { name, picks: 0, bans: 0, wins: 0, losses: 0, wPicks: 0, wBans: 0, wWins: 0, wLosses: 0, roles: {} };
  }

  for (const game of allGames) {
    const w = getWeight(game.OverviewPage);
    const winner = parseInt(game.Winner);
    
    // Banları işle
    for (let i = 1; i <= 5; i++) {
      for (const team of ['Team1', 'Team2']) {
        const banName = game[`${team}Ban${i}`];
        if (!banName) continue;
        const key = champKey(banName);
        if (!key) continue;
        if (!stats[key]) stats[key] = blankStat(banName);
        stats[key].bans++;
        stats[key].wBans += w;
      }
    }
    
    // Pickleri işle
    for (let i = 1; i <= 5; i++) {
      for (const [teamIdx, team] of [['1', 'Team1'], ['2', 'Team2']]) {
        const pickName = game[`${team}Pick${i}`];
        const roleName = game[`${team}Role${i}`];
        if (!pickName) continue;
        const key = champKey(pickName);
        if (!key) continue;
        const role = normalizeRole(roleName);
        
        if (!stats[key]) stats[key] = blankStat(pickName);
        stats[key].picks++;
        stats[key].wPicks += w;
        
        const isWinner = (winner === parseInt(teamIdx));
        if (isWinner) { stats[key].wins++; stats[key].wWins += w; }
        else          { stats[key].losses++; stats[key].wLosses += w; }
        
        if (role) {
          if (!stats[key].roles[role]) stats[key].roles[role] = { picks: 0, wins: 0, wPicks: 0, wWins: 0 };
          stats[key].roles[role].picks++;
          stats[key].roles[role].wPicks += w;
          if (isWinner) { stats[key].roles[role].wins++; stats[key].roles[role].wWins += w; }
        }
      }
    }
  }
  
  console.log(`${Object.keys(stats).length} farklı şampiyon bulundu\n`);
  
  // Toplam oyun sayısı — HAM (metadata/backward-compat) ve AĞIRLIKLI (yüzde hesapları için)
  const totalGames = allGames.length;
  let weightedTotalGames = 0;
  for (const game of allGames) weightedTotalGames += getWeight(game.OverviewPage);
  console.log(`Ağırlıklı toplam oyun havuzu: ${weightedTotalGames.toFixed(1)} (ham: ${totalGames})\n`);
  
  // Tier hesaplama: Presence, ban rate ve WR bazlı (girdiler zaten ağırlıklı; picks ham kalır)
  // Ban rate çok önemli — perma-ban olan şampiyon S-tier
  function getTier(presence, winRate, picks, banRate) {
    if (picks < 5) return 'C'; // Çok az oynanan outlier
    // Perma-ban seviyesi = S-tier
    if (banRate >= 30 && winRate >= 45) return 'S';
    if (banRate >= 20 && winRate >= 50) return 'S';
    if (presence >= 50 && winRate >= 48) return 'S';
    if (presence >= 40 && winRate >= 50) return 'S';
    // Güçlü = A-tier
    if (banRate >= 10 && winRate >= 50) return 'A';
    if (presence >= 25 && winRate >= 48) return 'A';
    if (presence >= 35 && winRate >= 45) return 'A';
    // Orta = B-tier
    if (presence >= 15 && winRate >= 45) return 'B';
    if (presence >= 10) return 'B';
    return 'C';
  }
  
  const champList = Object.entries(stats).map(([key, s]) => {
    // Ağırlıklı yüzdeler — GÜNCEL meta önceliğini yansıtır
    const presence = ((s.wPicks + s.wBans) / weightedTotalGames * 100);
    const winRate = s.wPicks > 0 ? (s.wWins / s.wPicks * 100) : 0;
    const pickRate = (s.wPicks / weightedTotalGames * 100);
    const banRate = (s.wBans / weightedTotalGames * 100);
    
    // Rol bazlı win rate — HAM pick sayısı eşik (>=2), değerler ağırlıklı
    const roleWinRates = {};
    const rolePickRates = {};
    const roleList = [];
    for (const [role, rd] of Object.entries(s.roles)) {
      if (rd.picks >= 2) { // En az 2 (ham) pick olan roller
        roleWinRates[role] = +(rd.wPicks > 0 ? (rd.wWins / rd.wPicks * 100) : 0).toFixed(1);
        rolePickRates[role] = +(rd.wPicks / weightedTotalGames * 100).toFixed(1);
        roleList.push(role);
      }
    }
    
    return {
      key, name: s.name, presence, winRate, pickRate, banRate,
      picks: s.picks, bans: s.bans, wins: s.wins, losses: s.losses, // HAM — örneklem güvenilirliği
      wPicks: s.wPicks, wBans: s.wBans,                              // Ağırlıklı toplamlar (şeffaflık)
      roles: roleList, roleWinRates, rolePickRates, roleData: s.roles,
    };
  });
  
  // Presence'a göre sırala
  champList.sort((a, b) => b.presence - a.presence);
  
  // Blind pick safety hesapla
  // Yüksek ban = güçlü şampiyon = iyi pick (ban yememek blind pick safety değil)
  // Gerçek blind pick safety = düşük counter alınma riski + decent WR
  function getBlindPickSafety(champ) {
    if (champ.picks < 5) return 3;
    const wr = champ.winRate;
    const pr = champ.pickRate;
    
    // Yüksek WR + yüksek pick rate = güvenli blind pick (çok denendi, hala kazanıyor)
    if (wr >= 55 && pr >= 8) return 10;
    if (wr >= 52 && pr >= 10) return 9;
    if (wr >= 50 && pr >= 8) return 8;
    if (wr >= 50 && pr >= 5) return 7;
    if (wr >= 48 && pr >= 5) return 7;
    if (wr >= 48) return 6;
    if (wr >= 45) return 5;
    return 4;
  }
  
  // Counter ve sinerji ilişkilerini maç verilerinden çıkar
  // Her oyunda aynı taraftaki şampiyonlar sinerji, karşı taraftaki counter
  // Ham (total/wins) örneklem güvenilirliği için, ağırlıklı (wTotal/wWins) güncel meta değeri için
  const counterWins = {}; // "A_vs_B" -> { wins, total, wWins, wTotal }
  const synergyWins = {}; // "A_with_B" -> { wins, total, wWins, wTotal }
  
  for (const game of allGames) {
    const w = getWeight(game.OverviewPage);
    const winner = parseInt(game.Winner);
    const team1Picks = [];
    const team2Picks = [];
    
    for (let i = 1; i <= 5; i++) {
      const p1 = champKey(game[`Team1Pick${i}`]);
      const p2 = champKey(game[`Team2Pick${i}`]);
      if (p1) team1Picks.push(p1);
      if (p2) team2Picks.push(p2);
    }
    
    // Counter ilişkileri (karşıt takımlar)
    for (const a of team1Picks) {
      for (const b of team2Picks) {
        const keyAB = `${a}_vs_${b}`;
        if (!counterWins[keyAB]) counterWins[keyAB] = { wins: 0, total: 0, wWins: 0, wTotal: 0 };
        counterWins[keyAB].total++;
        counterWins[keyAB].wTotal += w;
        if (winner === 1) { counterWins[keyAB].wins++; counterWins[keyAB].wWins += w; }
        
        const keyBA = `${b}_vs_${a}`;
        if (!counterWins[keyBA]) counterWins[keyBA] = { wins: 0, total: 0, wWins: 0, wTotal: 0 };
        counterWins[keyBA].total++;
        counterWins[keyBA].wTotal += w;
        if (winner === 2) { counterWins[keyBA].wins++; counterWins[keyBA].wWins += w; }
      }
    }
    
    // Sinerji ilişkileri (aynı takım)
    for (const picks of [team1Picks, team2Picks]) {
      const isWinner = (picks === team1Picks && winner === 1) || (picks === team2Picks && winner === 2);
      for (let i = 0; i < picks.length; i++) {
        for (let j = i + 1; j < picks.length; j++) {
          const key1 = `${picks[i]}_with_${picks[j]}`;
          const key2 = `${picks[j]}_with_${picks[i]}`;
          for (const k of [key1, key2]) {
            if (!synergyWins[k]) synergyWins[k] = { wins: 0, total: 0, wWins: 0, wTotal: 0 };
            synergyWins[k].total++;
            synergyWins[k].wTotal += w;
            if (isWinner) { synergyWins[k].wins++; synergyWins[k].wWins += w; }
          }
        }
      }
    }
  }
  
  // championMeta.json oluştur
  const meta = {
    _meta: {
      patch: latest,
      patchRange: `${prev}-${latest}`,
      source: 'Leaguepedia (lol.fandom.com)',
      tournaments: TOURNAMENTS.filter(t => allGames.some(g => g.OverviewPage === t)),
      totalGames,
      weightedTotalGames: +weightedTotalGames.toFixed(1),
      recencyModel: 'Turnuva ağırlıklı: MSI 2026 x3.0 (uluslararası zirve), Road to MSI/Split2/Playoffs x1.3-2.2 (güncel büyük bölge), erken sezon/minor x0.25-0.7. presence/winRate/banRate/tier bu ağırlıklarla hesaplanır; örneklem güvenilirliği için ham maç sayıları ayrıca korunur.',
      generatedAt: new Date().toISOString(),
    }
  };
  
  for (const champ of champList) {
    if (champ.roles.length === 0 && champ.picks < 2) continue; // Hiç oynamayan
    
    // Tier - rol bazlı (ağırlıklı presence/WR, ham picks örneklem eşiği için)
    const tierByRole = {};
    for (const role of champ.roles) {
      const rd = champ.roleData[role];
      const roleWPicks = rd.wPicks;
      const proportionalWBans = champ.wBans * (roleWPicks / Math.max(champ.wPicks, 0.0001));
      const rolePresence = ((roleWPicks + proportionalWBans) / weightedTotalGames * 100);
      const roleWR = roleWPicks > 0 ? (rd.wWins / roleWPicks * 100) : 0;
      const roleBanRate = proportionalWBans / weightedTotalGames * 100;
      tierByRole[role] = getTier(rolePresence, roleWR, rd.picks, roleBanRate); // rd.picks = HAM eşik
    }
    
    // Eğer hiç rol yoksa ama ban edildiyse, genel tier ver
    if (champ.roles.length === 0) {
      tierByRole['mid'] = getTier(champ.presence, champ.winRate, champ.picks, champ.banRate);
    }
    
    // Counter ilişkileri (HAM eşik: en az 3 maç, ağırlıklı WR >= 60%)
    const counters = {};
    for (const [key, data] of Object.entries(counterWins)) {
      if (!key.startsWith(`${champ.key}_vs_`)) continue;
      if (data.total < 3) continue; // örneklem güvenilirliği — ham maç sayısı
      const wr = data.wWins / data.wTotal; // güncellik ağırlıklı kazanma oranı
      if (wr >= 0.6) {
        const enemy = key.split('_vs_')[1];
        counters[enemy] = +(wr * 4).toFixed(1); // 0-4 arası puan
      }
    }
    
    // Sinerji ilişkileri (HAM eşik: en az 3 maç, ağırlıklı WR >= 60%)
    const synergies = {};
    for (const [key, data] of Object.entries(synergyWins)) {
      if (!key.startsWith(`${champ.key}_with_`)) continue;
      if (data.total < 3) continue; // örneklem güvenilirliği — ham maç sayısı
      const wr = data.wWins / data.wTotal; // güncellik ağırlıklı kazanma oranı
      if (wr >= 0.6) {
        const ally = key.split('_with_')[1];
        synergies[ally] = +(wr * 3).toFixed(1); // 0-3 arası puan
      }
    }
    
    const blindSafety = getBlindPickSafety(champ);
    
    // Rol-spesifik pick sayıları (HAM — örneklem eşiği) ve prioScore (ağırlıklı — güncel önem)
    const rolePickCounts = {};
    const rolePrioScores = {};
    for (const role of champ.roles) {
      const rd = champ.roleData[role];
      rolePickCounts[role] = rd.picks; // HAM — MIN_ROLE_PICKS/getGameCountPenalty gibi eşikler bunu kullanır
      const proportionalWBans = champ.wBans * (rd.wPicks / Math.max(champ.wPicks, 0.0001));
      rolePrioScores[role] = +((rd.wPicks + proportionalWBans) / weightedTotalGames * 100).toFixed(1);
    }
    
    // Açıklama
    const descParts = [];
    if (champ.banRate >= 50) descParts.push('Perma-ban');
    else if (champ.banRate >= 30) descParts.push('Yüksek ban');
    if (champ.winRate >= 55 && champ.picks >= 5) descParts.push('Yüksek WR');
    if (blindSafety >= 8) descParts.push('Güvenli blind pick');
    if (champ.presence >= 70) descParts.push('Meta tanımlayan');
    else if (champ.presence >= 40) descParts.push('Meta pick');
    else if (champ.presence >= 15) descParts.push('Durumsal pick');
    else descParts.push('Niş pick');
    
    meta[champ.key] = {
      name: champ.name,
      roles: champ.roles.length > 0 ? champ.roles : ['mid'],
      tier: tierByRole,
      winRate: champ.roleWinRates,
      pickRate: champ.rolePickRates,
      rolePickCounts: rolePickCounts,
      rolePrioScore: rolePrioScores,
      banRate: +champ.banRate.toFixed(1),
      presence: +champ.presence.toFixed(1),
      proStats: {
        picks: champ.picks,
        bans: champ.bans,
        wins: champ.wins,
        losses: champ.losses,
        weightedPicks: +champ.wPicks.toFixed(2),
        weightedBans: +champ.wBans.toFixed(2),
      },
      counters,
      synergies,
      blindPickSafety: blindSafety,
      description: descParts.join(' · '),
    };
  }
  
  // Dosyaya yaz
  const fs = await import('fs');
  const path = await import('path');
  const outPath = path.join(process.cwd(), 'src', 'data', 'championMeta.json');
  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`\n✅ championMeta.json yazıldı: ${outPath}`);
  console.log(`   ${Object.keys(meta).length - 1} şampiyon`);
  console.log(`   ${totalGames} oyun verisi`);
  
  // Özet istatistikler
  const topPresence = champList.slice(0, 15);
  console.log('\n📊 En Yüksek Presence (Top 15):');
  for (const c of topPresence) {
    console.log(`   ${c.name.padEnd(16)} | Pres: ${c.presence.toFixed(1)}% | WR: ${c.winRate.toFixed(1)}% | P:${c.picks} B:${c.bans} | Roles: ${c.roles.join(',')}`);
  }
  
  const topBanned = [...champList].sort((a, b) => b.banRate - a.banRate).slice(0, 10);
  console.log('\n🚫 En Çok Banlanan (Top 10):');
  for (const c of topBanned) {
    console.log(`   ${c.name.padEnd(16)} | Ban: ${c.banRate.toFixed(1)}% | Picks: ${c.picks}`);
  }
  
  const topBlind = champList
    .filter(c => c.picks >= 5 && c.roles.length > 0)
    .sort((a, b) => getBlindPickSafety(b) - getBlindPickSafety(a) || b.pickRate - a.pickRate)
    .slice(0, 10);
  console.log('\n🛡️ En İyi Blind Pickler:');
  for (const c of topBlind) {
    console.log(`   ${c.name.padEnd(16)} | Safety: ${getBlindPickSafety(c)} | PR: ${c.pickRate.toFixed(1)}% | WR: ${c.winRate.toFixed(1)}% | Roles: ${c.roles.join(',')}`);
  }
}

main().catch(err => {
  console.error('HATA:', err);
  process.exit(1);
});
