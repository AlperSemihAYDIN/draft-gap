// Şampiyon Arama bileşeni — Otomatik tamamlama destekli arama kutusu

import { useState, useRef, useEffect } from 'react';

export default function ChampionSearch({
  champions,      // Data Dragon'dan gelen şampiyon listesi { id, name, image }
  version,        // Data Dragon versiyonu (ikon URL'leri için)
  onSelect,       // Şampiyon seçildiğinde çağrılan callback
  placeholder,    // Arama kutusu placeholder metni
  disabledIds,    // Zaten seçilmiş şampiyon ID'leri (tekrar seçilemesin)
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Arama sonuçlarını filtrele
  const filtered = query.length > 0
    ? Object.values(champions).filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      }).slice(0, 8) // Maksimum 8 sonuç göster
    : [];

  // Dışarı tıklandığında dropdown'u kapat
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Klavye navigasyonu
  function handleKeyDown(e) {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[highlightIndex];
      if (selected && !disabledIds.includes(selected.id)) {
        handleSelect(selected);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  // Şampiyon seçimi
  function handleSelect(champion) {
    onSelect(champion);
    setQuery('');
    setIsOpen(false);
    setHighlightIndex(0);
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Arama input'u */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(0);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Şampiyon ara...'}
          className="w-full bg-lol-gray/80 border border-lol-light/20 rounded-lg px-4 py-3 
                     text-white placeholder-lol-light/50 focus:outline-none focus:border-lol-blue/60 
                     focus:ring-1 focus:ring-lol-blue/30 transition-all"
          autoComplete="off"
        />
        {/* Arama ikonu */}
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-lol-light/40"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Otomatik tamamlama dropdown'u */}
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-lol-gray border border-lol-light/20 
                       rounded-lg shadow-2xl max-h-64 overflow-y-auto">
          {filtered.map((champ, index) => {
            const isDisabled = disabledIds.includes(champ.id);
            return (
              <li
                key={champ.id}
                onClick={() => !isDisabled && handleSelect(champ)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                  ${index === highlightIndex ? 'bg-lol-blue/20' : 'hover:bg-lol-light/10'}
                  ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}
                `}
              >
                {/* Şampiyon ikonu */}
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image}`}
                  alt={champ.name}
                  className="w-8 h-8 rounded"
                  loading="lazy"
                />
                <div className="flex flex-col">
                  <span className="text-white text-sm font-medium">{champ.name}</span>
                  <span className="text-lol-light/50 text-xs">{champ.title}</span>
                </div>
                {isDisabled && (
                  <span className="ml-auto text-xs text-lol-red">Seçildi</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Sonuç bulunamazsa */}
      {isOpen && query.length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-lol-gray border border-lol-light/20 
                        rounded-lg shadow-2xl p-4 text-center text-lol-light/50 text-sm">
          Şampiyon bulunamadı
        </div>
      )}
    </div>
  );
}
