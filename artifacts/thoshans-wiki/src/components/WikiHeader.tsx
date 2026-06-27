import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { searchArticles } from '../lib/articleLoader';
import type { ArticleIndexEntry } from '../types/article';

interface WikiHeaderProps {
  onMenuClick: () => void;
}

export default function WikiHeader({ onMenuClick }: WikiHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ArticleIndexEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    let cancelled = false;
    searchArticles(query).then((results) => {
      if (!cancelled) {
        setSuggestions(results.slice(0, 8));
        setShowSuggestions(true);
        setActiveIdx(-1);
      }
    });
    return () => { cancelled = true; };
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        navigate(suggestions[activeIdx].slug);
      } else if (query.trim()) {
        setLocation(`/wiki/search?q=${encodeURIComponent(query)}`);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function navigate(slug: string) {
    setLocation(`/wiki/${slug}`);
    setQuery('');
    setShowSuggestions(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/wiki/search?q=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="flex items-center gap-2 px-3 py-2 max-w-[1400px] mx-auto">
        <button
          data-testid="button-hamburger"
          onClick={onMenuClick}
          className="p-1.5 hover:bg-card rounded"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <Link href="/" data-testid="link-wordmark" className="flex items-center gap-1 shrink-0">
          <span className="font-serif font-bold text-lg tracking-wide text-foreground">Thoshan's Wiki</span>
        </Link>

        <div ref={searchRef} className="flex-1 relative mx-2 max-w-xl">
          <form onSubmit={handleSubmit} className="flex">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                data-testid="input-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                placeholder="Search Thoshan's Wiki"
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-border bg-background focus:outline-none focus:border-accent rounded-l"
              />
            </div>
            <button
              data-testid="button-search-submit"
              type="submit"
              className="px-3 py-1.5 text-sm border border-l-0 border-border bg-card hover:bg-border/30 rounded-r"
            >
              Search
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-background border border-border shadow-md z-50 mt-0.5">
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  data-testid={`suggestion-item-${s.id}`}
                  onClick={() => navigate(s.slug)}
                  className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-card ${i === activeIdx ? 'bg-card' : ''}`}
                >
                  <Search size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground flex-1">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{s.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-2 text-sm text-foreground shrink-0">
          <a href="https://github.com/lingadevaru-hp" target="_blank" rel="noreferrer" className="hover:text-accent px-2 py-1 hover:bg-card rounded text-xs">GitHub</a>
          <a href="https://linkedin.com/in/lingadevaruhp" target="_blank" rel="noreferrer" className="hover:text-accent px-2 py-1 hover:bg-card rounded text-xs">LinkedIn</a>
          <a href="https://huggingface.co/lingadevaruhp" target="_blank" rel="noreferrer" className="hover:text-accent px-2 py-1 hover:bg-card rounded text-xs">🤗 HF</a>
        </nav>

        <button
          data-testid="button-theme-toggle"
          onClick={toggleTheme}
          className="p-1.5 hover:bg-card rounded ml-1 shrink-0"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
