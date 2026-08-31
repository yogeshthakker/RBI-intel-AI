import React, { useState } from 'react';
import { AuditEvent, RegulatoryDocument, RegulatoryRequirement, RemediationAction, RegulatoryRegime } from '../types';
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
  regime: RegulatoryRegime;
  auditEvents: AuditEvent[];
  documents: RegulatoryDocument[];
  requirements: (RegulatoryRequirement & { mapping?: any })[];
  actions: RemediationAction[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  regime,
  auditEvents,
  documents,
  requirements,
  actions
}) => {
  const isSAMA = regime === 'SAMA';
  const authorityName = isSAMA ? 'Saudi Central Bank (SAMA)' : 'Reserve Bank of India (RBI)';
  const frameworkName = isSAMA ? 'SAMA Rulebook' : 'RBI Master Directions';

  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [activePipelineStep, setActivePipelineStep] = useState<number>(0);
  const [showExportModal, setShowExportModal] = useState(false);

  const pipelineStages = [
    {
      step: 1,
      title: `${frameworkName} Intake`,
      desc: isSAMA
        ? 'Official SAMA Cyber Security Framework / Circular / Rule ingested from rulebook.sama.gov.sa with raw text hash.'
        : 'Official RBI Master Directions / Circulars ingested from rbi.org.in with raw circular text hash.',
      metrics: `${documents.length} ${regime} Publications`
    },
    {
      step: 2,
      title: 'AI Obligation Extraction',
      desc: isSAMA
        ? 'Gemini intelligence parses clauses, classifies obligation types (Cybersecurity, Governance, Process, Screening), and sets KSA bank applicability.'
        : 'Gemini intelligence parses sections, classifies obligation types (Governance, Process, Screening, Assurance), and sets Indian bank applicability.',
      metrics: `${requirements.length} Obligations Extracted`
    },
    {
      step: 3,
      title: 'Bank Architecture Impact',
      desc: `Requirements mapped to bank business taxonomy, 3 Lines of Defense, Internal Policies, Controls, and Core CBS / Payment switches.`,
      metrics: '100% Architecture Mapped'
    },
    {
      step: 4,
      title: 'Human Gap Assessment',
      desc: 'Compliance officers review AI findings, upgrade provenance from seeded to reviewed, and evaluate residual risk.',
      metrics: 'Continuous Review'
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
      desc: `Audit evidence uploaded, cryptographically sealed with SHA-256 checksums, verified by CCO/CISO, and ready for ${regime} inspection.`,
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
      `"${r.mapping?.classification || 'To Be Confirmed'}"`,
      `"${r.mapping?.severity || 'Low'}"`,
      `"${r.mapping?.provenance || 'seeded'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${regime}_Compliance_Impact_Matrix_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <History className={`h-5 w-5 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <h1 className="text-xl font-bold text-slate-900">
              {regime} End-to-End Regulatory Lineage & Audit Trail
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Complete traceability from {authorityName} publications to AI extractions, impact mappings, human sign-offs, and SHA-256 evidence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className={`flex items-center space-x-2 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${
              isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Export {regime} Audit Dossier (CSV)</span>
          </button>
        </div>
      </div>

      {/* Traceability Pipeline Visualization */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitFork className={`h-4 w-4 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Six-Stage Regulatory Traceability Lifecycle ({regime})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Click any stage to inspect regulatory governance gates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {pipelineStages.map((stage, idx) => (
            <div
              key={stage.step}
              onClick={() => setActivePipelineStep(idx)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                activePipelineStep === idx
                  ? isSAMA
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-md'
                    : 'bg-indigo-900 text-white border-indigo-900 shadow-md'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  activePipelineStep === idx
                    ? 'bg-slate-800 text-slate-200'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  STAGE 0{stage.step}
                </span>
                <CheckCircle className={`h-3.5 w-3.5 ${activePipelineStep === idx ? 'text-emerald-400' : 'text-slate-400'}`} />
              </div>

              <div className="font-bold text-xs leading-snug">
                {stage.title}
              </div>

              <div className={`text-[10px] font-medium pt-2 border-t ${
                activePipelineStep === idx ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-500'
              }`}>
                {stage.metrics}
              </div>
            </div>
          ))}
        </div>

        {/* Expanded Stage Info */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-900 flex items-center space-x-2">
            <span>Stage 0{pipelineStages[activePipelineStep].step}: {pipelineStages[activePipelineStep].title}</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
              isSAMA ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
            }`}>Active Protocol</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {pipelineStages[activePipelineStep].desc}
          </p>
        </div>
      </div>

      {/* Immutable Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <History className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Regulatory Audit Event Log ({filteredEvents.length} Recorded Actions)
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              <option value="all">All Event Types</option>
              <option value="assessment_update">Assessment Updates</option>
              <option value="action_create">Action Created</option>
              <option value="action_status_change">Workflow Changes</option>
              <option value="evidence_upload">Evidence Uploaded</option>
              <option value="evidence_verified">Evidence Verified</option>
              <option value="document_ingested">Document Ingested</option>
            </select>

            <div className="relative w-64">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Event Type</th>
              <th className="p-3.5">Actor & Role</th>
              <th className="p-3.5">Entity & Details</th>
              <th className="p-3.5 text-right">Event ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredEvents.map((ev) => (
              <tr key={ev.id} className="hover:bg-slate-50/80 transition">
                <td className="p-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {new Date(ev.timestamp).toLocaleString()}
                </td>
                <td className="p-3.5">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                    {ev.event_type.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-900">{ev.user_name}</div>
                  <div className="text-[10px] text-slate-500">{ev.user_role}</div>
                </td>
                <td className="p-3.5 max-w-md">
                  {ev.entity_title && (
                    <div className="font-semibold text-slate-800 truncate mb-0.5">
                      {ev.entity_title}
                    </div>
                  )}
                  <p className="text-slate-600 text-[11px] leading-relaxed">{ev.details}</p>
                </td>
                <td className="p-3.5 text-right font-mono text-[10px] text-slate-400">
                  {ev.id}
                </td>
              </tr>
            ))}

            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                  No audit events found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
