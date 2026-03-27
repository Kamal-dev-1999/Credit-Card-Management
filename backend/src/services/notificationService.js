const { supabaseAdmin } = require('../config/supabase.js');

/**
 * Create a notification for a user
 * @param {string} userId - User ID
 * @param {object} notificationData - { type, icon, title, message, actionUrl }
 */
const createNotification = async (userId, notificationData) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        userid: userId,
        type: notificationData.type,
        icon: notificationData.icon,
        title: notificationData.title,
        message: notificationData.message,
        actionurl: notificationData.actionUrl || null,
        read: false,
        createdat: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    console.log(`✅ Notification created: ${notificationData.title}`);
    return data?.[0];
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
};

/**
 * Check for upcoming dues and create notifications
 */
const checkAndNotifyUpcomingDues = async (userId) => {
  try {
    const { data: cards, error: cardsError } = await supabaseAdmin
      .from('cards')
      .select('id, card_name, bank_name')
      .eq('userid', userId);

    if (cardsError) throw cardsError;

    const now = new Date();
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    for (const card of cards || []) {
      const { data: bills, error: billsError } = await supabaseAdmin
        .from('bills')
        .select('id, amount_due, due_date, status')
        .eq('cardid', card.id)
        .eq('status', 'Unpaid')
        .gte('due_date', now.toISOString())
        .lte('due_date', twoDaysLater.toISOString());

      if (billsError) throw billsError;

      for (const bill of bills || []) {
        const dueDate = new Date(bill.due_date);
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        // Check if notification already exists for this bill
        const { data: existingNotifs } = await supabaseAdmin
          .from('notifications')
          .select('id')
          .eq('userid', userId)
          .textSearch('message', bill.id);

        if (!existingNotifs?.length) {
          await createNotification(userId, {
            type: 'due',
            icon: 'alert',
            title: 'Payment Due Soon',
            message: `${card.card_name} (${card.bank_name}) - ₹${bill.amount_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })} due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}!`,
            actionUrl: '/dashboard'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error checking dues:', err);
  }
};

/**
 * Notify when AI insights are generated
 */
const notifyAIInsightsGenerated = async (userId, dailyQuote) => {
  try {
    await createNotification(userId, {
      type: 'ai_insight',
      icon: 'sparkles',
      title: 'AI Insights Generated',
      message: `✨ New insights ready: "${dailyQuote.substring(0, 50)}..."`,
      actionUrl: '/ai-insights'
    });
  } catch (err) {
    console.error('Error notifying AI insights:', err);
  }
};

/**
 * Notify when payment is recorded
 */
const notifyPaymentRecorded = async (userId, cardName, amount) => {
  try {
    await createNotification(userId, {
      type: 'payment',
      icon: 'success',
      title: 'Payment Recorded',
      message: `Successfully recorded ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} payment for ${cardName}`,
      actionUrl: '/dashboard'
    });
  } catch (err) {
    console.error('Error notifying payment:', err);
  }
};

/**
 * Notify when bill statement is fetched
 */
const notifyStatementFetched = async (userId, bankName, amount) => {
  try {
    await createNotification(userId, {
      type: 'statement',
      icon: 'money',
      title: 'Statement Fetched',
      message: `${bankName} - ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} statement updated`,
      actionUrl: '/dashboard'
    });
  } catch (err) {
    console.error('Error notifying statement:', err);
  }
};

/**
 * Get all notifications for a user
 */
const getNotifications = async (userId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('userid', userId)
      .order('createdat', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Format response to match frontend expectations
    return (data || []).map((notif) => ({
      id: notif.id,
      type: notif.type,
      icon: notif.icon,
      title: notif.title,
      message: notif.message,
      time: formatTimeAgo(new Date(notif.createdat)),
      read: notif.read,
      actionUrl: notif.actionurl
    }));
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    console.log(`✅ Notification marked as read: ${notificationId}`);
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('userid', userId)
      .eq('read', false);

    if (error) throw error;
    console.log(`✅ All notifications marked as read for user: ${userId}`);
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
};

/**
 * Delete old notifications (older than 30 days)
 */
const cleanupOldNotifications = async (userId) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('userid', userId)
      .lt('createdat', thirtyDaysAgo.toISOString());

    if (error) throw error;
    console.log(`✅ Old notifications cleaned up for user: ${userId}`);
  } catch (err) {
    console.error('Error cleaning up old notifications:', err);
  }
};

/**
 * Format time difference for display
 */
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-IN');
};

module.exports = {
  createNotification,
  checkAndNotifyUpcomingDues,
  notifyAIInsightsGenerated,
  notifyPaymentRecorded,
  notifyStatementFetched,
  getNotifications,
  markAsRead,
  markAllAsRead,
  cleanupOldNotifications
};
