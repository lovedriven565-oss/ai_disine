import { CheckCircle, Cpu, Armchair, Brush } from 'lucide-react';
import { useEffect } from 'react';

export default function LoadingScreen({ onComplete }) {
  // Simulate loading process
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3000); // 3 seconds fake loading
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col font-body-lg">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAY29chiM74D1z0XistXwSUkacucUvYdPQtY2H2XN7-N1YhqWdvyV3f3A8Hu71CS_g4Oi3P328Dk6c2tuM9idkhxMoog3cUzr5m0WAD7LTRmM2hRfdA0JSHl9CQCcR9X0uKWKI2Lg3hp0__QHGZV1PQnNelxnYO2t3wSjCa6P4vWrIz-hWb0Za8zTtXKxCHSu3RC9ZFuNSdboShZAJn_Bodt3DFZLYHu0oBSvyssKjPT27Z2BZXA8_cmQsdZZ-zlPCJcAuL-vZ_2Hre')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-surface/85 backdrop-blur-[4px]"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 h-full w-full max-w-md mx-auto">
        <div className="relative w-full aspect-[4/5] bg-surface-container/40 backdrop-blur-xl border border-outline/20 rounded-2xl p-4 flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Simulated Image Area */}
          <div className="relative flex-1 rounded-xl overflow-hidden border border-white/5 mb-4">
            <div className="absolute inset-0 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAY29chiM74D1z0XistXwSUkacucUvYdPQtY2H2XN7-N1YhqWdvyV3f3A8Hu71CS_g4Oi3P328Dk6c2tuM9idkhxMoog3cUzr5m0WAD7LTRmM2hRfdA0JSHl9CQCcR9X0uKWKI2Lg3hp0__QHGZV1PQnNelxnYO2t3wSjCa6P4vWrIz-hWb0Za8zTtXKxCHSu3RC9ZFuNSdboShZAJn_Bodt3DFZLYHu0oBSvyssKjPT27Z2BZXA8_cmQsdZZ-zlPCJcAuL-vZ_2Hre')] bg-cover bg-center opacity-60"></div>
            
            {/* Skeleton Overlays */}
            <div className="absolute top-1/4 left-[10%] w-[30%] h-[40%] border-2 border-primary/60 border-dashed bg-primary/10 rounded-lg flex items-center justify-center">
              <Armchair className="text-primary opacity-80" size={24} />
            </div>
            
            {/* Simulated Scanning Line */}
            <div className="absolute top-[45%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(77,142,255,0.8)] animate-pulse"></div>
          </div>

          {/* Status Tracking */}
          <div className="flex flex-col space-y-2 w-full">
            <div className="flex items-center space-x-3 text-primary">
              <span className="text-xl">✨</span>
              <span className="font-headline-md">Анализируем геометрию...</span>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary w-[35%] rounded-full shadow-[0_0_10px_rgba(77,142,255,0.6)]"></div>
            </div>

            {/* Step List */}
            <div className="flex flex-col space-y-1 mt-2 font-label-caps text-[12px]">
              <div className="flex items-center justify-between text-on-surface-variant/50">
                <div className="flex items-center space-x-2">
                  <CheckCircle size={14} />
                  <span>Загрузка фото</span>
                </div>
                <span>Готово</span>
              </div>
              <div className="flex items-center justify-between text-primary">
                <div className="flex items-center space-x-2">
                  <Cpu size={14} />
                  <span>Анализируем геометрию...</span>
                </div>
                <span>35%</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant/30">
                <div className="flex items-center space-x-2">
                  <Armchair size={14} />
                  <span>Расставляем мебель...</span>
                </div>
                <span>Ожидание</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant/30">
                <div className="flex items-center space-x-2">
                  <Brush size={14} />
                  <span>Рендеринг...</span>
                </div>
                <span>Ожидание</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
