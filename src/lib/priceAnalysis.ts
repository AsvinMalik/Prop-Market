import { Property } from '../contexts/AppContext';
import { extractLocality, MarketRate } from './marketRates';

export type DealType = 'Overpriced' | 'Fair' | 'Good Deal';
export type NegotiationLevel = 'High' | 'Moderate' | 'Low';

export interface PriceAnalysisResult {
  locality: string;
  seller_price: number;
  market_min: number;
  market_max: number;
  market_avg: number;
  deal_type: DealType;
  negotiation_level: NegotiationLevel;
}

interface BuildPriceAnalysisOptions {
  property: Property;
  marketRate: MarketRate | null;
}

const FAIR_BAND_PERCENTAGE = 0.05;

const getFallbackAverageRate = (property: Property) => {
  if (!property.marketPrice || !property.area) {
    return property.price / property.area;
  }

  return property.marketPrice / property.area;
};

export const buildPriceAnalysis = ({
  property,
  marketRate,
}: BuildPriceAnalysisOptions): PriceAnalysisResult => {
  const locality = extractLocality(property.location);
  const sellerPricePerSqFt = property.price / property.area;
  const fallbackAverageRate = getFallbackAverageRate(property);
  const marketMin = marketRate?.min_price ?? Math.round(fallbackAverageRate * 0.95);
  const marketMax = marketRate?.max_price ?? Math.round(fallbackAverageRate * 1.05);
  const marketAvg = (marketMin + marketMax) / 2;
  const lowerFairBound = marketAvg * (1 - FAIR_BAND_PERCENTAGE);
  const upperFairBound = marketAvg * (1 + FAIR_BAND_PERCENTAGE);

  let dealType: DealType = 'Fair';
  let negotiationLevel: NegotiationLevel = 'Moderate';

  if (sellerPricePerSqFt > upperFairBound) {
    dealType = 'Overpriced';
    negotiationLevel = 'High';
  } else if (sellerPricePerSqFt < lowerFairBound) {
    dealType = 'Good Deal';
    negotiationLevel = 'Low';
  }

  return {
    locality,
    seller_price: Math.round(sellerPricePerSqFt),
    market_min: marketMin,
    market_max: marketMax,
    market_avg: Math.round(marketAvg),
    deal_type: dealType,
    negotiation_level: negotiationLevel,
  };
};
