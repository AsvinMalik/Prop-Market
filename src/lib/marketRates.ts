import { supabase } from './supabase';

export interface MarketRate {
  locality: string;
  min_price: number;
  max_price: number;
  unit: string;
  notes: string | null;
}

const fallbackMarketRates: MarketRate[] = [
  { locality: 'Model Town', min_price: 16400, max_price: 16400, unit: 'sqft', notes: null },
  { locality: 'Sector 21', min_price: 20000, max_price: 20000, unit: 'sqft', notes: null },
  { locality: 'Sector 25', min_price: 8750, max_price: 11050, unit: 'sqft', notes: null },
  { locality: 'Sector 27', min_price: 4900, max_price: 8000, unit: 'sqft', notes: null },
  { locality: 'Sector 35', min_price: 4900, max_price: 8000, unit: 'sqft', notes: null },
  { locality: 'Omaxe City', min_price: 8333, max_price: 8333, unit: 'sqft', notes: null },
  { locality: 'Maina', min_price: 3500, max_price: 5600, unit: 'sqft', notes: null },
];

const normalizeLocalityValue = (value: string) => value.trim().toLowerCase();

export const extractLocality = (location: string) =>
  location
    .split(',')
    .map((part) => part.trim())
    .find(Boolean) || location.trim();

export const getMarketRate = async (locality: string): Promise<MarketRate | null> => {
  const normalizedLocality = extractLocality(locality);

  if (!normalizedLocality) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('market_rates')
      .select('locality, min_price, max_price, unit, notes')
      .ilike('locality', normalizedLocality)
      .maybeSingle();

    if (error) {
      return (
        fallbackMarketRates.find(
          (rate) => normalizeLocalityValue(rate.locality) === normalizeLocalityValue(normalizedLocality)
        ) || null
      );
    }

    if (!data) {
      return null;
    }

    return {
      locality: data.locality as string,
      min_price: Number(data.min_price),
      max_price: Number(data.max_price),
      unit: data.unit as string,
      notes: (data.notes as string | null | undefined) ?? null,
    };
  } catch {
    return (
      fallbackMarketRates.find(
        (rate) => normalizeLocalityValue(rate.locality) === normalizeLocalityValue(normalizedLocality)
      ) || null
    );
  }
};
