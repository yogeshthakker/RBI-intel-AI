import React, { useState, useEffect } from 'react';
import {
  RegulatoryRequirement,
  ReqMapping,
  BusinessArea,
  OwnerRole,
  ComplianceClassification,
  SeverityLevel,
  ProvenanceType,
  RegulatoryRegime
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
  regime: RegulatoryRegime;
  requirements: (RegulatoryRequirement & { mapping?: ReqMapping })[];
  businessAreas: BusinessArea[];
  owners: OwnerRole[];
  selectedReqId?: string;
  onRefresh: () => void;
  onCreateAction: (actionData: any) => void;
}

export const ImpactAssessmentView: React.FC<ImpactAssessmentViewProps> = ({
  regime,
  requirements,
  businessAreas,
  owners,
  selectedReqId,
  onRefresh,
  onCreateAction
}) => {
  const isSAMA = regime === 'SAMA';
  const authorityName = isSAMA ? 'Saudi Central Bank (SAMA)' : 'Reserve Bank of India (RBI)';

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
        severity: activeMapping.severity || 'High',
        regulator: regime
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
      status: 'Assigned',
      regulator: regime
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
            <CheckCircle2 className={`h-5 w-5 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <h1 className="text-xl font-bold text-slate-900">
              {regime} Bank Impact Assessment & Gap Evaluation
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Map each {authorityName} requirement to internal bank policies, 3 Lines of Defense owners, operational controls, and core IT systems.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center space-x-1.5 ${
            isSAMA ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}>
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
                placeholder={`Filter ${regime} obligations or policies...`}
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
                        className={`flex items-center space-x-1 text-xs font-semibold text-white px-4 py-1.5 rounded-lg shadow-sm ${
                          isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
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
                <span className="font-bold text-slate-900 block">{authorityName} Paraphrased Obligation:</span>
                <p className="leading-relaxed">{activeRequirement.requirement}</p>
                <div className="text-[11px] text-slate-500 pt-1">
                  Source: <strong>{activeRequirement.doc_title}</strong> ({activeRequirement.clause_label})
                </div>
              </div>

              {/* 3 Lines of Defense & Multi-Dimensional Mapping Form / View */}
              <div className="space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 uppercase tracking-wide text-xs flex items-center space-x-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <span>3 Lines of Defense & Control Architecture</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Area */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Bank Business Function / Taxonomy</label>
                    {isEditing ? (
                      <select
                        value={editForm.business_area}
                        onChange={(e) => {
                          const ba = businessAreas.find((b) => b.id === e.target.value);
                          setEditForm({
                            ...editForm,
                            business_area: e.target.value,
                            business_area_name: ba?.name || ''
                          });
                        }}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        {businessAreas.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-semibold text-slate-800">
                        {activeMapping.business_area_name || activeMapping.business_area}
                      </div>
                    )}
                  </div>

                  {/* Internal Policy Reference */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Internal Bank Policy Document</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.policy || ''}
                        onChange={(e) => setEditForm({ ...editForm, policy: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800">
                        {activeMapping.policy}
                      </div>
                    )}
                  </div>

                  {/* Operational Process */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Standard Operating Process (SOP)</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.process || ''}
                        onChange={(e) => setEditForm({ ...editForm, process: e.target.value })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800">
                        {activeMapping.process}
                      </div>
                    )}
                  </div>

                  {/* Control & Type */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Control Specification & Gate</label>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={editForm.control || ''}
                          onChange={(e) => setEditForm({ ...editForm, control: e.target.value })}
                          className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                        <select
                          value={editForm.control_type || 'Preventive'}
                          onChange={(e) => setEditForm({ ...editForm, control_type: e.target.value as any })}
                          className="p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          <option value="Preventive">Preventive</option>
                          <option value="Detective">Detective</option>
                          <option value="Corrective">Corrective</option>
                        </select>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800 flex justify-between items-center">
                        <span>{activeMapping.control}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {activeMapping.control_type}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1st Line vs 2nd Line Ownership */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                    <span>Three Lines of Defense Ownership Matrix</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        1st Line of Defense (Operational Process Owner)
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.owner_process}
                          onChange={(e) => {
                            const o = owners.find((ow) => ow.id === e.target.value);
                            setEditForm({
                              ...editForm,
                              owner_process: e.target.value,
                              owner_process_name: o?.name || ''
                            });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          {owners
                            .filter((o) => o.line_of_defense === 'First line')
                            .map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name} ({o.department})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="font-semibold text-slate-800">
                          {activeMapping.owner_process_name || activeMapping.owner_process}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        2nd Line of Defense (Control & Compliance Oversight)
                      </label>
                      {isEditing ? (
                        <select
                          value={editForm.owner_control}
                          onChange={(e) => {
                            const o = owners.find((ow) => ow.id === e.target.value);
                            setEditForm({
                              ...editForm,
                              owner_control: e.target.value,
                              owner_control_name: o?.name || ''
                            });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        >
                          {owners
                            .filter((o) => o.line_of_defense === 'Second line')
                            .map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.name} ({o.department})
                              </option>
                            ))}
                        </select>
                      ) : (
                        <div className="font-semibold text-slate-800">
                          {activeMapping.owner_control_name || activeMapping.owner_control}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Products & Tech Systems Impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 flex items-center space-x-1">
                      <PackageCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span>Impacted Bank Products</span>
                    </label>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                      {activeMapping.products_impacted?.join(', ') || 'Retail Accounts, Corporate Lending'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 flex items-center space-x-1">
                      <Server className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Impacted IT / Core Banking Systems</span>
                    </label>
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700">
                      {activeMapping.tech_systems_impacted?.join(', ') || 'Core Banking CBS, Risk Engine'}
                    </div>
                  </div>
                </div>

                {/* Compliance Finding & Remediation Recommendation */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 text-xs">
                      Compliance Gap Assessment & Finding
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Provenance: {activeMapping.provenance}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="font-bold text-slate-700 block text-[11px]">Identified Gap / Finding:</span>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={editForm.finding || ''}
                          onChange={(e) => setEditForm({ ...editForm, finding: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                          {activeMapping.finding}
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block text-[11px]">Recommended Remediation:</span>
                      {isEditing ? (
                        <textarea
                          rows={3}
                          value={editForm.recommendation || ''}
                          onChange={(e) => setEditForm({ ...editForm, recommendation: e.target.value })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      ) : (
                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                          {activeMapping.recommendation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* AI Remediation Action Generator */}
                  {activeMapping.classification !== 'Compliant' && (
                    <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-600">
                        Convert this gap into a structured, trackable remediation action plan with evidence gates.
                      </div>
                      <button
                        onClick={handleGenerateAIPlan}
                        disabled={isGeneratingAIPlan}
                        className={`flex items-center space-x-1.5 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow transition ${
                          isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>{isGeneratingAIPlan ? 'Generating Plan...' : 'Generate AI Action Plan'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Plan Preview Box */}
                {aiPlanResult && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-indigo-600" />
                        <span className="font-bold text-indigo-900 text-xs">AI-Generated Remediation Blueprint</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-200 text-indigo-800">
                        Priority: {aiPlanResult.priority}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-800">
                      <div className="font-bold text-slate-900">{aiPlanResult.title}</div>
                      <p>{aiPlanResult.description}</p>
                      <div className="font-semibold text-slate-700 mt-2">Key Implementation Milestones:</div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 pl-2">
                        {aiPlanResult.milestones?.map((m: string, i: number) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleConvertAiPlanToAction}
                        className={`flex items-center space-x-1.5 text-white px-4 py-2 rounded-lg text-xs font-bold shadow ${
                          isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>Create Official Remediation Action</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs">
              Select an obligation from the left to view and edit its multi-dimensional impact assessment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
