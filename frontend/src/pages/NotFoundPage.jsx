import React from 'react';
import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-canvas text-center px-4">
      <CompassIcon size={40} className="text-ink-faint mb-3" />
      <h1 className="text-xl font-semibold text-ink">Page not found</h1>
      <p className="text-sm text-ink-faint mt-1 mb-5">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  );
}
