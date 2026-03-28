import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mail, Sparkles, Loader2, Filter, X, CreditCard as CardIcon, Search } from 'lucide-react';
import ManageCardItem from './ManageCardItem';
import AddCardModal from './AddCardModal';

const ManageCards = () => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  
  // Filtering states
  const [filterBank, setFilterBank] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Fetch cards on mount
  React.useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cards');
      const data = await response.json();
      
      const mappedCards = data.map(card => ({
        id: card.id,
        bankName: card.bankname,
        nickname: card.cardname,
        last4: card.last4digits,
        brand: card.cardtype || 'Visa',
        billingcycledate: card.billingcycledate,
        colorTheme: card.colortheme || 'midnight-purple',
        syncEnabled: true,
        nextBillingDate: 'TBD'
      }));

      setCards(mappedCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique banks for filtering
  const uniqueBanks = useMemo(() => {
    const banks = cards.map(c => c.bankName);
    return ['all', ...new Set(banks)].filter(Boolean).sort();
  }, [cards]);

  // Apply filters
  const filteredCards = useMemo(() => {
    return cards.filter(card => {
      const bankMatch = filterBank === 'all' || card.bankName === filterBank;
      const typeMatch = filterType === 'all' || card.brand.toLowerCase() === filterType.toLowerCase();
      return bankMatch && typeMatch;
    });
  }, [cards, filterBank, filterType]);

  const handleDiscover = async () => {
    setIsDiscovering(true);
    console.log('🔍 [ManageCards] Starting card discovery...');
    try {
      console.log('📨 [ManageCards] Calling /api/cards/discover endpoint...');
      const resp = await fetch('http://127.0.0.1:5000/api/cards/discover', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`📍 [ManageCards] Response status: ${resp.status}`);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`❌ [ManageCards] Server error: ${resp.status} - ${errorText}`);
        alert(`❌ Discovery failed: ${resp.status} error`);
        setIsDiscovering(false);
        return;
      }
      
      const result = await resp.json();
      console.log('✅ [ManageCards] Discovery result:', result);
      
      if (result.success) {
        alert(`✨ Discovery complete! Found and added ${result.newCardsFound} new cards.`);
        fetchCards();
      } else {
        alert('Discovery failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ [ManageCards] Discovery error:', err);
      alert('Network error during discovery: ' + err.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  const clearFilters = () => {
    setFilterBank('all');
    setFilterType('all');
  };

  const handleAddCard = (newCard) => {
    fetchCards();
  };

  const handleDeleteCard = async (cardToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${cardToDelete.bankName} card?`)) {
      try {
        const response = await fetch(`/api/cards/${cardToDelete.id}`, { method: 'DELETE' });
        if (response.ok) {
          setCards(cards.filter(c => c.id !== cardToDelete.id));
        }
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const handleEditCard = (cardToEdit) => {
    setEditingCard(cardToEdit);
    setIsModalOpen(true);
  };

  const handleToggleSync = async (cardId, newValue) => {
    setCards(cards.map(c => c.id === cardId ? { ...c, syncEnabled: newValue } : c));
  };

  const closeDrawer = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-4 sm:px-0 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 w-full">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">My Cards</h2>
          <p className="text-base text-gray-500 mt-2 font-medium">Manage cards, track due dates, and monitor spending logic.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleDiscover}
            disabled={isDiscovering}
            className={`flex items-center justify-center gap-2 bg-white hover:bg-yellow-50 text-gray-700 border border-gray-200 hover:border-primary px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-sm group ${isDiscovering ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isDiscovering ? (
              <Loader2 size={18} className="animate-spin text-primary" />
            ) : (
              <Sparkles size={18} className="text-primary group-hover:rotate-12 transition-transform" />
            )}
            {isDiscovering ? 'Discovery active...' : 'Auto-Discover'}
          </button>

          <button 
            onClick={() => { setEditingCard(null); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-yellow-500 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-transform active:scale-95 shadow-xl shadow-yellow-200/40 shrink-0"
          >
            <Plus size={20} />
            Add New Card
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 mb-8 shadow-sm flex flex-col md:flex-row items-center gap-4 w-full">
        <div className="flex items-center gap-2 px-3 text-gray-400 border-r border-gray-50 hidden md:flex">
          <Filter size={18} />
          <span className="text-xs font-bold uppercase tracking-widest px-2">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:flex-1">
          {/* Bank Filter */}
          <div className="relative group flex-1">
            <select 
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border-transparent focus:border-primary focus:ring-0 rounded-2xl px-5 py-3 text-sm font-semibold text-gray-700 appearance-none transition-all cursor-pointer"
            >
              <option value="all">All Banks ({cards.length})</option>
              {uniqueBanks.filter(b => b !== 'all').map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <ChevronDownIcon size={16} />
            </div>
          </div>

          {/* Type Filter */}
          <div className="relative group flex-1">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-50 hover:bg-gray-100 border-transparent focus:border-primary focus:ring-0 rounded-2xl px-5 py-3 text-sm font-semibold text-gray-700 appearance-none transition-all cursor-pointer"
            >
              <option value="all">Any Type</option>
              <option value="visa">Visa</option>
              <option value="mastercard">Mastercard</option>
              <option value="rupay">RuPay</option>
              <option value="amex">Amex</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <ChevronDownIcon size={16} />
            </div>
          </div>
        </div>

        {(filterBank !== 'all' || filterType !== 'all') && (
          <button 
            onClick={clearFilters}
            className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl transition-all text-sm font-bold w-full md:w-auto justify-center"
          >
            <X size={16} />
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <AnimatePresence mode="popLayout" initial={false}>
        {filteredCards.length > 0 ? (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 auto-rows-max w-full"
          >
            {filteredCards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="w-full"
              >
                <ManageCardItem 
                  card={card}
                  onDelete={handleDeleteCard}
                  onEdit={handleEditCard}
                  onToggleSync={handleToggleSync}
                />
              </motion.div>
            ))}
            
            {/* Transparent "Plus" card for filtered states is often hidden to keep clean */}
            {filterBank === 'all' && filterType === 'all' && (
              <motion.div 
                layout
                onClick={() => { setEditingCard(null); setIsModalOpen(true); }}
                className="w-full rounded-3xl border-2 border-dashed border-gray-200 bg-white/50 hover:bg-white hover:border-primary/40 flex flex-col items-center justify-center p-8 transition-all cursor-pointer aspect-[1.6/1] group text-gray-400 hover:text-primary min-h-[220px]"
              >
                <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-300">
                  <Plus size={28} className="text-gray-300 group-hover:text-primary transition-colors" />
                </div>
                <p className="font-bold text-gray-500 group-hover:text-gray-900 transition-colors">Add New Card</p>
                <p className="text-[10px] text-center mt-2 text-gray-400 uppercase tracking-widest font-bold">Secure Connection</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full py-24 flex flex-col items-center justify-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200"
          >
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
              <Search className="text-gray-300" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">No cards matched</h3>
            <p className="text-gray-500 mt-2 mb-8">Try adjusting your filters to find what you're looking for.</p>
            <button 
              onClick={clearFilters}
              className="px-8 py-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-2xl font-bold transition-all shadow-sm"
            >
              Reset Filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AddCardModal 
        isOpen={isModalOpen} 
        onClose={closeDrawer} 
        onAdd={handleAddCard}
        editingCard={editingCard}
      />
    </div>
  );
};

// Helper for custom select icons
const ChevronDownIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

export default ManageCards;
