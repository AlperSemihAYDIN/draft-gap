import { useState } from 'react';
import { useDraftContext } from '../contexts/DraftContext';
import { useLanguage } from '../i18n/LanguageContext';

const ROLES = ['top', 'jungle', 'mid', 'adc', 'support'];
const ROLE_EMOJIS = {
  top: '🏔️',
  jungle: '🌿',
  mid: '⚡',
  adc: '🏹',
  support: '🛡️',
};

export default function DraftModeSelector() {
  const { t } = useLanguage();
  const { draftMode, setDraftMode, userRole, setUserRole, userTeam, setUserTeam } = useDraftContext();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-lol-dark/60 border border-lol-light/10 rounded-xl p-6 space-y-6">
      <h3 className="text-lg font-bold text-lol-gold">⚙️ Draft AI Ayarları</h3>

      {/* Mode Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-lol-light/70">Çalışma Modu</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setDraftMode('soloq')}
            className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              draftMode === 'soloq'
                ? 'bg-lol-blue text-lol-dark'
                : 'bg-lol-dark/40 text-lol-light/60 hover:text-lol-light'
            }`}
          >
            🎮 SoloQ
            <p className="text-xs opacity-70 mt-1">Kişisel carry odaklı</p>
          </button>
          <button
            onClick={() => setDraftMode('pro')}
            className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
              draftMode === 'pro'
                ? 'bg-lol-blue text-lol-dark'
                : 'bg-lol-dark/40 text-lol-light/60 hover:text-lol-light'
            }`}
          >
            🏆 Pro Arena
            <p className="text-xs opacity-70 mt-1">Takım sinerji odaklı</p>
          </button>
        </div>
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-lol-light/70">Sizin Koridor</label>
        <div className="grid grid-cols-5 gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => setUserRole(role)}
              className={`px-3 py-2 rounded-lg font-medium transition-all text-sm ${
                userRole === role
                  ? 'bg-lol-gold text-lol-dark'
                  : 'bg-lol-dark/40 text-lol-light/60 hover:text-lol-light'
              }`}
              title={role}
            >
              {ROLE_EMOJIS[role]}
            </button>
          ))}
        </div>
      </div>

      {/* Team Side */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-lol-light/70">Takım Tarafı</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setUserTeam('blue')}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              userTeam === 'blue'
                ? 'bg-blue-500 text-white'
                : 'bg-lol-dark/40 text-lol-light/60 hover:text-lol-light'
            }`}
          >
            🔵 Mavi
          </button>
          <button
            onClick={() => setUserTeam('red')}
            className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
              userTeam === 'red'
                ? 'bg-red-500 text-white'
                : 'bg-lol-dark/40 text-lol-light/60 hover:text-lol-light'
            }`}
          >
            🔴 Kırmızı
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-lol-blue/10 border border-lol-blue/20 rounded-lg p-3 text-xs text-lol-light/60">
        <p className="mb-1">💡 {draftMode === 'soloq' ? 'SoloQ modunda' : 'Pro Arena modunda'}</p>
        <p>
          {draftMode === 'soloq'
            ? 'Sizin kazanma şansını maksimize edecek seçimler önerilecektir. Takım arkadaşlarının hataları varsayılır.'
            : 'Tüm takımın toplam kazanma şansını maksimize edecek stratejiler önerilecektir.'}
        </p>
      </div>
    </div>
  );
}
