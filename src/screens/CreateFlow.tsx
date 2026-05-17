import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import UploadScreen from './UploadScreen';
import LoadingScreen from './LoadingScreen';
import ResultScreen from './ResultScreen';

export default function CreateFlow() {
  const step = useAppStore((s) => s.createStep);
  const setStep = useAppStore((s) => s.setCreateStep);
  const [pickedStyle, setPickedStyle] = useState<string>('scandinavian');

  if (step === 'loading') {
    return <LoadingScreen style={pickedStyle} onDone={() => setStep('result')} />;
  }
  if (step === 'result') {
    return <ResultScreen onReset={() => setStep('upload')} />;
  }
  return (
    <UploadScreen
      onGenerate={(style) => {
        setPickedStyle(style);
        setStep('loading');
      }}
    />
  );
}
