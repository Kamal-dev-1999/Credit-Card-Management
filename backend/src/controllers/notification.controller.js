const { supabaseAdmin } = require('../config/supabase.js');

/**
 * Get all notifications for the current user
 */
const getNotificationsController = async (req, res) => {
  try {
    // Get user email from headers (sent by frontend)
    const userEmail = req.headers['x-user-email'];
    
    if (!userEmail) {
      console.log('⚠️  No user email provided in headers');
      return res.status(200).json({ notifications: [] });
    }

    // Fetching notifications...

    // Fetch notifications directly by email from Supabase
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('useremail', userEmail)
      .order('createdat', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return res.status(200).json({ notifications: [] });
    }

    // Format notifications for frontend
    const formattedNotifications = (notifications || []).map((notif) => ({
      id: notif.id,
      type: notif.type,
      icon: notif.icon,
      title: notif.title,
      message: notif.message,
      time: formatTimeAgo(new Date(notif.createdat)),
      read: notif.read,
      actionUrl: notif.actionurl
    }));

    console.log(`✅ Notifications retrieved`);
    res.json({ notifications: formattedNotifications, count: formattedNotifications.length });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(200).json({ notifications: [] });
  }
};

/**
 * Mark a single notification as read
 */
const markNotificationAsReadController = async (req, res) => {
  try {
    const { notificationId } = req.body;

    console.log(`📝 Attempting to mark notification as read: ${notificationId}`);

    if (!notificationId) {
      console.warn('⚠️  No notification ID provided');
      return res.status(400).json({ error: 'Notification ID required' });
    }

    // First verify the notification exists
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('id, read')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching notification:', fetchError);
      throw fetchError;
    }

    if (!notification) {
      console.warn(`⚠️  Notification not found: ${notificationId}`);
      return res.status(404).json({ error: 'Notification not found' });
    }

    console.log(`📊 Current notification status - ID: ${notification.id}, Read: ${notification.read}`);

    // Update the notification
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select('id, read');

    if (updateError) {
      console.error('❌ Error updating notification:', updateError);
      throw updateError;
    }

    if (updated && updated.length > 0) {
      console.log(`✅ Notification marked as read: ${notificationId} - New status: ${JSON.stringify(updated[0])}`);
      res.json({ success: true, message: 'Notification marked as read', notification: updated[0] });
    } else {
      console.warn(`⚠️  Update returned no results for notification: ${notificationId}`);
      res.json({ success: true, message: 'Notification marked as read' });
    }
  } catch (err) {
    console.error('❌ Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read', details: err.message });
  }
};

/**
 * Mark all notifications as read for the current user
 */
const markAllNotificationsAsReadController = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];

    // Marking all notifications as read...

    if (!userEmail) {
      console.warn('⚠️  No user email provided in headers');
      return res.status(401).json({ error: 'User email required' });
    }

    // First count unread notifications
    const { data: unreadBefore, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('useremail', userEmail)
      .eq('read', false);

    if (countError) {
      console.error('❌ Error counting unread notifications:', countError);
    } else {

    }

    // Update all unread notifications
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('useremail', userEmail)
      .eq('read', false)
      .select('id');

    if (updateError) {
      console.error('❌ Error marking all notifications as read:', updateError);
      throw updateError;
    }

    console.log(`✅ Marked notifications as read`);
    res.json({ success: true, message: 'All notifications marked as read', updatedCount: updated?.length || 0 });
  } catch (err) {
    console.error('❌ Error marking all notifications as read:', err);
    res.status(500).json({ error: 'Failed to mark all notifications as read', details: err.message });
  }
};

/**
 * Clear all notifications for the current user (delete from database and cache)
 */
const clearAllNotificationsController = async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];

    // Clearing all notifications...

    if (!userEmail) {
      console.warn('⚠️  No user email provided in headers');
      return res.status(401).json({ error: 'User email required' });
    }

    // Count notifications before deletion
    const { data: notificationsBefore, error: countError } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('useremail', userEmail);

    if (countError) {
      console.error('❌ Error counting notifications before deletion:', countError);
    } else {

    }

    // Delete all notifications for this user
    const { error: deleteError } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('useremail', userEmail);

    if (deleteError) {
      console.error('❌ Error deleting notifications:', deleteError);
      throw deleteError;
    }

    // Clear cache for this user
    try {
      const { deleteCache } = require('../utils/cache.js');
      await deleteCache(`user:${userEmail}:notifications`);

    } catch (cacheErr) {
      console.warn(`⚠️  Warning clearing cache: ${cacheErr.message}`);
      // Don't fail if cache clearing fails
    }

    console.log(`✅ Notifications cleared`);
    res.json({ 
      success: true, 
      message: 'All notifications cleared successfully', 
      clearedCount: notificationsBefore?.length || 0 
    });
  } catch (err) {
    console.error('❌ Error clearing all notifications:', err);
    res.status(500).json({ error: 'Failed to clear all notifications', details: err.message });
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
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  clearAllNotificationsController
};
