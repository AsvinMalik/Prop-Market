import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { firebaseDb } from '../lib/firebase';
import { supabase } from '../lib/supabase';

export interface Property {
  id: string;
  userId?: string;
  image: string;
  price: number;
  area: number;
  location: string;
  category: 'Agricultural' | 'Residential' | 'Commercial';
  type?: string;
  description?: string;
  verified: boolean;
  sellerVerified: boolean;
  marketPrice?: number;
  governmentRate?: number;
}

export interface NewPropertyInput {
  image?: string;
  price: number;
  area: number;
  location: string;
  category: Property['category'];
  type?: string;
  description?: string;
}

interface AppContextType {
  properties: Property[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  verificationRequestCounts: Record<string, number>;
  requestPropertyVerification: (id: string) => Promise<void>;
  addProperty: (input: NewPropertyInput) => Promise<Property>;
  isLoadingProperties: boolean;
  refreshProperties: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
const LOCAL_PROPERTIES_STORAGE_KEY = 'propmarket_local_properties';

const fallbackProperties: Property[] = [
  {
    id: 'fallback-1',
    image:
      'https://images.pexels.com/photos/186077/pexels-photo-186077.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 8500000,
    area: 2400,
    location: 'Model Town, Rohtak',
    category: 'Residential',
    type: 'House',
    verified: true,
    sellerVerified: true,
    marketPrice: 8200000,
    governmentRate: 7800000,
  },
  {
    id: 'fallback-2',
    image:
      'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 4500000,
    area: 1200,
    location: 'Sector 21, Rohtak',
    category: 'Residential',
    type: 'Flat',
    verified: true,
    sellerVerified: false,
    marketPrice: 4800000,
    governmentRate: 4600000,
  },
  {
    id: 'fallback-3',
    image:
      'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 15000000,
    area: 5000,
    location: 'Sector 25, Rohtak',
    category: 'Residential',
    type: 'House',
    verified: true,
    sellerVerified: true,
    marketPrice: 14500000,
    governmentRate: 14000000,
  },
  {
    id: 'fallback-4',
    image:
      'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 2500000,
    area: 2000,
    location: 'Sector 27, Rohtak',
    category: 'Agricultural',
    verified: false,
    sellerVerified: true,
    marketPrice: 2800000,
    governmentRate: 2400000,
  },
  {
    id: 'fallback-5',
    image:
      'https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 12000000,
    area: 3500,
    location: 'Sector 35, Rohtak',
    category: 'Commercial',
    verified: true,
    sellerVerified: true,
    marketPrice: 11500000,
    governmentRate: 11000000,
  },
  {
    id: 'fallback-6',
    image:
      'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
    price: 3200000,
    area: 1500,
    location: 'Omaxe City, Rohtak',
    category: 'Residential',
    type: 'Flat',
    verified: true,
    sellerVerified: true,
    marketPrice: 3100000,
    governmentRate: 3000000,
  },
];

const fallbackVerificationRequestCounts = {
  'fallback-1': 2,
  'fallback-2': 1,
  'fallback-3': 4,
  'fallback-4': 3,
  'fallback-5': 2,
  'fallback-6': 1,
};

const placeholderImages: Record<Property['category'], string> = {
  Agricultural:
    'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800',
  Residential:
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800',
  Commercial:
    'https://images.pexels.com/photos/380768/pexels-photo-380768.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const mapPropertyRow = (row: Record<string, unknown>): Property => ({
  id: row.id as string,
  userId: row.user_id as string | undefined,
  image: row.image as string,
  price: Number(row.price),
  area: Number(row.area),
  location: row.location as string,
  category: row.category as Property['category'],
  type: row.type as string | undefined,
  description: row.description as string | undefined,
  verified: Boolean(row.verified),
  sellerVerified: Boolean(row.seller_verified),
  marketPrice: row.market_price ? Number(row.market_price) : undefined,
  governmentRate: row.government_rate ? Number(row.government_rate) : undefined,
});

const mapFirebaseProperty = (id: string, row: Record<string, unknown>): Property => ({
  id,
  userId: row.userId as string | undefined,
  image: row.image as string,
  price: Number(row.price),
  area: Number(row.area),
  location: row.location as string,
  category: row.category as Property['category'],
  type: row.type as string | undefined,
  description: row.description as string | undefined,
  verified: Boolean(row.verified),
  sellerVerified: Boolean(row.sellerVerified),
  marketPrice: row.marketPrice ? Number(row.marketPrice) : undefined,
  governmentRate: row.governmentRate ? Number(row.governmentRate) : undefined,
});

const readLocalProperties = (): Property[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedProperties = window.localStorage.getItem(LOCAL_PROPERTIES_STORAGE_KEY);
  if (!storedProperties) {
    return [];
  }

  try {
    return JSON.parse(storedProperties) as Property[];
  } catch {
    window.localStorage.removeItem(LOCAL_PROPERTIES_STORAGE_KEY);
    return [];
  }
};

const persistLocalProperties = (properties: Property[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!properties.length) {
    window.localStorage.removeItem(LOCAL_PROPERTIES_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(LOCAL_PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
};

const fetchSupabaseProperties = async (): Promise<Property[]> => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data?.length) {
      return [];
    }

    return data.map((row) => mapPropertyRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
};

const fetchFirebaseProperties = async (): Promise<Property[]> => {
  const propertiesQuery = query(collection(firebaseDb, 'properties'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(propertiesQuery);

  return snapshot.docs.map((doc) => mapFirebaseProperty(doc.id, doc.data() as Record<string, unknown>));
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, isMockAuth } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [verificationRequestCounts, setVerificationRequestCounts] = useState<
    Record<string, number>
  >({});
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

  const refreshProperties = async () => {
    setIsLoadingProperties(true);
    const localProperties = readLocalProperties();

    try {
      const firebaseProperties = await fetchFirebaseProperties();

      if (firebaseProperties.length) {
        setProperties([...localProperties, ...firebaseProperties]);
        setIsLoadingProperties(false);
        return;
      }
    } catch {
      // Fall back to the existing Supabase source if Firestore is not ready yet.
    }

    let supabaseProperties: Property[] = [];

    try {
      supabaseProperties = await fetchSupabaseProperties();
    } catch {
      supabaseProperties = [];
    }

    if (!supabaseProperties.length) {
      setProperties([...localProperties, ...fallbackProperties]);
      setVerificationRequestCounts(fallbackVerificationRequestCounts);
      setIsLoadingProperties(false);
      return;
    }

    setProperties([...localProperties, ...supabaseProperties]);
    setIsLoadingProperties(false);
  };

  const refreshVerificationRequestCounts = async () => {
    try {
      const snapshot = await getDocs(collection(firebaseDb, 'verification_requests'));
      const counts = snapshot.docs.reduce<Record<string, number>>((result, verificationDoc) => {
        const propertyId = verificationDoc.data().propertyId as string | undefined;

        if (!propertyId) {
          return result;
        }

        result[propertyId] = (result[propertyId] || 0) + 1;
        return result;
      }, {});

      setVerificationRequestCounts(counts);
      return;
    } catch {
      setVerificationRequestCounts((currentCounts) =>
        Object.keys(currentCounts).length ? currentCounts : fallbackVerificationRequestCounts
      );
    }
  };

  const refreshWishlist = async () => {
    if (!isAuthenticated || !user) {
      setWishlist([]);
      return;
    }

    try {
      const wishlistQuery = query(
        collection(firebaseDb, 'wishlists'),
        where('userId', '==', user.id)
      );
      const snapshot = await getDocs(wishlistQuery);
      setWishlist(
        snapshot.docs
          .map((wishlistDoc) => wishlistDoc.data().propertyId as string | undefined)
          .filter((propertyId): propertyId is string => Boolean(propertyId))
      );
      return;
    } catch {
      setWishlist([]);
    }
  };

  useEffect(() => {
    void refreshProperties();
    void refreshVerificationRequestCounts();
  }, []);

  useEffect(() => {
    void refreshWishlist();
  }, [isAuthenticated, user?.id]);

  const toggleWishlist = async (id: string) => {
    if (!isAuthenticated || !user) {
      return;
    }

    const isWishlisted = wishlist.includes(id);

    setWishlist((currentWishlist) =>
      isWishlisted
        ? currentWishlist.filter((item) => item !== id)
        : [...currentWishlist, id]
    );

    if (isWishlisted) {
      try {
        await deleteDoc(doc(firebaseDb, 'wishlists', `${user.id}_${id}`));
      } catch {
        await refreshWishlist();
      }
      return;
    }

    try {
      await setDoc(doc(firebaseDb, 'wishlists', `${user.id}_${id}`), {
        userId: user.id,
        propertyId: id,
      });
    } catch {
      await refreshWishlist();
    }
  };

  const requestPropertyVerification = async (id: string) => {
    if (!isAuthenticated || !user) {
      return;
    }

    setVerificationRequestCounts((currentCounts) => ({
      ...currentCounts,
      [id]: Math.max((currentCounts[id] || 0) + 1, 1),
    }));

    try {
      await setDoc(doc(firebaseDb, 'verification_requests', `${id}_${user.id}`), {
        propertyId: id,
        requesterId: user.id,
        createdAt: serverTimestamp(),
      });
    } catch {
      await refreshVerificationRequestCounts();
      return;
    }

    await refreshVerificationRequestCounts();
  };

  const addProperty = async (input: NewPropertyInput) => {
    if (!isAuthenticated || !user) {
      throw new Error('You must be logged in to add a property.');
    }

    const fallbackProperty: Property = {
      id: `local-${Date.now()}`,
      userId: user.id,
      image: input.image || placeholderImages[input.category],
      price: input.price,
      area: input.area,
      location: input.location,
      category: input.category,
      type: input.type,
      description: input.description,
      verified: false,
      sellerVerified: user.verified,
      marketPrice: Math.round(input.price * 0.96),
      governmentRate: Math.round(input.price * 0.92),
    };

    const saveLocalProperty = () => {
      const nextLocalProperties = [fallbackProperty, ...readLocalProperties()];
      persistLocalProperties(nextLocalProperties);
      setProperties((currentProperties) => [fallbackProperty, ...currentProperties]);
      return fallbackProperty;
    };

    if (isMockAuth) {
      return saveLocalProperty();
    }

    const payload = {
      userId: user.id,
      image: input.image || placeholderImages[input.category],
      price: input.price,
      area: input.area,
      location: input.location,
      category: input.category,
      type: input.type || null,
      description: input.description || null,
      verified: false,
      sellerVerified: user.verified,
      marketPrice: Math.round(input.price * 0.96),
      governmentRate: Math.round(input.price * 0.92),
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(firebaseDb, 'properties'), payload);
      const nextProperty = mapFirebaseProperty(docRef.id, payload as unknown as Record<string, unknown>);
      setProperties((currentProperties) => [nextProperty, ...currentProperties]);
      return nextProperty;
    } catch {
      // Fall back to Supabase/local persistence so the listing flow still completes.
    }

    const supabasePayload = {
      user_id: user.id,
      image: input.image || placeholderImages[input.category],
      price: input.price,
      area: input.area,
      location: input.location,
      category: input.category,
      type: input.type || null,
      description: input.description || null,
      verified: false,
      seller_verified: user.verified,
      market_price: Math.round(input.price * 0.96),
      government_rate: Math.round(input.price * 0.92),
    };

    const { data, error } = await supabase
      .from('properties')
      .insert(supabasePayload)
      .select('*')
      .single();

    if (error) {
      return saveLocalProperty();
    }

    const nextProperty = mapPropertyRow(data as Record<string, unknown>);
    setProperties((currentProperties) => [nextProperty, ...currentProperties]);
    return nextProperty;
  };

  const value = useMemo(
    () => ({
      properties,
      selectedCategory,
      setSelectedCategory,
      wishlist,
      toggleWishlist,
      searchQuery,
      setSearchQuery,
      showFilters,
      setShowFilters,
      verificationRequestCounts,
      requestPropertyVerification,
      addProperty,
      isLoadingProperties,
      refreshProperties,
    }),
    [
      properties,
      selectedCategory,
      wishlist,
      searchQuery,
      showFilters,
      verificationRequestCounts,
      isLoadingProperties,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
