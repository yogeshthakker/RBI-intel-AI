import React, { useState, useEffect } from 'react';
import { RemediationAction, ActionStatus, ActionPriority, OwnerRole, EvidenceItem, RegulatoryRegime } from '../types';
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
  Check,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';

interface ActionManagementViewProps {
  regime: RegulatoryRegime;
  actions: RemediationAction[];
  owners: OwnerRole[];
  onRefresh: () => void;
  initialCreateData?: Partial<RemediationAction> | null;
  onClearInitialCreate?: () => void;
}

export const ActionManagementView: React.FC<ActionManagementViewProps> = ({
  regime,
  actions,
  owners,
  onRefresh,
  initialCreateData,
  onClearInitialCreate
}) => {
  const isSAMA = regime === 'SAMA';
  const authorityName = isSAMA ? 'Saudi Central Bank (SAMA)' : 'Reserve Bank of India (RBI)';

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
    owner_id: isSAMA ? 'SAMA-OWN-05' : 'RBI-OWN-06',
    owner_name: isSAMA ? 'Head of Digital Banking & Channels' : 'Head of Digital Banking & Payments',
    approver_id: isSAMA ? 'SAMA-OWN-02' : 'RBI-OWN-02',
    approver_name: 'Chief Compliance Officer (CCO)',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    regulator: regime
  });

  useEffect(() => {
    if (initialCreateData) {
      setCreateForm({
        title: initialCreateData.title || '',
        description: initialCreateData.description || '',
        req_id: initialCreateData.req_id || 'req:unlinked',
        doc_id: initialCreateData.doc_id,
        doc_title: initialCreateData.doc_title,
        clause_label: initialCreateData.clause_label,
        requirement_summary: initialCreateData.requirement_summary,
        priority: (initialCreateData.priority as any) || 'High',
        status: 'Assigned',
        owner_id: isSAMA ? 'SAMA-OWN-05' : 'RBI-OWN-06',
        owner_name: isSAMA ? 'Head of Digital Banking & Channels' : 'Head of Digital Banking & Payments',
        approver_id: isSAMA ? 'SAMA-OWN-02' : 'RBI-OWN-02',
        approver_name: 'Chief Compliance Officer (CCO)',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        regulator: regime
      });
      setShowCreateModal(true);
    }
  }, [initialCreateData, isSAMA, regime]);

  const columns: { status: ActionStatus; label: string; color: string }[] = [
    { status: 'Assigned', label: 'Assigned / Backlog', color: 'border-slate-300 bg-slate-50' },
    { status: 'In Progress', label: 'In Progress', color: 'border-blue-300 bg-blue-50/30' },
    { status: 'Under Review', label: 'Under 2nd Line Review', color: 'border-amber-300 bg-amber-50/30' },
    { status: 'Approved', label: 'Approved & Closed', color: 'border-emerald-300 bg-emerald-50/30' }
  ];

  const filteredActions = actions.filter((act) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue' && act.sla_status !== 'Overdue') return false;
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
      const created = await api.createAction({
        ...createForm,
        regulator: regime
      });
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
        verification_notes: evidenceNotes
      });
      const updatedList = [...(selectedAction.evidence_items || []), newEv];
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
      const updatedEvs = selectedAction.evidence_items?.map((ev) =>
        ev.id === evidenceId ? { ...ev, status } : ev
      );
      setSelectedAction({ ...selectedAction, evidence_items: updatedEvs });
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
            <ListTodo className={`h-5 w-5 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <h1 className="text-xl font-bold text-slate-900">
              {regime} Remediation Action Management & Evidence Vault
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Assign 1st line business accountability, track SLA countdowns, attach cryptographic evidence, and maintain audit-proof 2nd line sign-offs.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className={`flex items-center space-x-2 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${
            isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          <Plus className="h-4 w-4" />
          <span>New {regime} Remediation Action</span>
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

        <div className="relative w-64">
          <Search className="h-4 w-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${regime} actions, owners...`}
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
            const colActions = filteredActions.filter((a) => a.status === col.status);
            return (
              <div
                key={col.status}
                className={`rounded-xl border p-4 space-y-3 flex flex-col justify-between ${col.color}`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      {col.label}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {colActions.length}
                    </span>
                  </div>

                  <div className="space-y-3 mt-3">
                    {colActions.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => setSelectedAction(act)}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow cursor-pointer transition space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(act.priority)}`}>
                            {act.priority}
                          </span>
                          {act.sla_status === 'Overdue' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                              Overdue
                            </span>
                          )}
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                          {act.title}
                        </h3>

                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {act.description}
                        </p>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3 text-slate-400" />
                            <span className="truncate max-w-[110px] font-medium">{act.owner_name}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-slate-500">
                            <Paperclip className="h-3 w-3" />
                            <span>{act.evidence_items?.length || 0}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Due: <strong className="text-slate-700">{act.due_date}</strong></span>
                          <span className="font-mono text-emerald-700 font-bold">{act.progress_pct || 0}%</span>
                        </div>
                      </div>
                    ))}

                    {colActions.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg">
                        No actions in {col.status}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Action ID & Title</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">1st Line Owner</th>
                <th className="p-3.5">Due Date & SLA</th>
                <th className="p-3.5">Evidence Vault</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedAction(act)}>
                  <td className="p-3.5 font-medium text-slate-900 max-w-xs">
                    <div className="font-mono text-[10px] text-slate-400">{act.id}</div>
                    <div className="font-bold truncate">{act.title}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(act.priority)}`}>
                      {act.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-semibold text-slate-800">{act.status}</span>
                  </td>
                  <td className="p-3.5 font-medium">{act.owner_name}</td>
                  <td className="p-3.5">
                    <div className="font-medium text-slate-800">{act.due_date}</div>
                    <span className={`text-[10px] font-bold ${act.sla_status === 'Overdue' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {act.sla_status || 'On Track'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      <Paperclip className="h-3 w-3 text-slate-500" />
                      <span>{act.evidence_items?.length || 0} attached</span>
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAction(act);
                      }}
                      className={`font-semibold hover:underline ${isSAMA ? 'text-emerald-700' : 'text-indigo-700'}`}
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

      {/* Action Detail & Evidence Drilldown Modal */}
      {selectedAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-slate-400">{selectedAction.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getPriorityBadge(selectedAction.priority)}`}>
                    {selectedAction.priority}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border">
                    {selectedAction.status}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedAction.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Status Change Control */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-700">Advance Workflow Stage:</span>
              <div className="flex space-x-1.5">
                {(['Assigned', 'In Progress', 'Under Review', 'Approved'] as ActionStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedAction.id, st)}
                    className={`px-3 py-1 rounded-lg font-semibold text-xs transition ${
                      selectedAction.status === st
                        ? isSAMA ? 'bg-emerald-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description & Linked Requirement */}
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Action Description & Scope:</span>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedAction.description}</p>
              </div>

              {selectedAction.requirement_summary && (
                <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 text-indigo-900">
                  <span className="font-bold block mb-0.5">Linked {authorityName} Requirement:</span>
                  <p>{selectedAction.requirement_summary}</p>
                </div>
              )}
            </div>

            {/* Ownership & SLA Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">1st Line Assignee</span>
                <span className="font-semibold text-slate-900">{selectedAction.owner_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">2nd Line Approver</span>
                <span className="font-semibold text-slate-900">{selectedAction.approver_name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Target Due Date</span>
                <span className="font-semibold text-slate-900">{selectedAction.due_date}</span>
              </div>
            </div>

            {/* Evidence Vault Section */}
            <div className="border-t border-slate-200 pt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Cryptographic Evidence Vault & 2nd Line Verification
                  </h3>
                </div>
                <span className="text-slate-500 text-xs">
                  {selectedAction.evidence_items?.length || 0} Artifacts Attached
                </span>
              </div>

              {/* Existing Evidence List */}
              <div className="space-y-2">
                {selectedAction.evidence_items?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{ev.title}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          ev.status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : ev.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          {ev.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        SHA-256: {ev.sha256_hash?.slice(0, 24)}... • Uploaded by {ev.uploaded_by} ({ev.uploaded_at?.split('T')[0]})
                      </div>
                      {ev.verification_notes && (
                        <div className="text-[11px] text-emerald-700 italic">
                          Notes: {ev.verification_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {ev.status !== 'Verified' && (
                        <button
                          onClick={() => handleVerifyEvidence(ev.id, 'Verified')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-semibold hover:bg-emerald-500"
                        >
                          Verify & Attest
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {(!selectedAction.evidence_items || selectedAction.evidence_items.length === 0) && (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    No evidence files uploaded yet. Upload UAT sign-off, Board minutes, or system logs below.
                  </div>
                )}
              </div>

              {/* Upload Evidence Box */}
              <form onSubmit={handleEvidenceUpload} className="p-3.5 bg-slate-100 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block text-xs">Attach New Audit Evidence Document</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Evidence Title (e.g. UAT Signoff Report v2.4)"
                    value={evidenceTitle}
                    onChange={(e) => setEvidenceTitle(e.target.value)}
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Attestation Note (e.g. Approved by Head of Engineering)"
                    value={evidenceNotes}
                    onChange={(e) => setEvidenceNotes(e.target.value)}
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploadingEvidence}
                    className={`flex items-center space-x-1.5 text-white px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>{isUploadingEvidence ? 'Uploading...' : 'Upload & Compute SHA-256'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create New Action Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Create New {regime} Remediation Action Plan
              </h2>
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

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Action Title *</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Implement Real-Time Beneficiary Cooling Parameter"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Action Plan & Milestones *</label>
                <textarea
                  rows={4}
                  required
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Detailed remediation steps and milestones..."
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">1st Line Owner</label>
                  <select
                    value={createForm.owner_id}
                    onChange={(e) => {
                      const o = owners.find((ow) => ow.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        owner_id: e.target.value,
                        owner_name: o?.name || ''
                      });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    {owners
                      .filter((o) => o.line_of_defense === 'First line')
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Priority</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">2nd Line Approver</label>
                  <select
                    value={createForm.approver_id}
                    onChange={(e) => {
                      const o = owners.find((ow) => ow.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        approver_id: e.target.value,
                        approver_name: o?.name || ''
                      });
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    {owners
                      .filter((o) => o.line_of_defense === 'Second line')
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.due_date}
                    onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    if (onClearInitialCreate) onClearInitialCreate();
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`text-white px-5 py-2 rounded-lg font-bold shadow ${
                    isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  Create Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
