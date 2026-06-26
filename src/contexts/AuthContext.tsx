import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  User as FirebaseAuthUser,
  signOut,
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDb } from '../lib/firebase';

export type UserRole = 'buyer' | 'seller';
export type VerificationStatus = 'unverified' | 'ai_checked' | 'pending' | 'verified';
type OnboardingStep = 'role-selection' | 'profile-setup' | null;

export interface User {
  id: string;
  phone: string;
  email?: string;
  name?: string;
  city?: string;
  roles: UserRole[];
  profileImage?: string;
  verified: boolean;
  onboardingCompleted: boolean;
  onboardingDismissed: boolean;
  identityVerificationStatus: VerificationStatus;
  propertyDocumentStatus: VerificationStatus;
}

interface ProfileSetupPayload {
  name: string;
  city: string;
  roles: UserRole[];
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  session: FirebaseAuthUser | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isPhoneOtpEnabled: boolean;
  isMockAuth: boolean;
  sendPhoneOtp: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<{ needsEmailConfirmation: boolean }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showOnboarding: boolean;
  onboardingStep: OnboardingStep;
  dismissOnboarding: () => Promise<void>;
  goToRoleSelection: () => Promise<void>;
  completeRoleSelection: (roles: UserRole[]) => Promise<void>;
  skipRoleSelection: () => Promise<void>;
  completeProfileSetup: (payload: ProfileSetupPayload) => Promise<void>;
  updateVerificationStatus: (
    identityStatus: VerificationStatus,
    propertyStatus: VerificationStatus
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const MOCK_AUTH_STORAGE_KEY = 'propmarket_mock_auth_user';
const isDemoAuthEnabled = true;
const isPhoneOtpEnabled = false;
const isMockPhoneOtpEnabled = true;

const toUserRoleArray = (roles: unknown): UserRole[] => {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role): role is UserRole => role === 'buyer' || role === 'seller');
};

const getOnboardingStep = (user: User | null): OnboardingStep => {
  if (!user || user.onboardingCompleted || user.onboardingDismissed) {
    return null;
  }

  if (!user.roles.length) {
    return 'role-selection';
  }

  return 'profile-setup';
};

const createDemoUser = (overrides: Partial<User> = {}): User => {
  return {
    id: 'demo-user',
    phone: '+919876543210',
    email: 'demo@propmarket.local',
    name: 'Demo User',
    city: 'Rohtak',
    roles: ['buyer', 'seller'],
    verified: true,
    onboardingCompleted: true,
    onboardingDismissed: false,
    identityVerificationStatus: 'verified',
    propertyDocumentStatus: 'ai_checked',
    ...overrides,
  };
};

const readMockUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = window.localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return null;
  }
};

