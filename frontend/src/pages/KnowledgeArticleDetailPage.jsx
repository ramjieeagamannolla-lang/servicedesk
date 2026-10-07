import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, Eye } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useToast } from '../context/ToastContext.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';

export default function KnowledgeArticleDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/knowledge/${id}`);
      setArticle(res.data.data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleVote = async () => {
    if (voted) return;
    try {
      const res = await api.post(`/knowledge/${id}/vote`);
      setArticle(res.data.data);
      setVoted(true);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (loading) return <CardSkeleton className="h-96" />;
  if (!article) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <Link to="/knowledge-base" className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink">
        <ArrowLeft size={15} /> Back to knowledge base
      </Link>

      <div className="card p-6">
        <span className="inline-block text-[11px] font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full mb-2.5">{article.category}</span>
        <h1 className="text-xl font-semibold text-ink">{article.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-xs text-ink-faint">
          <span>By {article.author?.name}</span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {article.views} views
          </span>
        </div>

        {article.symptoms?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1.5">Symptoms</h3>
            <ul className="list-disc list-inside text-sm text-ink-muted space-y-1">
              {article.symptoms.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <h3 className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1.5">Solution</h3>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{article.solution}</p>
        </div>

        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
            {article.tags.map((t) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-canvas text-ink-muted">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
          <p className="text-sm text-ink-faint">Was this article helpful?</p>
          <button onClick={handleVote} disabled={voted} className="btn-secondary">
            <ThumbsUp size={14} /> {voted ? 'Thanks!' : 'Helpful'} ({article.helpfulVotes})
          </button>
        </div>
      </div>
    </div>
  );
}
