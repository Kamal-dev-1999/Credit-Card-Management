const { supabaseAdmin } = require('../config/supabase');

/**
 * Get conversation history for a user
 */
const getConversationHistoryController = async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Fetch conversation history from database
    const { data: messages, error } = await supabaseAdmin
      .from('chatbot_messages')
      .select('*')
      .eq('useremail', userEmail)
      .order('createdat', { ascending: false })
      .limit(20); // Get last 20 messages

    if (error) {
      console.error('❌ [Chatbot] Error fetching history:', error.message);
      return res.status(200).json({ messages: [], count: 0 });
    }

    console.log(`✅ [Chatbot] Found ${messages?.length || 0} previous messages for ${userEmail}`);
    res.json({ 
      messages: (messages || []).reverse(), // Reverse to show oldest first
      count: messages?.length || 0 
    });
  } catch (err) {
    console.error('❌ [Chatbot] Error:', err.message);
    res.status(200).json({ messages: [], count: 0 });
  }
};

/**
 * Process a chatbot message and generate AI response
 */
const askChatbotController = async (req, res) => {
  try {
    const { message, userEmail, conversationHistory } = req.body;
    const authUserEmail = req.user?.email;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Verify user is asking for their own data
    if (authUserEmail && authUserEmail !== userEmail && authUserEmail !== 'anonymous-user') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    console.log(`🤖 [Chatbot] Processing message from ${userEmail}`);

    // For now, generate a simple response based on the user's message
    // In a production system, this would call an LLM like Gemini or GPT
    let aiResponse = generateSmartResponse(message, conversationHistory || []);

    // Save user message to database
    try {
      const { error: userMsgError } = await supabaseAdmin
        .from('chatbot_messages')
        .insert([{
          useremail: userEmail,
          role: 'user',
          message: message,
          createdat: new Date().toISOString()
        }]);

      if (userMsgError) {
        console.warn('⚠️ [Chatbot] Could not save user message:', userMsgError.message);
      }

      // Save AI response to database
      const { error: aiMsgError } = await supabaseAdmin
        .from('chatbot_messages')
        .insert([{
          useremail: userEmail,
          role: 'assistant',
          message: aiResponse,
          createdat: new Date().toISOString()
        }]);

      if (aiMsgError) {
        console.warn('⚠️ [Chatbot] Could not save AI message:', aiMsgError.message);
      }
    } catch (dbErr) {
      console.warn('⚠️ [Chatbot] Error saving messages to database:', dbErr.message);
      // Continue even if database save fails
    }

    console.log('✅ [Chatbot] Response generated successfully');
    res.json({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('❌ [Chatbot] Error processing message:', err.message);
    res.status(500).json({ 
      error: err.message,
      response: 'Sorry, I encountered an error processing your request. Please try again.'
    });
  }
};

/**
 * Generate a smart response based on user message
 * This is a simple rule-based response generator
 * In production, this would call Gemini or another LLM
 */
const generateSmartResponse = (userMessage, conversationHistory) => {
  const msg = userMessage.toLowerCase().trim();

  // Credit card related queries
  if (msg.includes('credit') || msg.includes('card') || msg.includes('card bill')) {
    return 'I can help you manage your credit cards! You can view all your cards in the "My Cards" section. Would you like to add a new card, check your due dates, or discuss credit utilization?';
  }

  // Due date queries
  if (msg.includes('due') || msg.includes('when') || msg.includes('payment')) {
    return 'Your upcoming payments are shown in the "Recent Bills" table on the dashboard. Click the refresh button to sync the latest bills from your email. You can also mark bills as paid or overdue to track your payments.';
  }

  // Health score queries
  if (msg.includes('health') || msg.includes('score') || msg.includes('utilization')) {
    return 'Your Credit Health Score is displayed on the Overview page. It\'s based on your credit utilization ratio (how much of your available credit you\'re using). Keeping utilization below 30% can help improve your credit score.';
  }

  // Savings/financial advice
  if (msg.includes('save') || msg.includes('money') || msg.includes('budget')) {
    return 'To save money on credit cards: 1) Pay bills on time to avoid interest, 2) Look for cards with cashback or rewards, 3) Monitor your spending using the dashboard insights, 4) Challenge yourself to keep utilization low.';
  }

  // AI insights
  if (msg.includes('insight') || msg.includes('ai') || msg.includes('advice')) {
    return 'Your AI Insights are available on the "AI Insights" page. They include daily financial wisdom, projected savings, card-specific tips, and your credit health explanation. Click "Sync Now" to generate fresh insights.';
  }

  // General greeting
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return 'Hello! I\'m Lana, your financial assistant. I can help you manage your credit cards, track payments, understand your credit health, and get personalized financial advice. What would you like help with?';
  }

  // Default response with helpful suggestions
  return 'I can assist you with: 📊 Viewing and managing your credit cards, 💰 Tracking payment due dates, 💳 Understanding your credit health score, 📈 Getting personalized financial insights, and 💡 Receiving smart financial advice. What would you like to know?';
};

module.exports = {
  getConversationHistoryController,
  askChatbotController
};
