import React from 'react';
import { LogIn, LogOut, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  user: any;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, isLoggingIn, onLogin, onLogout }) => {
  return (
    <nav className="w-full bg-black text-white py-3.5 px-4 sm:px-6 border-b border-yellow-500/80 sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-xl flex items-center justify-center text-black font-black text-lg shadow-md shadow-yellow-500/20">
            TT
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
                Think Tank Digital <span className="text-yellow-400">SEO Writer</span>
              </h1>
              <span className="hidden md:inline-block text-[10px] uppercase font-black tracking-widest bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2 py-0.5 rounded-full">
                Omnichannel AI
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              US Grammar • Alex Hormozi Value • Zig Ziglar 2026 Sales Engine
            </p>
          </div>
        </div>
        
        {/* Navigation / Workspace Connection */}
        <div className="flex items-center gap-3 text-sm font-medium">
          {user ? (
            <div className="flex items-center gap-2.5 bg-gray-900 border border-gray-800 rounded-full pl-3 pr-2 py-1">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-none truncate max-w-[120px]">
                  {user.displayName || 'Authorized User'}
                </span>
                <span className="text-[10px] text-yellow-400 font-bold leading-normal">
                  Google Workspace Active
                </span>
              </div>
              
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  referrerPolicy="no-referrer"
                  alt="Profile"
                  className="w-7 h-7 rounded-full border border-yellow-500 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-yellow-500 text-black flex items-center justify-center text-xs font-black">
                  {(user.displayName || 'U')[0].toUpperCase()}
                </div>
              )}

              <button
                onClick={onLogout}
                className="text-gray-400 hover:text-red-400 p-1 rounded-full transition-all cursor-pointer"
                title="Disconnect Google Workspace"
              >
                <LogOut className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all outline-none cursor-pointer shadow-sm hover:shadow-yellow-500/20"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3.5 w-3.5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connecting...</span>
                </span>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Connect Google</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;