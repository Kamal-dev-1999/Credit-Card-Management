import React, { useState, useEffect } from 'react';
import { Bell, Menu, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Header = ({ notifications, setNotifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onClearAll }) => {
  const { userEmail, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);

  useEffect(() => {}, [onMarkAsRead, onMarkAllAsRead, onClearAll]);

  const handleSignOut = async () => {
    await logout();
    window.location.reload();
  };

  const createTestNotifications = async () => {
    setIsCreatingTest(true);
    try {
      const response = await fetch('http://localhost:5000/api/notifications/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to create test notifications: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Test notifications created:', data);
      
      // Refetch notifications to update the list
      const notifRes = await fetch('http://localhost:5000/api/notifications', {
        credentials: 'include'
      });
      const notifData = await notifRes.json();
      setNotifications(notifData.notifications || []);
      
      alert(`✨ Created ${data.count} test notifications!`);
    } catch (err) {
      console.error('❌ Error creating test notifications:', err);
      alert('Failed to create test notifications: ' + err.message);
    } finally {
      setIsCreatingTest(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-8 relative z-[1000]">
      {/* Mobile left side */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-green-500 flex items-center justify-center shadow-sm">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight"><span>L</span><span className="text-primary">a</span><span>n</span><span className="text-primary">a</span></h1>
      </div>

      {/* Desktop title */}
      <div className="hidden lg:block">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Overview</h1>
      </div>

      {/* Right side icons */}
      <div className="flex items-center gap-4">
        {/* Bell Icon - Enhanced & Prominent */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${
              unreadCount > 0
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white scale-110 hover:scale-125'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-primary hover:border-primary'
            }`}
            title={unreadCount > 0 ? `${unreadCount} new notification${unreadCount !== 1 ? 's' : ''}` : 'Notifications'}
          >
            <Bell size={24} />
            
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-3 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
                <span className="absolute inset-0 rounded-full border-2 border-yellow-300 animate-pulse opacity-75"></span>
              </>
            )}
          </button>

          <NotificationCenter
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            markAllAsRead={onMarkAllAsRead}
            onMarkAsRead={onMarkAsRead}
            onClearAll={onClearAll}
          />
        </div>

        {/* User Info + Avatar — only shown when signed in */}
        {userEmail ? (
          <div className="flex items-center gap-2">
            {/* Test Notifications Button - Developer Tool */}
            <button
              onClick={createTestNotifications}
              disabled={isCreatingTest}
              title="Create test notifications (developer tool)"
              className="hidden md:flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg px-2.5 py-1 text-xs text-blue-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingTest ? '⏳' : '✨'} Test
            </button>
            
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-3 py-1.5 flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-gray-800 leading-tight">
                  {userEmail.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
                <span className="text-[10px] text-gray-400 leading-tight truncate max-w-[120px]">{userEmail}</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-primary flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors shrink-0 ml-1"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
            className="hidden sm:flex items-center gap-2 bg-white border border-dashed border-gray-300 hover:border-primary hover:bg-yellow-50 rounded-2xl px-3 py-1.5 text-xs text-gray-500 hover:text-primary font-semibold transition-colors"
          >
            <Mail size={14} className="text-red-500" />
            Sign in with Gmail
          </button>
        )}

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden p-2 text-gray-600 hover:text-primary transition-colors bg-white rounded-lg shadow-sm border border-gray-100 ml-1">
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
};

export default Header;
