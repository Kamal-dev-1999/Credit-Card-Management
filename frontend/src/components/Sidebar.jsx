import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CreditCard,
  Sparkles,
  Settings,
  LogOut,
  Mail
} from 'lucide-react';

const Sidebar = ({ activePage = 'dashboard', setActivePage = () => {}, onSignOut = () => {} }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('lana_user_email'));
  const userEmail = localStorage.getItem('lana_user_email');

  const handleSignOut = () => {
    setIsLoggedIn(false);
    onSignOut();
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'manage-cards', name: 'Manage Cards', icon: <CreditCard size={18} /> },
    { id: 'ai-insights', name: 'AI Insights', icon: <Sparkles size={18} /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={18} /> },
  ];

  return (
    <div className="w-64 h-full bg-white flex flex-col justify-between overflow-y-auto hidden lg:flex border-r border-gray-100 pb-6 rounded-l-3xl relative">
      <div>
        <div className="flex items-center gap-2 p-8 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-green-500 flex items-center justify-center shadow-sm">
             <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight"><span>L</span><span className="text-primary">a</span><span>n</span><span className="text-primary">a</span></h1>
        </div>
        
        {/* Divider */}
        <div className="mx-8 mb-6 h-px bg-gray-100"></div>
        
        <nav className="flex flex-col gap-1 px-4">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            return (
            <div 
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex items-center justify-between px-5 py-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-primary text-white shadow-md shadow-yellow-200' : 'text-gray-500 hover:bg-yellow-50 hover:text-primary'} font-medium text-sm`}
            >
              <div className="flex items-center gap-3">
                <div className={`${isActive ? 'text-white' : 'text-gray-400'}`}>{item.icon}</div>
                {item.name}
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
            </div>
            );
          })}
        </nav>
      </div>

      <div className="px-5 mt-8 flex flex-col gap-2">
        {/* Decorative right scrollbar indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col items-center py-6 opacity-60">
           <div className="w-0 h-0 border-l-[4px] border-l-transparent border-b-[6px] border-b-gray-400 border-r-[4px] border-r-transparent mb-1"></div>
           <div className="w-1.5 h-[600px] bg-gray-300 rounded-full"></div>
           <div className="w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-gray-400 border-r-[4px] border-r-transparent mt-1"></div>
        </div>

        {/* Separator */}
        <div className="mx-3 mt-4 mb-2 h-px bg-gray-100"></div>

        {userEmail ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-gray-600 font-medium truncate">{userEmail}</span>
            </div>
            <button onClick={handleSignOut} className="flex items-center justify-center gap-2 w-11/12 bg-primary hover:bg-yellow-500 text-white py-3.5 rounded-2xl font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-yellow-200">
              Sign Out
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = '/api/auth/google'}
            className="flex items-center justify-center gap-2 w-11/12 bg-white hover:bg-yellow-50 text-gray-700 border border-gray-200 hover:border-primary py-3.5 rounded-2xl font-semibold text-sm transition-all active:scale-95 shadow-sm"
          >
            <Mail size={16} className="text-red-500" />
            Sign in with Gmail
            
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
