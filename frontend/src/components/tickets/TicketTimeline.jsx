import React from 'react';
import { Check } from 'lucide-react';
import { formatDateTime } from '../../utils/format.js';

const STEPS = [
  { key: 'created', label: 'Ticket Created' },
  { key: 'classified', label: 'AI Classified' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'started', label: 'Technician Started' },
  { key: 'worklog', label: 'Work Log Added' },
  { key: 'resolved', label: 'Resolution Added' },
  { key: 'confirmed', label: 'Employee Confirmed' },
  { key: 'closed', label: 'Closed' },
];

export default function TicketTimeline({ ticket, workLogs }) {
  const reached = {
    created: true,
    classified: Boolean(ticket.ai?.analyzedAt),
    assigned: Boolean(ticket.assignedTo),
    started: ['IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'].includes(ticket.status) || Boolean(ticket.sla?.respondedAt),
    worklog: (workLogs?.length || 0) > 0,
    resolved: Boolean(ticket.resolution?.resolvedAt),
    confirmed: Boolean(ticket.resolution?.confirmedByRequester),
    closed: ticket.status === 'CLOSED',
  };

  const timestamps = {
    created: ticket.createdAt,
    classified: ticket.ai?.analyzedAt,
    resolved: ticket.resolution?.resolvedAt,
    confirmed: ticket.resolution?.confirmedAt,
    closed: ticket.closedAt,
  };

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done = reached[step.key];
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                  done ? 'bg-status-safe text-white' : 'bg-canvas border border-border text-ink-faint'
                }`}
              >
                {done ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </div>
              {!isLast && <div className={`w-0.5 flex-1 min-h-[18px] ${done ? 'bg-status-safe/40' : 'bg-border'}`} />}
            </div>
            <div className="pb-4">
              <p className={`text-sm font-medium ${done ? 'text-ink' : 'text-ink-faint'}`}>{step.label}</p>
              {timestamps[step.key] && <p className="text-xs text-ink-faint">{formatDateTime(timestamps[step.key])}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
