import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Boxes,
  BookOpen,
  Users,
  Building2,
  ScrollText,
  Settings2,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/roles.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { to: '/tickets', label: 'Tickets', icon: Ticket, roles: null },
  { to: '/tickets/new', label: 'New Ticket', icon: PlusCircle, roles: null },
  { to: '/assets', label: 'Assets', icon: Boxes, roles: null },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen, roles: null },
  { to: '/users', label: 'Users', icon: Users, roles: [ROLES.SYSTEM_ADMIN] },
  { to: '/settings', label: 'Departments & SLAs', icon: Settings2, roles: [ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER] },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: [ROLES.SYSTEM_ADMIN, ROLES.IT_MANAGER] },
];

export default function Sidebar({ open, onNavigate }) {
  const { user } = useAuth();

  const items = NAV.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <aside
      className={`fixed z-40 inset-y-0 left-0 w-64 bg-sidebar text-sidebar-ink flex flex-col transition-transform duration-200 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/5">
        <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center shrink-0">
          <Wrench size={17} className="text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-white font-semibold text-[15px] tracking-tight">ServiceDesk Pro</p>
          <p className="text-[11px] text-sidebar-inkMuted">IT Helpdesk &amp; Assets</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-500/15 text-white'
                  : 'text-sidebar-ink hover:bg-sidebar-hover hover:text-white'
              }`
            }
          >
            <Icon size={17} className="shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/5">
        <div className="rounded-lg bg-white/5 px-3 py-2.5 text-[11px] text-sidebar-inkMuted leading-relaxed">
          Signed in as{' '}
          <span className="text-white font-medium">{user?.role?.replace('_', ' ')}</span>
        </div>
      </div>
    </aside>
  );
}
