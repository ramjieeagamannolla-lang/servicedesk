import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Boxes } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../utils/roles.js';
import { ASSET_TYPES, ASSET_STATUS } from '../constants.js';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.jsx';
import { AssetStatusBadge } from '../components/ui/Badge.jsx';
import Modal from '../components/ui/Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

function NewAssetModal({ open, onClose, onCreated }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', type: 'LAPTOP', brand: '', model: '', location: '' });
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/assets', form);
      showToast('Asset created.', 'success');
      setForm({ name: '', type: 'LAPTOP', brand: '', model: '', location: '' });
      onCreated();
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Asset"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.name.trim() || saving}>
            {saving ? 'Saving…' : 'Create Asset'}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={update('name')} placeholder="e.g. Dell Latitude 5440" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="label">Type</label>
            <select className="select" value={form.type} onChange={update('type')}>
              {ASSET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Brand</label>
            <input className="input" value={form.brand} onChange={update('brand')} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="label">Model</label>
            <input className="input" value={form.model} onChange={update('model')} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" value={form.location} onChange={update('location')} />
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AssetsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const type = searchParams.get('type') || '';
  const status = searchParams.get('status') || '';

  const canManage = [ROLES.ASSET_MANAGER, ROLES.SYSTEM_ADMIN].includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets', { params: { type: type || undefined, status: status || undefined, limit: 50 } });
      setAssets(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [type, status]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Assets</h1>
          <p className="text-sm text-ink-faint">{assets.length} shown</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setNewOpen(true)}>
            <PlusCircle size={16} /> Add Asset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <select className="select w-auto" value={type} onChange={(e) => updateFilter('type', e.target.value)}>
          <option value="">All types</option>
          {ASSET_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select className="select w-auto" value={status} onChange={(e) => updateFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {ASSET_STATUS.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : assets.length === 0 ? (
        <EmptyState icon={Boxes} title="No assets found" description="Try adjusting your filters." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-shell min-w-[760px]">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Department</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a._id} className="cursor-pointer" onClick={() => navigate(`/assets/${a._id}`)}>
                  <td>
                    <p className="font-medium text-ink">{a.name}</p>
                    <p className="text-xs text-ink-faint font-mono">{a.assetTag}</p>
                  </td>
                  <td className="text-ink-muted">{a.type.replace('_', ' ')}</td>
                  <td>
                    <AssetStatusBadge status={a.status} />
                  </td>
                  <td className="text-ink-muted">{a.assignedTo?.name || <span className="text-ink-faint italic">—</span>}</td>
                  <td className="text-ink-muted">{a.department?.name || '—'}</td>
                  <td className="text-ink-muted">{a.location || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewAssetModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={load} />
    </div>
  );
}
