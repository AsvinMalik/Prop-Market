import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Splash from './components/Splash';
import AuthCallback from './components/AuthCallback';
import Home from './components/Home';
import HomeAuthenticated from './components/HomeAuthenticated';
import PropertyDetail from './components/PropertyDetail';
import Chat from './components/Chat';
import Messages from './components/Messages';
import AddProperty from './components/AddProperty';
import Profile from './components/Profile';
import LoginModal from './components/LoginModal';
import LoginPage from './components/LoginPage';
import OnboardingModal from './components/OnboardingModal';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAuthLoading } = useAuth();
  if (isAuthLoading) {
    return null;
  }
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/home" element={<Home />} />
            <Route
              path="/home-auth"
              element={
                <ProtectedRoute>
                  <HomeAuthenticated />
                </ProtectedRoute>
              }
            />
            <Route
              path="/property/:id"
              element={<PropertyDetail />}
            />
            <Route
              path="/chat/property/:propertyId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/conversation/:conversationId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-property"
              element={
                <ProtectedRoute>
                  <AddProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
          <LoginModal />
          <OnboardingModal />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
