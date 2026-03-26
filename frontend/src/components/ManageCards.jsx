import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mail } from 'lucide-react';
import ManageCardItem from './ManageCardItem';
import AddCardModal from './AddCardModal';

// Initial Mock Data matches existing card stack colors/format
const initialCards = [
  {
    id: 'card-1',
    bankName: 'zota',
    nickname: 'Business Expense',
    last4: '0003',
    brand: 'Mastercard',
    billingCycleDate: 1,
    nextBillingDate: '01/04/2026',
    bgClass: 'from-purple-900 to-purple-600',
    syncEnabled: true
  },
  {
    id: 'card-2',
    bankName: 'PD Bank',
    nickname: 'Personal Shopping',
    last4: '9012',
    brand: 'Visa',
    billingCycleDate: 8,
    nextBillingDate: '08/04/2026',
    bgClass: 'from-yellow-500 to-yellow-300',
    syncEnabled: false
  },
  {
    id: 'card-3',
    bankName: 'prepaid',
    nickname: 'Travel Funds',
    last4: '3456',
    brand: 'Mastercard',
    billingCycleDate: 15,
    nextBillingDate: '15/04/2026',
    bgClass: 'from-rose-700 to-red-500',
    syncEnabled: true
  }
];

const ManageCards = () => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch cards on mount
  React.useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cards');
      const data = await response.json();
      
      // Map all-lowercase from DB to camelCase for UI
      const mappedCards = data.map(card => {
        // Determine color based on bank name if not stored
        let bgClass = 'from-purple-900 to-purple-600'; // Default
        const bank = (card.bankname || '').toLowerCase();
        if (bank.includes('sbi')) bgClass = 'from-blue-700 to-blue-500';
        else if (bank.includes('hdfc')) bgClass = 'from-blue-900 to-blue-700';
        else if (bank.includes('icici')) bgClass = 'from-orange-600 to-orange-400';
        else if (bank.includes('axis')) bgClass = 'from-rose-800 to-rose-600';
        else if (bank.includes('kotak')) bgClass = 'from-red-700 to-red-500';

        return {
          id: card.id,
          bankName: card.bankname,
          nickname: card.cardname,
          last4: card.last4digits,
          brand: 'Visa', // Default
          creditLimit: 50000,
          syncEnabled: true,
          bgClass,
          nextBillingDate: 'TBD'
        };
      });

      setCards(mappedCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = (newCard) => {
    // Refresh the list from DB to ensure consistency
    fetchCards();
  };

  const handleDeleteCard = async (cardToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${cardToDelete.bankName} ending in ${cardToDelete.last4Digits}?`)) {
      try {
        const response = await fetch(`/api/cards/${cardToDelete.id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setCards(cards.filter(c => c.id !== cardToDelete.id));
        } else {
          alert('Failed to delete card');
        }
      } catch (error) {
        console.error('Error deleting card:', error);
        alert('Network error while deleting card');
      }
    }
  };

  const handleEditCard = (cardToEdit) => {
    // This will be handled by passing the card to AddCardModal in "edit mode"
    alert(`Edit functionality for ${cardToEdit.bankName} would open the modal with pre-filled state.`);
  };

  const handleToggleSync = async (cardId, newValue) => {
    // In a real app we'd have a specific PATCH endpoint, 
    // for now we'll just local update or we could use the PUT endpoint
    setCards(cards.map(c => c.id === cardId ? { ...c, syncEnabled: newValue } : c));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 w-full">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">My Cards</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your active credit cards, due dates, and auto-sync settings.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!localStorage.getItem('lana_user_email') ? (
            <button 
              onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
              className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-5 py-3 rounded-xl font-semibold text-sm transition-transform active:scale-95 shadow-sm shrink-0 flex-1 sm:flex-auto"
            >
              <Mail size={18} className="text-red-500" />
              Connect Gmail
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0">
              <Mail size={16} className="text-green-600" />
              Gmail Connected
            </div>
          )}

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-yellow-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-yellow-200 shrink-0 flex-1 sm:flex-auto"
          >
            <Plus size={18} />
            Add New Card
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 auto-rows-max w-full">
        <AnimatePresence mode="popLayout">
          {cards.map((card) => (
            <motion.div
              key={card.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: -50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
          
          {/* Empty State / Add Card Tile */}
          <motion.div 
            layout
            onClick={() => setIsModalOpen(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-white hover:border-gray-400 hover:shadow-sm flex flex-col items-center justify-center p-8 transition-all cursor-pointer aspect-[1.6/1] group text-gray-400 hover:text-primary"
          >
            <div className="w-14 h-14 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Plus size={24} className="text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <p className="font-semibold text-gray-600 group-hover:text-gray-800 transition-colors">Add Another Card</p>
            <p className="text-xs text-center mt-2 text-gray-400 max-w-[200px]">Link a new card to track bills and spending automatically.</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <AddCardModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddCard}
      />
    </div>
  );
};

export default ManageCards;
