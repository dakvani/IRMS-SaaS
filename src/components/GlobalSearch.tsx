import { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Briefcase, Package, Truck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  type: string;
  title: string;
  subtitle: string;
  id: number;
  photo?: string;
  url: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const token = (window as any)._token;
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Employee': return <Users className="w-4 h-4 text-blue-500" />;
      case 'Project': return <Briefcase className="w-4 h-4 text-purple-500" />;
      case 'Vehicle': return <Truck className="w-4 h-4 text-green-500" />;
      case 'Asset': return <Package className="w-4 h-4 text-amber-500" />;
      default: return <Search className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md ml-4 mr-auto hidden md:block">
      <div 
        className={`flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-full px-4 py-2 border ${isOpen ? 'border-neutral-300 ring-2 ring-neutral-200' : 'border-transparent'}`}
      >
        <Search className="w-4 h-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Search employees, assets, projects..."
          className="bg-transparent border-none outline-none w-full text-sm text-neutral-900 placeholder:text-neutral-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden z-50">
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center p-8 text-neutral-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : results.length > 0 ? (
              <div className="flex flex-col">
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}-${i}`}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery('');
                      navigate(r.url);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      {r.photo ? (
                        <img src={r.photo} alt={r.title} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        getIcon(r.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-sm">
                          {r.type}
                        </span>
                        <span className="text-xs text-neutral-500 truncate">{r.subtitle}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-medium text-neutral-900">No results found</p>
                <p className="text-xs text-neutral-500 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
