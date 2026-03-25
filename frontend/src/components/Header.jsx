import React, { useState } from 'react';
import { Bell, User, Menu } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Header = ({ notifications, setNotifications, unreadCount }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({...n, read: true})));
  };

  return (
    <div className="flex justify-between items-center mb-8 relative z-30">
      {/* Mobile left side (Hamburger & Logo) */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-green-500 flex items-center justify-center shadow-sm">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight"><span>L</span><span className="text-primary">a</span><span>n</span><span className="text-primary">a</span></h1>
      </div>

      {/* Desktop empty left spacer or greeting */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Overview</h1>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-4">
        {/* Bell Icon */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-500 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </button>
          
          <NotificationCenter 
             isOpen={isNotifOpen} 
             onClose={() => setIsNotifOpen(false)} 
             notifications={notifications}
             markAllAsRead={markAllAsRead}
          />
        </div>

        {/* Profile */}
        <button className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-200 shadow-sm flex items-center justify-center text-white overflow-hidden focus:outline-none focus:ring-2 focus:ring-gray-300">
           <img src="https://i.pravatar.cc/150?img=33" alt="User Profile" className="w-full h-full object-cover" />
        </button>

        {/* Mobile Menu Toggle (we don't implement drawer yet, just visual) */}
        <button className="lg:hidden p-2 text-gray-600 hover:text-primary transition-colors bg-white rounded-lg shadow-sm border border-gray-100 ml-2">
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
};

export default Header;
