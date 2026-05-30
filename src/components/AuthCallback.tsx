import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Card from './ui/Card';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const completeGoogleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const authCode = params.get('code');
      const oauthError = params.get('error_description') || params.get('error');

      if (oauthError) {
        if (!cancelled) {
          setErrorMessage(decodeURIComponent(oauthError));
        }
        return;
      }

      if (authCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);

        if (error) {
          if (!cancelled) {
            setErrorMessage(error.message);
          }
          return;
        }
      }

      if (!cancelled) {
        navigate('/home-auth', { replace: true });
      }
    };

    void completeGoogleAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        {errorMessage ? (
          <>
            <h1 className="text-2xl font-bold text-slate-950">Google login failed</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{errorMessage}</p>
            <button
              onClick={() => navigate('/home', { replace: true })}
              className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              Return to Home
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-950">Completing Google login</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Finalizing your secure sign-in and redirecting you back into PropMarket.
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;
