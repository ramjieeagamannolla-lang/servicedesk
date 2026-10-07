import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';
import { formatRelative } from '../../utils/format.js';

const TYPE_DOT = {
  SLA_BREACHED: 'bg-status-critical',
  SLA_AT_RISK: 'bg-status-warn',
  ASSIGNMENT: 'bg-brand-500',
  RESOLUTION: 'bg-status-safe',
  COMMENT: 'bg-status-info',
  GENERAL: 'bg-ink-faint',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // Silent — the bell just stays empty if this fails.
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  const handleClickNotification = async (n) => {
    if (!n.isRead) await api.patch(`/notifications/${n._id}/read`);
    setOpen(false);
    load();
    if (n.relatedTicket) navigate(`/tickets/${n.relatedTicket._id}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-canvas text-ink-muted"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[16px] px-0.5 rounded-full bg-status-critical text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto bg-white border border-border rounded-xl2 shadow-popover z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-semibold text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1"
              >
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-faint">No notifications yet</p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li key={n._id}>
                  <button
                    onClick={() => handleClickNotification(n)}
                    className={`w-full text-left px-4 py-3 flex gap-2.5 hover:bg-canvas transition-colors ${
                      !n.isRead ? 'bg-brand-50/50' : ''
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${TYPE_DOT[n.type] || 'bg-ink-faint'}`} />
                    <span className="flex-1">
                      <span className="text-sm text-ink block leading-snug">{n.message}</span>
                      <span className="text-xs text-ink-faint">{formatRelative(n.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
