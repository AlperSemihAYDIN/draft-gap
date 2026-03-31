// Ana uygulama bileşeni — Draft formu ve sonuç sayfası arasında geçiş yönetir

import { useState, useEffect } from 'react';
import { getChampions, getLatestVersion } from './services/dataDragon';
import { getRecommendations } from './services/recommendation';
import ChampionSearch from './components/ChampionSearch';
import RoleSelector from './components/RoleSelector';
import SelectedChampions from './components/SelectedChampions';
import ResultsPage from './components/ResultsPage';
import TierList from './components/TierList';
import WelcomeScreen from './components/WelcomeScreen';

export default function App() {
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
        setError('Şampiyon verisi yüklenirken hata oluştu. Lütfen sayfayı yenileyin.');
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
    const results = getRecommendations(enemyIds, allyIds, selectedRole);
    setRecommendations(results);
    setShowResults(true);
  }

  // Geri dön
  function handleBack() {
    setShowResults(false);
    setRecommendations(null);
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
          <p className="text-lol-light/60">Şampiyon verisi yükleniyor...</p>
        </div>
      </div>
    );
  }

  // --- HATA EKRANI ---
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-lol-gray/60 border border-lol-red/30 rounded-xl p-8 text-center max-w-md">
          <p className="text-lol-red text-lg mb-2">⚠️ Hata</p>
          <p className="text-lol-light/60 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-lol-blue/20 text-lol-blue rounded-lg hover:bg-lol-blue/30 
                       transition-colors text-sm"
          >
            Tekrar Dene
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
                Pro Play Draft Analizi • S16
              </p>
            </div>
          </div>

          {/* Versiyon badge */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-lol-light/30">
            <div className="w-2 h-2 rounded-full bg-green-500/60"></div>
            Data Dragon bağlı
          </div>
        </div>

        {/* Tab Navigasyon */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
          <button
            onClick={() => { setActiveTab('draft'); setShowResults(false); }}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === 'draft'
                ? 'bg-lol-dark text-lol-gold border-t border-x border-lol-gold/30'
                : 'text-lol-light/40 hover:text-lol-light/60 hover:bg-lol-dark/40'
            }`}
          >
            ⚔️ Pro Draft Analizi
          </button>
          <button
            onClick={() => setActiveTab('tierlist')}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
              activeTab === 'tierlist'
                ? 'bg-lol-dark text-lol-gold border-t border-x border-lol-gold/30'
                : 'text-lol-light/40 hover:text-lol-light/60 hover:bg-lol-dark/40'
            }`}
          >
            📊 Tier List
          </button>
        </div>
      </header>

      {/* Ana içerik */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'tierlist' ? (
          <div className="animate-fadeIn">
            <TierList />
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
            {/* Açıklama */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Pro <span className="text-lol-blue">Draft</span> Analizi
              </h2>
              <p className="text-lol-light/50 text-sm max-w-lg mx-auto">
                Rakip pick'lere göre en iyi counter'ı, en güvenli blind pick'i
                ve pro play'de en çok ban yiyen şampiyonları keşfet.
              </p>
            </div>

            {/* Rol seçimi */}
            <section className="space-y-3">
              <label className="block text-sm font-medium text-lol-gold">
                🎯 Rolünü Seç
              </label>
              <RoleSelector selectedRole={selectedRole} onSelect={setSelectedRole} />
            </section>

            {/* Rakip takım */}
            <section className="space-y-3 bg-lol-dark/40 border border-lol-light/5 rounded-xl p-4 sm:p-6">
              <label className="block text-sm font-medium text-lol-red">
                ⚔️ Rakip Takım
              </label>
              <ChampionSearch
                champions={champions}
                version={version}
                onSelect={addEnemy}
                placeholder="Rakip şampiyon ara... (1-5)"
                disabledIds={allSelectedIds}
              />
              <SelectedChampions
                champions={enemyChampions}
                version={version}
                onRemove={removeEnemy}
                label="Rakip Şampiyonlar"
                maxCount={5}
              />
            </section>

            {/* Takım arkadaşları */}
            <section className="space-y-3 bg-lol-dark/40 border border-lol-light/5 rounded-xl p-4 sm:p-6">
              <label className="block text-sm font-medium text-lol-blue">
                🤝 Takımın (Opsiyonel)
              </label>
              <ChampionSearch
                champions={champions}
                version={version}
                onSelect={addAlly}
                placeholder="Takım şampiyonu ara... (0-4)"
                disabledIds={allSelectedIds}
              />
              <SelectedChampions
                champions={allyChampions}
                version={version}
                onRemove={removeAlly}
                label="Takım Şampiyonları"
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
                🔍 Şampiyon Öner
              </button>
            </div>

            {/* Yardım notu */}
            <p className="text-center text-lol-light/25 text-xs">
              En az bir rol seçerek öneri alabilirsiniz. Rakip ve takım bilgisi daha iyi sonuçlar verir.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-lol-light/5 mt-16">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-lol-light/20 text-xs">
          DraftGap — Pro play verileri gol.gg kaynaklıdır. Riot Games ile bağlantılı değildir.
        </div>
      </footer>
    </div>
  );
}
