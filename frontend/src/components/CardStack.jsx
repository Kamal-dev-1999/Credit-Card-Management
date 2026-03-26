import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, ChevronDown, ChevronUp, CreditCard, Sparkles } from 'lucide-react';

const mockCards = [
  {
    id: 'mock-1',
    name: 'zota',
    number: '•••• •••• •••• 0003',
    validThru: '12/24',
    owner: 'MURAD S M',
    type: 'mastercard',
    colorTheme: 'midnight-purple',
  },
  {
    id: 'mock-2',
    name: 'PD Bank',
    number: '•••• •••• •••• 9012',
    validThru: '08/25',
    owner: 'JOHN DOE',
    type: 'visa',
    colorTheme: 'gold-rush',
  },
  {
    id: 'mock-3',
    name: 'prepaid',
    number: '•••• •••• •••• 3456',
    validThru: '10/26',
    owner: 'R. Marina',
    type: 'mastercard',
    colorTheme: 'ruby-red',
  }
];

const CardStack = ({ onCardSelect, setActivePage }) => {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const response = await fetch('/api/cards');
      const data = await response.json();
      
      if (data && data.length > 0) {
        const mapped = data.map(c => ({
          id: c.id,
          name: c.bankname,
          nickname: c.cardname,
          number: `•••• •••• •••• ${c.last4digits}`,
          validThru: '12/29', // Mocked as not in DB
          owner: 'YOU',
          type: (c.cardtype || 'Visa').toLowerCase(),
          colorTheme: c.colortheme || 'midnight-purple',
        }));
        setCards(mapped);
      } else {
        setCards(mockCards);
      }
    } catch (error) {
      console.error('Error fetching cards for stack:', error);
      setCards(mockCards);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCardClick = (clickedCardId) => {

    const clickedIndex = cards.findIndex(c => c.id === clickedCardId);
    if (clickedIndex === 0) return; 
    
    const newCards = [...cards];
    const [clickedCard] = newCards.splice(clickedIndex, 1);
    newCards.unshift(clickedCard);
    
    setCards(newCards);
    if(onCardSelect) onCardSelect(clickedCard);
  };

  const getThemeClass = (themeId) => {
    const themes = {
      'midnight-purple': 'from-purple-900 to-indigo-800',
      'royal-blue':     'from-blue-800 to-blue-600',
      'gold-rush':      'from-yellow-600 to-yellow-400',
      'ruby-red':       'from-rose-700 to-red-600',
      'forest-green':   'from-emerald-800 to-teal-700',
      'luxury-black':   'from-gray-900 to-gray-700',
    };
    return themes[themeId] || 'from-purple-900 to-purple-600';
  };

  const renderBrand = (type) => {
    if (type === 'visa') return <div className="text-2xl font-bold italic opacity-90">VISA</div>;
    if (type === 'mastercard') {
      return (
        <div className="flex relative w-10 h-6">
          <div className="w-6 h-6 rounded-full bg-red-500 opacity-90 absolute left-0 mix-blend-multiply"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 absolute left-3 mix-blend-multiply"></div>
        </div>
      );
    }
    if (type === 'rupay') {
      return (
        <div className="bg-white/20 px-2.5 py-0.5 rounded border border-white/20">
          <span className="text-[10px] font-black italic">RuPay</span>
        </div>
      );
    }
    return <div className="text-xs font-bold opacity-60 uppercase tracking-widest">{type}</div>;
  };

  const stackCards = cards.slice(0, 3);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* 3D Interactive Stack Container */}
      <div className="relative h-[400px] w-full max-w-sm mx-auto sm:mx-0">
        <AnimatePresence mode="popLayout">
          {stackCards.map((card, index) => {
            const zIndex = 30 - index * 10;
            const topOffset = index * 85; 
            const scale = 1 - index * 0.05;
            const isCustomColor = card.colorTheme.startsWith('#');
            
            return (
              <motion.div 
                key={card.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => handleCardClick(card.id)}
                className={`absolute w-full rounded-3xl p-6 text-white shadow-2xl transition-all duration-500 ease-out cursor-pointer hover:-translate-y-2 flex flex-col justify-between ${!isCustomColor ? `bg-gradient-to-br ${getThemeClass(card.colorTheme)}` : ''}`}
                style={{
                  zIndex,
                  top: `${topOffset}px`,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  backgroundColor: isCustomColor ? card.colorTheme : undefined,
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-wider uppercase drop-shadow-sm truncate max-w-[180px]">
                      {card.nickname || card.name}
                    </span>
                    {(card.nickname && card.nickname.toLowerCase() !== card.name.toLowerCase()) && (
                      <span className="text-[10px] opacity-70 font-medium truncate max-w-[150px]">{card.name}</span>
                    )}
                  </div>
                  <Wifi className="rotate-90 text-white/80" size={18} />
                </div>
                
                <div className="text-xl font-medium font-mono tracking-[0.18em] my-6 drop-shadow-sm opacity-90 text-center">
                  {card.number}
                </div>
                
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[8px] text-white/70 mb-0.5 tracking-widest uppercase">Valid Thru</div>
                    <div className="font-bold text-xs">{card.validThru}</div>
                  </div>
                  {renderBrand(card.type)}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="w-full flex justify-center mt-4">
        <button 
          onClick={() => setActivePage('manage-cards')}
          className="flex items-center gap-2 px-8 py-3 bg-white hover:bg-gray-50 text-gray-500 hover:text-primary rounded-2xl border border-gray-100 shadow-sm transition-all text-sm font-bold group"
        >
          View All Cards ({cards.length})
        </button>
      </div>
    </div>
  );
};

export default CardStack;
