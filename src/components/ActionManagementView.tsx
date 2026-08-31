import React, { useState } from 'react';
import { RemediationAction, ActionStatus, ActionPriority, OwnerRole, EvidenceItem } from '../types';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Upload,
  ShieldCheck,
  User,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Paperclip,
  Check
} from 'lucide-react';
import { api } from '../services/api';

interface ActionManagementViewProps {
  actions: RemediationAction[];
  owners: OwnerRole[];
  onRefresh: () => void;
  initialCreateData?: Partial<RemediationAction> | null;
  onClearInitialCreate?: () => void;
}

export const ActionManagementView: React.FC<ActionManagementViewProps> = ({
  actions,
  owners,
  onRefresh,
  initialCreateData,
  onClearInitialCreate
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Selected Action for Detailed Modal / Evidence Vault
  const [selectedAction, setSelectedAction] = useState<RemediationAction | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(!!initialCreateData);

  // Evidence upload form inside selected action
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState<Partial<RemediationAction>>({
    title: initialCreateData?.title || '',
    description: initialCreateData?.description || '',
    req_id: initialCreateData?.req_id || 'req:unlinked',
    doc_id: initialCreateData?.doc_id,
    doc_title: initialCreateData?.doc_title,
    clause_label: initialCreateData?.clause_label,
    requirement_summary: initialCreateData?.requirement_summary,
    priority: (initialCreateData?.priority as any) || 'High',
    status: 'Assigned',
    owner_id: 'OWN-13',
    owner_name: 'Head — Digital Banking & Technology',
    approver_id: 'OWN-11',
    approver_name: 'Chief Risk Officer',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const columns: { status: ActionStatus; label: string; color: string }[] = [
    { status: 'Assigned', label: 'Assigned / Backlog', color: 'border-slate-300 bg-slate-50' },
    { status: 'In Progress', label: 'In Progress', color: 'border-blue-300 bg-blue-50/30' },
    { status: 'Under Review', label: 'Under 2nd Line Review', color: 'border-amber-300 bg-amber-50/30' },
    { status: 'Approved', label: 'Approved & Closed', color: 'border-emerald-300 bg-emerald-50/30' }
  ];

  const filteredActions = actions.filter((act) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue' && !act.is_overdue) return false;
      if (statusFilter !== 'overdue' && act.status !== statusFilter) return false;
    }
    if (priorityFilter !== 'all' && act.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        act.title.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q) ||
        act.owner_name.toLowerCase().includes(q) ||
        act.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (actionId: string, newStatus: ActionStatus) => {
    try {
      await api.updateAction(actionId, {
        status: newStatus,
        progress_pct: newStatus === 'Approved' || newStatus === 'Closed' ? 100 : undefined
      });
      onRefresh();
      if (selectedAction?.id === actionId) {
        setSelectedAction({ ...selectedAction, status: newStatus });
      }
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createAction(createForm);
      setShowCreateModal(false);
      if (onClearInitialCreate) onClearInitialCreate();
      onRefresh();
      setSelectedAction(created);
    } catch (err: any) {
      alert(`Create action failed: ${err.message}`);
    }
  };

  const handleEvidenceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction || !evidenceTitle) return;
    setIsUploadingEvidence(true);
    try {
      const newEv = await api.uploadEvidence(selectedAction.id, {
        title: evidenceTitle,
        file_name: `${evidenceTitle.replace(/\s+/g, '_')}.pdf`,
        file_type: 'application/pdf',
        file_size: '1.8 MB',
        notes: evidenceNotes
      });
      const updatedList = [...selectedAction.evidence_items, newEv];
      setSelectedAction({ ...selectedAction, evidence_items: updatedList });
      setEvidenceTitle('');
      setEvidenceNotes('');
      setIsUploadingEvidence(false);
      onRefresh();
    } catch (err: any) {
      alert(`Evidence upload failed: ${err.message}`);
      setIsUploadingEvidence(false);
    }
  };

  const handleVerifyEvidence = async (evidenceId: string, status: 'Verified' | 'Rejected') => {
    if (!selectedAction) return;
    try {
      await api.verifyEvidence(selectedAction.id, evidenceId, {
        status,
        notes: `Attested by 2nd Line Compliance at ${new Date().toLocaleTimeString()}`
      });
      const updatedEvs = selectedAction.evidence_items.map((ev) =>
        ev.id === evidenceId ? { ...ev, verification_status: status } : ev
      );
      setSelectedAction({ ...selectedAction, evidence_items: updatedEvs as any });
      onRefresh();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const getPriorityBadge = (priority: ActionPriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ListTodo className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Remediation Action Management & Evidence Vault
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Assign accountability, track SLA countdowns, attach verified evidence documents, and maintain audit-proof sign-offs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Remediation Action</span>
        </button>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded font-semibold transition ${
                viewMode === 'kanban' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded font-semibold transition ${
                viewMode === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Table
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="overdue">Overdue SLA Only</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search actions or owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colActions = filteredActions.filter((a) => {
              if (col.status === 'Approved') return a.status === 'Approved' || a.status === 'Closed';
              return a.status === col.status;
            });

            return (
              <div key={col.status} className={`rounded-xl border p-4 space-y-3 ${col.color}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wide">
                    {col.label}
                  </span>
                  <span className="bg-white text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full shadow-xs border border-slate-200">
                    {colActions.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colActions.map((action) => (
                    <div
                      key={action.id}
                      onClick={() => setSelectedAction(action)}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition cursor-pointer space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(action.priority)}`}>
                          {action.priority}
                        </span>
                        {action.is_overdue && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                            Overdue SLA
                          </span>
                        )}
                      </div>

                      <div className="font-bold text-slate-900 line-clamp-2">
                        {action.title}
                      </div>

                      <div className="text-slate-500 text-[11px] flex items-center space-x-1.5">
                        <User className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{action.owner_name}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{action.due_date}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-semibold text-emerald-700">
                          <Paperclip className="h-3 w-3" />
                          <span>{action.evidence_items.length} Proofs</span>
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{ width: `${action.progress_pct}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {colActions.length === 0 && (
                    <div className="text-center p-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No actions in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="p-3">Action ID & Title</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Owner & Line</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Evidence</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions.map((action) => (
                <tr
                  key={action.id}
                  onClick={() => setSelectedAction(action)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{action.title}</div>
                    <div className="text-slate-400 text-[10px] font-mono">{action.id} • {action.doc_title}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getPriorityBadge(action.priority)}`}>
                      {action.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{action.owner_name}</div>
                    <div className="text-[10px] text-slate-400">{action.owner_line}</div>
                  </td>
                  <td className="p-3">
                    <span className={action.is_overdue ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                      {action.due_date}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {action.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-slate-600 font-semibold">{action.evidence_items.length} Attached</span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAction(action);
                      }}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      Manage →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Detail & Evidence Vault Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-slate-400">{selectedAction.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(selectedAction.priority)}`}>
                    {selectedAction.priority}
                  </span>
                  {selectedAction.is_overdue && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                      Overdue SLA
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">{selectedAction.title}</h2>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Description & Linked Requirement */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-700 block">Description & Scope:</span>
                <p className="text-slate-800 whitespace-pre-line">{selectedAction.description}</p>
              </div>

              {/* Roles & Status Transition Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">1st Line Owner</span>
                  <div className="font-semibold text-slate-900">{selectedAction.owner_name}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">2nd Line Approver</span>
                  <div className="font-semibold text-slate-900">{selectedAction.approver_name}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Target Due Date</span>
                  <div className="font-bold text-slate-900">{selectedAction.due_date}</div>
                </div>
              </div>

              {/* Status Switcher Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="font-bold text-slate-700 mr-2">Change Status:</span>
                {(['Assigned', 'In Progress', 'Under Review', 'Approved'] as ActionStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedAction.id, st)}
                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition ${
                      selectedAction.status === st
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Vault Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Audit Evidence Vault ({selectedAction.evidence_items.length} Files)</span>
                </h3>
              </div>

              {/* Attached Evidence List */}
              <div className="space-y-2">
                {selectedAction.evidence_items.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <span className="font-bold text-slate-900">{ev.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({ev.file_name})</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{ev.notes || 'Evidence proof uploaded.'}</p>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-md">
                        Checksum: {ev.hash_checksum}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.verification_status === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ev.verification_status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ev.verification_status}
                      </span>

                      {ev.verification_status === 'Pending' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleVerifyEvidence(ev.id, 'Verified')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleVerifyEvidence(ev.id, 'Rejected')}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 rounded text-[10px] font-bold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {selectedAction.evidence_items.length === 0 && (
                  <div className="text-center p-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                    No evidence files uploaded yet. Add proof below to enable 2nd line sign-off.
                  </div>
                )}
              </div>

              {/* Upload New Evidence Form */}
              <form onSubmit={handleEvidenceUpload} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block">Attach New Verification Proof / Artifact</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Evidence Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. UAT Sign-off Report / Policy Approval Note"
                      value={evidenceTitle}
                      onChange={(e) => setEvidenceTitle(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Verification Notes / SOP Link</label>
                    <input
                      type="text"
                      placeholder="e.g. Verified 100% teller branch patch in testing"
                      value={evidenceNotes}
                      onChange={(e) => setEvidenceNotes(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploadingEvidence || !evidenceTitle}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-semibold text-xs shadow-xs disabled:opacity-50"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploadingEvidence ? 'Uploading...' : 'Upload & Stamp Proof'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Action Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Create New Remediation Action</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  if (onClearInitialCreate) onClearInitialCreate();
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Deploy 10% Beneficial Ownership CBS Parameter"
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Implementation Scope & Steps *</label>
                <textarea
                  rows={4}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detail the technical and process steps required for remediation..."
                  className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">1st Line Owner Role</label>
                  <select
                    value={createForm.owner_id}
                    onChange={(e) => {
                      const sel = owners.find((o) => o.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        owner_id: e.target.value,
                        owner_name: sel?.role || 'Head — Digital Banking',
                        owner_line: sel?.line
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.role} ({o.line})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">2nd Line Approver Role</label>
                  <select
                    value={createForm.approver_id}
                    onChange={(e) => {
                      const sel = owners.find((o) => o.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        approver_id: e.target.value,
                        approver_name: sel?.role || 'Chief Risk Officer'
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs bg-white"
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    if (onClearInitialCreate) onClearInitialCreate();
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-xs"
                >
                  Create & Assign Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
