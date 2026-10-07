import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, PlusCircle, Eye, ThumbsUp } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { STAFF_ROLES } from '../utils/roles.js';
import { TICKET_CATEGORIES } from '../constants.js';
import { TableSkeleton, EmptyState } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';

function NewArticleModal({ open, onClose, onCreated }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', category: 'Other', tags: '', symptoms: '', solution: '' });
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.solution.trim()) return;
    setSaving(true);
    try {
      await api.post('/knowledge', {
        title: form.title,
        category: form.category,
        solution: form.solution,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        symptoms: form.symptoms.split(',').map((t) => t.trim()).filter(Boolean),
      });
      showToast('Article published.', 'success');
      setForm({ title: '', category: 'Other', tags: '', symptoms: '', solution: '' });
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
      title="New Knowledge Article"
      size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={!form.title.trim() || !form.solution.trim() || saving}>
            {saving ? 'Publishing…' : 'Publish Article'}
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={update('title')} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="select" value={form.category} onChange={update('category')}>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Symptoms (comma-separated)</label>
          <input className="input" value={form.symptoms} onChange={update('symptoms')} placeholder="e.g. VPN timeout, cannot connect" />
        </div>
        <div>
          <label className="label">Tags (comma-separated)</label>
          <input className="input" value={form.tags} onChange={update('tags')} placeholder="e.g. vpn, remote access" />
        </div>
        <div>
          <label className="label">Solution steps</label>
          <textarea className="input min-h-[120px]" value={form.solution} onChange={update('solution')} placeholder="1. Step one&#10;2. Step two…" />
        </div>
      </div>
    </Modal>
  );
}

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [newOpen, setNewOpen] = useState(false);

  const canAuthor = STAFF_ROLES.includes(user?.role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/knowledge', { params: { search: search || undefined, category: category || undefined } });
      setArticles(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-ink">Knowledge Base</h1>
          <p className="text-sm text-ink-faint">{articles.length} articles</p>
        </div>
        {canAuthor && (
          <button className="btn-primary" onClick={() => setNewOpen(true)}>
            <PlusCircle size={16} /> New Article
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <input className="input max-w-xs" placeholder="Search articles…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="select w-auto" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {TICKET_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={3} />
      ) : articles.length === 0 ? (
        <EmptyState icon={BookOpen} title="No articles found" description="Try a different search or category." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((a) => (
            <Link key={a._id} to={`/knowledge-base/${a._id}`} className="card p-4 hover:border-brand-300 transition-colors">
              <span className="inline-block text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mb-2">{a.category}</span>
              <h3 className="font-medium text-ink text-sm leading-snug">{a.title}</h3>
              <div className="flex items-center gap-3 mt-3 text-xs text-ink-faint">
                <span className="flex items-center gap-1">
                  <Eye size={12} /> {a.views}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp size={12} /> {a.helpfulVotes}
                </span>
                <span className="ml-auto">{a.author?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NewArticleModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={load} />
    </div>
  );
}
