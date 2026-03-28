import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, X, Send, Sparkles, Bot, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

const initialMessages = [
  { sender: 'ai', text: 'Hi there! I am your Lana Financial Assistant. How can I help you manage your wealth today?' }
];

const GlobalChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Load conversation history on mount or when user email changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const userEmail = localStorage.getItem('lana_user_email');
        if (!userEmail) {
          setLoading(false);
          return;
        }

        console.log('📚 [Chatbot] Loading conversation history for:', userEmail);
        const response = await fetch(`http://127.0.0.1:5000/api/chatbot/history/${userEmail}`);
        
        if (!response.ok) throw new Error('Failed to load history');
        
        const data = await response.json();
        console.log('✅ [Chatbot] Loaded', data.count, 'previous messages');

        if (data.messages && data.messages.length > 0) {
          // Convert database format to display format
          const loadedMessages = data.messages.map(msg => ({
            sender: msg.role === 'assistant' ? 'ai' : 'user',
            text: msg.message
          }));
          setMessages([initialMessages[0], ...loadedMessages]);
        }
      } catch (err) {
        console.warn('⚠️ [Chatbot] Could not load history:', err);
        // Continue with initial messages if history fails
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const compressImage = (base64String) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set dimensions - max 1200px width while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.8 quality
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        console.log(`📸 [Chatbot] Image compressed: ${(base64String.length / 1024).toFixed(2)}KB → ${(compressed.length / 1024).toFixed(2)}KB`);
        resolve(compressed);
      };
      img.src = base64String;
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Please select a valid image file');
      return;
    }

    // Validate file size (5MB max - before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Image is too large (max 5MB)');
      return;
    }

    // Show preview and compress
    const reader = new FileReader();
    reader.onload = async (e) => {
      const originalBase64 = e.target.result;
      console.log(`📸 [Chatbot] Original image size: ${(file.size / 1024).toFixed(2)}KB`);
      
      try {
        const compressedBase64 = await compressImage(originalBase64);
        setImagePreview(compressedBase64);
      } catch (err) {
        console.error('❌ [Chatbot] Image compression error:', err);
        alert('❌ Failed to process image. Please try another image.');
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadCardImage = async () => {
    if (!imagePreview) return;

    setIsUploadingCard(true);
    setMessages(prev => [...prev, { sender: 'user', text: '📸 Uploading card image...' }]);

    try {
      const userEmail = localStorage.getItem('lana_user_email') || 'unknown-user';

      console.log('🔐 [Chatbot] Extracting card from image...');

      const response = await fetch('http://127.0.0.1:5000/api/chatbot/extract-card-from-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          userEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract card');
      }

      console.log('✅ [Chatbot] Card successfully extracted and saved');

      // Show success message
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `🎉 ${data.message}\n\nYour ${data.card.cardName} card ending in ${data.card.last4Digits} has been added to your account!`
      }]);

      // Clear preview
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('❌ [Chatbot] Card upload error:', err);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `❌ Sorry, I couldn't process the card image:\n\n${err.message}\n\nPlease make sure:\n✓ The card number is clearly visible\n✓ All four corners are visible\n✓ The image is well-lit and not blurry`
      }]);
    } finally {
      setIsUploadingCard(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setInput('');
    setIsTyping(true);

    try {
      const userEmail = localStorage.getItem('lana_user_email') || 'unknown-user';
      
      // Prepare conversation history (excluding initial AI message)
      const conversationHistory = messages
        .slice(1) // Skip initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          message: msg.text
        }));

      console.log('🤖 [Chatbot] Sending message with', conversationHistory.length, 'previous messages');
      
      const response = await fetch('http://127.0.0.1:5000/api/chatbot/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: input,
          userEmail,
          conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [Chatbot] Response received');
      
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: data.response || "I'm having trouble processing that. Please try again."
      }]);
    } catch (err) {
      console.error('❌ [Chatbot] Error:', err);
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: `Sorry, I encountered an error: ${err.message}. Please check your server connection.`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChatHistory = async () => {
    try {
      const userEmail = localStorage.getItem('lana_user_email');
      if (!userEmail) return;

      console.log('🗑️ [Chatbot] Clearing chat history...');
      
      const response = await fetch(`http://127.0.0.1:5000/api/chatbot/history/${userEmail}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to clear history');

      // Reset messages to initial state
      setMessages(initialMessages);
      console.log('✅ [Chatbot] Chat history cleared');
    } catch (err) {
      console.error('❌ [Chatbot] Error clearing history:', err);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-16 h-16 rounded-full bg-gradient-to-r from-purple-900 to-primary text-white shadow-xl shadow-purple-900/30 flex items-center justify-center z-[99999] transition-opacity ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
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
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-[calc(100vw-3rem)] md:w-[400px] h-[580px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-2xl border border-gray-100 z-[99999] flex flex-col overflow-hidden"
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
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearChatHistory}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors" 
                  title="Clear chat history"
                >
                  <Trash2 size={18} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
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

            {/* Image Preview */}
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 border-t border-blue-100 flex items-center gap-3 shrink-0"
              >
                <img src={imagePreview} alt="Card preview" className="h-24 rounded-lg border-2 border-blue-200" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-900 mb-2">📸 Card image ready</p>
                  <div className="flex gap-2">
                    <button
                      onClick={uploadCardImage}
                      disabled={isUploadingCard}
                      className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      {isUploadingCard ? '⏳ Processing...' : '✓ Save Card'}
                    </button>
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

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
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleImageSelect}
                 className="hidden"
                 disabled={isUploadingCard}
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploadingCard}
                 title="Upload card image (AI will extract details)"
                 className="w-12 h-12 rounded-xl bg-blue-400 hover:bg-blue-500 text-white flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 shrink-0 shadow-md shadow-blue-200"
               >
                 <Upload size={18} />
               </button>
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
