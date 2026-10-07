import React from 'react';
import { Sparkles, BookOpen, ShieldCheck, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AIAnalysisPanel({ ai }) {
  if (!ai) return null;
  const confidencePct = Math.round((ai.confidence || 0) * 100);

  return (
    <div className="rounded-xl2 border border-brand-200 bg-gradient-to-br from-brand-50 to-white overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-brand-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <h3 className="font-semibold text-sm text-ink">AI Ticket Analysis</h3>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
            ai.source === 'ai' ? 'bg-status-safeBg text-status-safe' : 'bg-status-neutralBg text-status-neutral'
          }`}
        >
          <Radio size={10} />
          {ai.source === 'ai' ? 'Live AI' : 'Demo Mode'}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[11px] text-ink-faint font-medium">Category</p>
            <p className="text-sm font-semibold text-ink mt-0.5">
              {ai.predictedCategory}
              {ai.predictedSubcategory ? ` / ${ai.predictedSubcategory}` : ''}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-ink-faint font-medium">Priority</p>
            <p className="text-sm font-semibold text-ink mt-0.5">{ai.predictedPriority}</p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[11px] text-ink-faint font-medium">Confidence</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 flex-1 bg-brand-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: `${confidencePct}%` }} />
              </div>
              <span className="text-xs font-semibold text-brand-600">{confidencePct}%</span>
            </div>
          </div>
        </div>

        {ai.summary && (
          <div>
            <p className="text-[11px] text-ink-faint font-medium mb-1">Summary</p>
            <p className="text-sm text-ink-muted">{ai.summary}</p>
          </div>
        )}

        {ai.suggestedSolution?.length > 0 && (
          <div>
            <p className="text-[11px] text-ink-faint font-medium mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={12} /> Suggested Resolution
            </p>
            <ol className="space-y-1.5">
              {ai.suggestedSolution.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-ink">
                  <span className="shrink-0 h-5 w-5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {ai.relatedArticles?.length > 0 && (
          <div>
            <p className="text-[11px] text-ink-faint font-medium mb-1.5 flex items-center gap-1.5">
              <BookOpen size={12} /> Relevant Knowledge
            </p>
            <div className="flex flex-wrap gap-2">
              {ai.relatedArticles.map((a) => (
                <Link
                  key={a._id}
                  to={`/knowledge-base/${a._id}`}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 font-medium"
                >
                  {a.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
