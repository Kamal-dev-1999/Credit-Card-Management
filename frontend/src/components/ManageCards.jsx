import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
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
  const [cards, setCards] = useState(initialCards);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddCard = (newCard) => {
    // Mock POST /api/cards
    // The new card is unshifted so it appears at the beginning of the list with a nice enter animation
    setCards([newCard, ...cards]);
  };

  const handleDeleteCard = (cardToDelete) => {
    // Show native confirm for simplicity matching prompt instructions prioritizing visual flow
    if (window.confirm(`Are you sure you want to delete ${cardToDelete.bankName} ending in ${cardToDelete.last4}?`)) {
      // Mock DELETE /api/cards/:id
      setCards(cards.filter(c => c.id !== cardToDelete.id));
    }
  };

  const handleEditCard = (cardToEdit) => {
    // Mock edit logic - usually opens form populated with edit data
    alert(`Edit functionality for ${cardToEdit.bankName} would open the modal with pre-filled state.`);
  };

  const handleToggleSync = (cardId, newValue) => {
    // Mock PATCH /api/cards/:id/sync
    setCards(cards.map(c => c.id === cardId ? { ...c, syncEnabled: newValue } : c));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 w-full">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">My Cards</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your active credit cards, due dates, and auto-sync settings.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-yellow-500 text-white px-5 py-3 rounded-xl font-semibold text-sm transition-transform active:scale-95 shadow-lg shadow-yellow-200 shrink-0 w-full sm:w-auto"
        >
          <Plus size={18} />
          Add New Card
        </button>
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
