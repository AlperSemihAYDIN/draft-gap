// Öneri Kartı bileşeni — Önerilen bir şampiyonun detaylı kartı

import { getSplashUrl } from '../services/dataDragon';
import { useLanguage } from '../i18n/LanguageContext';

// Tier badge renkleri
const TIER_COLORS = {
  S: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  A: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  B: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  C: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function RecommendationCard({ recommendation, version, rank }) {
  const { t } = useLanguage();
  const { id, name, tier, scores, reasons, description, winRate, pickRate } = recommendation;

  // İlk öneriye özel altın çerçeve
  const isFirst = rank === 1;
  const borderClass = isFirst
    ? 'border-lol-gold/60 shadow-lg shadow-lol-gold/10'
    : 'border-lol-light/10 hover:border-lol-blue/30';

  return (
    <div
      className={`relative bg-lol-gray/60 backdrop-blur-sm rounded-xl border 
                  overflow-hidden transition-all hover:scale-[1.02] ${borderClass}`}
    >
      {/* Üst kısım: Splash art arka plan + şampiyon bilgisi */}
      <div className="relative h-32 sm:h-40 overflow-hidden">
        {/* Splash art arka planı */}
        <img
          src={getSplashUrl(id)}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover object-top opacity-40"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-lol-gray/90 via-lol-gray/40 to-transparent" />

        {/* Sıra numarası */}
        <div className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center 
                        text-sm font-bold ${isFirst ? 'bg-lol-gold text-lol-dark' : 'bg-lol-gray/80 text-white'}`}>
          {rank}
        </div>

        {/* Tier badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-md text-xs font-bold 
                        border ${TIER_COLORS[tier] || TIER_COLORS['B']}`}>
          {tier}-Tier
        </div>

        {/* Şampiyon ismi ve ikonu */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3">
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${id}.png`}
            alt={name}
            className="w-12 h-12 rounded-lg border-2 border-lol-light/20"
            loading="lazy"
          />
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{name}</h3>
            <p className="text-lol-light/60 text-xs">{description}</p>
          </div>
        </div>
      </div>

      {/* Alt kısım: Puan detayları ve açıklamalar */}
      <div className="p-4 space-y-3">
        {/* Puan çubukları */}
        <div className="grid grid-cols-2 gap-2">
          <ScoreBar label={t('counter')} value={scores.counter} maxValue={20} color="bg-red-500" />
          <ScoreBar label={t('synergy')} value={scores.synergy} maxValue={15} color="bg-green-500" />
          <ScoreBar label={t('meta')} value={scores.meta} maxValue={20} color="bg-blue-500" />
          <ScoreBar label={t('safety')} value={scores.blindPick} maxValue={10} color="bg-yellow-500" />
          {scores.banPriority > 0 && (
            <ScoreBar label="Ban" value={scores.banPriority} maxValue={15} color="bg-purple-500" />
          )}
        </div>

        {/* Toplam puan */}
        <div className="flex items-center justify-between pt-2 border-t border-lol-light/10">
          <div className="flex items-center gap-3 text-xs text-lol-light/50">
            <span>{t('totalScore')}</span>
            {winRate && (
              <span className={winRate >= 51 ? 'text-green-400' : winRate < 49 ? 'text-lol-red' : ''}>
                WR {winRate}%
              </span>
            )}
            {pickRate && (
              <span className="text-lol-light/40">PR {pickRate}%</span>
            )}
          </div>
          <span className={`font-bold text-lg ${isFirst ? 'text-lol-gold' : 'text-lol-blue'}`}>
            {scores.total}
          </span>
        </div>

        {/* Açıklama satırları */}
        <div className="space-y-1.5">
          {reasons.map((reason, i) => (
            <p key={i} className="text-xs text-lol-light/70 leading-relaxed">
              {reason}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Puan çubuğu alt bileşeni
function ScoreBar({ label, value, maxValue, color }) {
  const percentage = Math.min((Math.max(value, 0) / maxValue) * 100, 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-lol-light/50">{label}</span>
        <span className="text-[10px] text-lol-light/70 font-medium">{value}</span>
      </div>
      <div className="h-1.5 bg-lol-dark/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
