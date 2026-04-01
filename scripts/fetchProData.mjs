// Leaguepedia Cargo API'den pro play verisi çeker ve championMeta.json oluşturur
// Kaynak: https://lol.fandom.com (Leaguepedia)

const TOURNAMENTS = [
  // Major Leagues 2026
  'LCK/2026 Season/Rounds 1-2',
  'LPL/2026 Season/Split 1',
  'LPL/2026 Season/Split 1 Playoffs',
  'LEC/2026 Season/Spring Season',
  'LEC/2026 Season/Versus Season',
  'LEC/2026 Season/Versus Playoffs',
  // Secondary Leagues 2026
  'VCS/2026 Season/Spring Season',
  'VCS/2026 Season/Spring Playoffs',
  'CBLOL/2026 Season/Split 1',
  'CBLOL/2026 Season/Split 1 Playoffs',
  '2026 Americas Cup',
  '2026 First Stand',
  'EMEA Masters/2026 Season/Winter',
  'LCK CL/2026 Season/Rounds 1-2',
  'LCP/2026 Season/Split 1 Playoffs',
];

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

async function main() {
  console.log('=== Leaguepedia Pro Play Data Fetcher ===\n');
  
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
  const stats = {}; // champKey -> { name, picks, bans, wins, losses, roles: { role: { picks, wins } } }
  
  for (const game of allGames) {
    const winner = parseInt(game.Winner);
    
    // Banları işle
    for (let i = 1; i <= 5; i++) {
      for (const team of ['Team1', 'Team2']) {
        const banName = game[`${team}Ban${i}`];
        if (!banName) continue;
        const key = champKey(banName);
        if (!key) continue;
        if (!stats[key]) stats[key] = { name: banName, picks: 0, bans: 0, wins: 0, losses: 0, roles: {} };
        stats[key].bans++;
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
        
        if (!stats[key]) stats[key] = { name: pickName, picks: 0, bans: 0, wins: 0, losses: 0, roles: {} };
        stats[key].picks++;
        
        const isWinner = (winner === parseInt(teamIdx));
        if (isWinner) stats[key].wins++;
        else stats[key].losses++;
        
        if (role) {
          if (!stats[key].roles[role]) stats[key].roles[role] = { picks: 0, wins: 0 };
          stats[key].roles[role].picks++;
          if (isWinner) stats[key].roles[role].wins++;
        }
      }
    }
  }
  
  console.log(`${Object.keys(stats).length} farklı şampiyon bulundu\n`);
  
  // Toplam oyun sayısı
  const totalGames = allGames.length;
  
  // Tier hesaplama: Presence (pick+ban / total games) bazlı
  const champList = Object.entries(stats).map(([key, s]) => {
    const presence = ((s.picks + s.bans) / totalGames * 100);
    const winRate = s.picks > 0 ? (s.wins / s.picks * 100) : 0;
    const pickRate = (s.picks / totalGames * 100);
    const banRate = (s.bans / totalGames * 100);
    
    // Rol bazlı win rate
    const roleWinRates = {};
    const rolePickRates = {};
    const roleList = [];
    for (const [role, rd] of Object.entries(s.roles)) {
      if (rd.picks >= 2) { // En az 2 pick olan roller
        roleWinRates[role] = +(rd.wins / rd.picks * 100).toFixed(1);
        rolePickRates[role] = +(rd.picks / totalGames * 100).toFixed(1);
        roleList.push(role);
      }
    }
    
    return {
      key, name: s.name, presence, winRate, pickRate, banRate,
      picks: s.picks, bans: s.bans, wins: s.wins, losses: s.losses,
      roles: roleList, roleWinRates, rolePickRates, roleData: s.roles,
    };
  });
  
  // Presence'a göre sırala
  champList.sort((a, b) => b.presence - a.presence);
  
  // Tier atama
  function getTier(presence, winRate, picks) {
    if (picks < 3) return 'C'; // Çok az oynanan
    if (presence >= 60 && winRate >= 45) return 'S';
    if (presence >= 35 && winRate >= 45) return 'A';
    if (presence >= 15) return 'B';
    return 'C';
  }
  
  // Blind pick safety hesapla
  // Çok ban almayan ama çok pick edilen = güvenli blind pick
  // Yüksek ban rate = muhtemelen OP, düşük ban yüksek pick = güvenli blind
  function getBlindPickSafety(champ) {
    if (champ.picks < 3) return 3;
    const banRatio = champ.bans / (champ.picks + champ.bans);
    const wr = champ.winRate;
    
    // Düşük ban oranı + decent WR = güvenli blind
    if (banRatio < 0.2 && champ.pickRate >= 10 && wr >= 48) return 9;
    if (banRatio < 0.3 && champ.pickRate >= 8 && wr >= 47) return 8;
    if (banRatio < 0.4 && champ.pickRate >= 5 && wr >= 45) return 7;
    if (banRatio < 0.5 && wr >= 45) return 6;
    if (wr >= 45) return 5;
    return 4;
  }
  
  // Counter ve sinerji ilişkilerini maç verilerinden çıkar
  // Her oyunda aynı taraftaki şampiyonlar sinerji, karşı taraftaki counter
  const counterWins = {}; // "A_vs_B" -> { wins, total }
  const synergyWins = {}; // "A_with_B" -> { wins, total }
  
  for (const game of allGames) {
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
        if (!counterWins[keyAB]) counterWins[keyAB] = { wins: 0, total: 0 };
        counterWins[keyAB].total++;
        if (winner === 1) counterWins[keyAB].wins++;
        
        const keyBA = `${b}_vs_${a}`;
        if (!counterWins[keyBA]) counterWins[keyBA] = { wins: 0, total: 0 };
        counterWins[keyBA].total++;
        if (winner === 2) counterWins[keyBA].wins++;
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
            if (!synergyWins[k]) synergyWins[k] = { wins: 0, total: 0 };
            synergyWins[k].total++;
            if (isWinner) synergyWins[k].wins++;
          }
        }
      }
    }
  }
  
  // championMeta.json oluştur
  const meta = {
    _meta: {
      patch: '16.5-16.7',
      source: 'Leaguepedia (lol.fandom.com)',
      tournaments: TOURNAMENTS.filter(t => allGames.some(g => g.OverviewPage === t)),
      totalGames,
      generatedAt: new Date().toISOString(),
    }
  };
  
  for (const champ of champList) {
    if (champ.roles.length === 0 && champ.picks < 2) continue; // Hiç oynamayan
    
    // Tier - rol bazlı
    const tierByRole = {};
    for (const role of champ.roles) {
      const rd = champ.roleData[role];
      const rolePresence = ((rd.picks + (champ.bans * (rd.picks / Math.max(champ.picks, 1)))) / totalGames * 100);
      const roleWR = rd.picks > 0 ? (rd.wins / rd.picks * 100) : 0;
      tierByRole[role] = getTier(rolePresence, roleWR, rd.picks);
    }
    
    // Eğer hiç rol yoksa ama ban edildiyse, genel tier ver
    if (champ.roles.length === 0) {
      tierByRole['mid'] = getTier(champ.presence, champ.winRate, champ.picks);
    }
    
    // Counter ilişkileri (en az 3 maç, WR >= 60%)
    const counters = {};
    for (const [key, data] of Object.entries(counterWins)) {
      if (!key.startsWith(`${champ.key}_vs_`)) continue;
      if (data.total < 3) continue;
      const wr = data.wins / data.total;
      if (wr >= 0.6) {
        const enemy = key.split('_vs_')[1];
        counters[enemy] = +(wr * 4).toFixed(1); // 0-4 arası puan
      }
    }
    
    // Sinerji ilişkileri (en az 3 maç, WR >= 60%)
    const synergies = {};
    for (const [key, data] of Object.entries(synergyWins)) {
      if (!key.startsWith(`${champ.key}_with_`)) continue;
      if (data.total < 3) continue;
      const wr = data.wins / data.total;
      if (wr >= 0.6) {
        const ally = key.split('_with_')[1];
        synergies[ally] = +(wr * 3).toFixed(1); // 0-3 arası puan
      }
    }
    
    const blindSafety = getBlindPickSafety(champ);
    
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
      banRate: +champ.banRate.toFixed(1),
      presence: +champ.presence.toFixed(1),
      proStats: {
        picks: champ.picks,
        bans: champ.bans,
        wins: champ.wins,
        losses: champ.losses,
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
