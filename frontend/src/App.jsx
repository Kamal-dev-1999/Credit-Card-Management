import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CardStack from './components/CardStack';
import DueSummaryCard from './components/DueSummaryCard';
import DueDatesGraph from './components/DueDatesGraph';
import CreditHealthCard from './components/CreditHealthCard';
import AITipCard from './components/AITipCard';
import RecentBillsTable from './components/RecentBillsTable';
import ManageCards from './components/ManageCards';

import AIInsights from './components/AIInsights';
import GlobalChatbot from './components/GlobalChatbot';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [activeCard, setActiveCard] = useState(null);
  
  // Notification State
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'info', icon: 'money', title: 'Statement Fetched', message: 'HDFC Bank - ₹14,450.20', time: '10m ago', read: false },
    { id: 2, type: 'warning', icon: 'alert', title: 'Reminder', message: 'Red Prepaid Card due in 48 hours!', time: '2h ago', read: false },
    { id: 3, type: 'suggestion', icon: 'sparkles', title: 'AI Suggestion', message: 'You could save ₹1,500 by switching to Auto-Pay.', time: '1d ago', read: true },
  ]);

  const handlePaySuccess = (bill) => {
    const newNotif = {
      id: Date.now(),
      type: 'success',
      icon: 'success',
      title: 'Payment Successful',
      message: `Successfully paid ₹${bill.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to ${bill.cardName}.`,
      time: 'Just now',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderContent = () => {
    if (activePage === 'dashboard') {
      return (
        <div className="animate-in fade-in duration-500">
          {/* Top Section */}
          <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 mb-8">
            {/* Left Column - Cards Stack */}
            <div className="w-full xl:w-[340px] shrink-0 h-[450px]">
              <CardStack onCardSelect={setActiveCard} />
            </div>
            
            {/* Right Column - Top Stats & Widgets */}
            <div className="flex-1 flex flex-col gap-6 lg:gap-8">
              
               <div className="flex flex-col md:flex-row gap-6 lg:gap-8 sm:h-auto lg:min-h-[220px]">
                 <div className="flex-[2] min-w-0">
                   <DueSummaryCard activeCard={activeCard} />
                 </div>
                 <div className="flex-[1] min-w-[220px]">
                   <CreditHealthCard utilization={28} />
                 </div>
               </div>
               
               <div className="flex-1 flex flex-col gap-5">
                 <div className="flex-1 min-h-[240px]">
                    <DueDatesGraph />
                 </div>
                 <AITipCard />
               </div>
               
            </div>
          </div>
          
          {/* Bottom Area - History Table */}
          <div className="w-full pb-8">
            <RecentBillsTable onPaySuccess={handlePaySuccess} />
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
