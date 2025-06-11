import { Check, X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelect: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Combobox component with direct input functionality
 * User can type directly in the input field and see suggestions
 */
export function Combobox({
  options,
  searchQuery,
  onSearchChange,
  onSelect,
  onClear,
  placeholder = 'Search...',
  emptyText = 'No results found.',
  className,
  disabled = false,
  loading = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isJustSelected, setIsJustSelected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show dropdown when there's a query and options, but not immediately after selection
  useEffect(() => {
    if (isJustSelected) {
      setOpen(false);
      return;
    }
    setOpen(searchQuery.length > 0 && (options.length > 0 || loading));
    setHighlightedIndex(-1);
  }, [searchQuery, options.length, loading, isJustSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsJustSelected(false); // 手動入力時はフラグをリセット
    onSearchChange(e.target.value);
  };

  // ブラウザ標準の検索クリア（×ボタン）にも対応
  const handleInputInput = (e: React.FormEvent<HTMLInputElement>) => {
    setIsJustSelected(false); // 手動入力時はフラグをリセット
    const target = e.target as HTMLInputElement;
    onSearchChange(target.value);
  };

  const handleSelect = (selectedValue: string) => {
    const option = options.find((opt) => opt.value === selectedValue);
    if (option) {
      // Extract the actual search term (remove prefix)
      const actualValue = selectedValue.replace(/^(world|player):/, '');
      setIsJustSelected(true); // 選択完了フラグを設定
      onSearchChange(actualValue);
      onSelect(actualValue);
    }
    setOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < options.length - 1 ? prev + 1 : prev,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleInputFocus = () => {
    if (
      !isJustSelected &&
      searchQuery.length > 0 &&
      (options.length > 0 || loading)
    ) {
      setOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for option clicks
    setTimeout(() => {
      setOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="search"
        className="flex h-full w-full rounded-2xl border-0 bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl px-4 py-2 text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:bg-white/80 dark:focus-visible:bg-gray-900/60 focus-visible:shadow-lg focus-visible:shadow-primary/10 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-500 ease-out hover:bg-white/70 dark:hover:bg-gray-900/50 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-white/5"
        placeholder={placeholder}
        value={searchQuery}
        onChange={handleInputChange}
        onInput={handleInputInput}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        disabled={disabled}
        autoComplete="off"
      />

      {/* カスタムクリアボタン（必要な場合のみ） */}
      {searchQuery && onClear && (
        <button
          type="button"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 flex items-center justify-center hover:bg-muted/40 rounded-full transition-colors z-10"
          onClick={onClear}
          aria-label="検索をクリア"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {open && (
        <div className="absolute top-full z-50 mt-3 w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl rounded-2xl border-0 p-3 shadow-2xl shadow-black/10 dark:shadow-black/30 outline-none animate-in">
          <div className="max-h-60 overflow-auto scrollbar-hide">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground/80 font-medium">
                検索中...
              </div>
            ) : options.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground/80 font-medium">
                {emptyText}
              </div>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors duration-150 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    index === highlightedIndex
                      ? 'bg-primary/10 dark:bg-primary/20'
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50',
                  )}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  tabIndex={0}
                >
                  <Check
                    className={cn(
                      'mr-3 h-4 w-4 text-primary transition-opacity duration-200',
                      index === highlightedIndex ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex-1 text-gray-900 dark:text-gray-100">
                    {option.label}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
