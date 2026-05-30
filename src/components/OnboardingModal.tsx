import { ChangeEvent, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ImagePlus,
  MapPin,
  Search,
  SkipForward,
  Store,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { HARYANA_CITY_OPTIONS } from '../constants/haryanaCities';
import Button from './ui/Button';
import Card from './ui/Card';
import FieldShell, { TextInput } from './ui/Field';

const roleOptions: Array<{
  id: UserRole;
  title: string;
  description: string;
  icon: typeof Search;
}> = [
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Find properties and track trusted listings.',
    icon: Search,
  },
  {
    id: 'seller',
    title: 'Seller',
    description: 'List properties and build trust with verification.',
    icon: Store,
  },
];

const onboardingCityOptions = HARYANA_CITY_OPTIONS.filter(
  (cityOption) => cityOption !== 'All Haryana Cities'
);

const OnboardingModal = () => {
  const navigate = useNavigate();
  const {
    user,
    showOnboarding,
    onboardingStep,
    goToRoleSelection,
    completeRoleSelection,
    skipRoleSelection,
    completeProfileSetup,
    logout,
  } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [showCityOptions, setShowCityOptions] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setSelectedRoles(user.roles.length ? user.roles : []);
    setFullName(user.name || '');
    setCity(user.city || '');
    setShowCityOptions(false);
    setProfileImage(user.profileImage || '');
    setSubmitted(false);
  }, [user, onboardingStep]);

  useBodyScrollLock(showOnboarding && !!user && !!onboardingStep);

  if (!showOnboarding || !user || !onboardingStep) {
    return null;
  }

  const toggleRole = (role: UserRole) => {
    setSelectedRoles((currentRoles) =>
      currentRoles.includes(role)
        ? currentRoles.filter((item) => item !== role)
        : [...currentRoles, role]
    );
  };

  const handleProfileImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRoleContinue = async () => {
    if (!selectedRoles.length) {
      setSubmitted(true);
      return;
    }

    await completeRoleSelection(selectedRoles);
  };

  const handleProfileSubmit = async () => {
    setSubmitted(true);
    if (!fullName.trim() || !city.trim() || !selectedRoles.length) {
      return;
    }

    await completeProfileSetup({
      name: fullName.trim(),
      city: city.trim(),
      roles: selectedRoles,
      profileImage,
    });
    navigate('/home-auth');
  };

  const handleBackToDashboard = async () => {
    await logout();
    navigate('/home');
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-[60] overflow-y-auto overscroll-contain p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" />

      <div className="flex min-h-full items-start justify-center md:items-center">
        <Card className="animate-scale-in relative my-auto w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto p-0">
          <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="hero-gradient p-8 text-white sm:p-10">
            <div className="max-w-sm space-y-5">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                Step {onboardingStep === 'role-selection' ? '1' : '2'} of 2
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {onboardingStep === 'role-selection'
                    ? 'How do you want to use the platform?'
                    : 'Set up your profile'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-blue-50">
                  {onboardingStep === 'role-selection'
                    ? 'Choose one or both roles so the platform can tailor your property experience.'
                    : 'Complete your profile to build trust and unlock a more realistic onboarding flow.'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            {onboardingStep === 'role-selection' ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {roleOptions.map((role) => {
                    const Icon = role.icon;
                    const isSelected = selectedRoles.includes(role.id);

                    return (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`rounded-[28px] border p-6 text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-300 bg-blue-50 shadow-float'
                            : 'bg-white shadow-soft hover:-translate-y-1 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white">
                          <Icon className="h-7 w-7" />
                        </div>
                        <h3 className="mt-5 text-xl font-bold text-slate-950">{role.title}</h3>
                        <p className="mt-2 text-sm text-slate-500">{role.description}</p>
                      </button>
                    );
                  })}
                </div>

                {submitted && !selectedRoles.length && (
                  <p className="text-sm font-medium text-red-600">
                    Select at least one role or use Skip to continue with the default role.
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleRoleContinue}>
                    Continue
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" onClick={handleBackToDashboard}>
                    <ArrowLeft className="h-5 w-5" />
                    Back to Dashboard
                  </Button>
                  <Button variant="secondary" onClick={skipRoleSelection}>
                    <SkipForward className="h-5 w-5" />
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <Button
                  variant="ghost"
                  onClick={goToRoleSelection}
                  className="justify-start self-start rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Back
                </Button>

                <FieldShell
                  label="Full Name"
                  hint={submitted && !fullName.trim() ? 'Full name is required.' : undefined}
                >
                  <TextInput
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter your full name"
                    className={submitted && !fullName.trim() ? 'border-red-300' : ''}
                  />
                </FieldShell>

                <FieldShell
                  label="City / Location"
                  hint={submitted && !city.trim() ? 'City or location is required.' : undefined}
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCityOptions((currentValue) => !currentValue)}
                      className={`flex h-16 w-full items-center justify-between rounded-[22px] border bg-white px-5 text-left text-base font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 ${
                        submitted && !city.trim() ? 'border-red-300' : 'border-slate-200'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <MapPin className="h-5 w-5 flex-shrink-0 text-slate-400" />
                        <span className={city ? 'text-slate-900' : 'text-slate-400'}>
                          {city || 'Select a Haryana city'}
                        </span>
                      </span>
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-500" />
                    </button>

                    {showCityOptions && (
                      <div className="mt-3 max-h-72 w-full overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_20px_48px_rgba(15,23,42,0.14)]">
                        {onboardingCityOptions.map((cityOption) => (
                          <button
                            key={cityOption}
                            type="button"
                            onClick={() => {
                              setCity(cityOption);
                              setShowCityOptions(false);
                            }}
                            className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                              cityOption === city
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {cityOption}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FieldShell>

                <FieldShell
                  label="Role"
                  hint={
                    submitted && !selectedRoles.length
                      ? 'At least one role is required.'
                      : 'Pre-filled from the previous step, but still editable.'
                  }
                >
                  <div className="flex flex-wrap gap-3">
                    {roleOptions.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={`rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                          selectedRoles.includes(role.id)
                            ? 'bg-slate-950 text-white shadow-soft'
                            : 'border border-slate-200 bg-white text-slate-600 shadow-soft hover:border-slate-300 hover:text-slate-950'
                        }`}
                      >
                        {role.title}
                      </button>
                    ))}
                  </div>
                </FieldShell>

                <FieldShell label="Profile Image" hint="Optional, but useful for trust and profile completeness.">
                  <label className="flex cursor-pointer items-center gap-4 rounded-[28px] border-2 border-dashed border-slate-300 bg-slate-50 p-5 transition-colors hover:border-blue-400 hover:bg-blue-50">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-slate-600 shadow-soft">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile preview"
                          className="h-14 w-14 rounded-3xl object-cover"
                        />
                      ) : (
                        <ImagePlus className="h-7 w-7" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-950">
                        {profileImage ? 'Change image' : 'Upload image'}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        JPG or PNG for your account profile
                      </div>
                    </div>
                    <input type="file" className="hidden" onChange={handleProfileImageUpload} />
                  </label>
                </FieldShell>

                <Button onClick={handleProfileSubmit} size="lg">
                  Complete Setup
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingModal;
