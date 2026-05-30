import { useState } from 'react';
import {
  Building2,
  Heart,
  Plus,
  Search,
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

const residentialTypes = ['All', 'Plot', 'House', 'Flat', 'Builder Floor'];
const categories = ['All', 'Agricultural', 'Residential', 'Commercial'];
const MIN_BUDGET = 500000;
const MAX_BUDGET = 200000000;
const DASHBOARD_HERO_IMAGE = `${import.meta.env.BASE_URL}dashboard-hero.png`;

const HomeAuthenticated = () => {
  const navigate = useNavigate();
  const { properties, wishlist, toggleWishlist, selectedCategory, setSelectedCategory } =
    useApp();
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('All');
  const [priceRange, setPriceRange] = useState([MIN_BUDGET, MAX_BUDGET]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('buy');
  const [selectedCity, setSelectedCity] = useState('Rohtak');
  const [hasSelectedCity, setHasSelectedCity] = useState(false);
  useBodyScrollLock(showFilters);

  let filteredProperties = properties;

  if (hasSelectedCity && selectedCity !== 'All Haryana Cities') {
    filteredProperties = filteredProperties.filter((property) =>
      property.location.toLowerCase().includes(selectedCity.toLowerCase())
    );
  }

  if (selectedCategory !== 'All') {
    filteredProperties = filteredProperties.filter(
      (property) => property.category === selectedCategory
    );
  }

  if (selectedType !== 'All' && selectedCategory === 'Residential') {
    filteredProperties = filteredProperties.filter((property) => property.type === selectedType);
  }

  if (searchQuery) {
    filteredProperties = filteredProperties.filter(
      (property) =>
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  filteredProperties = filteredProperties.filter(
    (property) => property.price >= priceRange[0] && property.price <= priceRange[1]
  );
  const rankedProperties = sortPropertiesByTrust(filteredProperties);

  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);

    if (mode === 'commercial') {
      setSelectedCategory('Commercial');
      return;
    }

    if (mode === 'plots-land') {
      setSelectedCategory('Agricultural');
      return;
    }

    if (mode === 'new-launch') {
      setSelectedCategory('Residential');
      return;
    }

    setSelectedCategory('All');
  };

  return (
    <div className="app-shell pb-32">
      <DisclaimerTicker />
      <header
        className="relative overflow-hidden border-b border-white/10 bg-cover bg-center text-white shadow-[0_12px_40px_rgba(15,23,42,0.18)]"
        style={{ backgroundImage: `url(${DASHBOARD_HERO_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/58 via-slate-950/28 to-slate-950/18" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/34 via-slate-950/8 to-slate-950/0" />

        <div className="page-container relative py-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-medium text-blue-100">Marketplace dashboard</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">PropMarket</h1>
              <p className="max-w-2xl text-sm leading-6 text-blue-50">
                Search smarter, compare faster, and review property pricing with
                a cleaner browse flow.
              </p>
            </div>

            <button
              onClick={() => setShowProfileMenu((previous) => !previous)}
              className="glass-panel flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20 sm:self-start"
            >
              <User className="h-5 w-5" />
            </button>
          </div>

          {showProfileMenu && (
            <Card className="animate-scale-in mb-4 ml-auto w-full max-w-xs p-2">
              <button
                onClick={() => navigate('/profile')}
                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Profile
              </button>
              <button
                onClick={() => navigate('/add-property')}
                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Add Property
              </button>
              <button
                onClick={logout}
                className="w-full rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Logout
              </button>
            </Card>
          )}

          <DashboardSearchPanel
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onOpenFilters={() => setShowFilters(true)}
            onPostProperty={() => navigate('/add-property')}
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
      </header>

      <main className="page-container pt-8">
        <section className="mb-8 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="section-title">Available Properties</h2>
              <p className="section-copy">
                {rankedProperties.length} matches based on your current filters.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-soft">
              Max budget: ₹{(priceRange[1] / 10000000).toFixed(1)} Cr
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-slate-950 text-white shadow-soft'
                    : 'border border-slate-200 bg-white text-slate-600 shadow-soft hover:border-slate-300 hover:text-slate-950'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {selectedCategory === 'Residential' && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {residentialTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedType === type
                      ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </section>

        {rankedProperties.length > 0 ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rankedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => navigate(`/property/${property.id}`)}
                onWishlistToggle={(event) => {
                  event.stopPropagation();
                  toggleWishlist(property.id);
                }}
                isWishlisted={wishlist.includes(property.id)}
                showWishlist
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
              Try broadening your budget or changing the category filters.
            </p>
          </Card>
        )}
      </main>

      <button
        onClick={() => navigate('/add-property')}
        className="shadow-float fixed bottom-24 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-950 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-blue-600"
      >
        <Plus className="h-6 w-6" />
      </button>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="page-container">
          <div className="flex justify-around py-3">
            <button className="flex flex-col items-center gap-1 text-blue-600">
              <Search className="h-6 w-6" />
              <span className="text-xs font-semibold">Explore</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-slate-700"
            >
              <Heart className="h-6 w-6" />
              <span className="text-xs font-medium">Saved</span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center gap-1 text-slate-400 transition-colors hover:text-slate-700"
            >
              <User className="h-6 w-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>

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
                  Adjust your budget and refine visible results.
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

export default HomeAuthenticated;
