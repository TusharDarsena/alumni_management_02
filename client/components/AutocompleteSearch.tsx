import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

// Define the shape of a suggestion object from your API
interface Suggestion {
  name: string;
  avatar?: string;
  linkedin_id?: string;
  position?: string;
}

// Define the props for your component
interface AutocompleteSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  branch?: string | null;
}

// The API fetching function, kept separate for clarity
async function fetchAutocompleteSuggestions(query: string, branch: string | null | undefined) {
  if (query.length < 2) return []; // Don't fetch for very short queries
  
  const params = new URLSearchParams({ q: query });
  if (branch) params.set("branch", branch);

  const res = await fetch(`/api/alumni/autocomplete?${params.toString()}`);
  if (!res.ok) {
    throw new Error("Failed to fetch suggestions");
  }
  const data = await res.json();
  return data.data as Suggestion[];
}

export default function AutocompleteSearch({ value, onChange, onSelect, branch }: AutocompleteSearchProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [debouncedQuery, setDebouncedQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the search query to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(value);
    }, 300); // 300ms delay
    return () => clearTimeout(handler);
  }, [value]);

  // useQuery handles fetching, loading, errors, and caching automatically
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['autocomplete', debouncedQuery, branch], // This key triggers refetch on change
    queryFn: () => fetchAutocompleteSuggestions(debouncedQuery, branch),
    enabled: debouncedQuery.length > 1 && open, // Only fetch when needed
  });

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.name);
    onSelect(suggestion);
    setOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search Alumni"
        className="bg-transparent outline-none w-full text-gray-600 placeholder-gray-500"
      />
      {open && debouncedQuery.length > 1 && (
        <ul className="absolute z-50 mt-2 w-full bg-white border rounded-md shadow-lg max-h-64 overflow-auto">
          {isLoading && <li className="px-3 py-2 text-sm text-gray-500">Loading...</li>}
          {!isLoading && suggestions.length === 0 && <li className="px-3 py-2 text-sm text-gray-500">No results</li>}
          {suggestions.map((s, idx) => (
            <li
              key={s.linkedin_id || idx}
              className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 ${activeIndex === idx ? "bg-gray-100" : ""}`}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <img src={s.avatar || `https://placehold.co/40x40/E2E8F0/4A5568?text=${s.name[0]}`} className="w-8 h-8 rounded-full object-cover" alt={s.name} />
              <div>
                <span className="text-sm font-medium">{s.name}</span>
                <span className="block text-xs text-gray-500">{s.position}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
