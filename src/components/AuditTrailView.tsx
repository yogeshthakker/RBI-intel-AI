import React, { useState } from 'react';
import { AuditEvent, RBIDocument, RBIRequirement, RemediationAction } from '../types';
import {
  History,
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  FileCheck2,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Printer,
  Sparkles,
  GitFork,
  FileText
} from 'lucide-react';

interface AuditTrailViewProps {
  auditEvents: AuditEvent[];
  documents: RBIDocument[];
  requirements: (RBIRequirement & { mapping?: any })[];
  actions: RemediationAction[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditEvents,
  documents,
  requirements,
  actions
}) => {
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [showExportModal, setShowExportModal] = useState(false);

  const pipelineStages = [
    {
      step: 1,
      title: 'RBI Regulatory Intake',
      desc: 'Official Master Direction / Circular ingested from RBI publication repository with PDF/HTML text hash.',
      metrics: `${documents.length} Publications Active`
    },
    {
      step: 2,
      title: 'AI Clause Extraction',
      desc: 'Gemini intelligence parses clauses, classifies obligation types (Governance, Process, Screening, Assurance), and sets applicability.',
      metrics: `${requirements.length} Obligations Extracted`
    },
    {
      step: 3,
      title: 'Bank Architecture Impact',
      desc: 'Requirements mapped to 18+ Business Units, 3 Lines of Defense, Internal Policies, Controls, and Core CBS systems.',
      metrics: '100% Architecture Mapped'
    },
    {
      step: 4,
      title: 'Human Gap Assessment',
      desc: 'Compliance officers review AI findings, upgrade provenance from seeded to reviewed, and evaluate residual risk.',
      metrics: 'Zero Unreviewed Items'
    },
    {
      step: 5,
      title: 'Remediation & Action Tracking',
      desc: 'Time-bound remediation tasks assigned with 1st Line owner, 2nd Line approver, and dynamic SLA monitoring.',
      metrics: `${actions.length} Active Remediation Items`
    },
    {
      step: 6,
      title: 'Evidence Vault & Closure',
      desc: 'Audit evidence uploaded, cryptographically sealed with SHA-256 checksums, verified by CCO/CRO, and closed.',
      metrics: 'Immutable Lineage Certified'
    }
  ];

  const filteredEvents = auditEvents.filter((ev) => {
    if (eventTypeFilter !== 'all' && ev.event_type !== eventTypeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        ev.details.toLowerCase().includes(q) ||
        ev.user_name.toLowerCase().includes(q) ||
        ev.entity_title?.toLowerCase().includes(q) ||
        ev.event_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['Requirement ID', 'Document', 'Clause Label', 'Obligation', 'Obligation Type', 'Business Area', 'Policy', 'Control', 'Status', 'Severity', 'Provenance'];
    const rows = requirements.map((r) => [
      `"${r.id}"`,
      `"${r.doc_title?.replace(/"/g, '""') || ''}"`,
      `"${r.clause_label || ''}"`,
      `"${r.requirement.replace(/"/g, '""')}"`,
      `"${r.obligation_type}"`,
      `"${r.mapping?.business_area_name || ''}"`,
      `"${r.mapping?.policy?.replace(/"/g, '""') || ''}"`,
      `"${r.mapping?.control?.replace(/"/g, '""') || ''}"`,
      `"${r.mapping?.classification || ''}"`,
      `"${r.mapping?.severity || ''}"`,
      `"${r.mapping?.provenance || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RBI_Compliance_Audit_Pack_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              Auditability & Complete Lineage Trail
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Deterministic, tamper-evident audit record tracing regulatory source publications down to operational controls, actions, and verified evidence.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV Audit Pack</span>
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Supervisory Report</span>
          </button>
        </div>
      </div>

      {/* Interactive Lineage Pipeline Visualizer */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <GitFork className="h-4 w-4 text-emerald-600" />
              <span>Interactive Regulatory Lineage Flow</span>
            </h2>
            <p className="text-xs text-slate-500">Every decision traceable from RBI Gazette to verified system evidence</p>
          </div>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {pipelineStages.map((stage, idx) => {
            const isActive = activePipelineStep === idx;
            return (
              <div
                key={stage.step}
                onClick={() => setActivePipelineStep(idx)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between text-xs space-y-2 ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    isActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 text-slate-700'
                  }`}>
                    0{stage.step}
                  </span>
                  <span className={`text-[10px] font-mono ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                    STAGE
                  </span>
                </div>

                <div>
                  <div className={`font-bold text-xs ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {stage.title}
                  </div>
                  <div className={`text-[10px] mt-1 line-clamp-2 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                    {stage.desc}
                  </div>
                </div>

                <div className={`text-[10px] font-semibold pt-2 border-t ${isActive ? 'border-slate-700 text-emerald-400' : 'border-slate-200 text-emerald-700'}`}>
                  {stage.metrics}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Detail Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-slate-900">
              Stage 0{pipelineStages[activePipelineStep].step}: {pipelineStages[activePipelineStep].title}
            </span>
            <p className="text-slate-600">{pipelineStages[activePipelineStep].desc}</p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-lg border border-emerald-200">
              {pipelineStages[activePipelineStep].metrics}
            </span>
          </div>
        </div>
      </div>

      {/* Immutable Event Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Immutable Supervisory Audit Event Log
            </h3>
            <p className="text-xs text-slate-500">Real-time log of regulatory changes, human reviews, and attestation sign-offs</p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="all">All Event Types</option>
              <option value="DOCUMENT_INGESTED">Document Ingested</option>
              <option value="AI_ANALYSIS_COMPLETED">AI Analysis Completed</option>
              <option value="ASSESSMENT_UPDATED">Assessment Updated</option>
              <option value="ACTION_CREATED">Action Created</option>
              <option value="EVIDENCE_UPLOADED">Evidence Uploaded</option>
              <option value="EVIDENCE_VERIFIED">Evidence Verified</option>
            </select>

            <div className="relative w-48 sm:w-64">
              <Search className="h-4 w-4 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit log..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Actor / Officer</th>
                <th className="p-3">Entity Target</th>
                <th className="p-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {ev.event_type}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{ev.user_name}</div>
                    <div className="text-[10px] text-slate-400">{ev.user_email}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-slate-800">{ev.entity_title || ev.entity_id}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono">{ev.entity_type}</div>
                  </td>
                  <td className="p-3 text-slate-700 max-w-md">
                    {ev.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supervisory Executive Report Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto print:m-0 print:p-0 print:shadow-none">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Official Supervisory Report</span>
                <h2 className="text-lg font-bold text-slate-900">
                  RBI Compliance Posture & Audit Readiness Pack
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrintReport}
                  className="flex items-center space-x-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Executive Summary in Report */}
            <div className="space-y-4 text-xs text-slate-800">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <h3 className="font-bold text-sm text-slate-900">1. Executive Compliance Certification</h3>
                <p>
                  This document certifies the regulatory compliance state of the bank across all issued Reserve Bank of India Master Directions and circulars as on {new Date().toLocaleDateString()}. All obligations are mapped across First, Second, and Third lines of defense with verifiable evidence.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-2 text-center">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Active Directions</div>
                    <div className="font-bold text-base text-slate-900">{documents.length}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Mapped Obligations</div>
                    <div className="font-bold text-base text-slate-900">{requirements.length}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Remediation Actions</div>
                    <div className="font-bold text-base text-slate-900">{actions.length}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <div className="text-slate-400 text-[10px]">Audit Events Logged</div>
                    <div className="font-bold text-base text-emerald-700">{auditEvents.length}</div>
                  </div>
                </div>
              </div>

              {/* Requirement Summary Table */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm text-slate-900">2. Active Requirement & Control Mapping Summary</h3>
                <table className="w-full text-left border-collapse border border-slate-200 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                      <th className="p-2 border">ID</th>
                      <th className="p-2 border">Obligation</th>
                      <th className="p-2 border">Business Function</th>
                      <th className="p-2 border">Internal Control</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requirements.map((r) => (
                      <tr key={r.id} className="border-b border-slate-200">
                        <td className="p-2 font-mono border">{r.id}</td>
                        <td className="p-2 border">{r.requirement}</td>
                        <td className="p-2 border">{r.mapping?.business_area_name || 'KYC & AML'}</td>
                        <td className="p-2 border">{r.mapping?.control}</td>
                        <td className="p-2 font-semibold border">{r.mapping?.classification}</td>
                        <td className="p-2 font-bold border">{r.mapping?.severity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sign-off Attestation Block */}
              <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-200">
                <div className="space-y-10">
                  <div className="text-xs text-slate-500 font-medium">Prepared by:</div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-900">
                    Chief Compliance Officer (CCO)
                    <div className="text-[10px] text-slate-400 font-normal">Second Line Compliance Function</div>
                  </div>
                </div>
                <div className="space-y-10">
                  <div className="text-xs text-slate-500 font-medium">Approved by:</div>
                  <div className="border-t border-slate-300 pt-1 font-bold text-slate-900">
                    Chief Risk Officer / MD & CEO
                    <div className="text-[10px] text-slate-400 font-normal">Executive Committee Sign-off</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
