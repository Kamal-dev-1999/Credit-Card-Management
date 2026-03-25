import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard } from 'lucide-react';

const AddCardModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    bankName: '',
    nickname: '',
    last4: '',
    brand: 'Visa',
    billingCycleDate: '1',
    colorTheme: 'purple'
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.bankName) {
      setError('Bank name is required');
      return;
    }
    if (formData.last4.length !== 4 || isNaN(formData.last4)) {
      setError('Last 4 digits must be exactly 4 numbers');
      return;
    }
    
    const bgClass = formData.colorTheme === 'purple' 
      ? 'from-purple-900 to-purple-600'
      : formData.colorTheme === 'yellow'
      ? 'from-yellow-500 to-yellow-300'
      : 'from-rose-700 to-red-500';

    // Mock simple next billing date calculation
    const today = new Date();
    let nextMonth = today.getMonth() + 2; 
    let year = today.getFullYear();
    if (nextMonth > 12) {
      nextMonth = 1;
      year += 1;
    }
    const formattedDate = `${formData.billingCycleDate.padStart(2, '0')}/${nextMonth.toString().padStart(2, '0')}/${year}`;

    onAdd({
      id: Date.now().toString(),
      bankName: formData.bankName,
      nickname: formData.nickname || 'My Card',
      last4: formData.last4,
      brand: formData.brand,
      billingCycleDate: parseInt(formData.billingCycleDate),
      nextBillingDate: formattedDate,
      bgClass,
      syncEnabled: false
    });

    setFormData({ bankName: '', nickname: '', last4: '', brand: 'Visa', billingCycleDate: '1', colorTheme: 'purple' });
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 m-auto z-50 bg-white rounded-3xl shadow-2xl w-full max-w-md h-fit max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-primary">
                    <CreditCard size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">Add New Card</h2>
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
                    placeholder="e.g. Chase, HDFC, Amex"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Card Nickname</label>
                  <input 
                    type="text" 
                    value={formData.nickname}
                    onChange={e => setFormData({...formData, nickname: e.target.value})}
                    placeholder="e.g. Travel Card"
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
                      placeholder="e.g. 1234"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-mono tracking-widest text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-gray-700">Card Brand</label>
                    <div className="relative">
                      <select 
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm appearance-none cursor-pointer pr-10"
                      >
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Billing Cycle Date (1-31)</label>
                  <div className="relative">
                    <select 
                      value={formData.billingCycleDate}
                      onChange={e => setFormData({...formData, billingCycleDate: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm appearance-none cursor-pointer pr-10"
                    >
                      {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Due dates are calculated automatically based on this date.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-semibold text-gray-700">Card Color Theme</label>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, colorTheme: 'purple'})}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br from-purple-900 to-purple-600 shadow-md flex items-center justify-center transition-all ${formData.colorTheme === 'purple' ? 'ring-4 ring-offset-2 ring-purple-400 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    >
                      {formData.colorTheme === 'purple' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, colorTheme: 'yellow'})}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-300 shadow-md flex items-center justify-center transition-all ${formData.colorTheme === 'yellow' ? 'ring-4 ring-offset-2 ring-yellow-400 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    >
                      {formData.colorTheme === 'yellow' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({...formData, colorTheme: 'red'})}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br from-rose-700 to-red-500 shadow-md flex items-center justify-center transition-all ${formData.colorTheme === 'red' ? 'ring-4 ring-offset-2 ring-red-400 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}`}
                    >
                      {formData.colorTheme === 'red' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="mt-4 w-full bg-primary hover:bg-yellow-500 text-white py-4 rounded-xl font-bold text-sm transition-transform active:scale-95 shadow-lg shadow-yellow-200"
                >
                  Save Card
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
