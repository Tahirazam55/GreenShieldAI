import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlaceSearchBar({ placeholder = 'Search place in KP (e.g. Kalam, Kumrat, Kaghan)...', className = '' }) {
  const { searchAndSelectPlace } = useAppStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await resp.json();
      if (data?.results && data.results.length > 0) {
        setSuggestions(data.results);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 350);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    const displayName = item.name.split(',')[0].trim();
    setQuery(displayName);
    setIsOpen(false);
    toast.success(`Analyzing ${displayName} (~10x10 km AOI)...`);
    searchAndSelectPlace(item);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    } else if (query.trim()) {
      fetchSuggestions(query);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="w-4 h-4 text-guardian-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-forest-dark border border-forest-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-guardian-500 font-medium transition-colors"
        />
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-guardian-400 animate-spin absolute right-3" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-white absolute right-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </form>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-forest-card/95 backdrop-blur-md border border-forest-border rounded-xl shadow-2xl z-[1500] max-h-56 overflow-y-auto divide-y divide-forest-border/60">
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item)}
              className="w-full p-2.5 text-left text-xs hover:bg-forest-dark flex items-start gap-2 transition-colors text-slate-200"
            >
              <MapPin className="w-3.5 h-3.5 text-guardian-400 shrink-0 mt-0.5" />
              <div className="truncate">
                <span className="font-bold text-white block truncate">{item.name.split(',')[0]}</span>
                <span className="text-[10px] text-slate-400 block truncate">{item.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
