import React from 'react';
import { Inbox } from 'lucide-react';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-border/70 rounded-md ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 0 ? 'w-24' : 'flex-1'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className = 'h-28' }) {
  return <div className={`card ${className} animate-pulse bg-border/40`} />;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-12 w-12 rounded-full bg-canvas flex items-center justify-center mb-3">
        <Icon size={22} className="text-ink-faint" />
      </div>
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="text-sm text-ink-faint mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
