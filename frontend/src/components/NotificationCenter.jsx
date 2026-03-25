import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, DollarSign, AlertTriangle, Sparkles } from 'lucide-react';

const NotificationCenter = ({ isOpen, onClose, notifications, markAllAsRead }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'money': return <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0"><DollarSign size={20} /></div>;
      case 'alert': return <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><AlertTriangle size={20} /></div>;
      case 'sparkles': return <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shrink-0"><Sparkles size={20} /></div>;
      case 'success': return <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-green-200"><Check size={20} /></div>;
      default: return <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><Bell size={20} /></div>;
    }
  };

  const NotificationList = () => (
    <div className="flex flex-col">
      {notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-400 font-medium">No notifications</div>
      ) : (
        notifications.map((notif) => (
          <div key={notif.id} className={`p-4 border-b border-gray-50 flex gap-4 transition-colors hover:bg-gray-50 ${!notif.read ? 'bg-yellow-50/30' : ''}`}>
            {getIcon(notif.icon)}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h4 className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{notif.title}</h4>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notif.time}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-snug">{notif.message}</p>
              <button className="text-xs font-bold text-primary mt-2 hover:text-yellow-600 transition-colors">
                View Details
              </button>
            </div>
            {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>}
          </div>
        ))
      )}
    </div>
  );

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
                className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40"
                onClick={onClose}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 top-12 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
              >
                <div className="p-5 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                  <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                  <div className="flex items-center gap-3">
                    <button onClick={markAllAsRead} className="text-xs font-semibold text-gray-500 hover:text-primary transition-colors">
                      Mark all as read
                    </button>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pb-8">
                  <NotificationList />
                </div>
              </motion.div>
            </>
          ) : (
            // Desktop Popover
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-14 w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden transform-gpu flex flex-col"
            >
              <div className="p-4 flex justify-between items-center border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-800 tracking-wide">Notifications <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{notifications.filter(n => !n.read).length}</span></h3>
                <button onClick={markAllAsRead} className="text-xs font-semibold text-primary hover:text-yellow-600 transition-colors">
                  Mark all as read
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
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
