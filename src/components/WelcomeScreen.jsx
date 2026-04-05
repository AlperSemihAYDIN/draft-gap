import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

// Chovy kupa fotoğrafı — public/ klasöründen, BASE_URL ile doğru path
const CHOVY_TROPHY = `${import.meta.env.BASE_URL}images/chovy-trophy.jpg`;

export default function WelcomeScreen({ onEnter }) {
  const { t } = useLanguage();
  const [fadeOut, setFadeOut] = useState(false);

  function handleEnter() {
    setFadeOut(true);
    setTimeout(() => onEnter(), 600);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-opacity duration-500 overflow-y-auto ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: '#000' }}
    >
      {/* Dil seçici - üst sağ köşe */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector />
      </div>

      {/* ===== HERO BÖLÜMÜ: Büyük Chovy Fotoğrafı ===== */}
      <div className="relative w-full flex-shrink-0" style={{ minHeight: '55vh' }}>
        {/* Tam genişlik fotoğraf */}
        <img
          src={CHOVY_TROPHY}
          alt="Chovy - MSI 2025 Champion"
          className="w-full h-full object-cover absolute inset-0"
          style={{ objectPosition: 'center 20%' }}
          draggable="false"
        />
        {/* Alt gradient overlay — fotoğrafı karanlığa geçirir */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        {/* Altın parıltı üst kenarlık */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lol-gold/60 to-transparent" />

        {/* Fotoğraf üzerinde isim plakası */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🏆</span>
            <span className="text-lol-gold font-bold text-xl sm:text-2xl tracking-[0.2em] uppercase drop-shadow-lg">
              CHOVY
            </span>
            <span className="text-3xl">🏆</span>
          </div>
          <span className="text-white/50 text-xs tracking-wider">GEN.G · MSI 2025 CHAMPION</span>
        </div>
      </div>

      {/* ===== İÇERİK BÖLÜMÜ ===== */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 py-8"
           style={{ background: 'linear-gradient(to bottom, #000 0%, #0A1428 30%, #061018 100%)' }}>
        
        {/* Dekoratif çizgiler */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-lol-gold/20 via-transparent to-transparent" />
        </div>

        <div className="relative max-w-2xl w-full flex flex-col items-center text-center animate-fadeIn">

          {/* Chovy sözü — büyük ve dikkat çekici */}
          <div className="relative mb-10 max-w-xl px-6">
            <span className="absolute -top-6 -left-2 text-6xl text-lol-gold/25 font-serif leading-none select-none">"</span>
            <blockquote className="text-xl sm:text-2xl md:text-3xl text-white/90 font-light leading-relaxed italic">
              {t('welcomeQuote1')}
              <span className="text-lol-gold font-semibold not-italic">{t('welcomeQuoteHighlight')}</span>
              {t('welcomeQuote2')}
            </blockquote>
            <span className="absolute -bottom-6 -right-2 text-6xl text-lol-gold/25 font-serif leading-none select-none">"</span>
            <p className="mt-8 text-lol-light/30 text-xs tracking-wide">
              {t('welcomeSource')}
            </p>
          </div>

          {/* Ayırıcı */}
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-lol-gold/50 to-transparent mb-8" />

          {/* Uygulama başlığı */}
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">
              Draft<span className="text-lol-blue">Gap</span>
            </h1>
            <p className="text-lol-light/40 text-sm max-w-sm mx-auto">
              {t('welcomeDesc')}
            </p>
          </div>

          {/* Giriş butonu */}
          <button
            onClick={handleEnter}
            className="group relative px-12 py-4 rounded-xl font-bold text-lg overflow-hidden
                       transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-lol-blue/20"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-lol-blue to-teal-500 
                            group-hover:from-teal-500 group-hover:to-lol-blue transition-all duration-500" />
            <div className="absolute inset-0 border border-white/20 rounded-xl" />
            <span className="relative text-lol-dark flex items-center gap-3">
              {t('welcomeButton')}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>

          {/* Alt bilgi */}
          <p className="mt-8 text-lol-light/20 text-xs">
            {t('welcomeFooter')}
          </p>
        </div>
      </div>
    </div>
  );
}
