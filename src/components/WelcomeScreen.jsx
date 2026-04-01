import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

const CHOVY_IMAGE = 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/5f/GenG_Cup2026.jpg/revision/latest?cb=20260114084721';
const CHOVY_FALLBACK = 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/3/36/GenG_Cup2025.jpg/revision/latest?cb=20250116164410';

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
        {/* Üst ve alt altın çizgi */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lol-gold/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lol-gold/30 to-transparent" />
      </div>

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

        {/* Gen.G Takım Kutlama Fotoğrafı */}
        <div className="relative mb-8 group w-full max-w-md">
          {/* Glow efekti */}
          <div className="absolute -inset-4 bg-lol-gold/10 rounded-2xl blur-2xl opacity-60" />
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-b from-lol-gold/40 via-lol-gold/20 to-transparent" />
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-lol-gold/50 shadow-2xl shadow-lol-gold/20">
            <img
              src={CHOVY_IMAGE}
              alt="Gen.G — LCK Champions"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                if (e.target.src !== CHOVY_FALLBACK) {
                  e.target.src = CHOVY_FALLBACK;
                } else {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div class="w-full h-full bg-lol-gray flex items-center justify-center">
                      <span class="text-4xl font-bold text-lol-gold">GEN.G</span>
                    </div>
                  `;
                }
              }}
              loading="eager"
            />
          </div>
          {/* İsim plakası */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-lol-dark border border-lol-gold/40 rounded-full px-5 py-1 shadow-lg">
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
