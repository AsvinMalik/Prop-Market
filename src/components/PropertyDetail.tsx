import { useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Loader,
  Lock,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getMarketRate } from '../lib/marketRates';
import { buildPriceAnalysis, PriceAnalysisResult } from '../lib/priceAnalysis';
import Button from './ui/Button';
import Card from './ui/Card';
import VerificationBadge from './ui/VerificationBadge';

const formatCompactPrice = (value: number) => `₹${(value / 100000).toFixed(2)}L`;
const formatUnitPrice = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}/sq ft`;

const formatApproxLocation = (location: string) => {
  const parts = location.split(',').map((part) => part.trim());
  if (parts.length === 1) {
    return `Approx. ${parts[0]}`;
  }

  return `Approx. ${parts.slice(-1)[0]}`;
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, verificationRequestCounts, requestPropertyVerification } = useApp();
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const property = properties.find((item) => item.id === id);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showProofRequestModal, setShowProofRequestModal] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PriceAnalysisResult | null>(null);
  const [analysisUsesDataset, setAnalysisUsesDataset] = useState(false);
  useBodyScrollLock(showProofRequestModal);

  if (!property) {
    return <div>Property not found</div>;
  }

  const images = [property.image, property.image, property.image];
  const confidence = property.verified ? 'High' : 'Medium';
  const requestCount = verificationRequestCounts[property.id] || 0;
  const pricePerSqFt = property.price / property.area;
  const pricePerSqYd = pricePerSqFt * 9;
  const approxLocation = formatApproxLocation(property.location);
  const analysisTone =
    analysisResult?.deal_type === 'Good Deal'
      ? 'good'
      : analysisResult?.deal_type === 'Overpriced'
      ? 'overpriced'
      : 'fair';

  const nextImage = () => {
    setCurrentImageIndex((previous) => (previous + 1) % images.length);
  };

  const previousImage = () => {
    setCurrentImageIndex((previous) => (previous - 1 + images.length) % images.length);
  };

  const openLoginModal = () => {
    setShowLoginModal(true);
  };

  const handleAnalyzePrice = async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    setAnalyzing(true);

    try {
      const marketRate = await getMarketRate(property.location);
      const nextAnalysis = buildPriceAnalysis({
        property,
        marketRate,
      });

      setAnalysisResult(nextAnalysis);
      setAnalysisUsesDataset(!!marketRate);
    } finally {
      setAnalyzing(false);
      setShowAnalysis(true);
    }
  };

  const handleRequestProof = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    requestPropertyVerification(property.id);
    setRequestSubmitted(true);
    setShowProofRequestModal(false);
  };

  const getNegotiationInsight = () => {
    if (!analysisResult) {
      return null;
    }

    if (analysisResult.deal_type === 'Overpriced') {
      return {
        title: 'Negotiation Insight',
        message:
          'This property is likely negotiable. You may be able to negotiate a lower price.',
        level: 'High',
        range: [analysisResult.market_min * property.area, analysisResult.market_avg * property.area],
        className: 'border-red-200 bg-red-50',
        badgeClassName: 'bg-red-100 text-red-700',
        icon: <TrendingDown className="h-6 w-6" />,
      };
    }

    if (analysisResult.deal_type === 'Fair') {
      return {
        title: 'Negotiation Insight',
        message: 'This property is fairly priced. Limited negotiation may be possible.',
        level: 'Moderate',
        range: [analysisResult.market_min * property.area, analysisResult.market_max * property.area],
        className: 'border-amber-200 bg-amber-50',
        badgeClassName: 'bg-amber-100 text-amber-700',
        icon: <Minus className="h-6 w-6" />,
      };
    }

    return {
      title: 'Negotiation Insight',
      message: 'This property is competitively priced. Negotiation scope is low.',
      level: 'Low',
      range: [property.price * 0.985, property.price * 0.995],
      className: 'border-emerald-200 bg-emerald-50',
      badgeClassName: 'bg-emerald-100 text-emerald-700',
      icon: <TrendingUp className="h-6 w-6" />,
    };
  };

  const negotiationInsight = getNegotiationInsight();

  return (
    <div className="app-shell pb-24">
      <section className="relative overflow-hidden bg-slate-950">
        <img
          src={images[isAuthenticated ? currentImageIndex : 0]}
          alt="Property"
          className="h-[420px] w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/10" />

        <div className="page-container absolute inset-x-0 top-0 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="glass-panel flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="glass-panel rounded-full px-4 py-2 text-sm font-semibold text-white">
              {property.category}
            </div>
          </div>
        </div>

        {isAuthenticated && (
          <>
            <button
              onClick={previousImage}
              className="glass-panel absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="glass-panel absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-2xl text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0">
          <div className="page-container pb-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <MapPin className="h-4 w-4" />
                  {isAuthenticated ? property.location : approxLocation}
                </div>
                <div>
                  <div className="text-sm font-medium uppercase tracking-[0.2em] text-blue-100">
                    Asking Price
                  </div>
                  <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    {formatCompactPrice(property.price)}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <VerificationBadge
                    variant={property.sellerVerified ? 'verified-user' : 'unverified'}
                    className={
                      property.sellerVerified
                        ? '!bg-emerald-500 !text-white'
                        : '!bg-white/15 !text-white'
                    }
                  />
                  <VerificationBadge
                    variant={property.verified ? 'verified-property' : 'unverified'}
                    className={
                      property.verified
                        ? '!bg-blue-500 !text-white'
                        : '!bg-white/15 !text-white'
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="glass-panel rounded-3xl px-5 py-4 text-white">
                  <div className="text-xs uppercase tracking-[0.2em] text-blue-100">Area</div>
                  <div className="mt-2 text-xl font-bold">{property.area} sq ft</div>
                </div>
                <div className="glass-panel rounded-3xl px-5 py-4 text-white">
                  <div className="text-xs uppercase tracking-[0.2em] text-blue-100">
                    Status
                  </div>
                  <div className="mt-2 text-xl font-bold">
                    {property.verified ? 'Verified' : 'Pending Review'}
                  </div>
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div className="mt-6 flex justify-center gap-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2.5 rounded-full transition-all duration-200 ${
                      index === currentImageIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/45'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="page-container -mt-10 space-y-6">
        <Card className="p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-950">Property Overview</h2>
                <p className="text-sm text-slate-600">
                  Review the headline details, trust signals, and location context before
                  contacting the owner.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <div className="text-sm font-medium text-slate-500">Listed Price</div>
                  <div className="mt-2 text-3xl font-extrabold text-slate-950">
                    {formatCompactPrice(property.price)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      ₹{pricePerSqFt.toFixed(0)}/sq ft
                    </div>
                    <div className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      ₹{pricePerSqYd.toFixed(0)}/sq yd
                    </div>
                  </div>
                </div>
                <div className="rounded-3xl bg-blue-50 p-5">
                  <div className="text-sm font-medium text-blue-700">
                    {isAuthenticated ? 'Location' : 'Approx Location'}
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-950">
                    {isAuthenticated ? property.location : approxLocation}
                  </div>
                </div>
              </div>

              {!property.verified && (
                <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-950">
                        Verification requested by buyers
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {requestCount} users requested verification
                      </p>
                      {requestSubmitted && (
                        <p className="mt-2 text-sm font-medium text-amber-700">
                          Your request has been recorded.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                {isAuthenticated ? 'Map Preview' : 'Location Preview'}
              </div>
              <div className="flex h-56 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-200 via-slate-100 to-white text-slate-500">
                <MapPin className="mr-2 h-6 w-6" />
                {isAuthenticated ? 'Approximate location preview' : 'Login to view exact map details'}
              </div>
            </div>
          </div>
        </Card>

        {isAuthenticated ? (
          <Card className="overflow-hidden p-0">
            {!showAnalysis && !analyzing ? (
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="hero-gradient flex items-center justify-center p-8 text-white sm:p-10">
                  <div className="max-w-sm space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
                      <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">Price Intelligence</h3>
                      <p className="mt-2 text-sm leading-6 text-blue-50">
                        Compare seller expectations against available market and rate
                        benchmarks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-8 sm:p-10">
                  <div>
                    <h4 className="text-2xl font-bold text-slate-950">
                      Generate Price Analysis
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">
                      Run the current property through market context to estimate whether
                      the price looks fair.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <div className="text-sm font-medium text-slate-500">Seller Price</div>
                      <div className="mt-2 text-2xl font-bold text-slate-950">
                        {formatCompactPrice(property.price)}
                      </div>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <div className="text-sm font-medium text-slate-500">Confidence</div>
                      <div className="mt-2 text-2xl font-bold text-slate-950">{confidence}</div>
                    </div>
                  </div>

                  <Button onClick={handleAnalyzePrice} size="lg" className="w-full sm:w-auto">
                    Generate Price Analysis
                  </Button>
                </div>
              </div>
            ) : analyzing ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50">
                  <Loader className="h-10 w-10 animate-spin text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-950">Analyzing property</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Comparing current pricing against market benchmarks.
                </p>
              </div>
            ) : (
              <div className="animate-slide-up p-6 sm:p-8">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-950">Price Analysis</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Side-by-side view of seller pricing against locality market data.
                    </p>
                  </div>

                  <div
                    className={`rounded-3xl px-4 py-3 text-sm font-semibold ${
                      analysisTone === 'good'
                        ? 'bg-emerald-50 text-emerald-700'
                        : analysisTone === 'overpriced'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    Confidence: {confidence}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="text-sm font-medium text-slate-500">Seller Rate</div>
                    <div className="mt-3 text-2xl font-bold text-slate-950">
                      {analysisResult ? formatUnitPrice(analysisResult.seller_price) : '--'}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-blue-50 p-5">
                    <div className="text-sm font-medium text-blue-700">Market Range</div>
                    <div className="mt-3 text-xl font-bold text-blue-700">
                      {analysisResult
                        ? `${formatUnitPrice(analysisResult.market_min)} - ${formatUnitPrice(
                            analysisResult.market_max
                          )}`
                        : '--'}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="text-sm font-medium text-slate-500">Market Average</div>
                    <div className="mt-3 text-2xl font-bold text-slate-950">
                      {analysisResult ? formatUnitPrice(analysisResult.market_avg) : '--'}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="text-sm font-medium text-slate-500">Negotiation Level</div>
                    <div className="mt-3 text-2xl font-bold text-slate-950">
                      {analysisResult?.negotiation_level || '--'}
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-6 rounded-[28px] border p-6 ${
                    analysisTone === 'good'
                      ? 'border-emerald-200 bg-emerald-50'
                      : analysisTone === 'overpriced'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                        analysisTone === 'good'
                          ? 'bg-emerald-100 text-emerald-700'
                          : analysisTone === 'overpriced'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {analysisTone === 'good' ? (
                        <TrendingDown className="h-7 w-7" />
                      ) : analysisTone === 'overpriced' ? (
                        <TrendingUp className="h-7 w-7" />
                      ) : (
                        <Minus className="h-7 w-7" />
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4
                        className={`text-2xl font-bold ${
                          analysisTone === 'good'
                            ? 'text-emerald-700'
                            : analysisTone === 'overpriced'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {analysisResult?.deal_type || 'Fair'}
                      </h4>
                      <p className="text-sm text-slate-600">
                        {analysisTone === 'good'
                          ? 'This property is currently listed below the average market rate for the locality.'
                          : analysisTone === 'overpriced'
                          ? 'This property appears to be listed above the average market rate for the locality.'
                          : 'This property appears to be closely aligned with the current market rate.'}
                      </p>
                    </div>
                  </div>
                </div>

                {negotiationInsight && (
                  <div className={`mt-4 rounded-[28px] border p-5 ${negotiationInsight.className}`}>
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${negotiationInsight.badgeClassName}`}
                      >
                        {negotiationInsight.icon}
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-lg font-bold text-slate-950">
                            {negotiationInsight.title}
                          </h4>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                            {negotiationInsight.level} negotiation
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{negotiationInsight.message}</p>
                        <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700">
                          Suggested negotiation range:{' '}
                          {formatCompactPrice(negotiationInsight.range[0])} -{' '}
                          {formatCompactPrice(negotiationInsight.range[1])}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <Card className="mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-none">
                  <div className="text-sm font-semibold text-slate-700">AI-ready payload</div>
                  <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                    {JSON.stringify(analysisResult, null, 2)}
                  </pre>
                </Card>

                <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                  {analysisUsesDataset
                    ? `Using dataset-backed market rates for ${analysisResult?.locality}. Verify final pricing independently before making a decision.`
                    : 'No exact market-rate row was found for this locality yet, so the analysis used the property benchmark fallback. Verify pricing independently before making a decision.'}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowAnalysis(false);
                    setAnalysisResult(null);
                    setAnalysisUsesDataset(false);
                  }}
                  size="lg"
                  className="mt-6 w-full sm:w-auto"
                >
                  Recalculate
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="relative overflow-hidden p-0">
            <div className="pointer-events-none blur-[5px]">
              <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="hero-gradient flex items-center justify-center p-8 text-white sm:p-10">
                  <div className="max-w-sm space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
                      <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white">Price Intelligence</h3>
                      <p className="mt-2 text-sm leading-6 text-blue-50">
                        Negotiation insight, market benchmarks, and exact pricing analysis.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-6 p-8 sm:p-10">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="text-sm font-medium text-slate-500">Seller Price</div>
                    <div className="mt-2 text-2xl font-bold text-slate-950">
                      {formatCompactPrice(property.price)}
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <div className="text-sm font-medium text-slate-500">Negotiation Insight</div>
                    <div className="mt-2 text-lg font-bold text-slate-950">Locked</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <Card className="max-w-md p-6 text-center shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-950">
                  Login to unlock full details and price insights
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Exact location, full pricing analysis, negotiation guidance, gallery,
                  and owner actions are visible after login.
                </p>
                <Button onClick={openLoginModal} className="mt-5">
                  Login to Continue
                </Button>
              </Card>
            </div>
          </Card>
        )}
        <Card className="p-6 sm:p-8">
          <h3 className="text-2xl font-bold text-slate-950">Trust & Safety</h3>
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-4 rounded-3xl bg-emerald-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-950">Seller Verification</div>
                  <VerificationBadge
                    variant={property.sellerVerified ? 'verified-user' : 'unverified'}
                  />
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {property.sellerVerified
                    ? 'Identity verified by PropMarket.'
                    : 'Seller identity has not been fully verified yet.'}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-3xl bg-blue-50 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-slate-950">Property Verification</div>
                  <VerificationBadge
                    variant={property.verified ? 'verified-property' : 'unverified'}
                  />
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {property.verified
                    ? 'Property documents have been reviewed by PropMarket.'
                    : `${requestCount} users requested verification for this property.`}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative p-6 sm:p-8">
          {!isAuthenticated && (
            <div className="absolute inset-0 z-10 rounded-[28px] bg-white/70 backdrop-blur-sm" />
          )}

          <div className={!isAuthenticated ? 'pointer-events-none blur-[4px]' : ''}>
            <h3 className="text-2xl font-bold text-slate-950">Next Actions</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use the options below to continue the conversation with the owner.
            </p>

            <div className="mt-6 grid gap-3">
              <Button
                onClick={() => navigate(`/chat/property/${id}`)}
                size="lg"
                className="justify-center sm:justify-start"
              >
                <MessageCircle className="h-5 w-5" />
                Chat with Owner
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="justify-center sm:justify-start"
              >
                <Phone className="h-5 w-5" />
                Show Phone Number
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setShowProofRequestModal(true)}
                className="justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 sm:justify-start"
              >
                <FileCheck className="h-5 w-5" />
                Request Property Proof
              </Button>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="relative z-20 flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-950">
                  Login to unlock full details and price insights
                </h4>
                <p className="mt-2 text-sm text-slate-600">
                  Chat, phone access, map details, and negotiation guidance are available
                  after login.
                </p>
              </div>
              <Button onClick={openLoginModal}>Login to Continue</Button>
            </div>
          )}
        </Card>
      </main>

      {showProofRequestModal && (
        <div className="animate-fade-in fixed inset-0 z-[65] overflow-y-auto overscroll-contain p-4">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
            onClick={() => setShowProofRequestModal(false)}
          />

          <div className="flex min-h-full items-start justify-center md:items-center">
            <Card className="animate-scale-in relative my-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-8">
              <button
                onClick={() => setShowProofRequestModal(false)}
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-slate-950">
                Request Property Proof
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This will notify the platform that you want additional ownership proof
                and document verification for this listing.
              </p>
              <div className="mt-4 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
                {requestCount} users requested verification
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleRequestProof}>Confirm Request</Button>
                <Button variant="secondary" onClick={() => setShowProofRequestModal(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetail;
