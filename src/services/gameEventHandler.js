import championMeta from '../data/championMeta.json';

// Oyun olaylarini isle ve analizi guncelle
// Her yeni ban/pick sonrasi analizi yeniden hesapla

export class GameEventHandler {
  constructor(draftContext, analysisEngine) {
    this.draftContext = draftContext;
    this.analysisEngine = analysisEngine;
    this.eventHistory = [];
  }

  /**
   * Ban olayini isle
   */
  handleBan(champId, team) {
    this.draftContext.addBan(champId, team);
    this.eventHistory.push({
      type: 'ban',
      champId,
      team,
      timestamp: new Date(),
    });

    // Analizi guncelle
    this.recalculateAnalysis();
  }

  /**
   * Pick olayini isle
   */
  handlePick(champId, role, team) {
    this.draftContext.addPick(champId, role, team);
    this.eventHistory.push({
      type: 'pick',
      champId,
      role,
      team,
      timestamp: new Date(),
    });

    // Analizi guncelle
    this.recalculateAnalysis();
  }

  /**
   * Draft phase degisikligi
   */
  handlePhaseChange(phase, turn, pickOrder) {
    this.draftContext.updateDraftPhase(phase, turn, pickOrder);
    this.recalculateAnalysis();
  }

  /**
   * Analizi tamamen yeniden hesapla
   * Her olay sonrasi cagrilacak
   */
  recalculateAnalysis() {
    const { blueTeam, redTeam, userRole, draftMode, userTeam } = this.draftContext;

    // Yeni oneriler olustur
    const recommendations = this.analysisEngine.getRecommendations(
      userRole,
      blueTeam,
      redTeam,
      userTeam,
      draftMode,
      3
    );

    // Takim analizi
    const composition = this.analysisEngine.analyzeComposition(
      blueTeam,
      redTeam,
      userTeam
    );

    // Rakip tahmini
    const predictedEnemyPicks = this.predictEnemyPicks(redTeam, blueTeam);

    // Sonraki mudaleler
    const nextMoves = this.suggestNextMoves(blueTeam, redTeam, userTeam, draftMode);

    // Context'e analizi kaydet
    this.draftContext.setAnalysis({
      recommendations,
      composition,
      predictedEnemyPicks,
      nextMoves,
      timestamp: new Date(),
    });
  }

  /**
   * Rakibin muhtemel secimini tahmin et
   * Banning frequency, meta power, team synergy'ye bakarak
   */
  predictEnemyPicks(enemyTeam, allyTeam) {
    const usedChamps = new Set([
      ...enemyTeam.map(p => p.champId),
      ...allyTeam.map(p => p.champId),
    ]);

    const predictions = [];

    for (const [champId, champData] of Object.entries(championMeta)) {
      if (champId === '_meta') continue;
      if (usedChamps.has(champId)) continue;

      // Skor: meta gucu + takim uyumu
      const metaScore = champData.presence || 0;
      const synergyScore = this.calculateAverageSynergy(champId, enemyTeam);
      
      const predictionScore = metaScore * 0.7 + synergyScore * 0.3;

      if (predictionScore > 0) {
        predictions.push({
          champId,
          name: champData.name,
          predictionScore: Math.round(predictionScore * 10) / 10,
          reason: this.generatePredictionReason(champData, metaScore, synergyScore),
        });
      }
    }

    // En yuksek prediction score'a gore sirala
    return predictions.sort((a, b) => b.predictionScore - a.predictionScore).slice(0, 3);
  }

  /**
   * Takimin ortalaması uyum puanini hesapla
   */
  calculateAverageSynergy(champId, team) {
    if (team.length === 0) return 0;

    let totalSynergy = 0;
    const champ = championMeta[champId];
    if (!champ || !champ.synergies) return 0;

    for (const teamMember of team) {
      const synergy = champ.synergies[teamMember.champId] || 0;
      totalSynergy += synergy;
    }

    return totalSynergy / team.length;
  }

