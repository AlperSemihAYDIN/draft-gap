// Seçilmiş Şampiyonlar bileşeni — Seçilen şampiyonları chip olarak gösterir

import { useLanguage } from '../i18n/LanguageContext';

export default function SelectedChampions({ champions, version, onRemove, label, maxCount }) {
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-lol-light/70">{label}</span>
        <span className="text-xs text-lol-light/40">
          {champions.length}/{maxCount}
        </span>
      </div>

      {/* Boş durum */}
      {champions.length === 0 && (
        <div className="flex items-center justify-center h-16 border border-dashed 
                        border-lol-light/20 rounded-lg text-lol-light/30 text-sm">
          {t('noChampSelected')}
        </div>
      )}

      {/* Seçilmiş şampiyon chip'leri */}
      <div className="flex flex-wrap gap-2">
        {champions.map((champ) => (
          <div
            key={champ.id}
            className="flex items-center gap-2 bg-lol-gray border border-lol-light/15 
                       rounded-lg px-3 py-2 group hover:border-lol-red/40 transition-colors"
          >
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image}`}
              alt={champ.name}
              className="w-7 h-7 rounded"
              loading="lazy"
            />
            <span className="text-sm text-white">{champ.name}</span>
            {/* Kaldır butonu */}
            <button
              onClick={() => onRemove(champ.id)}
              className="ml-1 text-lol-light/40 hover:text-lol-red transition-colors"
              title={t('remove')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
