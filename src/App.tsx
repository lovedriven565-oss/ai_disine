import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import UploadScreen from './components/UploadScreen';
import LoadingScreen from './components/LoadingScreen';
import ResultScreen from './components/ResultScreen';

export default function App() {
  const [screen, setScreen] = useState('upload'); // 'upload' | 'loading' | 'result'

  useEffect(() => {
    // Expand the Telegram Web App on start
    try {
      WebApp.ready();
      WebApp.expand();
    } catch (e) {
      console.warn("Telegram WebApp is not available", e);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-lg">
      {screen === 'upload' && (
        <UploadScreen onGenerate={() => setScreen('loading')} />
      )}
      {screen === 'loading' && (
        <LoadingScreen onComplete={() => setScreen('result')} />
      )}
      {screen === 'result' && (
        <ResultScreen onReset={() => setScreen('upload')} />
      )}
    </div>
  );
}
