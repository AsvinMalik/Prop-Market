import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import {
  User as FirebaseAuthUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseDb, googleAuthProvider } from '../lib/firebase';

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
const isPhoneOtpEnabled = import.meta.env.VITE_ENABLE_PHONE_OTP === 'true';
const isMockPhoneOtpEnabled = import.meta.env.VITE_ENABLE_MOCK_PHONE_OTP === 'true';

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

const mapAuthErrorMessage = (error: unknown, fallbackMessage: string) => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('popup closed')) {
    return 'The sign-in popup was closed before completing login.';
  }

  if (normalizedMessage.includes('email-already-in-use')) {
    return 'An account with this email already exists. Try logging in instead.';
  }

  if (normalizedMessage.includes('invalid-credential') || normalizedMessage.includes('wrong-password')) {
    return 'Invalid email or password.';
  }

  if (normalizedMessage.includes('user-not-found')) {
    return 'No account exists for this email address yet.';
  }

  if (normalizedMessage.includes('operation-not-allowed')) {
    return 'This login method is not enabled in Firebase Authentication yet.';
  }

  return message;
};

const normalizeProfile = (
  authUser: FirebaseAuthUser,
  profile: Record<string, unknown> | null
): User => {
  const identityVerificationStatus =
    (profile?.identity_verification_status as VerificationStatus | undefined) || 'unverified';

  return {
    id: authUser.uid,
    phone: (profile?.phone as string | undefined) || authUser.phoneNumber || '',
    email: (profile?.email as string | undefined) || authUser.email || undefined,
    name: profile?.name as string | undefined,
    city: profile?.city as string | undefined,
    roles: toUserRoleArray(profile?.roles),
    profileImage: profile?.profile_image as string | undefined,
    verified:
      (profile?.verified as boolean | undefined) ?? identityVerificationStatus === 'verified',
    onboardingCompleted: (profile?.onboarding_completed as boolean | undefined) ?? false,
    onboardingDismissed: (profile?.onboarding_dismissed as boolean | undefined) ?? false,
    identityVerificationStatus,
    propertyDocumentStatus:
      (profile?.property_document_status as VerificationStatus | undefined) || 'unverified',
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

  const syncUserFromSession = async (authUser: FirebaseAuthUser | null) => {
    if (!authUser) {
      setUser(null);
      setOnboardingStep(null);
      persistMockUser(null);
      return;
    }

    const profileRef = doc(firebaseDb, 'profiles', authUser.uid);
    const profileSnapshot = await getDoc(profileRef);
    const existingProfile = profileSnapshot.exists()
      ? (profileSnapshot.data() as Record<string, unknown>)
      : null;

    const profilePayload =
      existingProfile ||
      {
        phone: authUser.phoneNumber || '',
        email: authUser.email || '',
        roles: [],
        verified: false,
        onboarding_completed: false,
        onboarding_dismissed: false,
        identity_verification_status: 'unverified',
        property_document_status: 'unverified',
      };

    if (!existingProfile) {
      await setDoc(profileRef, profilePayload);
    }

    const nextUser = normalizeProfile(authUser, profilePayload);
    setUser(nextUser);
    setOnboardingStep(getOnboardingStep(nextUser));
    persistMockUser(null);
  };

  const hydrateMockUser = () => {
    const mockUser = isMockPhoneOtpEnabled ? readMockUser() : null;
    setUser(mockUser);
    setOnboardingStep(getOnboardingStep(mockUser));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setSession(nextUser);

      if (nextUser) {
        void syncUserFromSession(nextUser);
      } else {
        hydrateMockUser();
      }

      setIsAuthLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const sendPhoneOtp = async (_phone: string) => {
    if (!canUsePhoneOtp) {
      throw new Error(
        'Phone OTP is disabled for this deployment. Continue with email or Google login.'
      );
    }

    if (isMockPhoneOtpEnabled && !isPhoneOtpEnabled) {
      return;
    }

    throw new Error('Firebase phone authentication is not wired yet. Use email or Google login.');
  };

  const verifyPhoneOtp = async (phone: string, _otp: string) => {
    if (isMockPhoneOtpEnabled && !isPhoneOtpEnabled) {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const mockUser: User = {
        id: `mock-${phone}`,
        phone: formattedPhone,
        roles: [],
        verified: false,
        onboardingCompleted: false,
        onboardingDismissed: false,
        identityVerificationStatus: 'unverified',
        propertyDocumentStatus: 'unverified',
      };

      persistMockUser(mockUser);
      setSession(null);
      setUser(mockUser);
      setOnboardingStep(getOnboardingStep(mockUser));
      setShowLoginModal(false);
      return;
    }

    throw new Error('Firebase phone authentication is not wired yet. Use email or Google login.');
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      setShowLoginModal(false);
    } catch (error) {
      throw new Error(
        mapAuthErrorMessage(error, 'Unable to sign in with email and password.')
      );
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
      setShowLoginModal(false);
      return { needsEmailConfirmation: false };
    } catch (error) {
      throw new Error(
        mapAuthErrorMessage(error, 'Unable to create your account with email and password.')
      );
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(firebaseAuth, googleAuthProvider);
      setShowLoginModal(false);
    } catch (error) {
      throw new Error(mapAuthErrorMessage(error, 'Unable to continue with Google.'));
    }
  };

  const updateProfile = async (changes: Record<string, unknown>) => {
    if (!user) {
      return;
    }

    if (isMockPhoneOtpEnabled && !session) {
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