  /**
   * Tahminin sebebini acikla
   */
  generatePredictionReason(champData, metaScore, synergyScore) {
    const reasons = [];

    if (metaScore >= 50) {
      reasons.push('Meta gucu yuksek');
    }
    if (synergyScore > 2) {
      reasons.push('Takim uyumu iyi');
    }
    if (champData.banRate >= 30) {
      reasons.push('Sik ban yiliyor');
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Durumsal secim';
  }

  /**
   * Sonraki muhtemel hamleleri oner
   * SoloQ: Sadece kendi secim onerileri
   * Pro: Tum takimin stratejisi
   */
  suggestNextMoves(blueTeam, redTeam, userTeam, draftMode) {
    const ownTeam = userTeam === 'blue' ? blueTeam : redTeam;
    const enemyTeam = userTeam === 'blue' ? redTeam : blueTeam;

    if (draftMode === 'soloq') {
      // SoloQ: Sadece kullanici icin tavsiye
      return {
        priority: 'Suanki rolundeki en guclu pick',
        reason: 'Kisisel kazanma ihtimalini maksimize etmek icin',
        nextMove: 'Rakibin en cok threat olusturan sampiyonunu counter pick et',
      };
    } else {
      // Pro: Butun takim stratejisi
      return {
        priority: this.determinePriorityPick(ownTeam, enemyTeam),
        reason: this.generateStrategyReason(ownTeam, enemyTeam),
        nextMove: this.generateNextMove(ownTeam, enemyTeam),
        warnings: this.generateWarnings(ownTeam, enemyTeam),
      };
    }
  }

  /**
   * Oncelik pick'ini belirle (Pro mode)
   */
  determinePriorityPick(ownTeam, enemyTeam) {
    if (ownTeam.length === 0) {
      return 'Blind pick guventi sampiyona ihtiyaciniz var';
    }

    // En az temsil edilen rol nedir?
    const roles = ['top', 'jungle', 'mid', 'adc', 'support'];
    const ownRoles = new Set(ownTeam.map(p => p.role));
    const missingRoles = roles.filter(r => !ownRoles.has(r));

    if (missingRoles.length > 0) {
      return `${missingRoles[0]} rolunde Pick yapin`;
    }

    return 'Team comp uyumluluk saglayin';
  }

  /**
   * Strateji sebebini olustur
   */
  generateStrategyReason(ownTeam, enemyTeam) {
    const ownCount = ownTeam.length;
    const enemyCount = enemyTeam.length;

    if (ownCount < 3) return 'Erken faz picklari - meta ve blind pick guvenligi onemli';
    if (ownCount === 4) return 'Son pick - rakip composition karsi counter hazirligì';
    return 'Son hamle - korkulu draft (fearless) aktivitesi';
  }

  /**
   * Sonraki hareketi olustur
   */
  generateNextMove(ownTeam, enemyTeam) {
    if (enemyTeam.length === ownTeam.length) {
      return 'Rakip takiminin tehdidi coz veya team comp tamamla';
    }
    return 'Rakip takiminin muhtemel secimini karsi hazirlan';
  }

  /**
   * Uyarilar
   */
  generateWarnings(ownTeam, enemyTeam) {
    const warnings = [];

    // AP/AD dengesi
    const enemyADCount = enemyTeam.filter(p => this.isADCarry(p.champId)).length;
    const enemyAPCount = enemyTeam.filter(p => this.isAPCarry(p.champId)).length;
    if (enemyADCount === enemyTeam.length) {
      warnings.push('Rakip tum AD - Armor build onceligi!');
    }
    if (enemyAPCount === enemyTeam.length) {
      warnings.push('Rakip tum AP - Magic Resist onceligi!');
    }

    // CC eksikligi
    const ownCC = ownTeam.filter(p => this.hasCrowdControl(p.champId)).length;
    if (ownCC === 0 && enemyTeam.length >= 3) {
      warnings.push('CC yetersiz - Crowd Control yetenekli sampiyon gerekli!');
    }

    return warnings;
  }

  /**
   * Sampiyonun AD carry olup olmadìgini kontrol et
   */
  isADCarry(champId) {
    const champ = championMeta[champId];
    return champ && (champ.roles.includes('adc') || champ.roles.includes('top'));
  }

  /**
   * Sampiyonun AP carry olup olmadìgini kontrol et
   */
  isAPCarry(champId) {
    const champ = championMeta[champId];
    return champ && champ.roles.includes('mid');
  }

  /**
   * Sampiyonun CC yetenekleri olup olmadìgini kontrol et
   * Ban rate yuksek sampiyonlar genellikle CC potansiyeli yuksek
   */
  hasCrowdControl(champId) {
    const champ = championMeta[champId];
    return champ && (champ.banRate >= 25 || champ.roles.includes('support'));
  }

  /**
   * Event gecmisini al
   */
  getEventHistory() {
    return this.eventHistory;
  }

  /**
   * Event gecmisini temizle
   */
  clearHistory() {
    this.eventHistory = [];
  }
}

export default GameEventHandler;
