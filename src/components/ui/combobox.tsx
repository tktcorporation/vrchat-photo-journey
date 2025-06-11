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
        className="flex h-full w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0 flex items-center justify-center hover:bg-muted/40 rounded transition-colors z-10"
          onClick={onClear}
          aria-label="検索をクリア"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none animate-in">
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="py-6 text-center text-sm">Loading...</div>
            ) : options.length === 0 ? (
              <div className="py-6 text-center text-sm">{emptyText}</div>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.value}
                  className={cn(
                    'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    index === highlightedIndex &&
                      'bg-accent text-accent-foreground',
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
                      'mr-2 h-4 w-4',
                      index === highlightedIndex ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {option.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
