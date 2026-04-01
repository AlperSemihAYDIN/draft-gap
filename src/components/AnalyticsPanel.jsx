// Analytics Panel — Ziyaretçi istatistiklerini gösteren küçük panel
import { useState, useEffect } from 'react';
import { trackVisit, getStats } from '../services/analytics';
import { useLanguage } from '../i18n/LanguageContext';

export default function AnalyticsPanel() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // İlk yüklemede ziyareti kaydet
    const s = trackVisit();
    setStats(s);
  }, []);

  if (!stats) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Toggle butonu */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-lol-gray/90 backdrop-blur-sm border border-lol-light/10 rounded-full 
                   w-10 h-10 flex items-center justify-center text-lol-light/50 
                   hover:text-lol-gold hover:border-lol-gold/30 transition-all shadow-lg"
        title={t('analyticsTitle') || 'Analytics'}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" 
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute bottom-12 right-0 w-64 bg-lol-gray/95 backdrop-blur-md border border-lol-light/10 
                        rounded-xl shadow-2xl p-4 animate-fadeIn">
          <h3 className="text-lol-gold text-sm font-bold mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            {t('analyticsTitle') || 'Analytics'}
          </h3>

          <div className="space-y-2.5">
            {/* Bugünkü görüntüleme */}
            <StatRow
              icon="📊"
              label={t('analyticsToday') || "Today's Views"}
              value={stats.todayViews}
            />
            {/* Toplam görüntüleme */}
            <StatRow
              icon="👁️"
              label={t('analyticsTotal') || 'Total Views'}
              value={stats.totalViews}
            />
            {/* Aktif gün sayısı */}
            <StatRow
              icon="📅"
              label={t('analyticsActiveDays') || 'Active Days'}
              value={stats.uniqueDays}
            />
            {/* İlk ziyaret */}
            {stats.firstVisit && (
              <StatRow
                icon="🎯"
                label={t('analyticsFirstVisit') || 'First Visit'}
                value={stats.firstVisit}
                small
              />
            )}
          </div>

          <p className="text-lol-light/20 text-[10px] mt-3 pt-2 border-t border-lol-light/5">
            {t('analyticsNote') || 'Data stored locally in your browser only.'}
          </p>
        </div>
      )}
    </div>
  );
}

function StatRow({ icon, label, value, small }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-lol-light/50 text-xs flex items-center gap-1.5">
        <span>{icon}</span>
        {label}
      </span>
      <span className={`font-bold ${small ? 'text-xs text-lol-light/60' : 'text-sm text-white'}`}>
        {value}
      </span>
    </div>
  );
}
