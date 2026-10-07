import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { ROLES } from '../utils/roles.js';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';

function SectionCard({ title, description, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-sm text-ink">{title}</h3>
      {description && <p className="text-xs text-ink-faint mt-0.5 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

export default function DepartmentsCategoriesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === ROLES.SYSTEM_ADMIN;

  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slaConfigs, setSlaConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newDept, setNewDept] = useState('');
  const [newCat, setNewCat] = useState('');
  const [checking, setChecking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, c, s] = await Promise.all([api.get('/departments'), api.get('/categories'), api.get('/sla/config')]);
      setDepartments(d.data.data);
      setCategories(c.data.data);
      setSlaConfigs(s.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addDepartment = async () => {
    if (!newDept.trim()) return;
    try {
      await api.post('/departments', { name: newDept.trim() });
      setNewDept('');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const deleteDepartment = async (id) => {
    try {
      await api.delete(`/departments/${id}`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const addCategory = async () => {
    if (!newCat.trim()) return;
    try {
      await api.post('/categories', { name: newCat.trim() });
      setNewCat('');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const updateSla = async (priority, field, value) => {
    setSlaConfigs((prev) => prev.map((s) => (s.priority === priority ? { ...s, [field]: value } : s)));
  };

  const saveSla = async (config) => {
    try {
      await api.put(`/sla/config/${config.priority}`, {
        responseMinutes: Number(config.responseMinutes),
        resolutionMinutes: Number(config.resolutionMinutes),
      });
      showToast(`${config.priority} SLA updated.`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const runSlaCheck = async () => {
    setChecking(true);
    try {
      const res = await api.post('/sla/check');
      showToast(res.data.message, 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <CardSkeleton className="h-40" />
        <CardSkeleton className="h-40" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-ink">Departments, Categories &amp; SLAs</h1>
        <p className="text-sm text-ink-faint">Configure the reference data used across tickets and assets.</p>
      </div>

      <SectionCard title="SLA Configuration" description="Response and resolution targets per priority, in minutes.">
        <div className="space-y-2.5">
          {slaConfigs.map((s) => (
            <div key={s.priority} className="flex items-center gap-3 flex-wrap">
              <span className="w-24 text-sm font-medium text-ink shrink-0">{s.priority}</span>
              <label className="text-xs text-ink-faint">Response</label>
              <input
                type="number"
                className="input w-24"
                value={s.responseMinutes}
                disabled={!isAdmin && user?.role !== ROLES.IT_MANAGER}
                onChange={(e) => updateSla(s.priority, 'responseMinutes', e.target.value)}
              />
              <label className="text-xs text-ink-faint">Resolution</label>
              <input
                type="number"
                className="input w-24"
                value={s.resolutionMinutes}
                disabled={!isAdmin && user?.role !== ROLES.IT_MANAGER}
                onChange={(e) => updateSla(s.priority, 'resolutionMinutes', e.target.value)}
              />
              <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => saveSla(s)}>
                Save
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <p className="text-xs text-ink-faint">Recompute SLA status for all open tickets and raise breach notifications.</p>
          <button className="btn-secondary" onClick={runSlaCheck} disabled={checking}>
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} /> Run SLA Check
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Departments">
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <input className="input" placeholder="New department name" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
            <button className="btn-secondary shrink-0" onClick={addDepartment}>
              <Plus size={15} /> Add
            </button>
          </div>
        )}
        <ul className="divide-y divide-border -mx-5">
          {departments.map((d) => (
            <li key={d._id} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-sm text-ink">{d.name}</span>
              {isAdmin && (
                <button onClick={() => deleteDepartment(d._id)} className="text-ink-faint hover:text-status-critical">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Categories">
        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <input className="input" placeholder="New category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn-secondary shrink-0" onClick={addCategory}>
              <Plus size={15} /> Add
            </button>
          </div>
        )}
        <ul className="divide-y divide-border -mx-5">
          {categories.map((c) => (
            <li key={c._id} className="flex items-center justify-between px-5 py-2.5">
              <span className="text-sm text-ink">{c.name}</span>
              {isAdmin && (
                <button onClick={() => deleteCategory(c._id)} className="text-ink-faint hover:text-status-critical">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
