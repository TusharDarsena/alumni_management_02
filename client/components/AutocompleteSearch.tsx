import React, { useEffect, useRef, useState } from "react";

interface Suggestion {
  name: string;
  avatar?: string;
  linkedin_id?: string;
  position?: string;
  current_company?: string | null;
}

export default function AutocompleteSearch({
  value,
  onChange,
  onSelect,
  branch,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: Suggestion) => void;
  branch?: string | null;
}) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setQuery(value || ""), [value]);

  useEffect(() => {
    // debounce 300ms
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query || query.trim().length === 0) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(() => {
      // cancel previous
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const params = new URLSearchParams();
      params.set("q", query);
      if (branch) params.set("branch", branch);
      fetch(`/api/alumni/autocomplete?${params.toString()}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.data) {
            setSuggestions(data.data as Suggestion[]);
            setOpen(true);
            setActiveIndex(-1);
          } else {
            setSuggestions([]);
            setOpen(false);
          }
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          console.error("Autocomplete fetch error", err);
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, branch]);

  const handleInput = (v: string) => {
    setQuery(v);
    onChange(v);
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(s.name);
    onChange(s.name);
    setOpen(false);
    if (onSelect) onSelect(s);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        handleSelect(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" style={{ width: 406 }}>
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open}
        aria-controls="autocomplete-listbox"
        aria-autocomplete="list"
        className="bg-transparent outline-none text-gray-600 placeholder-gray-500 flex-1"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        placeholder="Search Alumni"
      />

      {open && (
        <ul
          id="autocomplete-listbox"
          role="listbox"
          className="absolute z-50 mt-2 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-auto"
        >
          {loading && <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>}
          {!loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No results</li>
          )}
          {!loading && suggestions.map((s, idx) => (
            <li
              key={s.linkedin_id || s.name + idx}
              role="option"
              aria-selected={activeIndex === idx}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${activeIndex === idx ? 'bg-gray-100' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <img src={s.avatar || '/placeholder.svg'} className="w-8 h-8 rounded-full object-cover" alt="" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{s.name}</span>
                <span className="text-xs text-gray-500">{s.position || s.current_company || ''}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
