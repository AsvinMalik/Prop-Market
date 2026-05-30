import { useEffect, useState } from 'react';
import { Loader, Mail, Phone, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import Button from './ui/Button';
import Card from './ui/Card';
import FieldShell, { TextInput } from './ui/Field';

const LoginModal = () => {
  const {
    showLoginModal,
    setShowLoginModal,
    isPhoneOtpEnabled,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
  } = useAuth();
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [emailAuthMode, setEmailAuthMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const showPhoneProviderHint = errorMessage.toLowerCase().includes('phone otp is not configured');
  const showPhoneOtpDisabledState = !isPhoneOtpEnabled && step === 'phone';

  useEffect(() => {
    if (!showLoginModal) {
      return;
    }

    setPhone('');
    setOtp('');
    setEmail('');
    setPassword('');
    setAuthMethod('phone');
    setEmailAuthMode('login');
    setStep('phone');
    setLoading(false);
    setErrorMessage('');
    setSuccessMessage('');
  }, [showLoginModal]);

  useBodyScrollLock(showLoginModal);

  if (!showLoginModal) {
    return null;
  }

  const handleSendOTP = async () => {
    if (phone.length === 10) {
      try {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        await sendPhoneOtp(phone);
        setStep('otp');
        setSuccessMessage(`OTP sent to +91 ${phone}.`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to send OTP. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length === 6) {
      try {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        await verifyPhoneOtp(phone, otp);
        setShowLoginModal(false);
        navigate('/home-auth');
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to verify OTP. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      await sendPhoneOtp(phone);
      setSuccessMessage(`A new OTP was sent to +91 ${phone}.`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to resend OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      await loginWithGoogle();
    } catch (error) {
      setLoading(false);
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to continue with Google.'
      );
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || password.length < 6) {
      setErrorMessage('Enter a valid email address and a password with at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (emailAuthMode === 'login') {
        await loginWithEmail(email.trim(), password);
        navigate('/home-auth');
        return;
      }

      const { needsEmailConfirmation } = await signUpWithEmail(email.trim(), password);

      if (needsEmailConfirmation) {
        setSuccessMessage('Account created. Check your email and confirm your account before signing in.');
        setEmailAuthMode('login');
        setPassword('');
        return;
      }

      navigate('/home-auth');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to continue with email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 overflow-y-auto overscroll-contain p-4">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        onClick={() => setShowLoginModal(false)}
      />

      <div className="flex min-h-full items-start justify-center md:items-center">
        <Card className="animate-scale-in relative my-auto w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-0">
          <div className="hero-gradient px-8 pb-20 pt-8 text-white">
          <button
            onClick={() => setShowLoginModal(false)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="max-w-xs space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 backdrop-blur-sm">
              {step === 'phone' ? (
                <Phone className="h-8 w-8" />
              ) : (
                <ShieldCheck className="h-8 w-8" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-50">
                <Sparkles className="h-3.5 w-3.5" />
                Secure access
              </div>
              <h2 className="mt-4 text-3xl font-bold text-white">
                {step === 'phone' ? 'Welcome Back' : 'Verify OTP'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-blue-50">
                Login or create account to continue.
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                {authMethod === 'email'
                  ? emailAuthMode === 'login'
                    ? 'Sign in with your email and password.'
                    : 'Create an email account to continue.'
                  : step === 'phone'
                  ? 'Unlock full details, price analysis, seller trust indicators, and onboarding.'
                  : `Enter the code sent to +91 ${phone}.`}
              </p>
            </div>
          </div>
        </div>

          <div className="-mt-12 px-6 pb-6 sm:px-8 sm:pb-8">
            <Card className="p-6 sm:p-7">
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setStep('phone');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                  authMethod === 'phone' ? 'bg-white text-slate-950 shadow-soft' : 'text-slate-500'
                }`}
              >
                Phone
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                  authMethod === 'email' ? 'bg-white text-slate-950 shadow-soft' : 'text-slate-500'
                }`}
              >
                Email
              </button>
            </div>

            {authMethod === 'phone' ? step === 'phone' ? (
              <div className="space-y-6">
                <FieldShell label="Phone Number" hint="We will send a one-time verification code.">
                  <div className="flex rounded-2xl border border-slate-200 bg-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)]">
                    <span className="inline-flex items-center rounded-l-2xl bg-slate-50 px-4 text-sm font-semibold text-slate-600">
                      +91
                    </span>
                    <TextInput
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      disabled={!isPhoneOtpEnabled}
                      className="border-0 shadow-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </FieldShell>

                {showPhoneOtpDisabledState && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Phone OTP is disabled for this deployment. Continue with email or Google login.
                  </div>
                )}

                <Button
                  onClick={handleSendOTP}
                  disabled={phone.length !== 10 || loading || !isPhoneOtpEnabled}
                  fullWidth
                  size="lg"
                  className="shadow-[0_18px_44px_rgba(37,99,235,0.26)]"
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : isPhoneOtpEnabled ? (
                    'Send OTP'
                  ) : (
                    'Phone OTP unavailable'
                  )}
                </Button>

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                )}

                {showPhoneProviderHint && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Continue with email or Google below, or enable Firebase phone authentication.
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {loading ? 'Please wait...' : 'Continue with Google'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <FieldShell
                  label="Enter OTP"
                  hint="Use the 6-digit code sent to your phone number."
                >
                  <TextInput
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="h-14 text-center text-2xl font-semibold tracking-[0.45em]"
                  />
                </FieldShell>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || loading}
                  fullWidth
                  size="lg"
                  className="shadow-[0_18px_44px_rgba(37,99,235,0.26)]"
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 text-sm font-medium">
                  <button
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className="text-slate-500 transition-colors hover:text-slate-900"
                  >
                    Change phone number
                  </button>

                  <button
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    Resend OTP
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthMode('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      emailAuthMode === 'login'
                        ? 'bg-white text-slate-950 shadow-soft'
                        : 'text-slate-500'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthMode('signup');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      emailAuthMode === 'signup'
                        ? 'bg-white text-slate-950 shadow-soft'
                        : 'text-slate-500'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <FieldShell
                  label="Email Address"
                  hint="Use the email address for your account."
                >
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <TextInput
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="name@example.com"
                      className="pl-12"
                    />
                  </div>
                </FieldShell>

                <FieldShell
                  label="Password"
                  hint={
                    emailAuthMode === 'signup'
                      ? 'Use at least 6 characters.'
                      : 'Enter your account password.'
                  }
                >
                  <TextInput
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                  />
                </FieldShell>

                <Button
                  onClick={handleEmailAuth}
                  disabled={loading || !email.trim() || password.length < 6}
                  fullWidth
                  size="lg"
                  className="shadow-[0_18px_44px_rgba(37,99,235,0.26)]"
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : emailAuthMode === 'login' ? (
                    'Login with Email'
                  ) : (
                    'Create Email Account'
                  )}
                </Button>

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            )}
            </Card>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginModal;
