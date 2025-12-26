
import React from 'react';

interface HeaderProps {
  onLogoClick: () => void;
  isAdmin?: boolean;
  userName?: string;
  onAdminToggle?: () => void;
  onLogout?: () => void;
  isAdminOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick, isAdmin, userName, onAdminToggle, onLogout, isAdminOpen }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 backdrop-blur-2xl bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={onLogoClick}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
            <span className="text-white font-black text-lg italic">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-white tracking-tighter leading-none">SVGA <span className="text-sky-400">enius</span></span>
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mt-0.5">Quantum Suite</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[8px] font-black text-sky-500 uppercase tracking-widest leading-none mb-1">User</span>
            <span className="text-[10px] font-bold text-white opacity-70">{userName || 'Administrator'}</span>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <button 
                onClick={(e) => { e.preventDefault(); onAdminToggle?.(); }}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  isAdminOpen 
                    ? 'bg-amber-500 text-white border-amber-400 shadow-glow-amber' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                <span className="hidden sm:inline">لوحة التحكم</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
            
            <button 
              onClick={(e) => { e.preventDefault(); onLogout?.(); }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all"
            >
              <span className="hidden sm:inline">تسجيل الخروج</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </nav>
        </div>
      </div>
      <style>{`
        .shadow-glow-amber { box-shadow: 0 0 20px rgba(245, 158, 11, 0.4); }
      `}</style>
    </header>
  );
};
