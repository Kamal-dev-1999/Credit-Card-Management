import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Plus } from 'lucide-react';

const AddCardModal = ({ isOpen, onClose, onAdd, editingCard = null }) => {
  const [formData, setFormData] = useState({
    bankName: '',
    nickname: '',
    last4: '',
    brand: 'Visa',
    billingCycleDate: '1',
    colorTheme: 'midnight-purple'
  });

  const [error, setError] = useState('');
  const isEditMode = !!editingCard;

  // Pre-fill if editing
  React.useEffect(() => {
    if (editingCard) {
      setFormData({
        bankName: editingCard.bankName || '',
        nickname: editingCard.nickname || '',
        last4: editingCard.last4 || '',
        brand: editingCard.brand || 'Visa',
        billingCycleDate: String(editingCard.billingcycledate || '1'),
        colorTheme: editingCard.colorTheme || 'midnight-purple'
      });
    } else {
      setFormData({
        bankName: '', nickname: '', last4: '', brand: 'Visa', billingCycleDate: '1', colorTheme: 'midnight-purple'
      });
    }
  }, [editingCard, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.bankName) {
      setError('Bank name is required');
      return;
    }
    if (formData.last4.length !== 4 || isNaN(formData.last4)) {
      setError('Last 4 digits must be exactly 4 numbers');
      return;
    }

    try {
      const userEmail = localStorage.getItem('lana_user_email');
      if (!userEmail) {
        setError('Please sign in with Gmail first');
        return;
      }

      // Prepare card data
      const cardData = {
        cardName: formData.nickname || `${formData.bankName} Card`,
        bankName: formData.bankName,
        last4Digits: formData.last4,
        cardType: formData.brand,
        billingCycleDate: parseInt(formData.billingCycleDate),
        colorTheme: formData.colorTheme,
        creditLimit: 50000,
      };

      if (!isEditMode) {
        // Fetch userId only for new cards
        const usersRes = await fetch('/api/users');
        const users = await usersRes.json();
        const currentUser = users.find(u => u.email === userEmail);
        if (!currentUser) throw new Error('User not found');
        cardData.userId = currentUser.id;
      }

      const url = isEditMode ? `/api/cards/${editingCard.id}` : '/api/cards';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save card');
      }

      const savedCard = await response.json();
      onAdd(savedCard);
      onClose();
    } catch (err) {
      console.error('Error saving card:', err);
      setError(err.message || 'An error occurred while saving the card');
    }
  };

  const PRO_GRADIENTS = [
    { id: 'midnight-purple', class: 'from-purple-900 to-indigo-800', label: 'Midnight' },
    { id: 'royal-blue',     class: 'from-blue-800 to-blue-600',   label: 'Royal' },
    { id: 'gold-rush',      class: 'from-yellow-600 to-yellow-400', label: 'Gold' },
    { id: 'ruby-red',       class: 'from-rose-700 to-red-600',    label: 'Ruby' },
    { id: 'forest-green',   class: 'from-emerald-800 to-teal-700', label: 'Forest' },
    { id: 'luxury-black',   class: 'from-gray-900 to-gray-700',   label: 'Luxury' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed inset-0 m-auto z-50 bg-white rounded-3xl shadow-2xl w-full max-w-md h-fit max-h-[95vh] overflow-y-auto"
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-primary">
                    <CreditCard size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                    {isEditMode ? 'Edit Card Details' : 'Add New Card'}
                  </h2>
                </div>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Bank Name</label>
                  <input 
                    type="text" 
                    value={formData.bankName}
                    onChange={e => setFormData({...formData, bankName: e.target.value})}
                    placeholder="e.g. HDFC, SBI, Axis"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Card Nickname</label>
                  <input 
                    type="text" 
                    value={formData.nickname}
                    onChange={e => setFormData({...formData, nickname: e.target.value})}
                    placeholder="e.g. Travel Rewards"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Last 4 Digits</label>
                    <input 
                      type="text" 
                      maxLength="4"
                      value={formData.last4}
                      onChange={e => setFormData({...formData, last4: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono tracking-widest text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Card Type</label>
                    <select 
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="Rupay">Rupay</option>
                      <option value="Amex">Amex</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Billing Cycle Date (1-31)</label>
                  <select 
                    value={formData.billingCycleDate}
                    onChange={e => setFormData({...formData, billingCycleDate: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer hover:bg-white transition-all"
                  >
                    {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Card Theme (Presets & Custom)</label>
                  <div className="grid grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {PRO_GRADIENTS.map((g) => (
                      <button 
                        key={g.id}
                        type="button"
                        onClick={() => setFormData({...formData, colorTheme: g.id})}
                        className={`w-full aspect-square rounded-xl bg-gradient-to-br ${g.class} shadow-sm flex items-center justify-center transition-all ${formData.colorTheme === g.id ? 'ring-4 ring-offset-2 ring-primary scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                        title={g.label}
                      >
                        {formData.colorTheme === g.id && <div className="w-2 h-2 bg-white rounded-full shadow-inner"></div>}
                      </button>
                    ))}
                    {/* Custom Color Picker Swatch */}
                    <div className="relative group aspect-square">
                      <input 
                        type="color"
                        value={formData.colorTheme.startsWith('#') ? formData.colorTheme : '#e2e8f0'}
                        onChange={(e) => setFormData({...formData, colorTheme: e.target.value})}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div 
                        className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${formData.colorTheme.startsWith('#') ? 'ring-4 ring-offset-2 ring-primary' : 'border-gray-300 hover:border-primary'}`}
                        style={{ backgroundColor: formData.colorTheme.startsWith('#') ? formData.colorTheme : 'transparent' }}
                      >
                         {!formData.colorTheme.startsWith('#') && <Plus size={16} className="text-gray-400" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Premium Gradients</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Custom Plate</p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-2 w-full bg-primary hover:bg-yellow-500 text-white py-4 rounded-2xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-yellow-200"
                >
                  {isEditMode ? 'Update Card' : 'Save New Card'}
                </button>
              </form>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default AddCardModal;
