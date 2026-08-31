import React, { useState, useEffect } from 'react';
import {
  RBIRequirement,
  ReqMapping,
  BusinessArea,
  OwnerRole,
  ComplianceClassification,
  SeverityLevel,
  ProvenanceType
} from '../types';
import {
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Layers,
  Sparkles,
  Edit3,
  Check,
  PlusCircle,
  Clock,
  Building,
  UserCheck,
  Zap,
  Server,
  PackageCheck
} from 'lucide-react';
import { api } from '../services/api';

interface ImpactAssessmentViewProps {
  requirements: (RBIRequirement & { mapping?: ReqMapping })[];
  businessAreas: BusinessArea[];
  owners: OwnerRole[];
  selectedReqId?: string;
  onRefresh: () => void;
  onCreateAction: (actionData: any) => void;
}

export const ImpactAssessmentView: React.FC<ImpactAssessmentViewProps> = ({
  requirements,
  businessAreas,
  owners,
  selectedReqId,
  onRefresh,
  onCreateAction
}) => {
  const [activeReqId, setActiveReqId] = useState<string>(selectedReqId || requirements[0]?.id || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ReqMapping>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAIPlan, setIsGeneratingAIPlan] = useState(false);
  const [aiPlanResult, setAiPlanResult] = useState<any>(null);

  useEffect(() => {
    if (selectedReqId) {
      setActiveReqId(selectedReqId);
    } else if (!activeReqId && requirements.length > 0) {
      setActiveReqId(requirements[0].id);
    }
  }, [selectedReqId, requirements]);

  const activeRequirement = requirements.find((r) => r.id === activeReqId);
  const activeMapping = activeRequirement?.mapping;

  const startEditing = () => {
    if (activeMapping) {
      setEditForm({ ...activeMapping });
      setIsEditing(true);
      setAiPlanResult(null);
    }
  };

  const saveAssessment = async () => {
    if (!activeReqId) return;
    setIsSaving(true);
    try {
      await api.updateAssessment(activeReqId, editForm);
      setIsEditing(false);
      setIsSaving(false);
      onRefresh();
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
      setIsSaving(false);
    }
  };

  const handleGenerateAIPlan = async () => {
    if (!activeRequirement || !activeMapping) return;
    setIsGeneratingAIPlan(true);
    try {
      const plan = await api.generateActionPlanAI({
        requirement: activeRequirement.requirement,
        finding: activeMapping.finding || activeRequirement.clause_title || '',
        severity: activeMapping.severity || 'High'
      });
      setAiPlanResult(plan);
      setIsGeneratingAIPlan(false);
    } catch (err: any) {
      alert(`AI Action generation failed: ${err.message}`);
      setIsGeneratingAIPlan(false);
    }
  };

  const handleConvertAiPlanToAction = () => {
    if (!aiPlanResult || !activeRequirement || !activeMapping) return;
    onCreateAction({
      req_id: activeRequirement.id,
      doc_id: activeRequirement.doc_id,
      doc_title: activeRequirement.doc_title,
      clause_label: activeRequirement.clause_label,
      requirement_summary: activeRequirement.requirement,
      title: aiPlanResult.title,
      description: `${aiPlanResult.description}\n\nKey Milestones:\n${aiPlanResult.milestones.map((m: string) => `• ${m}`).join('\n')}`,
      priority: aiPlanResult.priority || 'High',
      status: 'Assigned'
    });
    setAiPlanResult(null);
  };

  const filteredRequirements = requirements.filter((r) => {
    const m = r.mapping;
    if (statusFilter !== 'all' && m?.classification !== statusFilter) return false;
    if (severityFilter !== 'all' && m?.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.requirement.toLowerCase().includes(q) ||
        r.clause_title?.toLowerCase().includes(q) ||
        m?.policy.toLowerCase().includes(q) ||
        m?.control.toLowerCase().includes(q) ||
        m?.finding.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (classification?: ComplianceClassification) => {
    switch (classification) {
      case 'Compliant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Partially Compliant':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Gap':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'To Be Confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getSeverityBadge = (sev?: SeverityLevel) => {
    switch (sev) {
      case 'Critical':
        return 'bg-rose-600 text-white font-bold';
      case 'High':
        return 'bg-amber-500 text-white font-bold';
      case 'Medium':
        return 'bg-blue-600 text-white font-medium';
      default:
        return 'bg-slate-500 text-white font-normal';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Bank Impact Assessment & Gap Evaluation
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Map each RBI requirement to internal bank policies, 3 Lines of Defense owners, controls, and Core Banking IT systems.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center space-x-1.5">
            <Shield className="h-4 w-4" />
            <span>AI recommends. Humans decide.</span>
          </span>
        </div>
      </div>

      {/* Two-Column Master / Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Requirements List / Sidebar */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Filter obligations or policies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">All Classifications</option>
                <option value="Compliant">Compliant</option>
                <option value="Partially Compliant">Partially Compliant</option>
                <option value="Gap">Non-Compliant Gap</option>
                <option value="To Be Confirmed">To Be Confirmed</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
            {filteredRequirements.map((req) => {
              const isSelected = req.id === activeReqId;
              const m = req.mapping;
              return (
                <div
                  key={req.id}
                  onClick={() => {
                    setActiveReqId(req.id);
                    setIsEditing(false);
                    setAiPlanResult(null);
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isSelected ? 'bg-slate-800 text-slate-200 border-slate-700' : getStatusBadge(m?.classification)
                    }`}>
                      {m?.classification || 'To Be Confirmed'}
                    </span>
                    {m?.severity && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase ${getSeverityBadge(m.severity)}`}>
                        {m.severity}
                      </span>
                    )}
                  </div>

                  <div className={`font-bold line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                    {req.clause_title || req.clause_label}
                  </div>
                  <p className={`mt-1 line-clamp-2 text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    {req.requirement}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px]">
                    <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>
                      {req.clause_label}
                    </span>
                    <span className={`capitalize font-mono px-1.5 py-0.2 rounded ${
                      m?.provenance === 'reviewed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {m?.provenance || 'seeded'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Assessment View & Form */}
        <div className="lg:col-span-7">
          {activeRequirement && activeMapping ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
              {/* Top Title & Quick Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-400">{activeRequirement.id}</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${getStatusBadge(activeMapping.classification)}`}>
                      {activeMapping.classification}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded uppercase ${getSeverityBadge(activeMapping.severity)}`}>
                      {activeMapping.severity}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {activeRequirement.clause_title || activeRequirement.clause_label}
                  </h2>
                </div>

                <div className="flex items-center space-x-2">
                  {!isEditing ? (
                    <button
                      onClick={startEditing}
                      className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Edit Assessment</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveAssessment}
                        disabled={isSaving}
                        className="flex items-center space-x-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg shadow-sm"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Requirement Text Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 space-y-1">
                <span className="font-bold text-slate-900 block">RBI Paraphrased Obligation:</span>
                <p className="leading-relaxed">{activeRequirement.requirement}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Source: <strong>{activeRequirement.doc_title}</strong> ({activeRequirement.clause_label})
                </div>
              </div>

              {/* Bank Impact Mapping Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span>Multi-Dimensional Bank Architecture Mapping</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Business Unit & 3 Lines of Defense */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                      <Building className="h-4 w-4 text-slate-400" />
                      <span>Business Function & 3 Lines</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Business Unit:</span>
                      <div className="font-bold text-slate-800">{activeMapping.business_area_name || activeMapping.business_area}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">1st Line Process Owner:</span>
                      <div className="font-semibold text-slate-700">{activeMapping.owner_process_name}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">2nd Line Control Approver:</span>
                      <div className="font-semibold text-slate-700">{activeMapping.owner_control_name}</div>
                    </div>
                  </div>

                  {/* Policies & Controls */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
                      <Shield className="h-4 w-4 text-slate-400" />
                      <span>Internal Policy & Control Register</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Bank Internal Policy:</span>
                      <div className="font-bold text-slate-800">{activeMapping.policy}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Control Name & Type:</span>
                      <div className="font-semibold text-slate-700">
                        {activeMapping.control} ({activeMapping.control_type})
                      </div>
                    </div>
                  </div>

                  {/* Products & Systems */}
                  <div className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2 md:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                          <PackageCheck className="h-4 w-4 text-slate-400" />
                          <span>Impacted Products:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeMapping.products_impacted?.map((p, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                              {p}
                            </span>
                          )) || <span className="text-slate-400">All Products</span>}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5 text-slate-500 font-semibold mb-1">
                          <Server className="h-4 w-4 text-slate-400" />
                          <span>IT & Core Banking Systems:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {activeMapping.tech_systems_impacted?.map((s, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[11px] font-mono">
                              {s}
                            </span>
                          )) || <span className="text-slate-400">Core CBS</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Findings & Recommendations (View / Edit Form) */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Gap Evaluation, Finding & Remediation</span>
                </h3>

                {isEditing ? (
                  <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Compliance Status</label>
                        <select
                          value={editForm.classification}
                          onChange={(e) => setEditForm({ ...editForm, classification: e.target.value as any })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="Compliant">Compliant</option>
                          <option value="Partially Compliant">Partially Compliant</option>
                          <option value="Gap">Non-Compliant Gap</option>
                          <option value="To Be Confirmed">To Be Confirmed</option>
                          <option value="Not Applicable">Not Applicable</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Severity Rating</label>
                        <select
                          value={editForm.severity}
                          onChange={(e) => setEditForm({ ...editForm, severity: e.target.value as any })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Identified Bank Finding / Vulnerability</label>
                      <textarea
                        rows={3}
                        value={editForm.finding || ''}
                        onChange={(e) => setEditForm({ ...editForm, finding: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Remediation Recommendation</label>
                      <textarea
                        rows={3}
                        value={editForm.recommendation || ''}
                        onChange={(e) => setEditForm({ ...editForm, recommendation: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Verification Evidence Required</label>
                      <input
                        type="text"
                        value={editForm.evidence_required || ''}
                        onChange={(e) => setEditForm({ ...editForm, evidence_required: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-lg space-y-1">
                      <span className="font-bold text-rose-900 block">Bank Finding / Current Gap:</span>
                      <p className="text-rose-800">{activeMapping.finding || 'No gaps identified during initial review.'}</p>
                    </div>

                    <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-1">
                      <span className="font-bold text-emerald-900 block">Remediation Recommendation:</span>
                      <p className="text-emerald-800">{activeMapping.recommendation}</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-slate-600">
                      <span className="font-bold text-slate-800 block">Required Audit Evidence:</span>
                      <p>{activeMapping.evidence_required}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Plan Generation & Direct Action Creation */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <span>Provenance:</span>
                  <span className="font-semibold uppercase text-slate-700">{activeMapping.provenance}</span>
                  {activeMapping.reviewed_by && (
                    <span>• Reviewed by {activeMapping.reviewed_by}</span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleGenerateAIPlan}
                    disabled={isGeneratingAIPlan}
                    className="flex items-center space-x-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{isGeneratingAIPlan ? 'Drafting with AI...' : 'Draft AI Remediation Plan'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onCreateAction({
                        req_id: activeRequirement.id,
                        doc_id: activeRequirement.doc_id,
                        doc_title: activeRequirement.doc_title,
                        clause_label: activeRequirement.clause_label,
                        requirement_summary: activeRequirement.requirement,
                        title: `Remediate: ${activeRequirement.clause_title || activeRequirement.clause_label}`,
                        description: activeMapping.recommendation || activeMapping.finding,
                        priority: activeMapping.severity || 'High',
                        status: 'Assigned'
                      });
                    }}
                    className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg shadow-sm transition"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create Action Item</span>
                  </button>
                </div>
              </div>

              {/* AI Plan Generation Result Box */}
              {aiPlanResult && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3 text-xs mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 flex items-center space-x-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      <span>Gemini AI Recommended Remediation Plan</span>
                    </span>
                    <button
                      onClick={handleConvertAiPlanToAction}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-semibold"
                    >
                      Accept & Create Action →
                    </button>
                  </div>

                  <div className="font-bold text-slate-900">{aiPlanResult.title}</div>
                  <p className="text-slate-700">{aiPlanResult.description}</p>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-800">Suggested Milestones:</span>
                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                      {aiPlanResult.milestones.map((m: string, idx: number) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              Select a requirement to view and evaluate bank impact.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
