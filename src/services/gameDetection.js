// Queue ID'ye göre mod otomatik belirleme
// Riot API tarafından sağlanan QueueID'ye göre oyun tipini belirler

const QUEUE_TYPES = {
  // Ranked
  420: { type: 'SoloQ', label: 'Ranked Solo/Duo', suggestedMode: 'soloq' },
  440: { type: 'FlexRanked', label: 'Ranked Flex', suggestedMode: 'pro' },
  450: { type: 'ARAM', label: 'ARAM', suggestedMode: 'soloq' },

  // Normal
  430: { type: 'Blind', label: 'Normal Blind Pick', suggestedMode: 'soloq' },
  400: { type: 'Draft', label: 'Normal Draft Pick', suggestedMode: 'soloq' },

  // Tournament/Clash
  700: { type: 'Clash', label: 'Clash', suggestedMode: 'pro' },
  900: { type: 'UREF', label: 'URF', suggestedMode: 'soloq' },
  920: { type: 'PBE', label: 'PBE', suggestedMode: 'soloq' },

  // Special
  0: { type: 'Custom', label: 'Custom Game', suggestedMode: 'soloq' },
  1: { type: 'Tutorial', label: 'Tutorial', suggestedMode: 'soloq' },
};

/**
 * Queue ID'ye göre oyun modunu otomatik belirle
 * @param {number} queueId - Riot API'den gelen queue ID
 * @returns {Object} { type, label, suggestedMode }
 */
export function detectGameMode(queueId) {
  if (queueId in QUEUE_TYPES) {
    return QUEUE_TYPES[queueId];
  }

  // Varsayılan olarak SoloQ
  return { type: 'Unknown', label: 'Unknown Queue', suggestedMode: 'soloq' };
}

/**
 * Riot ID formatını parse et
 * Beklenen format: "GameName#TAG"
 * Örnek: "AlperSemih#TR1"
 */
export function parseRiotId(input) {
  if (!input || !input.includes('#')) {
    return null;
  }

  const [gameName, tagLine] = input.split('#');

  if (!gameName.trim() || !tagLine.trim()) {
    return null;
  }

  return {
    gameName: gameName.trim(),
    tagLine: tagLine.trim(),
  };
}

/**
 * Region kodu'na göre platform belirle
 * Örnek: TR1 => tr platform, europe regionu
 */
export function getRegionInfo(tagLine) {
  const REGION_MAP = {
    // Routing value -> { platform, region, label }
    BR1: { platform: 'br1', region: 'americas', label: 'Brazil' },
    LA1: { platform: 'la1', region: 'americas', label: 'LAN' },
    LA2: { platform: 'la2', region: 'americas', label: 'LAS' },
    NA1: { platform: 'na1', region: 'americas', label: 'NA' },
    OC1: { platform: 'oc1', region: 'sea', label: 'Oceania' },
    PH2: { platform: 'ph2', region: 'sea', label: 'Philippines' },
    RU: { platform: 'ru', region: 'europe', label: 'Russia' },
    SG2: { platform: 'sg2', region: 'sea', label: 'Singapore' },
    TH2: { platform: 'th2', region: 'sea', label: 'Thailand' },
    TR1: { platform: 'tr1', region: 'europe', label: 'Turkey' },
    VN2: { platform: 'vn2', region: 'sea', label: 'Vietnam' },
    EUW1: { platform: 'euw1', region: 'europe', label: 'EU West' },
    EUNE1: { platform: 'eune1', region: 'europe', label: 'EU Nordic & East' },
    JP1: { platform: 'jp1', region: 'asia', label: 'Japan' },
    KR: { platform: 'kr', region: 'asia', label: 'Korea' },
  };

  return REGION_MAP[tagLine] || { platform: 'na1', region: 'americas', label: 'Unknown' };
}

export default {
  detectGameMode,
  parseRiotId,
  getRegionInfo,
  QUEUE_TYPES,
};
