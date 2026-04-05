// Ana uygulama bileşeni — Draft formu ve sonuç sayfası arasında geçiş yönetir

import { useState, useEffect } from 'react';
import { getChampions, getLatestVersion } from './services/dataDragon';
import { getRecommendations } from './services/recommendation';
import ChampionSearch from './components/ChampionSearch';
import RoleSelector from './components/RoleSelector';
import SelectedChampions from './components/SelectedChampions';
import ResultsPage from './components/ResultsPage';
import TierList from './components/TierList';
import BlindPickList from './components/BlindPickList';
import CounterPick from './components/CounterPick';
import ProCoach from './components/ProCoach';
import WelcomeScreen from './components/WelcomeScreen';
import LanguageSelector from './components/LanguageSelector';
import AnalyticsPanel from './components/AnalyticsPanel';
import LiveGameDetector from './components/LiveGameDetector';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { t } = useLanguage();

  // Data Dragon verisi
  const [champions, setChampions] = useState({});
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Draft form durumu
  const [enemyChampions, setEnemyChampions] = useState([]);
  const [allyChampions, setAllyChampions] = useState([]);
  const [selectedRole, setSelectedRole] = useState('mid');

  // Sonuç durumu
  const [recommendations, setRecommendations] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Tab durumu
  const [activeTab, setActiveTab] = useState('draft');

  // Karşılama ekranı durumu
  const [showWelcome, setShowWelcome] = useState(true);

  // Uygulama başladığında şampiyon verisini çek
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [v, champs] = await Promise.all([
          getLatestVersion(),
          getChampions(),
        ]);
        setVersion(v);
        setChampions(champs);
      } catch (err) {
        setError('error');
        console.error('Data Dragon yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Rakip şampiyon ekleme / çıkarma
  function addEnemy(champ) {
    if (enemyChampions.length >= 5) return;
    if (enemyChampions.find((c) => c.id === champ.id)) return;
    setEnemyChampions([...enemyChampions, champ]);
  }

  function removeEnemy(champId) {
    setEnemyChampions(enemyChampions.filter((c) => c.id !== champId));
  }

  // Takım şampiyon ekleme / çıkarma
  function addAlly(champ) {
    if (allyChampions.length >= 4) return;
    if (allyChampions.find((c) => c.id === champ.id)) return;
    setAllyChampions([...allyChampions, champ]);
  }

  function removeAlly(champId) {
    setAllyChampions(allyChampions.filter((c) => c.id !== champId));
  }

  // Tüm seçilmiş şampiyon ID'leri (aramada devre dışı bırakmak için)
  const allSelectedIds = [
    ...enemyChampions.map((c) => c.id),
    ...allyChampions.map((c) => c.id),
  ];

  // Öneri hesapla ve sonuç sayfasına geç
  function handleGetRecommendations() {
    const enemyIds = enemyChampions.map((c) => c.id);
    const allyIds = allyChampions.map((c) => c.id);
    const results = getRecommendations(enemyIds, allyIds, selectedRole, t);
    setRecommendations(results);
    setShowResults(true);
  }

  // Geri dön
  function handleBack() {
    setShowResults(false);
    setRecommendations(null);
  }

  // Canlı oyundan draft al
  function handleGameDetected({ enemies, allies }) {
    setEnemyChampions(enemies.slice(0, 5));
    setAllyChampions(allies.slice(0, 4));
  }

  // Form geçerli mi kontrol et (en az 1 rakip veya role seçilmiş olmalı)
  const isFormValid = selectedRole && (enemyChampions.length > 0 || allyChampions.length > 0 || selectedRole);

  // --- YÜKLEME EKRANI ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 animate-fadeIn">
          <div className="w-16 h-16 border-4 border-lol-blue/30 border-t-lol-blue rounded-full 
                          animate-spin mx-auto" />
          <p className="text-lol-light/60">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // --- HATA EKRANI ---
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-lol-gray/60 border border-lol-red/30 rounded-xl p-8 text-center max-w-md">
          <p className="text-lol-red text-lg mb-2">{t('errorTitle')}</p>
          <p className="text-lol-light/60 text-sm">{t('errorMsg')}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-lol-blue/20 text-lol-blue rounded-lg hover:bg-lol-blue/30 
                       transition-colors text-sm"
          >
            {t('errorRetry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Karşılama Ekranı */}
      {showWelcome && <WelcomeScreen onEnter={() => setShowWelcome(false)} />}

      {/* Header */}
      <header className="border-b border-lol-light/10 bg-lol-dark/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-lol-blue/20 rounded-lg flex items-center justify-center">
              <span className="text-lol-gold font-bold text-lg">DG</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                DraftGap
              </h1>
              <p className="text-lol-light/40 text-xs">
                {t('headerSubtitle')}
              </p>
            </div>
          </div>

          {/* Versiyon badge */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <div className="hidden sm:flex items-center gap-2 text-xs text-lol-light/30">
              <div className="w-2 h-2 rounded-full bg-green-500/60"></div>
              {t('headerConnected')}
            </div>
          </div>
        </div>

        {/* Tab Navigasyon */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          <button
            onClick={() => { setActiveTab('draft'); setShowResults(false); }}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'draft'
                ? 'bg-lol-dark text-lol-gold border-t border-x border-lol-gold/30'
                : 'text-lol-light/40 hover:text-lol-light/60 hover:bg-lol-dark/40'
            }`}
          >
            {t('tabDraft')}
          </button>
          <button
            onClick={() => setActiveTab('tierlist')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'tierlist'
                ? 'bg-lol-dark text-lol-gold border-t border-x border-lol-gold/30'
                : 'text-lol-light/40 hover:text-lol-light/60 hover:bg-lol-dark/40'
            }`}
          >
            {t('tabTierList')}
          </button>
          <button
            onClick={() => setActiveTab('blindpick')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'blindpick'
                ? 'bg-lol-dark text-lol-gold border-t border-x border-lol-gold/30'
                : 'text-lol-light/40 hover:text-lol-light/60 hover:bg-lol-dark/40'
            }`}
          >
            {t('tabBlindPick')}
          </button>
          <button
            onClick={() => setActiveTab('counterpick')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'counterpick'
                ? 'bg-lol-dark text-lol-gold border-t border-x border-lol-gold/30'
                : 'text-lol-light/40 hover:text-lol-light/60 hover:bg-lol-dark/40'
            }`}
          >
            {t('tabCounterPick')}
          </button>
          <button
            onClick={() => setActiveTab('procoach')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
              activeTab === 'procoach'
                ? 'bg-lol-dark text-lol-gold border-t border-x border-lol-gold/30'
                : 'text-lol-light/40 hover:text-lol-light/60 hover:bg-lol-dark/40'
            }`}
          >
            {t('tabProCoach')}
          </button>
        </div>
      </header>

      {/* Ana içerik */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'tierlist' ? (
          <div className="animate-fadeIn">
            <TierList />
          </div>
        ) : activeTab === 'blindpick' ? (
          <div className="animate-fadeIn">
            <BlindPickList />
          </div>
        ) : activeTab === 'counterpick' ? (
          <div className="animate-fadeIn">
            <CounterPick />
          </div>
        ) : activeTab === 'procoach' ? (
          <div className="animate-fadeIn">
            <ProCoach />
          </div>
        ) : showResults && recommendations ? (
          // --- SONUÇ SAYFASI ---
          <ResultsPage
            recommendations={recommendations}
            version={version}
            selectedRole={selectedRole}
            enemyChampions={enemyChampions}
            allyChampions={allyChampions}
            onBack={handleBack}
          />
        ) : (
          // --- DRAFT FORMU ---
          <div className="space-y-8 animate-fadeIn">
            {/* Canlı Oyun Tespiti */}
            <LiveGameDetector champions={champions} onGameDetected={handleGameDetected} />

            {/* Açıklama */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {t('draftTitle1')}<span className="text-lol-blue">{t('draftTitle2')}</span>{t('draftTitle3')}
              </h2>
              <p className="text-lol-light/50 text-sm max-w-lg mx-auto">
                {t('draftDesc')}
              </p>
            </div>

            {/* Rol seçimi */}
            <section className="space-y-3">
              <label className="block text-sm font-medium text-lol-gold">
                {t('selectRole')}
              </label>
              <RoleSelector selectedRole={selectedRole} onSelect={setSelectedRole} />
            </section>

            {/* Rakip takım */}
            <section className="space-y-3 bg-lol-dark/40 border border-lol-light/5 rounded-xl p-4 sm:p-6">
              <label className="block text-sm font-medium text-lol-red">
                {t('enemyTeam')}
              </label>
              <ChampionSearch
                champions={champions}
                version={version}
                onSelect={addEnemy}
                placeholder={t('enemyPlaceholder')}
                disabledIds={allSelectedIds}
              />
              <SelectedChampions
                champions={enemyChampions}
                version={version}
                onRemove={removeEnemy}
                label={t('enemyLabel')}
                maxCount={5}
              />
            </section>

            {/* Takım arkadaşları */}
            <section className="space-y-3 bg-lol-dark/40 border border-lol-light/5 rounded-xl p-4 sm:p-6">
              <label className="block text-sm font-medium text-lol-blue">
                {t('allyTeam')}
              </label>
              <ChampionSearch
                champions={champions}
                version={version}
                onSelect={addAlly}
                placeholder={t('allyPlaceholder')}
                disabledIds={allSelectedIds}
              />
              <SelectedChampions
                champions={allyChampions}
                version={version}
                onRemove={removeAlly}
                label={t('allyLabel')}
                maxCount={4}
              />
            </section>

            {/* Öneri butonu */}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleGetRecommendations}
                disabled={!isFormValid}
                className={`px-8 py-4 rounded-xl font-bold text-lg transition-all
                  ${
                    isFormValid
                      ? 'bg-gradient-to-r from-lol-blue to-teal-500 text-lol-dark hover:shadow-lg hover:shadow-lol-blue/30 hover:scale-105 animate-pulseGlow'
                      : 'bg-lol-gray/40 text-lol-light/30 cursor-not-allowed'
                  }`}
              >
                {t('recommend')}
              </button>
            </div>

            {/* Yardım notu */}
            <p className="text-center text-lol-light/25 text-xs">
              {t('draftHelp')}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-lol-light/5 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-lol-light/20 text-xs">
          <span>{t('footer')}</span>
          <a
            href="https://ko-fi.com/draftgap"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF5E5B]/10 border border-[#FF5E5B]/20
                       text-[#FF5E5B] hover:bg-[#FF5E5B]/20 transition-colors text-xs font-medium"
          >
            ☕ {t('donate')}
          </a>
        </div>
      </footer>

      {/* Analytics Panel */}
      <AnalyticsPanel />
    </div>
  );
}
