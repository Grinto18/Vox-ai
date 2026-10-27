import React from 'react';
import { Film, Clapperboard, Settings, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProviderStatus } from '../types';

interface NavbarProps {
  currentTab: 'create' | 'projects' | 'settings';
  onSelectTab: (tab: 'create' | 'projects' | 'settings') => void;
  isDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
  providerStatus?: ProviderStatus | null;
  projectsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isDemoMode,
  onToggleDemoMode,
  providerStatus,
  projectsCount,
}) => {
  const isAiConnected = providerStatus?.geminiText.status === 'connected';

  return (
    <header className="sticky top-0 z-50 border-b border-[#2d2c29] bg-[#171717]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onSelectTab('create')}>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#C6A15B] to-[#997939] flex items-center justify-center shadow-lg shadow-[#C6A15B]/20">
              <Film className="w-6 h-6 text-[#171717]" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-[#F7F3EA] font-['Cairo']">
                  VOX <span className="text-[#C6A15B]">AI STUDIO</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2A2925] text-[#C6A15B] border border-[#C6A15B]/30 tracking-wider">
                  PRODUCER
                </span>
              </div>
              <p className="text-xs text-[#77736D] font-medium font-['Tajawal']">
                من الفكرة إلى الفيديو النهائي — استوديو الأفلام الوثائقية
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2 bg-[#21201D] p-1.5 rounded-xl border border-[#33312C]">
            <button
              onClick={() => onSelectTab('create')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                currentTab === 'create'
                  ? 'bg-[#C6A15B] text-[#171717] shadow-sm'
                  : 'text-[#F7F3EA]/80 hover:text-[#F7F3EA] hover:bg-[#2C2A25]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              إنشاء فيديو جديد
            </button>

            <button
              onClick={() => onSelectTab('projects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                currentTab === 'projects'
                  ? 'bg-[#C6A15B] text-[#171717] shadow-sm'
                  : 'text-[#F7F3EA]/80 hover:text-[#F7F3EA] hover:bg-[#2C2A25]'
              }`}
            >
              <Clapperboard className="w-4 h-4" />
              المشاريع
              {projectsCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full ${
                    currentTab === 'projects' ? 'bg-[#171717]/20 text-[#171717]' : 'bg-[#33312C] text-[#C6A15B]'
                  }`}
                >
                  {projectsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                currentTab === 'settings'
                  ? 'bg-[#C6A15B] text-[#171717] shadow-sm'
                  : 'text-[#F7F3EA]/80 hover:text-[#F7F3EA] hover:bg-[#2C2A25]'
              }`}
            >
              <Settings className="w-4 h-4" />
              الإعدادات والتشخيص
            </button>
          </nav>

          {/* Right Tools: Demo Mode & System Status */}
          <div className="flex items-center gap-3">
            {/* Demo mode badge */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                isDemoMode
                  ? 'bg-[#2A261D] border-[#C6A15B]/50 text-[#C6A15B]'
                  : 'bg-[#1F1F1F] border-[#333] text-[#77736D] hover:border-[#555]'
              }`}
              onClick={() => onToggleDemoMode(!isDemoMode)}
              title="الوضع التجريبي ينشئ فيديوهات حقيقية دون استهلاك حصص API"
            >
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-[#C6A15B] animate-pulse' : 'bg-gray-500'}`} />
              <span className="font-semibold">{isDemoMode ? 'الوضع التجريبي نشط' : 'الوضع الحقيقي'}</span>
            </div>

            {/* Provider indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E1E1E] border border-[#2D2D2D] text-xs text-[#F7F3EA]/90 cursor-pointer"
              onClick={() => onSelectTab('settings')}
              title="حالة محرك الذكاء الاصطناعي ومونتاج الفيديو"
            >
              {isAiConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Gemini جاهز</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-medium">FFmpeg نشط</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav Tabs */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-[#262522]">
          <button
            onClick={() => onSelectTab('create')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold ${
              currentTab === 'create' ? 'bg-[#C6A15B] text-[#171717]' : 'text-[#F7F3EA]/70'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            إنشاء فيديو
          </button>
          <button
            onClick={() => onSelectTab('projects')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold ${
              currentTab === 'projects' ? 'bg-[#C6A15B] text-[#171717]' : 'text-[#F7F3EA]/70'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            المشاريع ({projectsCount})
          </button>
          <button
            onClick={() => onSelectTab('settings')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-bold ${
              currentTab === 'settings' ? 'bg-[#C6A15B] text-[#171717]' : 'text-[#F7F3EA]/70'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            التشخيص
          </button>
        </div>
      </div>
    </header>
  );
};
