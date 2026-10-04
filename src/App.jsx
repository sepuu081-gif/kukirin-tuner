import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { HashRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home';
import BuildShop from './pages/BuildShop';
import TelemetryRace from './pages/TelemetryRace.jsx';
import VehicleDetail from './pages/VehicleDetail';
import DragRace from './pages/DragRace';
import Dyno from './pages/Dyno';
import Garage from './pages/Garage';
import FanFeed from './pages/FanFeed';
import Career from './pages/Career';
import HouseGarage from './pages/HouseGarage';
import Settings from './pages/Settings';
import StuntPark from './pages/StuntPark';
import CityRide from './pages/CityRide';
import FirstLaunchName from './components/FirstLaunchName';
import Leaderboard from './pages/Leaderboard';
import {syncScores} from './lib/leaderboard';
import AppSound from './components/AppSound';
import { LanguageProvider } from './lib/i18n';

const AuthenticatedApp = () => {
  const location = useLocation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/vehicle/:vehicleId" element={<VehicleDetail />} />
      <Route path="/build/:vehicleId" element={<BuildShop key={location.pathname} />} />
      <Route path="/telemetry/:vehicleId" element={<TelemetryRace key={location.pathname + location.search} />} />
      <Route path="/drag" element={<DragRace />} />
      <Route path="/dyno" element={<Dyno />} />
      <Route path="/repair" element={<Garage />} />
      <Route path="/fanfeed" element={<FanFeed />} />
      <Route path="/career" element={<Career />} />
      <Route path="/house" element={<HouseGarage />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/stunt" element={<StuntPark />} />
      <Route path="/leaderboard" element={<Leaderboard/>} />
      <Route path="/city" element={<CityRide />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function BackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleBack = () => {
      const path = location.pathname;
      const telemetry = path.match(/^\/telemetry\/([^/]+)/);
      const build = path.match(/^\/build\/([^/]+)/);
      const vehicle = path.match(/^\/vehicle\/([^/]+)/);

      const consumed = !window.dispatchEvent(new Event('kukirin:back-request', { cancelable: true }));
      if (consumed) return;
      if (telemetry && new URLSearchParams(location.search).get('practice')==='park') navigate(`/stunt?vehicle=${telemetry[1]}`,{replace:true});
      else if (telemetry) navigate(`${location.search.includes('stock=1') ? '/vehicle/' : '/build/'}${telemetry[1]}`, { replace: true });
      else if (path === '/drag' && new URLSearchParams(location.search).has('career')) navigate('/career', { replace: true });
      else if (build) navigate(`/vehicle/${build[1]}`, { replace: true });
      else if (vehicle || path === '/drag' || path === '/dyno' || path === '/repair' || path === '/fanfeed' || path === '/career' || path === '/house' || path === '/city' || path === '/settings') navigate('/', { replace: true });
      else if (path !== '/') navigate('/', { replace: true });
      else navigator.vibrate?.(18);
    };

    window.addEventListener('kukirin:native-back', handleBack);
    return () => window.removeEventListener('kukirin:native-back', handleBack);
  }, [location.pathname, location.search, navigate]);

  return null;
}


function App() {
  useEffect(()=>{void syncScores();const sync=()=>{void syncScores();};window.addEventListener("online",sync);return()=>window.removeEventListener("online",sync);},[]);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <AppSound />
          <Router>
            <ScrollToTop />
            <BackNavigation />
            <FirstLaunchName><AuthenticatedApp /></FirstLaunchName>
          </Router>
          <Toaster />
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
