import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CardStack from './components/CardStack';
import DueSummaryCard from './components/DueSummaryCard';
import DueDatesGraph from './components/DueDatesGraph';
import CreditHealthCard from './components/CreditHealthCard';
import AITipCard from './components/AITipCard';
import RecentBillsTable from './components/RecentBillsTable';
import ManageCards from './components/ManageCards';
import DuesBreakdownChart from './components/DuesBreakdownChart';

import AIInsights from './components/AIInsights';
import GlobalChatbot from './components/GlobalChatbot';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeCard, setActiveCard] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const refreshDashboard = () => setRefreshKey(prev => prev + 1);

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    try {
      const userEmail = localStorage.getItem('lana_user_email');
      const res = await fetch('http://127.0.0.1:5000/api/notifications', {
        headers: {
          'x-user-email': userEmail || ''
        }
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      console.log(`📬 Fetched ${data.notifications?.length || 0} notifications`);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      const userEmail = localStorage.getItem('lana_user_email');
      await fetch('http://127.0.0.1:5000/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'x-user-email': userEmail || ''
        }
      });
      fetchNotifications(); // Refresh notifications
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderContent = () => {
    if (activePage === 'dashboard') {
      return (
        <div className="animate-in fade-in duration-500">
          {/* Top Section */}
          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 mb-8">
            {/* Left Column - Cards Stack & Breakdown */}
            <div className="w-full xl:w-[340px] shrink-0 flex flex-col gap-6 order-2 xl:order-1">
              <div className="xl:h-[480px] h-auto">
                <CardStack onCardSelect={setActiveCard} setActivePage={setActivePage} />
              </div>
              <DuesBreakdownChart refreshKey={refreshKey} />
            </div>
            
            {/* Right Column - Top Stats & Widgets */}
            <div className="flex-1 flex flex-col gap-6 lg:gap-8 min-w-0">
              
               <div className="flex flex-col md:flex-row gap-6 lg:gap-8 lg:min-h-[220px] min-w-0">
                 <div className="flex-[2] min-w-0">
                   <DueSummaryCard activeCard={activeCard} refreshKey={refreshKey} />
                 </div>
                 <div className="flex-[1] min-w-0">
                   <CreditHealthCard utilization={28} />
                 </div>
               </div>
               
               <div className="flex flex-col gap-5 min-w-0 w-full">
                 <div className="min-h-[320px] xl:min-h-[240px] w-full min-w-0">
                    <DueDatesGraph refreshKey={refreshKey} />
                 </div>
                 <AITipCard />
               </div>
               
            </div>
          </div>
          
          {/* Bottom Area - History Table */}
          <div className="w-full pb-8">
            <RecentBillsTable onPaySuccess={async (bill) => {
              refreshDashboard();
              // Notification will be created by backend when status is updated
               // Fetch notifications on next refresh
              setTimeout(() => fetchNotifications(), 1000);
            }} refreshKey={refreshKey} />
          </div>
        </div>
      );
    }
    
    if (activePage === 'manage-cards') {
      return (
        <div className="animate-in fade-in duration-500 pb-8">
           <ManageCards />
        </div>
      );
    }
    
    if (activePage === 'ai-insights') {
      return (
        <div className="animate-in fade-in duration-500 pb-8 h-full flex-1">
           <AIInsights />
        </div>
      );
    }
    
    // Placeholder pages for other routes
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm h-full w-full min-h-[400px] animate-in fade-in duration-500">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-green-500 animate-pulse"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3 capitalize tracking-tight">{activePage.replace('-', ' ')}</h2>
          <p className="text-gray-500 max-w-md mx-auto">This section is being built out. It will feature detailed {activePage.replace('-', ' ')} tailored to your personal finances.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onSignOut={() => {
        localStorage.removeItem('lana_user_email');
        window.location.reload();
      }} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-5 sm:p-8 lg:p-10 overflow-y-auto bg-[#fafbfc] transition-all duration-300 relative scroll-smooth">
        
        <Header 
          notifications={notifications} 
          setNotifications={setNotifications} 
          unreadCount={unreadCount} 
        />

        {renderContent()}

      </div>
      
      <GlobalChatbot />
    </div>
  );
}

export default App;
