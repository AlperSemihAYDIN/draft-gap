// Sonuçlar Sayfası bileşeni — Önerilen 5 şampiyonu gösterir

import RecommendationCard from './RecommendationCard';
import { useLanguage } from '../i18n/LanguageContext';

// Rol etiketleri (Türkçe görüntüleme için)
const ROLE_LABELS = {
  top: 'Top',
  jungle: 'Jungle',
  mid: 'Mid',
  adc: 'ADC',
  support: 'Support',
};

export default function ResultsPage({
  recommendations,
  version,
  selectedRole,
  enemyChampions,
  allyChampions,
  onBack,
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Başlık ve geri butonu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t('resultsTitle')}
          </h2>
          <p className="text-lol-light/50 text-sm mt-1">
            <span className="text-lol-blue font-medium">{ROLE_LABELS[selectedRole]}</span> {t('resultsForRole')}
            {enemyChampions.length > 0 && (
              <> • {enemyChampions.length} {t('resultsAgainst')}</>
            )}
            {allyChampions.length > 0 && (
              <> • {allyChampions.length} {t('resultsWith')}</>
            )}
          </p>
        </div>

        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-lol-gray/80 border border-lol-light/15 
                     rounded-lg text-lol-light hover:text-white hover:border-lol-blue/40 
                     transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToDraft')}
        </button>
      </div>

      {/* Sonuç yoksa */}
      {recommendations.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lol-light/40 text-lg">
            {t('noResults')}
          </p>
          <p className="text-lol-light/30 text-sm mt-2">
            {t('tryOtherRole')}
          </p>
        </div>
      )}

      {/* Öneri kartları grid'i */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec, index) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            version={version}
            rank={index + 1}
          />
        ))}
      </div>

      {/* Bilgi notu */}
      <div className="text-center text-lol-light/30 text-xs pt-4 border-t border-lol-light/5">
        {t('resultsNote')}
        <br />
        {t('resultsDisclaimer')}
      </div>
    </div>
  );
}
