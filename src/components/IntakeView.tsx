import React, { useState } from 'react';
import { RBIDocument } from '../types';
import {
  FileText,
  Plus,
  Search,
  Building,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ArrowRight,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';

interface IntakeViewProps {
  documents: RBIDocument[];
  onOpenDoc: (docId: string) => void;
  onRefresh: () => void;
}

export const IntakeView: React.FC<IntakeViewProps> = ({
  documents,
  onOpenDoc,
  onRefresh
}) => {
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showIngestModal, setShowIngestModal] = useState(false);

  // Ingestion form state
  const [ingestForm, setIngestForm] = useState({
    title: '',
    refNo: '',
    docType: 'Circular',
    department: 'Department of Regulation (DoR)',
    sourceUrl: 'https://rbi.org.in/Scripts/NotificationUser.aspx',
    rawText: ''
  });
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const departments = [
    { id: 'all', label: 'All RBI Departments' },
    { id: 'Supervision', label: 'Department of Supervision (DoS)' },
    { id: 'Regulation', label: 'Department of Regulation (DoR)' },
    { id: 'Foreign', label: 'Foreign Exchange Department (FED)' },
    { id: 'DPSS', label: 'Payment & Settlement Systems (DPSS)' }
  ];

  const filteredDocs = documents.filter((doc) => {
    if (departmentFilter !== 'all' && !doc.department?.includes(departmentFilter)) return false;
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.ref_no?.toLowerCase().includes(q) ||
        doc.primary_topic?.toLowerCase().includes(q) ||
        doc.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleIngestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestForm.title || !ingestForm.rawText) return;

    setIsIngesting(true);
    try {
      const result = await api.ingestDocumentWithAI({
        title: ingestForm.title,
        rawText: ingestForm.rawText,
        refNo: ingestForm.refNo,
        docType: ingestForm.docType,
        department: ingestForm.department,
        sourceUrl: ingestForm.sourceUrl
      });
      setIngestSuccess(`Successfully ingested "${result.document.title}". Extracted ${result.requirements.length} obligations.`);
      setTimeout(() => {
        setIsIngesting(false);
        setShowIngestModal(false);
        setIngestSuccess(null);
        setIngestForm({
          title: '',
          refNo: '',
          docType: 'Circular',
          department: 'Department of Regulation (DoR)',
          sourceUrl: 'https://rbi.org.in/Scripts/NotificationUser.aspx',
          rawText: ''
        });
        onRefresh();
        onOpenDoc(result.document.id);
      }, 1200);
    } catch (err: any) {
      alert(`Ingestion failed: ${err.message}`);
      setIsIngesting(false);
    }
  };

  const handleSampleLoad = () => {
    setIngestForm({
      title: 'Master Direction – Digital Payment Security Controls & Tokenization Standards, 2026',
      refNo: 'RBI/DPSS/2026-27/89',
      docType: 'Master Direction',
      department: 'Department of Payment & Settlement Systems (DPSS)',
      sourceUrl: 'https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=14990',
      rawText: `1. Governance of Digital Payment Channels: Banks shall establish a dedicated 24x7 Fraud Monitoring Cell (FMC) with automated behavioral anomaly detection capabilities to flag suspicious transaction velocities within 15 seconds.
2. Device Binding & SIM Verification: Mobile banking applications must enforce client-side hardware cryptographic binding and prohibit execution on rooted, jailbroken, or developer-mode-enabled mobile devices.
3. Card-on-File Tokenization: Payment aggregators and merchant portals shall strictly not store raw 16-digit card credentials; all token requestors must support dynamic CVV cryptograms for card-not-present transactions exceeding INR 5,000.
4. Customer Dispute & Chargeback SLA: Banks shall ensure credit reversals for unauthorized digital payment transactions reported within 72 hours are provisionally credited to the customer account within 5 working days.`
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-900">
              RBI Regulatory Intake & Repository
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Systematic repository of RBI Master Directions, Circulars, and Notifications with automated clause parsing and AI extraction.
          </p>
        </div>

        <button
          onClick={() => setShowIngestModal(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition"
        >
          <Plus className="h-4 w-4" />
          <span>Ingest New RBI Document</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setDepartmentFilter(dept.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                departmentFilter === dept.id
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="amended">Amended</option>
            <option value="superseded">Superseded</option>
          </select>

          <div className="relative w-64">
            <Search className="h-4 w-4 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Search circulars, ref numbers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Document Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 hover:shadow transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                    {doc.doc_type}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    doc.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : doc.status === 'amended'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {doc.status}
                  </span>
                  {doc.has_update && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      Amended 2026
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">{doc.id}</span>
              </div>

              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-snug hover:text-emerald-700 transition cursor-pointer" onClick={() => onOpenDoc(doc.id)}>
                  {doc.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {doc.raw_body_preview || 'Parsed regulatory framework containing binding directives for commercial bank operations.'}
                </p>
              </div>

              {/* Badges and metadata */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{doc.department}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>Effective: <strong>{doc.effective_date || doc.date}</strong></span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs">
                <span className="font-semibold text-slate-700">
                  {doc.requirements_count ?? 0} Obligations
                </span>
                <span className="text-slate-300">•</span>
                <span className={`font-bold ${(doc.open_gaps_count ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {doc.open_gaps_count ?? 0} Open Gaps
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={doc.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded transition"
                  title="View on RBI Official Website"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  onClick={() => onOpenDoc(doc.id)}
                  className="flex items-center space-x-1 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg transition"
                >
                  <span>Explore Clauses</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ingest Document Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Ingest RBI Document & Run AI Extraction</h3>
              </div>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {ingestSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h4 className="text-base font-bold text-slate-900">Document Ingestion Completed</h4>
                <p className="text-xs text-slate-600">{ingestSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleIngestSubmit} className="space-y-4">
                <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3 rounded-lg text-xs text-indigo-900">
                  <span>Want to test with a real upcoming RBI tokenization directive?</span>
                  <button
                    type="button"
                    onClick={handleSampleLoad}
                    className="font-bold underline text-indigo-700 hover:text-indigo-900"
                  >
                    Load Sample Circular
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Publication Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Direction – Digital Payment Security Controls & Tokenization Standards, 2026"
                    value={ingestForm.title}
                    onChange={(e) => setIngestForm({ ...ingestForm, title: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      RBI Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. RBI/DPSS/2026-27/89"
                      value={ingestForm.refNo}
                      onChange={(e) => setIngestForm({ ...ingestForm, refNo: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={ingestForm.docType}
                      onChange={(e) => setIngestForm({ ...ingestForm, docType: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none"
                    >
                      <option value="Master Direction">Master Direction</option>
                      <option value="Circular">Circular</option>
                      <option value="Notification">Notification</option>
                      <option value="Guidelines">Guidelines</option>
                      <option value="FAQ">FAQ / Clarification</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Issuing RBI Department
                  </label>
                  <select
                    value={ingestForm.department}
                    onChange={(e) => setIngestForm({ ...ingestForm, department: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none"
                  >
                    <option value="Department of Regulation (DoR)">Department of Regulation (DoR)</option>
                    <option value="Department of Supervision (DoS)">Department of Supervision (DoS)</option>
                    <option value="Foreign Exchange Department (FED)">Foreign Exchange Department (FED)</option>
                    <option value="Department of Payment & Settlement Systems (DPSS)">Department of Payment & Settlement Systems (DPSS)</option>
                    <option value="Financial Inclusion & Development (FIDD)">Financial Inclusion & Development (FIDD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Raw Circular / Regulatory Body Text * (Pasted or Parsed from PDF)
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Paste the full or excerpt text of the RBI Master Direction / Circular..."
                    value={ingestForm.rawText}
                    onChange={(e) => setIngestForm({ ...ingestForm, rawText: e.target.value })}
                    className="w-full text-xs p-3 font-mono rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowIngestModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isIngesting}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 shadow"
                  >
                    {isIngesting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Extracting with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Ingest & Run AI Intelligence</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
