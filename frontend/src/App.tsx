import { useState, lazy, Suspense } from 'react';
import { SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import { Header } from './components/Header';
import { AuthProvider, useAuth } from './features/auth/context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { AnimalProvider } from './context/AnimalContext';
import { Toaster } from 'sonner';
import { Loading } from './components/Loading';
import { BottomNav } from './components/BottomNav';
import { OfflineBanner } from './components/OfflineBanner';

// Lazy load feature components
const Dashboard = lazy(() => import('./features/dashboard/components/Dashboard').then(m => ({ default: m.Dashboard })));
const CropManagement = lazy(() => import('@/features/crops/components/CropManagement').then(m => ({ default: m.CropManagement })));
const LivestockManagement = lazy(() => import('@/features/livestock/components/LivestockManagement').then(m => ({ default: m.LivestockManagement })));
const EquipmentTracking = lazy(() => import('@/features/equipment/components/EquipmentTracking').then(m => ({ default: m.EquipmentTracking })));
const FinanceTracking = lazy(() => import('@/features/finance/components/FinanceTracking').then(m => ({ default: m.FinanceTracking })));
const Login = lazy(() => import('./features/auth/components/Login').then(m => ({ default: m.Login })));


function AppContent() {
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  if (isAuthLoading) {
    return <Loading />;
  }
  const [darkMode, setDarkMode] = useState(false);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<Loading />}>
        <Login />
      </Suspense>
    );
  }



  const renderComponent = () => {
    // Default farm data structure for sections not yet implemented
    const defaultFarmData = {
      crops: [],
      equipment: [],
      transactions: [],
    };

    switch (activeComponent) {
      case 'dashboard':
        return <Dashboard farmData={defaultFarmData} onNavigate={setActiveComponent} />;
      case 'crops':
        return <CropManagement />;
      case 'livestock':
        return <LivestockManagement />;
      case 'equipment':
        return <EquipmentTracking />;
      case 'finance':
        return <FinanceTracking />;
      default:
        return <Dashboard farmData={defaultFarmData} onNavigate={setActiveComponent} />;
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen bg-background ${darkMode ? 'dark' : ''}`}>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <div className="hidden md:flex">
            <AppSidebar activeComponent={activeComponent} setActiveComponent={setActiveComponent} />
          </div>

          <div className="flex-1 flex flex-col h-full bg-background">
            <Header
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />

            <OfflineBanner />

            <main className="flex-1 overflow-auto bg-background pb-20 md:pb-0">
              <Suspense fallback={<Loading />}>
                {renderComponent()}
              </Suspense>
            </main>

            <BottomNav activeComponent={activeComponent} setActiveComponent={setActiveComponent} />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <AnimalProvider>
          <AppContent />
          <Toaster position="top-right" richColors />
        </AnimalProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
