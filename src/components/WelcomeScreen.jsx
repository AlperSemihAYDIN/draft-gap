import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

// Chovy'nin imza şampiyonları — Data Dragon CDN
const HERO_SPLASH = 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Azir_0.jpg';
// Gen.G takım fotoğrafı / Worlds trophy - Data Dragon üzerinden alternatif splash
const CHOVY_CHAMPS = [
  'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Orianna_0.jpg',
  'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Azir_0.jpg',
  'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Zoe_0.jpg',
];

export default function WelcomeScreen({ onEnter }) {
  const { t } = useLanguage();
  const [fadeOut, setFadeOut] = useState(false);

  function handleEnter() {
    setFadeOut(true);
    setTimeout(() => onEnter(), 600);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, #0A1428 0%, #061018 60%, #000 100%)',
      }}
    >
      {/* Dekoratif arka plan çizgileri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-lol-gold/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-lol-gold/5 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-lol-gold/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lol-gold/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lol-gold/30 to-transparent" />
      </div>

      {/* Chovy imza şampiyonları kolajı arka plan */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {CHOVY_CHAMPS.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className="absolute h-full object-cover"
            style={{
              left: `${i * 33}%`,
              width: '34%',
              opacity: 0.06 + i * 0.02,
              filter: 'saturate(0.3)',
            }}
            draggable="false"
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1428]/40 via-[#0A1428]/70 to-[#061018]/95 pointer-events-none" />

      <div className="relative max-w-3xl w-full mx-4 flex flex-col items-center text-center animate-fadeIn">
        {/* Dil seçici - üst sağ köşe */}
        <div className="absolute top-0 right-0">
          <LanguageSelector />
        </div>

        {/* Gen.G Logo / Üst badge */}
        <div className="mb-6 flex items-center gap-2 text-lol-light/40 text-xs tracking-[0.3em] uppercase">
          <div className="w-8 h-px bg-lol-gold/30" />
          {t('welcomeBadge')}
          <div className="w-8 h-px bg-lol-gold/30" />
        </div>

        {/* Chovy Şampiyon Çerçevesi */}
        <div className="relative mb-8">
          <div className="relative w-36 h-36 mx-auto">
            {/* Chovy'nin imza şampiyonu splash */}
            <img
              src={HERO_SPLASH}
              alt="Chovy"
              className="w-full h-full object-cover rounded-2xl border-2 border-lol-gold/40
                         shadow-2xl shadow-lol-gold/20"
              style={{ objectPosition: 'center 20%' }}
            />
            {/* Altın glow */}
            <div className="absolute -inset-3 bg-lol-gold/10 rounded-3xl blur-xl -z-10" />
            {/* Kupa ikonu */}
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-lol-dark border-2 border-lol-gold/50
                            rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xl">🏆</span>
            </div>
          </div>
          {/* İsim plakası */}
          <div className="mt-4 bg-lol-dark/80 border border-lol-gold/30 rounded-full px-5 py-1.5 inline-block">
            <span className="text-lol-gold font-bold text-sm tracking-wider">GEN.G · CHOVY</span>
          </div>
        </div>

        {/* Chovy sözü */}
        <div className="relative mb-10 max-w-xl px-4">
          {/* Tırnak işareti */}
          <span className="absolute -top-4 -left-2 text-5xl text-lol-gold/20 font-serif leading-none select-none">"</span>
          <blockquote className="text-lg sm:text-xl md:text-2xl text-white/90 font-light leading-relaxed italic">
            {t('welcomeQuote1')}
            <span className="text-lol-gold font-medium not-italic">{t('welcomeQuoteHighlight')}</span>
            {t('welcomeQuote2')}
          </blockquote>
          <span className="absolute -bottom-4 -right-2 text-5xl text-lol-gold/20 font-serif leading-none select-none">"</span>

          {/* Kaynak */}
          <p className="mt-6 text-lol-light/30 text-xs tracking-wide">
            {t('welcomeSource')}
          </p>
        </div>

        {/* Ayırıcı çizgi */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-lol-gold/50 to-transparent mb-8" />

        {/* Uygulama başlığı */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Draft<span className="text-lol-blue">Gap</span>
          </h1>
          <p className="text-lol-light/40 text-sm max-w-sm mx-auto">
            {t('welcomeDesc')}
          </p>
        </div>

        {/* Giriş butonu */}
        <button
          onClick={handleEnter}
          className="group relative px-10 py-4 rounded-xl font-bold text-lg overflow-hidden
                     transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-lol-blue/20"
        >
          {/* Buton arka plan */}
          <div className="absolute inset-0 bg-gradient-to-r from-lol-blue to-teal-500 
                          group-hover:from-teal-500 group-hover:to-lol-blue transition-all duration-500" />
          {/* Parlak üst kenarlık */}
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
  );
}