const persistMockUser = (mockUser: User | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!mockUser) {
    window.localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(mockUser));
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const canUsePhoneOtp = isPhoneOtpEnabled || isMockPhoneOtpEnabled;
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<FirebaseAuthUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const hydrateMockUser = () => {
    const mockUser = readMockUser();
    setUser(mockUser);
    setOnboardingStep(getOnboardingStep(mockUser));
  };

  useEffect(() => {
    hydrateMockUser();
    setSession(null);
    setIsAuthLoading(false);
  }, []);

  const sendPhoneOtp = async (_phone: string) => {
    if (isDemoAuthEnabled) {
      return;
    }

    throw new Error('Demo login is enabled for this deployment.');
  };

  const verifyPhoneOtp = async (phone: string, _otp: string) => {
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone || '9876543210'}`;
    const mockUser = createDemoUser({ phone: formattedPhone });

    persistMockUser(mockUser);
    setSession(null);
    setUser(mockUser);
    setOnboardingStep(getOnboardingStep(mockUser));
    setShowLoginModal(false);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const mockUser = createDemoUser({
      email: email || 'demo@propmarket.local',
      name: email ? email.split('@')[0] : 'Demo User',
    });

    persistMockUser(mockUser);
    setSession(null);
    setUser(mockUser);
    setOnboardingStep(getOnboardingStep(mockUser));
    setShowLoginModal(false);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await loginWithEmail(email, password);
    return { needsEmailConfirmation: false };
  };

  const loginWithGoogle = async () => {
    const mockUser = createDemoUser();

    persistMockUser(mockUser);
    setSession(null);
    setUser(mockUser);
    setOnboardingStep(getOnboardingStep(mockUser));
    setShowLoginModal(false);
  };

  const updateProfile = async (changes: Record<string, unknown>) => {
    if (!user) {
      return;
    }

    if (!session) {
      const nextUser = {
        ...user,
        phone: (changes.phone as string | undefined) ?? user.phone,
        email: (changes.email as string | undefined) ?? user.email,
        name: (changes.name as string | undefined) ?? user.name,
        city: (changes.city as string | undefined) ?? user.city,
        roles: toUserRoleArray(changes.roles ?? user.roles),
        profileImage: (changes.profile_image as string | undefined) ?? user.profileImage,
        verified: (changes.verified as boolean | undefined) ?? user.verified,
        onboardingCompleted:
          (changes.onboarding_completed as boolean | undefined) ?? user.onboardingCompleted,
        onboardingDismissed:
          (changes.onboarding_dismissed as boolean | undefined) ?? user.onboardingDismissed,
        identityVerificationStatus:
          (changes.identity_verification_status as VerificationStatus | undefined) ??
          user.identityVerificationStatus,
        propertyDocumentStatus:
          (changes.property_document_status as VerificationStatus | undefined) ??
          user.propertyDocumentStatus,
      };

      setUser(nextUser);
      setOnboardingStep(getOnboardingStep(nextUser));
      persistMockUser(nextUser);
      return;
    }

    const profileRef = doc(firebaseDb, 'profiles', user.id);
    await updateDoc(profileRef, changes as Record<string, string | boolean | string[] | undefined>);

    const nextUser = {
      ...user,
      phone: (changes.phone as string | undefined) ?? user.phone,
      email: (changes.email as string | undefined) ?? user.email,
      name: (changes.name as string | undefined) ?? user.name,
      city: (changes.city as string | undefined) ?? user.city,
      roles: toUserRoleArray(changes.roles ?? user.roles),
      profileImage: (changes.profile_image as string | undefined) ?? user.profileImage,
      verified: (changes.verified as boolean | undefined) ?? user.verified,
      onboardingCompleted:
        (changes.onboarding_completed as boolean | undefined) ?? user.onboardingCompleted,
      onboardingDismissed:
        (changes.onboarding_dismissed as boolean | undefined) ?? user.onboardingDismissed,
      identityVerificationStatus:
        (changes.identity_verification_status as VerificationStatus | undefined) ??
        user.identityVerificationStatus,
      propertyDocumentStatus:
        (changes.property_document_status as VerificationStatus | undefined) ??
        user.propertyDocumentStatus,
    };

    setUser(nextUser);
    setOnboardingStep(getOnboardingStep(nextUser));
    persistMockUser(null);
  };

  const completeRoleSelection = async (roles: UserRole[]) => {
    await updateProfile({
      roles,
      onboarding_dismissed: false,
    });
    setOnboardingStep('profile-setup');
  };

  const skipRoleSelection = async () => {
    await completeRoleSelection(['buyer']);
  };

  const goToRoleSelection = async () => {
    await updateProfile({
      onboarding_dismissed: false,
    });
    setOnboardingStep('role-selection');
  };

  const dismissOnboarding = async () => {
    await updateProfile({
      onboarding_dismissed: true,
    });
    setOnboardingStep(null);
  };

  const completeProfileSetup = async (payload: ProfileSetupPayload) => {
    await updateProfile({
      name: payload.name,
      city: payload.city,
      roles: payload.roles,
      profile_image: payload.profileImage,
      onboarding_completed: true,
      onboarding_dismissed: false,
    });
    setOnboardingStep(null);
  };

  const updateVerificationStatus = async (
    identityStatus: VerificationStatus,
    propertyStatus: VerificationStatus
  ) => {
    await updateProfile({
      identity_verification_status: identityStatus,
      property_document_status: propertyStatus,
      verified: identityStatus === 'verified',
    });
  };

  const logout = async () => {
    if (session) {
      await signOut(firebaseAuth);
    }

    setUser(null);
    setSession(null);
    setOnboardingStep(null);
    persistMockUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: !!user,
      isAuthLoading,
      isPhoneOtpEnabled: canUsePhoneOtp,
      isMockAuth: !!user && !session,
      sendPhoneOtp,
      verifyPhoneOtp,
      loginWithEmail,
      signUpWithEmail,
      loginWithGoogle,
      logout,
      showLoginModal,
      setShowLoginModal,
      showOnboarding: onboardingStep !== null,
      onboardingStep,
      dismissOnboarding,
      goToRoleSelection,
      completeRoleSelection,
      skipRoleSelection,
      completeProfileSetup,
      updateVerificationStatus,
    }),
    [user, session, isAuthLoading, showLoginModal, onboardingStep, canUsePhoneOtp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
