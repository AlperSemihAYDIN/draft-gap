// Bağış butonu — Türkiye'de çalışan ödeme yöntemleri
import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

// =============================================
// Papara numaranı veya IBAN'ını buraya gir
// =============================================
const PAPARA_NO = '';       // örn: '1234567890'
const IBAN = '';            // örn: 'TR12 0006 2000 1234 0006 2993 26'
const ACCOUNT_NAME = 'DraftGap';
// =============================================

export default function DonateButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(null);
  const ref = useRef(null);

  // Dışarı tıklayınca kapat
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-lol-gold/10 border border-lol-gold/20 text-lol-gold
                   hover:bg-lol-gold/20 transition-colors text-xs font-medium"
      >
        ☕ {t('donate')}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-lol-gray border border-lol-light/10
                        rounded-xl shadow-2xl shadow-black/60 p-4 space-y-3 z-50">
          <p className="text-white font-medium text-sm">{t('donateTitle')}</p>
          <p className="text-lol-light/50 text-xs leading-relaxed">{t('donateDesc')}</p>

          {/* Papara */}
          {PAPARA_NO && (
            <div className="bg-lol-dark/60 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">💳</span>
                <span className="text-lol-gold text-xs font-semibold">Papara</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-mono text-xs">{PAPARA_NO}</span>
                <button
                  onClick={() => copyToClipboard(PAPARA_NO, 'papara')}
                  className="text-lol-blue text-xs hover:text-lol-blue/70 transition-colors whitespace-nowrap"
                >
                  {copied === 'papara' ? '✓ Kopyalandı' : t('donateCopy')}
                </button>
              </div>
            </div>
          )}

          {/* IBAN */}
          {IBAN && (
            <div className="bg-lol-dark/60 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🏦</span>
                <span className="text-lol-gold text-xs font-semibold">Banka Transferi (IBAN)</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-mono text-[10px] break-all">{IBAN}</span>
                  <button
                    onClick={() => copyToClipboard(IBAN, 'iban')}
                    className="text-lol-blue text-xs hover:text-lol-blue/70 transition-colors whitespace-nowrap"
                  >
                    {copied === 'iban' ? '✓ Kopyalandı' : t('donateCopy')}
                  </button>
                </div>
                <p className="text-lol-light/40 text-[10px]">{ACCOUNT_NAME}</p>
              </div>
            </div>
          )}

          {/* Henüz eklenmemiş */}
          {!PAPARA_NO && !IBAN && (
            <div className="bg-lol-dark/40 rounded-lg p-3 text-center">
              <p className="text-lol-light/40 text-xs">{t('donateSoon')}</p>
            </div>
          )}

          <p className="text-lol-light/30 text-[10px] text-center">{t('donateThank')}</p>
        </div>
      )}
    </div>
  );
}
