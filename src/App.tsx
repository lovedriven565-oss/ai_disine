import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { initTelegram } from './services/telegram';

import CreateFlow from './screens/CreateFlow';
import ProfileScreen from './screens/ProfileScreen';
import BottomTabBar from './components/ui/BottomTabBar';
import Toast from './components/ui/Toast';
import Paywall from './components/Paywall';

export default function App() {
  const tab = useAppStore((s) => s.tab);
  const createStep = useAppStore((s) => s.createStep);
  const initSession = useAppStore((s) => s.initSession);

  useEffect(() => {
    initTelegram();
    initSession();
  }, [initSession]);

  // Hide the bottom bar when the creation pipeline is mid-flight to remove UI noise.
  const hideTabBar = tab === 'create' && createStep === 'loading';

  return (
    <div className="min-h-screen bg-background text-on-background font-body-lg antialiased">
      {tab === 'create' ? <CreateFlow /> : <ProfileScreen />}
      {!hideTabBar && <BottomTabBar />}
      <Paywall />
      <Toast />
    </div>
  );
}
