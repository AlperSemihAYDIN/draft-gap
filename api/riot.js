// Vercel Serverless Function — Riot API proxy
// Riot API anahtarını güvenli tutmak için sunucu tarafında çağrı yapar

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'RIOT_API_KEY not configured on server' });
  }

  const { action, gameName, tagLine, puuid, platform, region, count, matchId } = req.query;

  const regionHost = region || 'europe';
  const platformHost = platform || 'tr1';

  // Input validation
  const ALLOWED_REGIONS = ['americas', 'europe', 'asia', 'esports', 'sea'];
  const ALLOWED_PLATFORMS = [
    'tr1', 'euw1', 'eun1', 'na1', 'kr', 'jp1', 'br1',
    'la1', 'la2', 'oc1', 'ru', 'ph2', 'sg2', 'th2', 'tw2', 'vn2',
  ];

  if (!ALLOWED_REGIONS.includes(regionHost)) {
    return res.status(400).json({ error: 'Invalid region' });
  }
  if (!ALLOWED_PLATFORMS.includes(platformHost)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }

  let url;

  switch (action) {
    case 'account':
      if (!gameName || !tagLine) return res.status(400).json({ error: 'gameName and tagLine required' });
      if (gameName.length > 30 || tagLine.length > 10) return res.status(400).json({ error: 'Invalid input length' });
      url = `https://${regionHost}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
      break;

    case 'spectator':
      if (!puuid) return res.status(400).json({ error: 'puuid required' });
      if (puuid.length > 100) return res.status(400).json({ error: 'Invalid puuid' });
      url = `https://${platformHost}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${encodeURIComponent(puuid)}`;
      break;

    case 'matches':
      if (!puuid) return res.status(400).json({ error: 'puuid required' });
      if (puuid.length > 100) return res.status(400).json({ error: 'Invalid puuid' });
      const c = Math.min(Math.max(parseInt(count) || 10, 1), 20);
      url = `https://${regionHost}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(puuid)}/ids?count=${c}`;
      break;

    case 'match':
      if (!matchId) return res.status(400).json({ error: 'matchId required' });
      if (matchId.length > 30) return res.status(400).json({ error: 'Invalid matchId' });
      url = `https://${regionHost}.api.riotgames.com/lol/match/v5/matches/${encodeURIComponent(matchId)}`;
      break;

    default:
      return res.status(400).json({ error: 'Unknown action. Use: account, spectator, matches, match' });
  }

  try {
    const response = await fetch(url, {
      headers: { 'X-Riot-Token': apiKey },
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Cache 60 saniye
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch {
    return res.status(502).json({ error: 'Failed to fetch from Riot API' });
  }
}
