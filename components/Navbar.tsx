import React from 'react';
import { LayoutGrid, CalendarDays, LogOut, User as UserIcon, Settings, Trash2 } from 'lucide-react';
import { ViewState, User } from '../types';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: User;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, user, onLogout, onDeleteAccount }) => {
  return (
    <>
      <nav className="sticky top-0 z-50 bg-accent-900 border-b border-accent-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView('HOME')}>
              <div className="flex-shrink-0 flex items-center">
                <img src="/logo.png" alt="SNS iHub Logo" className="h-12 w-auto object-contain drop-shadow-lg" />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
              <div className="hidden sm:flex items-center space-x-1">
                <button
                  onClick={() => setView('HOME')}
                  className={`flex items-center px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${currentView === 'HOME'
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-accent-300 hover:text-white hover:bg-accent-800'
                    }`}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Halls
                </button>

                <button
                  onClick={() => setView('MY_BOOKINGS')}
                  className={`flex items-center px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${currentView === 'MY_BOOKINGS'
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-accent-300 hover:text-white hover:bg-accent-800'
                    }`}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  My Bookings
                </button>

                {(user.role === 'admin_ic' || user.role === 'coordinator' || user.role === 'head_ops') && (
                  <button
                    onClick={() => setView('HALL_CONFIG')}
                    className={`flex items-center px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${currentView === 'HALL_CONFIG'
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                      : 'text-accent-300 hover:text-white hover:bg-accent-800'
                      }`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Config
                  </button>
                )}
              </div>

              <div className="h-8 w-px bg-accent-500/50 hidden sm:block"></div>

              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-semibold text-white">{user.name}</span>
                  <span className="text-xs text-accent-400">{user.email}</span>
                </div>
                <div className="w-10 h-10 bg-accent-800 rounded-full flex items-center justify-center border border-accent-700 text-brand-400 shadow-inner">
                  <UserIcon className="w-5 h-5" />
                </div>

                <button
                  onClick={onLogout}
                  className="ml-2 p-2.5 text-accent-400 hover:text-brand-400 hover:bg-accent-800 rounded-full transition-all duration-300"
                  title="Log Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>

                <button
                  onClick={onDeleteAccount}
                  className="p-2.5 text-red-400/80 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all duration-300"
                  title="Delete Account"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation (All Users) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 w-full bg-accent-900 border-t border-accent-800 z-[100] px-6 py-3 flex justify-around items-center shadow-[0_-8px_30px_-4px_rgba(15,23,42,0.5)]">
        <button
          onClick={() => setView('HOME')}
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${currentView === 'HOME' ? 'text-brand-400 scale-110 drop-shadow-md' : 'text-accent-500 hover:text-accent-400'}`}
        >
          <LayoutGrid className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Halls</span>
        </button>
        <button
          onClick={() => setView('MY_BOOKINGS')}
          className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${currentView === 'MY_BOOKINGS' ? 'text-brand-400 scale-110 drop-shadow-md' : 'text-accent-500 hover:text-accent-400'}`}
        >
          <CalendarDays className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Bookings</span>
        </button>
        {(user.role === 'admin_ic' || user.role === 'coordinator' || user.role === 'head_ops') && (
          <button
            onClick={() => setView('HALL_CONFIG')}
            className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 ${currentView === 'HALL_CONFIG' ? 'text-brand-400 scale-110 drop-shadow-md' : 'text-accent-500 hover:text-accent-400'}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Config</span>
          </button>
        )}
      </div>
    </>
  );
};