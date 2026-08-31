import React, { useState } from 'react';
import { RegulatoryRequirement, RegulatoryDocument, RegulatoryRegime } from '../types';
import {
  Sliders,
  Search,
  Sparkles,
  Tag,
  Clock,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Cpu
} from 'lucide-react';

interface IntelligenceViewProps {
  regime: RegulatoryRegime;
  requirements: (RegulatoryRequirement & { mapping?: any })[];
  documents: RegulatoryDocument[];
  onNavigateToImpact: (reqId: string) => void;
}

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  regime,
  requirements,
  documents,
  onNavigateToImpact
}) => {
  const isSAMA = regime === 'SAMA';
  const authorityName = isSAMA ? 'Saudi Central Bank (SAMA)' : 'Reserve Bank of India (RBI)';

  const [selectedDoc, setSelectedDoc] = useState('all');
  const [selectedObligation, setSelectedObligation] = useState('all');
  const [selectedRelevance, setSelectedRelevance] = useState('all');
  const [search, setSearch] = useState('');

  const obligationTypes = [
    'Governance',
    'Process',
    'Screening',
    'Assurance',
    'Timeline',
    'Reporting',
    'Capital',
    'Cybersecurity',
    'Prudential'
  ];

  const filteredReqs = requirements.filter((r) => {
    if (selectedDoc !== 'all' && r.doc_id !== selectedDoc) return false;
    if (selectedObligation !== 'all' && r.obligation_type !== selectedObligation) return false;
    if (selectedRelevance !== 'all' && r.branch_relevance !== selectedRelevance) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.requirement.toLowerCase().includes(q) ||
        r.clause_title?.toLowerCase().includes(q) ||
        r.clause_label?.toLowerCase().includes(q) ||
        r.keywords.some((k) => k.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getObligationColor = (type: string) => {
    switch (type) {
      case 'Governance':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Cybersecurity':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Process':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Screening':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Timeline':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Prudential':
      case 'Capital':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className={`h-5 w-5 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <h1 className="text-xl font-bold text-slate-900">
              {regime} AI Regulatory Intelligence & Parsed Obligations
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Machine-extracted clauses translated into standardized bank obligations with applicability, timelines, and {authorityName} taxonomy categorization.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
          <Cpu className={`h-4 w-4 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
          <span>Extracted with Gemini 2.5 Flash</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none max-w-xs truncate"
          >
            <option value="all">All {regime} Documents ({documents.length})</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>

          <select
            value={selectedObligation}
            onChange={(e) => setSelectedObligation(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Obligation Types</option>
            {obligationTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedRelevance}
            onChange={(e) => setSelectedRelevance(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Branch Relevance</option>
            <option value="High">High Branch Relevance</option>
            <option value="Medium">Medium Branch Relevance</option>
            <option value="Low">Low Branch Relevance</option>
          </select>
        </div>

        <div className="relative w-72">
          <Search className="h-4 w-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${regime} obligations, keywords...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Obligations Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReqs.map((req) => (
          <div
            key={req.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 hover:shadow transition space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded border ${getObligationColor(req.obligation_type)}`}>
                  {req.obligation_type}
                </span>
                <span className="text-xs font-bold text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded">
                  {req.clause_label}
                </span>
                <span className="text-xs text-slate-400 font-mono">{req.id}</span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Building className="h-3.5 w-3.5" />
                <span className="font-semibold text-slate-700">{req.doc_title}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900">
                {req.clause_title}
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
                {req.requirement}
              </p>
            </div>

            {/* Structured Tags & Timeline */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Keywords:</span>
                {req.keywords?.map((k, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] border border-slate-200"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    <span>{k}</span>
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-slate-500 text-xs">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Timeline: <strong className="text-slate-800">{req.timeline || 'Mandatory / Continuous'}</strong></span>
                </div>

                <button
                  onClick={() => onNavigateToImpact(req.id)}
                  className={`flex items-center space-x-1.5 font-bold text-xs px-3 py-1 rounded-lg border shadow-2xs transition ${
                    isSAMA
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <span>Impact & Assessment</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReqs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            No {regime} obligations found matching current filters.
          </div>
        )}
      </div>
    </div>
  );
};
