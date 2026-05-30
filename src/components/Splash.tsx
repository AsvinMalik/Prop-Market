import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Splash = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    const timer = setTimeout(() => {
      navigate(isAuthenticated ? '/home-auth' : '/home');
    }, 4000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isAuthLoading, navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 animate-fade-in">
      <img
        src={`${import.meta.env.BASE_URL}WhatsApp_Image_2026-03-19_at_7.43.34_PM.jpeg`}
        alt="City skyline"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/70" />

      <div className="relative z-10 px-6 text-center text-white animate-slide-up">
        <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] backdrop-blur-sm">
          PropMarket
        </div>
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Find better property deals
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base">
          Verified listings, cleaner browsing, and smarter property decisions.
        </p>
        <div className="mx-auto mt-8 h-1.5 w-20 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-full animate-pulse rounded-full bg-white/80" />
        </div>
      </div>
    </div>
  );
};

export default Splash;
