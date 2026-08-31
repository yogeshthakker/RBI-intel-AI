import React, { useState } from 'react';
import { RegulatoryDocument, RegulatoryRegime } from '../types';
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
  FileCheck,
  Globe
} from 'lucide-react';
import { api } from '../services/api';

interface IntakeViewProps {
  regime: RegulatoryRegime;
  documents: RegulatoryDocument[];
  onOpenDoc: (docId: string) => void;
  onRefresh: () => void;
}

export const IntakeView: React.FC<IntakeViewProps> = ({
  regime,
  documents,
  onOpenDoc,
  onRefresh
}) => {
  const isSAMA = regime === 'SAMA';
  const authorityName = isSAMA ? 'Saudi Central Bank (SAMA)' : 'Reserve Bank of India (RBI)';
  const frameworkName = isSAMA ? 'SAMA Rulebook' : 'RBI Master Directions';

  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showIngestModal, setShowIngestModal] = useState(false);

  // Ingestion form state
  const [ingestForm, setIngestForm] = useState({
    title: '',
    refNo: '',
    docType: isSAMA ? 'Circular' : 'Master Direction',
    department: isSAMA ? 'Cyber Risk & Technology Supervision Department' : 'Department of Regulation (DoR)',
    sourceUrl: isSAMA ? 'https://rulebook.sama.gov.sa/en' : 'https://www.rbi.org.in',
    rawText: ''
  });
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  const samaDepartments = [
    { id: 'all', label: 'All SAMA Departments' },
    { id: 'Cyber', label: 'Cyber Risk & Tech Supervision' },
    { id: 'Banking', label: 'Banking Supervision Department' },
    { id: 'AML', label: 'AML / CFT Supervision' },
    { id: 'Consumer', label: 'Consumer Protection' },
    { id: 'Payment', label: 'Payment Systems & FinTech' }
  ];

  const rbiDepartments = [
    { id: 'all', label: 'All RBI Departments' },
    { id: 'Regulation', label: 'Department of Regulation (DoR)' },
    { id: 'Supervision', label: 'Department of Supervision (DoS)' },
    { id: 'DPSS', label: 'Payment & Settlement Systems (DPSS)' },
    { id: 'Cyber', label: 'Cyber Security & IT Risk (CSITE)' },
    { id: 'Consumer', label: 'Consumer Education & Protection (CEPD)' }
  ];

  const departments = isSAMA ? samaDepartments : rbiDepartments;

  const filteredDocs = documents.filter((doc) => {
    if (departmentFilter !== 'all' && !doc.department?.toLowerCase().includes(departmentFilter.toLowerCase())) return false;
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
        sourceUrl: ingestForm.sourceUrl,
        regulator: regime
      });
      setIngestSuccess(`Successfully ingested "${result.document.title}". Extracted ${result.requirements.length} ${regime} obligations.`);
      setTimeout(() => {
        setIsIngesting(false);
        setShowIngestModal(false);
        setIngestSuccess(null);
        setIngestForm({
          title: '',
          refNo: '',
          docType: isSAMA ? 'Circular' : 'Master Direction',
          department: isSAMA ? 'Cyber Risk & Technology Supervision Department' : 'Department of Regulation (DoR)',
          sourceUrl: isSAMA ? 'https://rulebook.sama.gov.sa/en' : 'https://www.rbi.org.in',
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
    if (isSAMA) {
      setIngestForm({
        title: 'SAMA Circular – National Fraud Intelligence & Real-Time SARIE Payment Freeze Controls, 2026',
        refNo: 'SAMA Circular No. 46091244',
        docType: 'Circular',
        department: 'Payment Systems & FinTech Supervision',
        sourceUrl: 'https://rulebook.sama.gov.sa/en',
        rawText: `Article 1 (Real-Time Behavioral Anti-Fraud Engine): All licensed commercial banks in KSA shall implement real-time machine-learning anomaly scoring for all outbound SARIE and mada e-commerce transactions exceeding SAR 10,000.
Article 2 (Mandatory National Fraud Network Integration): Banks must integrate their internal Transaction Monitoring Systems with the SAMA National Fraud Counter-Platform via automated bi-directional REST APIs with maximum 5-second round-trip latency.
Article 3 (Dynamic Cooling-Off Period for High-Risk Beneficiary Adds): When a retail customer adds a new domestic or international beneficiary via digital channels, the bank shall enforce a mandatory 2-hour transaction cooldown or require high-assurance Nafath biometric step-up authentication.
Article 4 (Customer Redress & Restitution Timeline): Where unauthorized digital fraud occurs without gross customer negligence, the bank shall complete preliminary investigation and provide provisional liquidity credit within 48 business hours.`
      });
    } else {
      setIngestForm({
        title: 'RBI Master Direction – Digital Payment Security & Mule Account Detection Controls, 2026',
        refNo: 'RBI/2026-27/418 DPSS.CO.OD.No.912/06.11.001/2026-27',
        docType: 'Master Direction',
        department: 'Department of Payment and Settlement Systems (DPSS)',
        sourceUrl: 'https://www.rbi.org.in',
        rawText: `Section 1 (Mule Account Detection & MuleHunter Integration): All Scheduled Commercial Banks and Payment Banks shall deploy automated behavioral pattern detection to identify potential mule bank accounts within 1 hour of account credit bursts and integrate real-time API telemetry with the RBI MuleHunter counter-fraud network.
Section 2 (Enhanced Step-Up Authentication for High-Value Immediate Payments): For all outbound IMPS/UPI transactions exceeding INR 50,000 originating from a new device IP or geolocation change, mandatory multi-factor biometric step-up authentication or out-of-band verification shall be enforced.
Section 3 (Mandatory CKYCR Synchronisation): Regulated entities shall verify and sync digital customer records with CERSAI CKYCR within 3 calendar days of customer profile modification.
Section 4 (Supervisory Incident Notification & Root Cause Analysis): Any digital channel outage exceeding 30 minutes or cybersecurity compromise impacting payment switch infrastructure must be notified to RBI CSITE and CERT-In within 2 hours.`
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className={`h-5 w-5 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <h1 className="text-xl font-bold text-slate-900">
              {frameworkName} Regulatory Intake & Repository
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            {isSAMA
              ? 'Systematic repository of Saudi Central Bank (SAMA) Rulebook Frameworks, Circulars, and Regulations with automated clause parsing and AI extraction.'
              : 'Systematic repository of Reserve Bank of India (RBI) Master Directions, Master Circulars, and Guidelines with automated clause parsing and AI extraction.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={isSAMA ? 'https://rulebook.sama.gov.sa/en' : 'https://www.rbi.org.in'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center space-x-1 text-xs font-semibold px-3 py-2 rounded-lg transition ${
              isSAMA
                ? 'text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200'
                : 'text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5 mr-1" />
            <span>{isSAMA ? 'rulebook.sama.gov.sa' : 'rbi.org.in'}</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>

          <button
            onClick={() => setShowIngestModal(true)}
            className={`flex items-center space-x-2 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition ${
              isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Ingest {regime} Document</span>
          </button>
        </div>
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
              placeholder={`Search ${regime} circulars, ref numbers...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 ${
                isSAMA ? 'focus:ring-emerald-500' : 'focus:ring-indigo-500'
              }`}
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
                <h2
                  className={`text-sm font-bold text-slate-900 leading-snug transition cursor-pointer ${
                    isSAMA ? 'hover:text-emerald-700' : 'hover:text-indigo-700'
                  }`}
                  onClick={() => onOpenDoc(doc.id)}
                >
                  {doc.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {doc.raw_body_preview || `${regime} regulatory framework containing binding directives for regulated institutions.`}
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
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-mono">{doc.ref_no}</span>
              </div>
              <button
                onClick={() => onOpenDoc(doc.id)}
                className={`flex items-center space-x-1 text-xs font-semibold transition ${
                  isSAMA ? 'text-emerald-700 hover:text-emerald-800' : 'text-indigo-700 hover:text-indigo-800'
                }`}
              >
                <span>Inspect Obligations</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Ingest Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${isSAMA ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Ingest {authorityName} Document with Gemini AI
                  </h2>
                  <p className="text-xs text-slate-500">
                    Paste circular/framework text. Gemini extracts obligations, maps 3 lines of defense, and identifies gaps.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSampleLoad}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                  isSAMA
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                Load Sample {regime} Circular
              </button>
            </div>

            {ingestSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{ingestSuccess}</span>
              </div>
            )}

            <form onSubmit={handleIngestSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Official Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder={isSAMA ? 'e.g. SAMA Circular on Digital Fraud Prevention Controls 2026' : 'e.g. RBI Master Direction on Digital Payment Security Controls 2026'}
                  value={ingestForm.title}
                  onChange={(e) => setIngestForm({ ...ingestForm, title: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Reference Number</label>
                  <input
                    type="text"
                    placeholder={isSAMA ? 'e.g. SAMA Circular No. 46091244' : 'e.g. RBI/2026-27/418 DPSS.CO.OD.No.912'}
                    value={ingestForm.refNo}
                    onChange={(e) => setIngestForm({ ...ingestForm, refNo: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Document Type</label>
                  <select
                    value={ingestForm.docType}
                    onChange={(e) => setIngestForm({ ...ingestForm, docType: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none"
                  >
                    <option value="Circular">Circular</option>
                    <option value="Master Direction">Master Direction</option>
                    <option value="Framework">Framework</option>
                    <option value="Rulebook">Rulebook Section</option>
                    <option value="Guidelines">Guidelines</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Supervising Department</label>
                  <input
                    type="text"
                    value={ingestForm.department}
                    onChange={(e) => setIngestForm({ ...ingestForm, department: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Source URL</label>
                  <input
                    type="url"
                    value={ingestForm.sourceUrl}
                    onChange={(e) => setIngestForm({ ...ingestForm, sourceUrl: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Raw Document Text / Articles / Clauses *</label>
                <textarea
                  required
                  rows={8}
                  placeholder="Paste official text or articles..."
                  value={ingestForm.rawText}
                  onChange={(e) => setIngestForm({ ...ingestForm, rawText: e.target.value })}
                  className="w-full text-xs p-2.5 font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isIngesting}
                  onClick={() => setShowIngestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIngesting}
                  className={`flex items-center space-x-2 text-white px-5 py-2 rounded-lg text-xs font-semibold shadow transition disabled:opacity-50 ${
                    isSAMA ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {isIngesting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                      <span>Parsing with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Ingest & Auto-Map with AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
