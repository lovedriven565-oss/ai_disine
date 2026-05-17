import { ArrowLeft, X, CloudUpload, MagicWand, Image as ImageIcon, Palette, User, Code } from 'lucide-react';

export default function UploadScreen({ onGenerate }) {
  return (
    <div className="flex flex-col min-h-screen relative pt-14 pb-[88px]">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl shadow-sm flex items-center justify-between px-4 h-14 border-b border-white/10">
        <button className="text-primary hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center w-10 h-10">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-headline-md text-headline-md text-on-surface font-bold text-center flex-1">AI Staging</h1>
        <button className="text-on-surface-variant hover:opacity-80 transition-opacity active:scale-95 flex items-center justify-center w-10 h-10">
          <X size={24} />
        </button>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto">
        {/* Upload Zone */}
        <section className="flex flex-col gap-2">
          <div className="relative w-full h-16 rounded-xl border-2 border-dashed border-primary/50 overflow-hidden bg-surface-container flex flex-row items-center justify-center gap-3 group cursor-pointer hover:border-primary transition-colors px-4">
            <CloudUpload className="text-primary" size={24} />
            <p className="font-body-sm text-on-surface text-center">Загрузить фото пустой комнаты</p>
          </div>
        </section>

        {/* Magic Slider Preview */}
        <section className="flex flex-col gap-2">
          <h2 className="font-headline-md text-on-surface">Посмотрите на магию ИИ</h2>
          <div className="relative w-full h-[30vh] rounded-xl overflow-hidden bg-surface-variant select-none shadow-lg">
            <img 
              alt="Готовый интерьер" 
              className="absolute inset-0 w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida/ADBb0ugWnsqUKx4W5h-jWOZoxB88cjQ3jRaVwZdS75IwH-ceYq3cDv6ucmj2ajuEs_YqkY-L_vah6nLa0Ly4vx3YLk_1m7DlbSBBUXG1LXV4yOujeTVxHRHz7GDGcGbfUZi11FRYkYDRT3tPuQjD4IhYQuM5ho8tuPtB3vOXNjCGZmNXInQ9m-SslEw2tNuJOxR9k3BHo94Qo754ruheuJBkvA52LuZ0iCqiQ8n_6dlmedgfWMf85KFf6hpfJmRU" 
            />
            <div className="absolute bottom-3 right-3 bg-surface/80 text-on-surface text-label-caps px-2 py-1 rounded backdrop-blur-md z-0">После</div>
            
            <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r-[3px] border-white z-10 shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
              <img 
                alt="Пустое помещение" 
                className="absolute top-0 left-0 h-full w-[200%] max-w-none object-cover object-left" 
                src="https://lh3.googleusercontent.com/aida/ADBb0ugaplghrz_oaJY6SIdBcLyEG2MPaveTfWVDruU1uh7YnfwHRgY-wNsF5-fW4X1OMd53MC31xK0HmJOMSQklDI9DrO6mL2_hR3IiazSTs1iOFCNRC_tMhL_Vv_bqR18GI-1zkAKiS8lMJaXU02sBTraWRVSTabQZ_F037YwjjVWXM8VIVwsfamYVsVZHfaHsJPOJOT9K1id6acZl_9RLWlyTVnA-ssmlx1ULbY-6cDnVwEFw5SqISEzYPI0" 
              />
              <div className="absolute bottom-3 left-3 bg-surface/80 text-on-surface text-label-caps px-2 py-1 rounded backdrop-blur-md">До</div>
            </div>
            
            <div className="absolute inset-y-0 left-1/2 flex items-center justify-center z-20 -ml-4 pointer-events-none">
              <div className="w-8 h-8 bg-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] flex items-center justify-center text-background pointer-events-auto cursor-ew-resize">
                <Code size={16} />
              </div>
            </div>
          </div>
        </section>

        {/* Style Selection */}
        <section className="flex flex-col gap-4 pb-12">
          <h2 className="font-headline-md text-on-surface">Выберите стиль</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 -mx-4 px-4 no-scrollbar">
            {/* Card 1 */}
            <button className="snap-start shrink-0 w-40 glass-card rounded-xl p-3 flex flex-col gap-3 relative border-primary ring-2 ring-primary bg-primary/10 overflow-hidden text-left transition-transform active:scale-95">
              <div className="w-full h-24 rounded-lg bg-surface-variant overflow-hidden relative">
                <img alt="Скандинавский" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsbKw5UkXdZ8xHDFSFguPVhuaE1F1j87EN7FMrrU3Dj5BQVcGKVenQUJu9DIdTrjYqf4c8SnBsW4Zn5IRO-7IfF5q_Uy0AlTIyuYGkl_xsXB6cEW7gMyxoJ0XHHMMl5oI4H6hkM4-IDATFWUTFvzJVAFAWBjgXa8ZejbmlubrMLIi6qNWlzSZovdc9LoT2CcrxqlJtu704tOxDBs9jjWUKJFiBCl3u0u7Jsu4mO7VsNYzcd2RQfTXaTbQdKNans1cdU531J6rm6xAo" />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-body-sm text-on-surface font-semibold">Скандинавский</span>
                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-surface"></div>
                </div>
              </div>
            </button>
            {/* Card 2 */}
            <button className="snap-start shrink-0 w-40 glass-card rounded-xl p-3 flex flex-col gap-3 relative overflow-hidden text-left transition-transform active:scale-95 hover:border-primary/50">
              <div className="w-full h-24 rounded-lg bg-surface-variant overflow-hidden relative">
                <img alt="Лофт" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBQiCCd3qudKk6_uQB1ZxfzkoCpNSJRaG0F_X1NeZgwxHW_kzuiy3-vSCbGK93kr467XNGGU9gluS12WQTsu33ChCJTOMabjcHw0thgIypbndjE6BIA2FkvA1ZDznkQ6XkSgBdOB34txuMdpVrTEruyZQ21647ydJf8HVCaNprwwqjWMVf_LktdYEIFXIw9xIgoYnZ3jSwzGB34b_eMWV35GySsFQDTf1DtGhgdRIYq3Fm8-DK7d-CMV7Q8yott7ZqlCyU8dmaXpkB" />
              </div>
              <span className="font-body-sm text-on-surface-variant">Лофт</span>
            </button>
            {/* Card 3 */}
            <button className="snap-start shrink-0 w-40 glass-card rounded-xl p-3 flex flex-col gap-3 relative overflow-hidden text-left transition-transform active:scale-95 hover:border-primary/50">
              <div className="w-full h-24 rounded-lg bg-surface-variant overflow-hidden relative">
                <img alt="Неоклассика" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7ybKcdNYtoL9zFL0LPo1uIlsv_UM7fN-hF4av_SDSpHb8Na5hxvtO7hVpBZ-dlHDnu9fYcyk2pAt40RL2qaRFxc4Y5eP6EKkS2QEqIMZpZGtpvXEAQQbaLyKM57BYTIHVnpRX8sfM553cycKyc8hl17Y7bDqX10PoBcGdfYy9gJ5AsaMz6nMRATSxKm8jiUwHNAEVo5tmgxWariJRTr-jx1gEUR1HReTiy0VcObyoufxoacs9oqCmmUqNwOkdpGuBUhAevfcG_esk" />
              </div>
              <span className="font-body-sm text-on-surface-variant">Неоклассика</span>
            </button>
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-0 w-full px-4 z-40 flex justify-center">
        <button 
          onClick={onGenerate}
          className="w-full max-w-md bg-[#3B82F6] text-white font-headline-md py-4 px-6 rounded-xl shadow-[0_4px_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-2 transition-transform active:scale-95 hover:bg-[#2563EB]"
        >
          {/* Using text because standard icons might not have magic_button */}
          <span className="text-xl">✨</span>
          <span>Сгенерировать интерьер</span>
        </button>
      </div>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pt-2 pb-6 bg-surface-container/80 backdrop-blur-xl rounded-t-xl z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <button className="flex flex-col items-center justify-center text-primary bg-primary-container/20 rounded-xl px-3 py-1 active:scale-90 transition-all duration-200">
          <span className="text-lg mb-1">✨</span>
          <span className="font-label-caps text-[10px]">Studio</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-all duration-200">
          <ImageIcon size={20} className="mb-1" />
          <span className="font-label-caps text-[10px]">Gallery</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-all duration-200">
          <Palette size={20} className="mb-1" />
          <span className="font-label-caps text-[10px]">Styles</span>
        </button>
        <button className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-all duration-200">
          <User size={20} className="mb-1" />
          <span className="font-label-caps text-[10px]">Profile</span>
        </button>
      </nav>
    </div>
  );
}
