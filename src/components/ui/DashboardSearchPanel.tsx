import { useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react';

type SearchMode = 'buy' | 'rent' | 'new-launch' | 'commercial' | 'plots-land';

interface DashboardSearchPanelProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onSearchSubmit?: () => void;
  onOpenFilters: () => void;
  onPostProperty: () => void;
  activeMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  listingLabel: string;
  listingOptions: readonly string[];
  onListingSelect: (value: string) => void;
  searchPlaceholder?: string;
}

const searchTabs: Array<{
  id: SearchMode;
  label: string;
  highlight?: boolean;
}> = [
  { id: 'buy', label: 'Buy' },
  { id: 'rent', label: 'Rent' },
  { id: 'new-launch', label: 'New Launch', highlight: true },
  { id: 'commercial', label: 'Commercial' },
  { id: 'plots-land', label: 'Plots/Land' },
];

const DashboardSearchPanel = ({
  searchQuery,
  onSearchQueryChange,
  onSearchSubmit,
  onOpenFilters,
  onPostProperty,
  activeMode,
  onModeChange,
  listingLabel,
  listingOptions,
  onListingSelect,
  searchPlaceholder = 'Search upto 3 localities or landmarks',
}: DashboardSearchPanelProps) => {
  const [showListingOptions, setShowListingOptions] = useState(false);

  return (
    <div className="relative overflow-visible rounded-[32px] text-slate-900 shadow-[0_26px_60px_rgba(15,23,42,0.18)]">
      <div className="rounded-[32px] bg-white">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
            {searchTabs.map((tab) => {
              const isActive = tab.id === activeMode;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onModeChange(tab.id)}
                  className={`relative rounded-2xl px-3 py-2 text-sm font-semibold transition-colors sm:px-4 sm:text-base ${
                    isActive ? 'text-slate-950' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.highlight && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  )}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[18px] hidden h-1 rounded-full bg-blue-600 sm:block" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden h-14 w-px bg-slate-200 lg:block" />

          <button
            type="button"
            onClick={onPostProperty}
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 sm:px-4 sm:text-base"
          >
            <span>Post Property</span>
            <span className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white">
              Free to Post
            </span>
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSearchSubmit?.();
          }}
          className="grid gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:grid-cols-[240px_minmax(0,1fr)_64px_132px] lg:items-center"
        >
          <div className="self-start">
            <button
              type="button"
              onClick={() => setShowListingOptions((previous) => !previous)}
              className="flex h-16 w-full items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-5 text-left text-base font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-100"
            >
              <span>{listingLabel}</span>
              <ChevronDown className="h-5 w-5 text-slate-500" />
            </button>

            {showListingOptions && (
              <div className="mt-3 max-h-72 w-full overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_20px_48px_rgba(15,23,42,0.14)]">
                {listingOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onListingSelect(option);
                      setShowListingOptions(false);
                    }}
                    className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                      option === listingLabel
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>

          <label className="relative block">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-16 w-full rounded-[22px] border border-slate-200 bg-white pr-5 pl-14 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <button
            type="button"
            onClick={onOpenFilters}
            className="flex h-16 w-16 items-center justify-center justify-self-start rounded-full bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100"
          >
            <SlidersHorizontal className="h-6 w-6" />
          </button>

          <button
            type="submit"
            className="inline-flex h-16 items-center justify-center rounded-[18px] bg-blue-600 px-6 text-lg font-semibold text-white shadow-[0_16px_32px_rgba(37,99,235,0.24)] transition-colors hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
};

export type { SearchMode };
export default DashboardSearchPanel;
