import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import { TICKET_CATEGORIES, IMPACT, URGENCY } from '../constants.js';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', category: '', impact: 'MEDIUM', urgency: 'HIGH', asset: '' });
  const [assets, setAssets] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/assets', { params: { limit: 100 } })
      .then((res) => setAssets(res.data.data))
      .catch(() => {});
  }, []);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      showToast('Please fill in a title and description.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.category) delete payload.category;
      if (!payload.asset) delete payload.asset;
      const res = await api.post('/tickets', payload);
      showToast(`Ticket ${res.data.data.ticketNumber} created — AI analysis complete.`, 'success');
      navigate(`/tickets/${res.data.data._id}`);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-ink">Create a Ticket</h1>
        <p className="text-sm text-ink-faint">Describe your issue in plain language — our AI will classify and prioritize it instantly.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            placeholder="e.g. VPN is not connecting"
            value={form.title}
            onChange={update('title')}
            maxLength={140}
            required
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[120px] resize-y"
            placeholder="Describe what's happening, when it started, and any error messages you're seeing…"
            value={form.description}
            onChange={update('description')}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category (optional)</label>
            <select className="select" value={form.category} onChange={update('category')}>
              <option value="">Let AI decide</option>
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Related Asset (optional)</label>
            <select className="select" value={form.asset} onChange={update('asset')}>
              <option value="">None</option>
              {assets.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.assetTag} — {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Impact</label>
            <select className="select" value={form.impact} onChange={update('impact')}>
              {IMPACT.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Urgency</label>
            <select className="select" value={form.urgency} onChange={update('urgency')}>
              {URGENCY.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-brand-50 border border-brand-100 px-3.5 py-2.5 text-xs text-brand-700">
          <Sparkles size={14} className="shrink-0" />
          After you submit, AI will predict the category, priority, and suggest a resolution automatically.
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Analyzing &amp; creating…
            </>
          ) : (
            'Submit Ticket'
          )}
        </button>
      </form>
    </div>
  );
}
