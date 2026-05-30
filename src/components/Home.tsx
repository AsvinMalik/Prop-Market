import { useState } from 'react';
import {
  Building2,
  Compass,
  LogIn,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HARYANA_CITY_OPTIONS } from '../constants/haryanaCities';
import { sortPropertiesByTrust } from '../utils/propertyRanking';
import PropertyCard from './PropertyCard';
import Button from './ui/Button';
import Card from './ui/Card';
import DisclaimerTicker from './ui/DisclaimerTicker';
import DashboardSearchPanel, { SearchMode } from './ui/DashboardSearchPanel';

const categories = ['All', 'Agricultural', 'Residential', 'Commercial'];
const GUEST_SEARCH_LIMIT = 3;
const MIN_BUDGET = 500000;
const MAX_BUDGET = 200000000;
const DASHBOARD_HERO_IMAGE = '/dashboard-hero.png';
const formatBudgetInCrores = (value: number) => `₹${(value / 10000000).toFixed(1)} Cr`;

const Home = () => {
  const navigate = useNavigate();
  const { properties } = useApp();
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [showHeaderImage, setShowHeaderImage] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([MIN_BUDGET, MAX_BUDGET]);
  const [searchMode, setSearchMode] = useState<SearchMode>('buy');
  const [selectedCity, setSelectedCity] = useState('Rohtak');
  const [hasSelectedCity, setHasSelectedCity] = useState(false);
  useBodyScrollLock(showFilters);
  const [guestSearchCount, setGuestSearchCount] = useState(() => {
    if (typeof window === 'undefined') {
      return 0;
    }

    const storedCount = window.localStorage.getItem('propmarket-guest-search-count');
    return storedCount ? Number(storedCount) || 0 : 0;
  });

  let filteredProperties =
    activeCategory === 'All'
      ? properties
      : properties.filter((property) => property.category === activeCategory);

  if (hasSelectedCity && selectedCity !== 'All Haryana Cities') {
    filteredProperties = filteredProperties.filter((property) =>
      property.location.toLowerCase().includes(selectedCity.toLowerCase())
    );
  }

  if (appliedSearchQuery) {
    const normalizedQuery = appliedSearchQuery.toLowerCase();
    filteredProperties = filteredProperties.filter(
      (property) =>
        property.location.toLowerCase().includes(normalizedQuery) ||
        property.category.toLowerCase().includes(normalizedQuery) ||
        (property.type || '').toLowerCase().includes(normalizedQuery)
    );
  }

  filteredProperties = filteredProperties.filter(
    (property) => property.price >= priceRange[0] && property.price <= priceRange[1]
  );

  const rankedProperties = sortPropertiesByTrust(filteredProperties);

  const handlePropertyClick = (id: string) => {
    navigate(`/property/${id}`);
  };

  const openAuthModal = () => {
    setShowLoginModal(true);
  };

  const handleSearchSubmit = () => {
    const normalizedQuery = searchQuery.trim();

    if (!normalizedQuery) {
      setAppliedSearchQuery('');
      return;
    }

    if (isAuthenticated) {
      setAppliedSearchQuery(normalizedQuery);
      return;
    }

    if (guestSearchCount >= GUEST_SEARCH_LIMIT) {
      openAuthModal();
      return;
    }

    const nextCount = guestSearchCount + 1;
    setGuestSearchCount(nextCount);
    window.localStorage.setItem('propmarket-guest-search-count', String(nextCount));
    setAppliedSearchQuery(normalizedQuery);
  };

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);

    if (mode === 'commercial') {
      setActiveCategory('Commercial');
      return;
    }

    if (mode === 'plots-land') {
      setActiveCategory('Agricultural');
      return;
    }

    if (mode === 'new-launch') {
      setActiveCategory('Residential');
      return;
    }

    setActiveCategory('All');
  };

  const heroInfoCardClass =
    'rounded-3xl border border-white/15 bg-slate-950/22 p-5 text-sm text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-md';

  return (
    <div className="app-shell pb-16 pt-12">
      <DisclaimerTicker />
      <header
        className={`${showHeaderImage ? '' : 'hero-gradient '}relative overflow-hidden border-b border-white/10 text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]`}
      >
        {showHeaderImage && (
          <img
            src={DASHBOARD_HERO_IMAGE}
            alt="Dashboard hero"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setShowHeaderImage(false)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/58 via-slate-950/28 to-slate-950/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/34 via-slate-950/8 to-slate-950/0" />

        <div className="page-container relative py-6 sm:py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                Direct property discovery
              </div>

              <div className="space-y-3">
                <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  PropMarket
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
                  Browse verified listings with a cleaner, faster path from search
                  to property details.
                </p>
              </div>

              {!isAuthenticated && (
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button
                    size="lg"
                    onClick={openAuthModal}
                    className="bg-white text-slate-950 hover:bg-slate-100"
                  >
                    Login
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={openAuthModal}
                    className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  >
                    Create Account
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 self-start">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="glass-panel flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20"
                >
                  <User className="h-5 w-5" />
                </button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={openAuthModal}
                  className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {!isAuthenticated && (
              <div className={`${heroInfoCardClass} lg:col-span-1`}>
                <div className="mb-2 text-base font-semibold text-white">
                  Unlock full dashboard access
                </div>
                <p className="leading-7 text-blue-50/95">
                  Sign in to view exact locations, complete pricing insights, and owner
                  contact options.
                </p>
              </div>
            )}

            <div className={heroInfoCardClass}>
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                Verified-first browsing
              </div>
              <p className="leading-7 text-blue-50/95">
                Better trust signals help serious and verified listings rise first.
              </p>
            </div>

            <div className={heroInfoCardClass}>
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <Compass className="h-4 w-4" />
                Faster decision flow
              </div>
              <p className="leading-7 text-blue-50/95">
                Preview listings now and unlock deeper pricing insights after login.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <DashboardSearchPanel
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onOpenFilters={() => setShowFilters(true)}
              onPostProperty={() => {
                if (isAuthenticated) {
                  navigate('/add-property');
                  return;
                }

                openAuthModal();
              }}
              activeMode={searchMode}
              onModeChange={handleModeChange}
              listingLabel={selectedCity}
              listingOptions={HARYANA_CITY_OPTIONS}
              onListingSelect={(value) => {
                setSelectedCity(value);
                setHasSelectedCity(true);
              }}
            />
          </div>
        </div>
      </header>

      <main className="page-container pt-8">
        <section className="mb-8 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="section-title">Explore Listings</h2>
              <p className="section-copy">
                {rankedProperties.length} listings are visible with verified-first ordering.
              </p>
              {!isAuthenticated && (
                <p className="text-sm font-medium text-slate-500">
                  Guest searches used: {Math.min(guestSearchCount, GUEST_SEARCH_LIMIT)} /{' '}
                  {GUEST_SEARCH_LIMIT}
                </p>
              )}
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-soft">
              Max budget: {formatBudgetInCrores(priceRange[1])}
            </div>
          </div>

          <div className="space-y-2">
            <p className="section-copy">
              Search by location or category, then filter by budget before opening the
              guest preview.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === category
                    ? 'bg-slate-950 text-white shadow-soft'
                    : 'border border-slate-200 bg-white text-slate-600 shadow-soft hover:border-slate-300 hover:text-slate-950'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {rankedProperties.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rankedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => handlePropertyClick(property.id)}
                ctaLabel={isAuthenticated ? 'View Full Details' : 'Preview Details'}
              />
            ))}
          </section>
        ) : (
          <Card className="mx-auto max-w-xl p-10 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
              <Building2 className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-950">No exact matches found</h3>
            <p className="mt-2 text-sm text-slate-600">
              Try switching categories to widen the search.
            </p>
            {!isAuthenticated && (
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={openAuthModal}>Login</Button>
                <Button variant="secondary" onClick={openAuthModal}>
                  Create Account
                </Button>
              </div>
            )}
          </Card>
        )}
      </main>

      {showFilters && (
        <div className="animate-fade-in fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4">
          <div
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setShowFilters(false)}
          />

          <div className="flex min-h-full items-end justify-center md:items-center">
            <Card className="animate-slide-up relative w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-8">
              <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-950">Filters</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Refine the public listing preview before login.
                </p>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

              <div className="space-y-6">
                <Card className="rounded-3xl bg-slate-50 p-5 shadow-none">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Price Range</p>
                    <p className="mt-1 text-sm text-slate-500">Set an upper budget limit</p>
                  </div>
                  <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-soft">
                    ₹{(priceRange[1] / 10000000).toFixed(1)} Cr
                  </div>
                </div>

                <input
                  type="range"
                  min={MIN_BUDGET}
                  max={MAX_BUDGET}
                  step="1000000"
                  value={priceRange[1]}
                  onChange={(event) =>
                    setPriceRange([priceRange[0], parseInt(event.target.value, 10)])
                  }
                  className="w-full accent-blue-600"
                />

                <div className="mt-3 flex justify-between text-sm text-slate-500">
                  <span>₹5 L</span>
                  <span>₹20 Cr</span>
                </div>
                </Card>

                <Button onClick={() => setShowFilters(false)} fullWidth size="lg">
                  Apply Filters
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
