import { ArrowLeft, X, Share2, RefreshCw } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

export default function ResultScreen({ onReset }) {
  // Determine pricing display based on user locale
  const getPricing = (priceRub, priceUsd) => {
    try {
      const languageCode = WebApp.initDataUnsafe?.user?.language_code || 'en';
      const cisLangs = ['ru', 'be', 'kk', 'uk'];
      if (cisLangs.includes(languageCode)) {
        return `${priceRub.toLocaleString('ru-RU')} ₽`;
      }
    } catch (e) {
      // Fallback
    }
    return `$${priceUsd}`;
  };

  return (
    <div className="min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="bg-surface/70 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-white/10 shadow-sm flex items-center justify-between px-4 h-14">
        <button 
          onClick={onReset}
          className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center w-10 h-10 rounded-full"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-headline-md text-on-surface font-bold">AI Staging</h1>
        <button 
          onClick={onReset}
          className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center w-10 h-10 rounded-full"
        >
          <X size={24} />
        </button>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        {/* Hero Image Section / Compare Slider */}
        <section className="w-full relative h-[45vh]">
          <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src="https://lh3.googleusercontent.com/aida/ADBb0ugaplghrz_oaJY6SIdBcLyEG2MPaveTfWVDruU1uh7YnfwHRgY-wNsF5-fW4X1OMd53MC31xK0HmJOMSQklDI9DrO6mL2_hR3IiazSTs1iOFCNRC_tMhL_Vv_bqR18GI-1zkAKiS8lMJaXU02sBTraWRVSTabQZ_F037YwjjVWXM8VIVwsfamYVsVZHfaHsJPOJOT9K1id6acZl_9RLWlyTVnA-ssmlx1ULbY-6cDnVwEFw5SqISEzYPI0" alt="До" />}
            itemTwo={<ReactCompareSliderImage src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyyvNSaw5mYYqEexjBJQmcnjzlHwIrvhmYCWF0-zFEnK6l1BiBjWGjPWMJF_fkp0GCf48HZqTVj0z6HLaaKHUmcpZx6EXXz7roLuluv-rD78-Kgh11CvGuqxMEfX4mhJKYEP7ZEm53-WBxLAKC7KayIDYOlRPQhABRbpBVxhfj_-GG-04gjKVLIDLBdvmaxUHY5Jc2_wgCGrRDJmmwcXtBpZiAMPhKvmHGxV-fUrTHoKZDGaGlOT8Gw7TZUALoL9_DfjZjGDv2BLHK" alt="После" />}
            className="w-full h-full object-cover rounded-b-xl shadow-lg"
          />

          <div className="absolute bottom-4 left-4 bg-surface-container/70 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm z-10 pointer-events-none">
            <span className="text-[18px] text-primary">✨</span>
            <span className="font-label-caps text-on-surface">Scandinavian Modern</span>
          </div>
        </section>

        {/* Product Carousel Section */}
        <section className="mt-6 px-4">
          <h2 className="font-headline-md text-on-surface mb-4">Мебель в интерьере</h2>
          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-4 px-4 snap-x">
            
            {/* Card 1 */}
            <div className="snap-start flex-none w-[240px] bg-surface-container/70 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-md hover:bg-surface-container-high transition-colors">
              <div className="w-full aspect-square rounded-lg mb-3 overflow-hidden bg-white flex items-center justify-center">
                <img className="w-full h-full object-contain mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp8xd6un2tNwRZCY2qaO1Zbr-IE-CXbM2QU8OQ1JmVKk82RbGvhuy7YSc19GKnBf6TDOcIA-3p2IuibqB48XUqpwu4y0Kz9BTH_sQ3oWwcAWZxCQyetxwgT12d619IsNS3CufI8JXI7QxpyZD5BF0Da7BFkDdkHo97zMWgwWQjP2lBJrxKGUaWrIJBLV2qaudaQGQfcCUzrkPIOCnLCCaLgGneMbJuvtPamYWnsN1QP3JgCQKL-1N3ywyLsc-fkB26O2gxvmjKKqSh" alt="Grey Sofa" />
              </div>
              <h3 className="font-headline-md text-[16px] leading-tight mb-1 truncate text-on-surface">Grey Sofa</h3>
              <p className="font-body-sm text-on-surface-variant mb-4">{getPricing(45900, 459)}</p>
              <button className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-label-caps py-2 rounded-lg transition-colors active:scale-95">
                Купить
              </button>
            </div>

            {/* Card 2 */}
            <div className="snap-start flex-none w-[240px] bg-surface-container/70 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-md hover:bg-surface-container-high transition-colors">
              <div className="w-full aspect-square rounded-lg mb-3 overflow-hidden bg-white flex items-center justify-center">
                <img className="w-full h-full object-contain mix-blend-multiply" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1keC0GhixSDtt_G_fPQQhKcIkd9LKS1kxoWZMJRS1MfhVOqdBfePUvV-hIAOxh34pbBjLn30DgvsSInC_YRSMu6VAhqcfa6goi6M6WyDFnBnRxZmnced6sRuVjosC09wx9sJLFqD-_Mf0Hy1yC8fhym3u7mY6TDpDi-jd_N4bg3hvrzhFWpGnUGQhafud6ZuoNSi1RlsSLoZLH6dsGpO5xOse1v5-eyUJ1VF9_x7_YdR1GfDrwJd3s7T7E4wNYWWkK_xNp1e6pUxM" alt="Oak Coffee Table" />
              </div>
              <h3 className="font-headline-md text-[16px] leading-tight mb-1 truncate text-on-surface">Oak Coffee Table</h3>
              <p className="font-body-sm text-on-surface-variant mb-4">{getPricing(12500, 125)}</p>
              <button className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-label-caps py-2 rounded-lg transition-colors active:scale-95">
                Купить
              </button>
            </div>

            {/* Card 3 (Using screen.png logic from instruction) */}
            <div className="snap-start flex-none w-[240px] bg-surface-container/70 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-md hover:bg-surface-container-high transition-colors">
              <div className="w-full aspect-square rounded-lg mb-3 overflow-hidden bg-white flex items-center justify-center relative">
                {/* Adding requested screen.png (using fallback if missing locally) */}
                <img className="w-full h-full object-contain mix-blend-multiply" src="/screen.png" onError={(e) => { e.target.src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEvr37l8-c-l3sXWpa8J8NcQMmqR5XMCpSzyrIvUkqtVO63OCDezYVgz3IIADENWebOY1kyI5Oer91Ly_LKQQu2d7EVZoxvukjSKDROi6N8F1Z8_j3xGHhLDPLWZ4NyIeoo4NONnGOVC5Ddf60IiUPCxFSBvtLCgirByV2alayHX6X8DJ-G5MUZkuxMr_lGZ7u4Ls0Ke2AJo8ApTHYnCk0CGUI6zU24LB-zNgXZSx4-7PbcOiavohpqNNBK_ITDyKovEgMMy_1sfys' }} alt="Screen/Floor Lamp" />
              </div>
              <h3 className="font-headline-md text-[16px] leading-tight mb-1 truncate text-on-surface">Modern Piece</h3>
              <p className="font-body-sm text-on-surface-variant mb-4">{getPricing(8900, 89)}</p>
              <button className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white font-label-caps py-2 rounded-lg transition-colors active:scale-95">
                Купить
              </button>
            </div>

          </div>
        </section>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-xl border-t border-white/5 p-4 z-40 pb-safe">
        <div className="flex flex-col gap-3 max-w-md mx-auto">
          <button className="w-full bg-[#3B82F6] text-white font-headline-md py-3 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Share2 size={20} />
            Поделиться с клиентом
          </button>
          <button 
            onClick={onReset}
            className="w-full bg-transparent border border-white/20 text-on-surface font-headline-md py-3 rounded-xl hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} />
            Сделать еще
          </button>
        </div>
      </div>
    </div>
  );
}
