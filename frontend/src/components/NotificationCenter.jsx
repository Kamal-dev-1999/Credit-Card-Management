import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, DollarSign, AlertTriangle, Sparkles, ArrowRight, Trash2 } from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose, notifications, markAllAsRead, onMarkAsRead }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [marking, setMarking] = useState(null); // Track which notification is being marked

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    console.log('🔔 [NotificationCenter] handleMarkAsRead called with ID:', notificationId);
    console.log('🔔 [NotificationCenter] onMarkAsRead prop is:', onMarkAsRead ? 'DEFINED' : 'UNDEFINED');
    
    if (!onMarkAsRead) {
      console.warn('⚠️ [NotificationCenter] WARNING: onMarkAsRead prop is undefined! Function will not be called.');
      return;
    }
    
    setMarking(notificationId);
    try {
      console.log('🔔 [NotificationCenter] Calling onMarkAsRead...');
      await onMarkAsRead(notificationId);
      console.log('🔔 [NotificationCenter] onMarkAsRead completed successfully');
    } catch (err) {
      console.error('❌ [NotificationCenter] Error in handleMarkAsRead:', err);
      console.error('❌ [NotificationCenter] Error details:', {
        message: err.message,
        stack: err.stack
      });
    } finally {
      setMarking(null);
    }
  };

  const getIcon = (icon) => {
    const iconProps = { size: 20 };
    switch(icon) {
      case 'money': 
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white shrink-0 shadow-lg"><DollarSign {...iconProps} /></div>;
      case 'alert': 
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white shrink-0 shadow-lg"><AlertTriangle {...iconProps} /></div>;
      case 'sparkles': 
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white shrink-0 shadow-lg"><Sparkles {...iconProps} /></div>;
      case 'success': 
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-lg"><Check {...iconProps} /></div>;
      default: 
        return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg"><Bell {...iconProps} /></div>;
    }
  };

  const NotificationList = () => (
    <div className="flex flex-col divide-y divide-gray-100">
      {notifications.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-400 font-medium text-sm mb-1">No notifications yet</p>
          <p className="text-gray-300 text-xs">Your notifications will appear here</p>
        </motion.div>
      ) : (
        notifications.map((notif, idx) => (
          <motion.div 
            key={notif.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => {
              console.log('🔔 [NotificationCenter] Notification clicked. ID:', notif.id, 'Read status:', notif.read);
              !notif.read && handleMarkAsRead(notif.id);
            }}
            className={`p-4 flex gap-3 transition-all duration-200 cursor-pointer group ${!notif.read ? 'hover:from-yellow-50/50 hover:to-transparent bg-yellow-50/40 hover:bg-yellow-50/60' : 'hover:from-gray-50 hover:to-transparent'}`}
          >
            {getIcon(notif.icon)}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold leading-tight ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                </div>
                <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">{notif.time}</span>
              </div>
              {notif.actionUrl && (
                <a 
                  href={notif.actionUrl}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-yellow-600 mt-2 transition-colors group"
                >
                  View <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
            </div>
            {!notif.read && (
              <div className="flex flex-col items-center gap-1">
                {marking === notif.id ? (
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 animate-pulse"></div>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 shrink-0 group-hover:scale-150 transition-transform"></div>
                )}
                <div className="text-[10px] text-gray-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Mark as read
                </div>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {isMobile ? (
            // Mobile Overlay
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
                onClick={onClose}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 top-16 bg-white rounded-t-3xl shadow-2xl z-[9999] flex flex-col overflow-hidden"
              >
                <div className="p-6 flex justify-between items-center border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50 sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white shadow-md">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                      {unreadCount > 0 && <span className="text-xs text-gray-500">{unreadCount} new</span>}
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <NotificationList />
                </div>
                {unreadCount > 0 && (
                  <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                    <button 
                      onClick={() => {
                        console.log('🔔 [NotificationCenter] Mark All as Read button clicked');
                        console.log('🔔 [NotificationCenter] markAllAsRead prop is:', markAllAsRead ? 'DEFINED' : 'UNDEFINED');
                        if (markAllAsRead) {
                          markAllAsRead();
                        } else {
                          console.warn('⚠️ [NotificationCenter] WARNING: markAllAsRead prop is undefined!');
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                    >
                      Mark All as Read
                    </button>
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            // Desktop Popover
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.90 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.90 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-20 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100/50 z-[9999] overflow-hidden transform-gpu flex flex-col backdrop-blur-sm"
            >
              <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-gradient-to-r from-white to-gray-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-800 tracking-wide">Messages</h3>
                  {unreadCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      console.log('🔔 [NotificationCenter] Mark all as read link clicked (header)');
                      console.log('🔔 [NotificationCenter] markAllAsRead prop is:', markAllAsRead ? 'DEFINED' : 'UNDEFINED');
                      if (markAllAsRead) {
                        markAllAsRead();
                      } else {
                        console.warn('⚠️ [NotificationCenter] WARNING: markAllAsRead prop is undefined!');
                      }
                    }}
                    className="text-xs font-semibold text-primary hover:text-yellow-600 transition-colors hover:bg-yellow-50/50 px-2 py-1 rounded"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                <NotificationList />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
