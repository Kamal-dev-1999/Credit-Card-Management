import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, X, Send, Sparkles, Bot } from 'lucide-react';

const initialMessages = [
  { sender: 'ai', text: 'Hi there! I am your Lana Financial Assistant. How can I help you manage your wealth today?' }
];

const GlobalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiResponse = { sender: 'ai', text: '' };
      const query = input.toLowerCase();
      
      if (query.includes('due') || query.includes('bill')) {
        aiResponse.text = "You have ₹1,24,850.15 in total upcoming dues. The Purple Zota Card bill of ₹82,050.50 is due next on April 18th.";
      } else if (query.includes('score') || query.includes('health')) {
        aiResponse.text = "Your Credit Health is currently Good (28% utilization). To hit Excellent, try keeping the PD Bank card balance below 30% of its limit.";
      } else {
        aiResponse.text = "I've noted that! I'm constantly analyzing your synced accounts to find the best savings and rewards strategies for you.";
      }

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-16 h-16 rounded-full bg-gradient-to-r from-purple-900 to-primary text-white shadow-xl shadow-purple-900/30 flex items-center justify-center z-50 transition-opacity ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <MessageSquareText size={28} />
        {/* Unread indicator dot */}
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      </motion.button>

      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-[calc(100vw-3rem)] md:w-[400px] h-[580px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-primary p-5 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <Bot size={22} className="text-white drop-shadow-sm" />
                </div>
                <div>
                  <h3 className="font-bold tracking-wide">Lana Copilot</h3>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium tracking-wider uppercase">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#fafbfc]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                   <div className={`max-w-[85%] rounded-2xl p-4 ${msg.sender === 'user' ? 'bg-gray-900 text-white rounded-tr-sm shadow-md' : 'bg-white border border-gray-100 shadow-sm rounded-tl-sm text-gray-700'}`}>
                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Sparkles size={12} className="text-primary" />
                          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">AI Copilot</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed font-medium">
                        {msg.text}
                      </p>
                   </div>
                </div>
              ))}
              {isTyping && (
                 <div className="flex justify-start w-full">
                   <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center max-w-[100px]">
                     <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                     <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                     <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                   </div>
                 </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-50 flex items-center gap-2 shrink-0">
               <input 
                 type="text" 
                 value={input}
                 onChange={(e) => setInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                 placeholder="Type your financial question..."
                 className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-inner"
               />
               <button 
                 onClick={handleSend}
                 disabled={!input.trim()}
                 className="w-12 h-12 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-900 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shrink-0 shadow-md shadow-yellow-200"
               >
                 <Send size={18} className="translate-x-px" />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalChatbot;
