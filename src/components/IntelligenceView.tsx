import React, { useState } from 'react';
import { RBIRequirement, RBIDocument } from '../types';
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
  requirements: (RBIRequirement & { mapping?: any })[];
  documents: RBIDocument[];
  onNavigateToImpact: (reqId: string) => void;
}

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  requirements,
  documents,
  onNavigateToImpact
}) => {
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
            <Sliders className="h-5 w-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900">
              AI Regulatory Intelligence & Parsed Obligations
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Machine-extracted clauses translated into standardized bank obligations with applicability, timelines, and obligation categorization.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
          <Cpu className="h-4 w-4 text-indigo-600" />
          <span>Extracted using Gemini 2.5 Flash</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Document Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Source Publication
            </label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none"
            >
              <option value="all">All Ingested Directions ({documents.length})</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title.slice(0, 60)}...
                </option>
              ))}
            </select>
          </div>

          {/* Obligation Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Obligation Type
            </label>
            <select
              value={selectedObligation}
              onChange={(e) => setSelectedObligation(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none"
            >
              <option value="all">All Obligation Types</option>
              {obligationTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Branch Relevance */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Branch Level Relevance
            </label>
            <select
              value={selectedRelevance}
              onChange={(e) => setSelectedRelevance(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none"
            >
              <option value="all">All Relevance Levels</option>
              <option value="High">High (Direct branch operational impact)</option>
              <option value="Medium">Medium (Regional / zonal operations)</option>
              <option value="Low">Low (Head Office / Central Tech only)</option>
            </select>
          </div>
        </div>

        <div className="relative pt-1">
          <Search className="h-4 w-4 absolute left-2.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search obligations by keywords, obligation text, or clause title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Extracted Obligations List */}
      <div className="space-y-4">
        {filteredReqs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <AlertCircle className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No matching obligations found</p>
            <p className="text-xs text-slate-500 mt-1">Try relaxing your filter parameters or search term.</p>
          </div>
        ) : (
          filteredReqs.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition space-y-3"
            >
              {/* Top metadata tags */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {req.clause_label}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${getObligationColor(req.obligation_type)}`}>
                    {req.obligation_type}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Branch: <strong>{req.branch_relevance}</strong>
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {req.id}
                </div>
              </div>

              {/* Requirement Title & Paraphrased Obligation */}
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  {req.clause_title || req.clause_label}
                </h2>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 leading-relaxed font-medium">
                  <span className="font-bold text-slate-900 block mb-1">Plain-Language Bank Obligation:</span>
                  {req.requirement}
                </div>
              </div>

              {/* Applicability, Timelines & Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                <div>
                  <span className="font-semibold text-slate-700">Applicability:</span> {req.applicability}
                </div>
                {req.timeline && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span><strong className="text-slate-700">Timeline / SLA:</strong> {req.timeline}</span>
                  </div>
                )}
              </div>

              {/* Keyword chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                <Tag className="h-3 w-3 text-slate-400 mr-1" />
                {req.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200"
                  >
                    #{kw}
                  </span>
                ))}
              </div>

              {/* Footer with Impact Mapping Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Document: <span className="font-semibold text-slate-700">{req.doc_title}</span>
                </div>

                <button
                  onClick={() => onNavigateToImpact(req.id)}
                  className="flex items-center space-x-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition"
                >
                  <span>Bank Impact & Gap Assessment</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
