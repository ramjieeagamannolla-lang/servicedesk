import React from 'react';
import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

const STATUS_STYLES = {
  NEW: 'bg-status-infoBg text-status-info',
  TRIAGED: 'bg-status-infoBg text-status-info',
  ASSIGNED: 'bg-brand-50 text-brand-600',
  IN_PROGRESS: 'bg-brand-50 text-brand-600',
  WAITING_FOR_USER: 'bg-status-warnBg text-status-warn',
  RESOLVED: 'bg-status-safeBg text-status-safe',
  CLOSED: 'bg-status-neutralBg text-status-neutral',
  REOPENED: 'bg-status-criticalBg text-status-critical',
};

const STATUS_LABELS = {
  NEW: 'New',
  TRIAGED: 'Triaged',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING_FOR_USER: 'Waiting for User',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status] || 'bg-status-neutralBg text-status-neutral'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

const PRIORITY_STYLES = {
  LOW: 'bg-status-neutralBg text-status-neutral',
  MEDIUM: 'bg-status-infoBg text-status-info',
  HIGH: 'bg-status-warnBg text-status-warn',
  CRITICAL: 'bg-status-criticalBg text-status-critical',
};

export function PriorityBadge({ priority }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${PRIORITY_STYLES[priority] || PRIORITY_STYLES.MEDIUM}`}>
      {priority === 'CRITICAL' && <AlertTriangle size={11} />}
      {priority}
    </span>
  );
}

const SLA_STYLES = {
  SAFE: 'bg-status-safeBg text-status-safe',
  AT_RISK: 'bg-status-warnBg text-status-warn',
  BREACHED: 'bg-status-criticalBg text-status-critical',
};

const SLA_ICONS = {
  SAFE: CheckCircle2,
  AT_RISK: Clock,
  BREACHED: AlertTriangle,
};

const SLA_LABELS = {
  SAFE: 'On Track',
  AT_RISK: 'At Risk',
  BREACHED: 'Breached',
};

export function SlaBadge({ status }) {
  const Icon = SLA_ICONS[status] || Clock;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${SLA_STYLES[status] || SLA_STYLES.SAFE}`}>
      <Icon size={11} />
      {SLA_LABELS[status] || status}
    </span>
  );
}

const ASSET_STYLES = {
  AVAILABLE: 'bg-status-safeBg text-status-safe',
  ASSIGNED: 'bg-brand-50 text-brand-600',
  IN_REPAIR: 'bg-status-warnBg text-status-warn',
  RETIRED: 'bg-status-neutralBg text-status-neutral',
  LOST: 'bg-status-criticalBg text-status-critical',
};

export function AssetStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${ASSET_STYLES[status] || ASSET_STYLES.AVAILABLE}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}
