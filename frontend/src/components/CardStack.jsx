import React, { useState } from 'react';
import { Wifi } from 'lucide-react';

const mockCards = [
  {
    id: 'card-1',
    name: 'zota',
    number: '5235 7102 0000 0003',
    validThru: '12/24',
    owner: 'MURAD S M',
    type: 'mastercard',
    bgClass: 'from-purple-900 to-purple-600',
    shadowClass: 'shadow-purple-200',
  },
  {
    id: 'card-2',
    name: 'PD',
    number: '4500 1234 5678 9012',
    validThru: '08/25',
    owner: 'JOHN DOE',
    type: 'visa',
    bgClass: 'from-yellow-500 to-yellow-300',
    shadowClass: 'shadow-yellow-200',
  },
  {
    id: 'card-3',
    name: 'prepaid',
    number: '5402 7112 0412 3456',
    validThru: '10/26',
    owner: 'R. Marina',
    type: 'mastercard',
    bgClass: 'from-rose-700 to-red-500',
    shadowClass: 'shadow-red-200',
  }
];

const CardStack = ({ onCardSelect }) => {
  const [cards, setCards] = useState(mockCards);

  const handleCardClick = (clickedCardId) => {
    const clickedIndex = cards.findIndex(c => c.id === clickedCardId);
    if (clickedIndex === 0) return; // Already on top
    
    // Reorder cards so the clicked card comes to index 0
    const newCards = [...cards];
    const [clickedCard] = newCards.splice(clickedIndex, 1);
    newCards.unshift(clickedCard);
    
    setCards(newCards);
    if(onCardSelect) onCardSelect(clickedCard);
  };

  return (
    <div className="flex flex-col relative h-[450px]">
      {cards.map((card, index) => {
        // Calculate dynamic styles based on position in stack
        const zIndex = 30 - index * 10;
        const topOffset = index * 112; // 0, 112px, 224px (same gap as before)
        const scale = 1 - index * 0.05; // 1, 0.95, 0.90
        
        return (
          <div 
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className={`absolute w-full bg-gradient-to-br ${card.bgClass} rounded-3xl p-6 text-white shadow-xl ${card.shadowClass} transition-all duration-300 ease-in-out cursor-pointer hover:-translate-y-2`}
            style={{
              zIndex,
              top: `${topOffset}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top center'
            }}
          >
            <div className="flex justify-between items-start mb-6">
              {card.type === 'visa' && card.name === 'PD' ? (
                 <div className="w-10 h-10 rounded-full border border-white/60 flex items-center justify-center font-bold text-lg shadow-inner">{card.name}</div>
              ) : (
                <div className="font-bold text-lg tracking-wider">{card.name}</div>
              )}
              
              <div className="flex items-center gap-3">
                {card.type !== 'visa' && <div className="w-8 h-6 bg-gradient-to-br from-gray-300 to-gray-400 rounded-md"></div>}
                <Wifi className="rotate-90 text-white/80" size={22} />
              </div>
            </div>
            
            <div className="text-[22px] font-medium font-mono tracking-[0.15em] mb-6 drop-shadow-sm opacity-90">
              {card.number}
            </div>
            
            <div className="flex justify-between items-end">
              <div>
                <div className="text-[10px] text-white/70 mb-0.5 tracking-wider">VALID THRU</div>
                <div className="font-medium text-sm mb-1">{card.validThru}</div>
                {card.type !== 'visa' && <div className="text-sm font-medium tracking-wide">{card.owner}</div>}
              </div>
              
              {card.type === 'visa' ? (
                <div className="text-3xl font-bold italic opacity-90 drop-shadow-sm">VISA</div>
              ) : (
                <div className="flex relative w-12 h-8">
                  <div className="w-8 h-8 rounded-full bg-red-500 opacity-90 absolute left-0 mix-blend-multiply"></div>
                  <div className="w-8 h-8 rounded-full bg-yellow-400 opacity-90 absolute left-4 mix-blend-multiply"></div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardStack;
