import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ticket,
  FolderOpen,
  Loader,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Boxes,
  UserCog,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../utils/roles.js';
import { CardSkeleton, EmptyState } from '../components/ui/Skeleton.jsx';
import { StatusBadge, PriorityBadge, SlaBadge } from '../components/ui/Badge.jsx';
import { formatRelative } from '../utils/format.js';
import { TicketTrendChart, CategoryChart, StatusChart, SlaChart, WorkloadChart } from '../components/charts/DashboardCharts.jsx';

function StatCard({ label, value, icon: Icon, accent = 'brand' }) {
  const accents = {
    brand: 'text-brand-600 bg-brand-50',
    safe: 'text-status-safe bg-status-safeBg',
    warn: 'text-status-warn bg-status-warnBg',
    critical: 'text-status-critical bg-status-criticalBg',
    neutral: 'text-status-neutral bg-status-neutralBg',
  };
  const borderAccents = {
    brand: 'border-l-brand-500',
    safe: 'border-l-status-safe',
    warn: 'border-l-status-warn',
    critical: 'border-l-status-critical',
    neutral: 'border-l-border-strong',
  };
  return (
    <div className={`card border-l-[3px] ${borderAccents[accent]} p-4 flex items-start justify-between`}>
      <div>
        <p className="text-xs font-medium text-ink-faint">{label}</p>
        <p className="text-2xl font-semibold text-ink mt-1 tabular-nums">{value}</p>
      </div>
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${accents[accent]}`}>
        <Icon size={17} />
      </div>
    </div>
  );
}

function StaffDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/dashboard/stats')
      .then((res) => setStats(res.data.data))
      .catch(() => setError('Could not load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} className="h-20" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <CardSkeleton className="h-72" />
          <CardSkeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return <EmptyState icon={ShieldAlert} title="Dashboard unavailable" description={error} />;
  }

  const { cards, ticketTrend, categories, statuses, slaPerformance, technicianWorkload } = stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Tickets" value={cards.totalTickets} icon={Ticket} accent="brand" />
        <StatCard label="Open Tickets" value={cards.openTickets} icon={FolderOpen} accent="neutral" />
        <StatCard label="In Progress" value={cards.inProgress} icon={Loader} accent="brand" />
        <StatCard label="Resolved Today" value={cards.resolvedToday} icon={CheckCircle2} accent="safe" />
        <StatCard label="SLA At Risk" value={cards.slaAtRisk} icon={AlertTriangle} accent="warn" />
        <StatCard label="SLA Breached" value={cards.slaBreached} icon={ShieldAlert} accent="critical" />
        <StatCard label="Total Assets" value={cards.totalAssets} icon={Boxes} accent="neutral" />
        <StatCard label="Active Technicians" value={cards.activeTechnicians} icon={UserCog} accent="brand" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm text-ink mb-4">Ticket Trend (14 days)</h3>
          {ticketTrend.length === 0 ? (
            <p className="text-sm text-ink-faint py-10 text-center">No tickets in this period yet.</p>
          ) : (
            <TicketTrendChart data={ticketTrend} />
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-ink mb-4">SLA Performance</h3>
          <SlaChart met={slaPerformance.met} atRisk={slaPerformance.atRisk} breached={slaPerformance.breached} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-ink mb-4">Ticket Categories</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-ink-faint py-10 text-center">No data yet.</p>
          ) : (
            <CategoryChart data={categories} />
          )}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-ink mb-4">Ticket Status</h3>
          {statuses.length === 0 ? (
            <p className="text-sm text-ink-faint py-10 text-center">No data yet.</p>
          ) : (
            <StatusChart data={statuses} />
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-sm text-ink mb-4">Technician Workload</h3>
        {technicianWorkload.length === 0 ? (
          <p className="text-sm text-ink-faint py-10 text-center">No technicians yet.</p>
        ) : (
          <>
            <WorkloadChart data={technicianWorkload.map((w) => ({ name: w.name, assigned: w.assigned, resolved: w.resolved }))} />
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {technicianWorkload.map((w) => (
                <div key={w.technicianId} className="rounded-lg border border-border px-3.5 py-3">
                  <p className="text-sm font-medium text-ink">{w.name}</p>
                  <div className="flex justify-between text-xs text-ink-faint mt-1.5">
                    <span>SLA compliance</span>
                    <span className="font-medium text-ink">{w.slaCompliance}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-ink-faint">
                    <span>Avg. resolution</span>
                    <span className="font-medium text-ink">{w.avgResolutionHours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/tickets', { params: { limit: 6 } })
      .then((res) => setTickets(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const open = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status)).length;
  const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status)).length;

  return (
    <div className="space-y-6">
      <div className="card p-6 bg-gradient-to-br from-brand-500 to-brand-600 border-none">
        <p className="text-white/80 text-sm">Welcome back,</p>
        <h2 className="text-white text-xl font-semibold mt-0.5">{user?.name}</h2>
        <Link to="/tickets/new" className="btn bg-white text-brand-600 hover:bg-brand-50 mt-4 w-fit">
          <PlusCircle size={16} /> Create a new ticket
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Open Tickets" value={loading ? '—' : open} icon={FolderOpen} accent="warn" />
        <StatCard label="Resolved" value={loading ? '—' : resolved} icon={CheckCircle2} accent="safe" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm text-ink">Your Recent Tickets</h3>
          <Link to="/tickets" className="text-xs font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-border/40 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No tickets yet"
            description="Create your first ticket and our AI will triage it instantly."
            action={
              <Link to="/tickets/new" className="btn-primary">
                <PlusCircle size={16} /> Create Ticket
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {tickets.map((t) => (
              <li key={t._id}>
                <Link to={`/tickets/${t._id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-canvas">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{t.title}</p>
                    <p className="text-xs text-ink-faint font-mono">{t.ticketNumber} · {formatRelative(t.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                    <SlaBadge status={t.sla?.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  return user?.role === ROLES.EMPLOYEE ? <EmployeeDashboard /> : <StaffDashboard />;
}
