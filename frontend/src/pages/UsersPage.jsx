import React, { useCallback, useEffect, useState } from 'react';
import { PlusCircle, Users as UsersIcon, Ban, CheckCircle2 } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import { ROLES, ROLE_LABELS } from '../utils/roles.js';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import { initials } from '../utils/format.js';

function NewUserModal({ open, onClose, onCreated, departments }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: ROLES.EMPLOYEE, department: '' });
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;
    setSaving(true);
    try {
      await api.post('/users', form);
      showToast('User created.', 'success');
      setForm({ name: '', email: '', password: '', role: ROLES.EMPLOYEE, department: '' });
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
      title="Add User"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <label className="label">Full name</label>
          <input className="input" value={form.name} onChange={update('name')} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={update('email')} />
        </div>
        <div>
          <label className="label">Temporary password</label>
          <input className="input" type="text" value={form.password} onChange={update('password')} />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="label">Role</label>
            <select className="select" value={form.role} onChange={update('role')}>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <select className="select" value={form.department} onChange={update('department')}>
              <option value="">None</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        api.get('/users', { params: { role: roleFilter || undefined } }),
        api.get('/departments'),
      ]);
      setUsers(uRes.data.data);
      setDepartments(dRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (u) => {
    try {
      if (u.isActive) {
        await api.delete(`/users/${u._id}`);
      } else {
        await api.put(`/users/${u._id}`, { isActive: true });
      }
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Users</h1>
          <p className="text-sm text-ink-faint">{users.length} users</p>
        </div>
        <button className="btn-primary" onClick={() => setNewOpen(true)}>
          <PlusCircle size={16} /> Add User
        </button>
      </div>

      <select className="select w-auto" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
        <option value="">All roles</option>
        {Object.values(ROLES).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>

      {loading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : users.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No users found" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-shell min-w-[680px]">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center shrink-0">
                        {initials(u.name)}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{u.name}</p>
                        <p className="text-xs text-ink-faint">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-ink-muted">{ROLE_LABELS[u.role]}</td>
                  <td className="text-ink-muted">{u.department?.name || '—'}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${u.isActive ? 'bg-status-safeBg text-status-safe' : 'bg-status-neutralBg text-status-neutral'}`}>
                      {u.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => toggleActive(u)} className="btn-ghost !px-2 !py-1 text-xs">
                      {u.isActive ? (
                        <>
                          <Ban size={13} /> Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} /> Reactivate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewUserModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={load} departments={departments} />
    </div>
  );
}
