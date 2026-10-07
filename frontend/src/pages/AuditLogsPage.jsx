import React, { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import api from '../api/axios.js';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.jsx';
import { formatDateTime } from '../utils/format.js';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', { params: { page, limit: 40 } });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Audit Logs</h1>
        <p className="text-sm text-ink-faint">System-wide activity trail</p>
      </div>

      {loading ? (
        <TableSkeleton rows={10} cols={4} />
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit log entries yet" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-shell min-w-[720px]">
            <thead>
              <tr>
                <th>Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l._id}>
                  <td className="font-medium text-ink">{l.action.replace(/_/g, ' ')}</td>
                  <td className="text-ink-muted">
                    {l.entityType}
                    {l.metadata?.ticketNumber && <span className="text-ink-faint font-mono text-xs ml-1.5">{l.metadata.ticketNumber}</span>}
                  </td>
                  <td className="text-ink-muted">{l.actor?.name || l.actorName || 'System'}</td>
                  <td className="text-ink-faint whitespace-nowrap">{formatDateTime(l.createdAt)}</td>
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
                <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-40">
                  Prev
                </button>
                <button disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)} className="btn-secondary !px-2.5 !py-1.5 disabled:opacity-40">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
