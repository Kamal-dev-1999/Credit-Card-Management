const express = require('express');
const {
  getNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  clearAllNotificationsController
} = require('../controllers/notification.controller.js');

const router = express.Router();

/**
 * GET /api/notifications
 * Fetch all notifications for the current user
 */
router.get('/', getNotificationsController);

/**
 * POST /api/notifications/mark-read
 * Mark a notification as read
 */
router.post('/mark-read', markNotificationAsReadController);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
router.post('/mark-all-read', markAllNotificationsAsReadController);

/**
 * DELETE /api/notifications/clear-all
 * Clear all notifications for the current user (delete from database and cache)
 */
router.delete('/clear-all', clearAllNotificationsController);

module.exports = router;
