import { useState, useRef, useEffect } from 'react';
import { useLanguage, LANGUAGES } from '../i18n/LanguageContext';

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                   bg-lol-gray/60 border border-lol-light/10 text-lol-light/70
                   hover:border-lol-gold/40 hover:text-lol-light transition-all"
      >
        <span className="text-sm">{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-lol-gray border border-lol-light/20 
                        rounded-lg shadow-xl shadow-black/40 overflow-hidden z-50 min-w-[140px]">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors
                ${lang === l.code
                  ? 'bg-lol-gold/15 text-lol-gold'
                  : 'text-lol-light/70 hover:bg-lol-light/5 hover:text-white'
                }`}
            >
              <span className="text-sm">{l.flag}</span>
              <span>{l.label}</span>
              {lang === l.code && (
                <svg className="w-3 h-3 ml-auto text-lol-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
