const Notification = require('../models/Notification');

async function notify(userId, message, type = 'GENERAL', relatedTicket = null) {
  if (!userId) return null;
  try {
    return await Notification.create({ user: userId, message, type, relatedTicket });
  } catch (err) {
    // Notifications are best-effort — never let a notification failure break
    // the primary action (ticket update, assignment, etc.)
    console.error('[notificationService] failed to create notification:', err.message);
    return null;
  }
}

async function notifyMany(userIds, message, type = 'GENERAL', relatedTicket = null) {
  const unique = [...new Set((userIds || []).filter(Boolean).map(String))];
  return Promise.all(unique.map((id) => notify(id, message, type, relatedTicket)));
}

module.exports = { notify, notifyMany };
