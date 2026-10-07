import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, ChevronDown, LogOut, User as UserIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../utils/roles.js';
import { initials } from '../../utils/format.js';
import NotificationBell from '../notifications/NotificationBell.jsx';
import api from '../../api/axios.js';

export default function Topbar({ onMenuClick, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setResults(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q: query } });
        setResults(res.data.data);
      } catch {
        setResults(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const goTo = (path) => {
    setResults(null);
    setQuery('');
    navigate(path);
  };

  const hasResults =
    results && (results.tickets?.length || results.assets?.length || results.users?.length || results.articles?.length);

  return (
    <header className="h-16 shrink-0 border-b border-border bg-white flex items-center gap-3 px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-canvas">
        <Menu size={19} />
      </button>

      {title && <h1 className="hidden md:block font-semibold text-[15px] text-ink">{title}</h1>}

      <div className="flex-1 flex justify-center md:justify-end lg:justify-center max-w-xl mx-auto relative" ref={searchRef}>
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets, assets, articles…"
            className="w-full rounded-lg border border-border bg-canvas pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <X size={14} />
            </button>
          )}
        </div>

        {results && (
          <div className="absolute top-full mt-2 w-full bg-white border border-border rounded-xl2 shadow-popover max-h-96 overflow-y-auto z-50">
            {!hasResults && <p className="px-4 py-6 text-center text-sm text-ink-faint">No matches for "{query}"</p>}
            {results.tickets?.length > 0 && (
              <div className="py-2">
                <p className="px-4 py-1 text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Tickets</p>
                {results.tickets.map((t) => (
                  <button key={t._id} onClick={() => goTo(`/tickets/${t._id}`)} className="w-full text-left px-4 py-2 hover:bg-canvas text-sm flex justify-between">
                    <span className="truncate">{t.title}</span>
                    <span className="text-ink-faint font-mono text-xs shrink-0 ml-2">{t.ticketNumber}</span>
                  </button>
                ))}
              </div>
            )}
            {results.assets?.length > 0 && (
              <div className="py-2 border-t border-border">
                <p className="px-4 py-1 text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Assets</p>
                {results.assets.map((a) => (
                  <button key={a._id} onClick={() => goTo(`/assets/${a._id}`)} className="w-full text-left px-4 py-2 hover:bg-canvas text-sm flex justify-between">
                    <span className="truncate">{a.name}</span>
                    <span className="text-ink-faint font-mono text-xs shrink-0 ml-2">{a.assetTag}</span>
                  </button>
                ))}
              </div>
            )}
            {results.articles?.length > 0 && (
              <div className="py-2 border-t border-border">
                <p className="px-4 py-1 text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Knowledge Base</p>
                {results.articles.map((a) => (
                  <button key={a._id} onClick={() => goTo(`/knowledge-base/${a._id}`)} className="w-full text-left px-4 py-2 hover:bg-canvas text-sm truncate">
                    {a.title}
                  </button>
                ))}
              </div>
            )}
            {results.users?.length > 0 && (
              <div className="py-2 border-t border-border">
                <p className="px-4 py-1 text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Users</p>
                {results.users.map((u) => (
                  <button key={u._id} onClick={() => goTo('/users')} className="w-full text-left px-4 py-2 hover:bg-canvas text-sm truncate">
                    {u.name} <span className="text-ink-faint">· {u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <NotificationBell />

      <div className="relative" ref={menuRef}>
        <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-canvas">
          <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {initials(user?.name)}
          </div>
          <span className="hidden md:block text-left">
            <span className="block text-sm font-medium text-ink leading-tight">{user?.name}</span>
            <span className="block text-[11px] text-ink-faint leading-tight">{ROLE_LABELS[user?.role]}</span>
          </span>
          <ChevronDown size={15} className="text-ink-faint hidden md:block" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-white border border-border rounded-xl2 shadow-popover py-1.5 z-50">
            <div className="px-3.5 py-2 border-b border-border md:hidden">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-ink-faint">{ROLE_LABELS[user?.role]}</p>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-ink hover:bg-canvas"
            >
              <UserIcon size={15} /> My Profile
            </button>
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-status-critical hover:bg-status-criticalBg">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
