import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserMinus } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLES } from '../utils/roles.js';
import { AssetStatusBadge, StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import { formatDate, formatDateTime } from '../utils/format.js';

export default function AssetDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [saving, setSaving] = useState(false);

  const canManage = [ROLES.ASSET_MANAGER, ROLES.SYSTEM_ADMIN].includes(user?.role);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/assets/${id}`);
      setData(res.data.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openAssign = async () => {
    setAssignOpen(true);
    if (users.length === 0) {
      const res = await api.get('/users');
      setUsers(res.data.data);
    }
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.patch(`/assets/${id}/assign`, { userId: selectedUser });
      showToast('Asset assigned.', 'success');
      setAssignOpen(false);
      setSelectedUser('');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    try {
      await api.patch(`/assets/${id}/unassign`);
      showToast('Asset unassigned.', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CardSkeleton className="h-96" />;
  if (!data) return null;
  const { asset, history, relatedTickets } = data;

  return (
    <div className="space-y-5 pb-10">
      <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink">
        <ArrowLeft size={15} /> Back to assets
      </Link>

      <div className="card p-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-ink-faint">{asset.assetTag}</p>
          <h1 className="text-xl font-semibold text-ink mt-0.5">{asset.name}</h1>
          <p className="text-sm text-ink-faint mt-0.5">
            {asset.brand} {asset.model}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AssetStatusBadge status={asset.status} />
          {canManage &&
            (asset.assignedTo ? (
              <button className="btn-secondary" onClick={handleUnassign} disabled={saving}>
                <UserMinus size={15} /> Unassign
              </button>
            ) : (
              <button className="btn-primary" onClick={openAssign} disabled={saving || asset.status === 'RETIRED' || asset.status === 'LOST'}>
                <UserPlus size={15} /> Assign
              </button>
            ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-ink mb-3">Details</h3>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-faint">Serial Number</dt>
              <dd className="font-medium text-ink font-mono text-xs">{asset.serialNumber || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-faint">Department</dt>
              <dd className="font-medium text-ink">{asset.department?.name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-faint">Location</dt>
              <dd className="font-medium text-ink">{asset.location || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-faint">Assigned To</dt>
              <dd className="font-medium text-ink">{asset.assignedTo?.name || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-faint">Purchase Date</dt>
              <dd className="font-medium text-ink">{formatDate(asset.purchaseDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-faint">Warranty Expiry</dt>
              <dd className="font-medium text-ink">{formatDate(asset.warrantyExpiry)}</dd>
            </div>
          </dl>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm text-ink mb-3">Related Tickets</h3>
          {relatedTickets.length === 0 ? (
            <p className="text-sm text-ink-faint">No tickets reference this asset.</p>
          ) : (
            <ul className="space-y-2.5">
              {relatedTickets.map((t) => (
                <li key={t._id}>
                  <Link to={`/tickets/${t._id}`} className="block hover:bg-canvas rounded-lg -mx-2 px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-ink truncate">{t.title}</p>
                      <PriorityBadge priority={t.priority} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-ink-faint">{t.ticketNumber}</span>
                      <StatusBadge status={t.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-sm text-ink mb-3">History</h3>
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h._id} className="text-sm">
                <p className="text-ink font-medium">{h.action.replace('_', ' ')}</p>
                <p className="text-xs text-ink-faint">
                  {h.performedBy?.name} · {formatDateTime(h.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Asset"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAssign} disabled={!selectedUser || saving}>
              {saving ? 'Assigning…' : 'Assign'}
            </button>
          </>
        }
      >
        <select className="select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">Select a user…</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.role.replace('_', ' ')})
            </option>
          ))}
        </select>
      </Modal>
    </div>
  );
}
