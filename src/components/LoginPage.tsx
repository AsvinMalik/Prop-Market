import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { isAuthenticated, isAuthLoading, showLoginModal, setShowLoginModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setShowLoginModal(true);

    return () => {
      setShowLoginModal(false);
    };
  }, [setShowLoginModal]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !showLoginModal) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, showLoginModal]);

  if (isAuthLoading) {
    return <div className="app-shell min-h-screen bg-slate-50" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home-auth" replace />;
  }

  return <div className="app-shell min-h-screen bg-slate-50" />;
};

export default LoginPage;
