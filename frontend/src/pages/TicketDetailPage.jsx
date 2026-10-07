import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Lock,
  Clock,
  User as UserIcon,
  Building2,
  Boxes,
  UserCog,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import api, { getErrorMessage } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { STAFF_ROLES, ROLES } from '../utils/roles.js';
import { TICKET_TRANSITIONS } from '../constants.js';
import { StatusBadge, PriorityBadge, SlaBadge } from '../components/ui/Badge.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';
import Modal from '../components/ui/Modal.jsx';
import AIAnalysisPanel from '../components/tickets/AIAnalysisPanel.jsx';
import TicketTimeline from '../components/tickets/TicketTimeline.jsx';
import { formatDateTime, formatMinutesToDuration, initials } from '../utils/format.js';

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 py-2">
      <Icon size={15} className="text-ink-faint mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-ink-faint">{label}</p>
        <p className="text-sm text-ink font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [posting, setPosting] = useState(false);

  const [workLogText, setWorkLogText] = useState('');
  const [workLogMinutes, setWorkLogMinutes] = useState('');
  const [postingWorkLog, setPostingWorkLog] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTech, setSelectedTech] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolving, setResolving] = useState(false);

  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopening, setReopening] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.data.ticket);
      setComments(res.data.data.comments);
      setWorkLogs(res.data.data.workLogs);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const isStaff = STAFF_ROLES.includes(user?.role);
  const isRequester = ticket && String(ticket.requester?._id) === String(user?._id);
  const canAssign = [ROLES.IT_MANAGER, ROLES.SYSTEM_ADMIN].includes(user?.role);
  const canWorkOnTicket = isStaff;

  const openAssignModal = async () => {
    setAssignOpen(true);
    if (technicians.length === 0) {
      const res = await api.get('/users/technicians');
      setTechnicians(res.data.data);
    }
  };

  const handleAssign = async () => {
    if (!selectedTech) return;
    setAssigning(true);
    try {
      await api.patch(`/tickets/${id}/assign`, { technicianId: selectedTech });
      showToast('Ticket assigned.', 'success');
      setAssignOpen(false);
      setSelectedTech('');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.post(`/tickets/${id}/accept`);
      showToast('Ticket accepted.', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    setActionLoading(true);
    try {
      await api.patch(`/tickets/${id}/status`, { status });
      showToast(`Status updated to ${status.replace('_', ' ')}.`, 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionSummary.trim()) return;
    setResolving(true);
    try {
      await api.post(`/tickets/${id}/resolve`, { summary: resolutionSummary });
      showToast('Ticket marked as resolved.', 'success');
      setResolveOpen(false);
      setResolutionSummary('');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setResolving(false);
    }
  };

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await api.post(`/tickets/${id}/confirm`);
      showToast('Resolution confirmed. Ticket closed.', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setReopening(true);
    try {
      await api.post(`/tickets/${id}/reopen`, { reason: reopenReason });
      showToast('Ticket reopened.', 'success');
      setReopenOpen(false);
      setReopenReason('');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setReopening(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      await api.post(`/tickets/${id}/comments`, { message: commentText, isInternal });
      setCommentText('');
      setIsInternal(false);
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setPosting(false);
    }
  };

  const handlePostWorkLog = async (e) => {
    e.preventDefault();
    if (!workLogText.trim()) return;
    setPostingWorkLog(true);
    try {
      await api.post(`/tickets/${id}/worklogs`, { description: workLogText, minutesSpent: Number(workLogMinutes) || 0 });
      setWorkLogText('');
      setWorkLogMinutes('');
      load();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setPostingWorkLog(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton className="h-24" />
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <CardSkeleton className="h-48" />
            <CardSkeleton className="h-40" />
          </div>
          <CardSkeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const allowedTransitions = TICKET_TRANSITIONS[ticket.status] || [];
  const staffTransitions = allowedTransitions.filter((s) => !['CLOSED', 'REOPENED'].includes(s) || s !== 'RESOLVED');

  return (
    <div className="space-y-5 pb-10">
      <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink">
        <ArrowLeft size={15} /> Back to tickets
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-ink-faint">{ticket.ticketNumber}</p>
            <h1 className="text-xl font-semibold text-ink mt-0.5">{ticket.title}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <SlaBadge status={ticket.sla?.status} />
          </div>
        </div>
        <p className="text-sm text-ink-muted mt-3 whitespace-pre-wrap">{ticket.description}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <AIAnalysisPanel ai={ticket.ai} />

          {/* Action bar */}
          <div className="card p-4 flex flex-wrap gap-2">
            {canAssign && (
              <button className="btn-secondary" onClick={openAssignModal}>
                <UserCog size={15} /> {ticket.assignedTo ? 'Reassign' : 'Assign'} Technician
              </button>
            )}
            {isStaff && !ticket.assignedTo && user.role === ROLES.TECHNICIAN && (
              <button className="btn-secondary" onClick={handleAccept} disabled={actionLoading}>
                Accept Ticket
              </button>
            )}
            {canWorkOnTicket &&
              staffTransitions
                .filter((s) => s !== 'RESOLVED')
                .map((s) => (
                  <button key={s} className="btn-secondary" onClick={() => handleStatusChange(s)} disabled={actionLoading}>
                    Move to {s.replace('_', ' ')}
                  </button>
                ))}
            {canWorkOnTicket && allowedTransitions.includes('RESOLVED') && (
              <button className="btn-primary" onClick={() => setResolveOpen(true)}>
                <CheckCircle2 size={15} /> Resolve Ticket
              </button>
            )}
            {isRequester && ticket.status === 'RESOLVED' && (
              <>
                <button className="btn-primary" onClick={handleConfirm} disabled={actionLoading}>
                  <CheckCircle2 size={15} /> Confirm Resolution
                </button>
                <button className="btn-secondary" onClick={() => setReopenOpen(true)}>
                  <RotateCcw size={15} /> Reopen
                </button>
              </>
            )}
          </div>

          {/* Comments */}
          <div className="card">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="font-semibold text-sm text-ink">Comments</h3>
            </div>
            <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink-faint text-center">No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c._id} className={`px-5 py-3.5 flex gap-3 ${c.isInternal ? 'bg-status-warnBg/40' : ''}`}>
                    <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center shrink-0">
                      {initials(c.author?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-ink">{c.author?.name}</p>
                        {c.isInternal && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-warn bg-status-warnBg px-1.5 py-0.5 rounded">
                            <Lock size={9} /> Internal note
                          </span>
                        )}
                        <span className="text-xs text-ink-faint">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-ink-muted mt-0.5 whitespace-pre-wrap">{c.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handlePostComment} className="p-4 border-t border-border space-y-2.5">
              <textarea
                className="input min-h-[70px] resize-y"
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                {isStaff ? (
                  <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
                    <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded border-border" />
                    Internal note (hidden from requester)
                  </label>
                ) : (
                  <span />
                )}
                <button type="submit" className="btn-primary" disabled={posting || !commentText.trim()}>
                  {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Post
                </button>
              </div>
            </form>
          </div>

          {/* Work logs (staff only) */}
          {isStaff && (
            <div className="card">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="font-semibold text-sm text-ink">Work Logs</h3>
              </div>
              <div className="divide-y divide-border">
                {workLogs.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-ink-faint text-center">No work logs yet.</p>
                ) : (
                  workLogs.map((w) => (
                    <div key={w._id} className="px-5 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ink">{w.technician?.name}</p>
                        <span className="text-xs text-ink-faint">{formatDateTime(w.createdAt)}</span>
                      </div>
                      <p className="text-sm text-ink-muted mt-0.5">{w.description}</p>
                      {w.minutesSpent > 0 && <p className="text-xs text-ink-faint mt-0.5">{w.minutesSpent} min logged</p>}
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handlePostWorkLog} className="p-4 border-t border-border flex gap-2.5">
                <input
                  className="input flex-1"
                  placeholder="What did you do?"
                  value={workLogText}
                  onChange={(e) => setWorkLogText(e.target.value)}
                />
                <input
                  className="input w-28"
                  type="number"
                  min="0"
                  placeholder="Minutes"
                  value={workLogMinutes}
                  onChange={(e) => setWorkLogMinutes(e.target.value)}
                />
                <button type="submit" className="btn-secondary shrink-0" disabled={postingWorkLog || !workLogText.trim()}>
                  {postingWorkLog ? <Loader2 size={15} className="animate-spin" /> : 'Add'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-ink mb-1">SLA</h3>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Clock size={14} className="text-ink-faint" />
              <span className="text-ink-muted">Response due</span>
              <span className="ml-auto font-medium text-ink">{formatDateTime(ticket.sla?.responseDeadline)}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm">
              <Clock size={14} className="text-ink-faint" />
              <span className="text-ink-muted">Resolution due</span>
              <span className="ml-auto font-medium text-ink">{formatDateTime(ticket.sla?.resolutionDeadline)}</span>
            </div>
            {!['RESOLVED', 'CLOSED'].includes(ticket.status) && (
              <p className={`text-xs mt-2.5 font-medium ${ticket.sla?.status === 'BREACHED' ? 'text-status-critical' : ticket.sla?.status === 'AT_RISK' ? 'text-status-warn' : 'text-status-safe'}`}>
                {formatMinutesToDuration(ticket.sla?.resolutionMinutesRemaining)} remaining
              </p>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm text-ink mb-1">Details</h3>
            <div className="divide-y divide-border/60">
              <MetaRow icon={UserIcon} label="Requester" value={ticket.requester?.name} />
              <MetaRow icon={Building2} label="Department" value={ticket.department?.name || '—'} />
              <MetaRow icon={UserCog} label="Assigned to" value={ticket.assignedTo?.name || 'Unassigned'} />
              {ticket.asset && (
                <MetaRow icon={Boxes} label="Related asset" value={`${ticket.asset.assetTag} — ${ticket.asset.name}`} />
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-sm text-ink mb-3">Timeline</h3>
            <TicketTimeline ticket={ticket} workLogs={workLogs} />
          </div>
        </div>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Technician"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAssign} disabled={!selectedTech || assigning}>
              {assigning ? 'Assigning…' : 'Assign'}
            </button>
          </>
        }
      >
        <select className="select" value={selectedTech} onChange={(e) => setSelectedTech(e.target.value)}>
          <option value="">Select a technician…</option>
          {technicians.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} {t.department?.name ? `(${t.department.name})` : ''}
            </option>
          ))}
        </select>
      </Modal>

      {/* Resolve modal */}
      <Modal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve Ticket"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setResolveOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleResolve} disabled={!resolutionSummary.trim() || resolving}>
              {resolving ? 'Saving…' : 'Mark Resolved'}
            </button>
          </>
        }
      >
        <label className="label">Resolution summary</label>
        <textarea
          className="input min-h-[100px]"
          placeholder="Describe how the issue was resolved…"
          value={resolutionSummary}
          onChange={(e) => setResolutionSummary(e.target.value)}
        />
      </Modal>

      {/* Reopen modal */}
      <Modal
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        title="Reopen Ticket"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setReopenOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleReopen} disabled={reopening}>
              {reopening ? 'Reopening…' : 'Reopen Ticket'}
            </button>
          </>
        }
      >
        <label className="label">Why are you reopening this ticket? (optional)</label>
        <textarea className="input min-h-[80px]" value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} />
      </Modal>
    </div>
  );
}
