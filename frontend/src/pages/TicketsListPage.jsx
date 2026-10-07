import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Ticket as TicketIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios.js';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.jsx';
import { StatusBadge, PriorityBadge, SlaBadge } from '../components/ui/Badge.jsx';
import { formatRelative } from '../utils/format.js';
import { TICKET_CATEGORIES, TICKET_PRIORITY, TICKET_STATUS } from '../constants.js';

export default function TicketsListPage() {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets', {
        params: { status: status || undefined, priority: priority || undefined, category: category || undefined, page, limit: 15 },
      });
      setTickets(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, [status, priority, category, page]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Tickets</h1>
          <p className="text-sm text-ink-faint">{pagination.total} total</p>
        </div>
        <Link to="/tickets/new" className="btn-primary">
          <PlusCircle size={16} /> New Ticket
        </Link>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <select className="select w-auto" value={status} onChange={(e) => updateFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {TICKET_STATUS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select className="select w-auto" value={priority} onChange={(e) => updateFilter('priority', e.target.value)}>
          <option value="">All priorities</option>
          {TICKET_PRIORITY.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select className="select w-auto" value={category} onChange={(e) => updateFilter('category', e.target.value)}>
          <option value="">All categories</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={TicketIcon}
          title="No tickets found"
          description="Try adjusting your filters, or create a new ticket."
          action={
            <Link to="/tickets/new" className="btn-primary">
              <PlusCircle size={16} /> New Ticket
            </Link>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-shell min-w-[820px]">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Requester</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA</th>
                <th>Assigned</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="cursor-pointer" onClick={() => navigate(`/tickets/${t._id}`)}>
                  <td>
                    <p className="font-medium text-ink truncate max-w-[220px]">{t.title}</p>
                    <p className="text-xs text-ink-faint font-mono">{t.ticketNumber}</p>
                  </td>
                  <td className="text-ink-muted">{t.requester?.name}</td>
                  <td className="text-ink-muted">{t.category}</td>
                  <td>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>
                    <SlaBadge status={t.sla?.status} />
                  </td>
                  <td className="text-ink-muted">{t.assignedTo?.name || <span className="text-ink-faint italic">Unassigned</span>}</td>
                  <td className="text-ink-faint whitespace-nowrap">{formatRelative(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-ink-faint">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-1.5">
                <button
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                  className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  disabled={page >= pagination.pages}
                  onClick={() => goToPage(page + 1)}
                  className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
