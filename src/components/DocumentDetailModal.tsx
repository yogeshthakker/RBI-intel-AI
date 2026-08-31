import React from 'react';
import { SAMADocument, SAMARequirement } from '../types';
import {
  FileText,
  ExternalLink,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface DocumentDetailModalProps {
  document: SAMADocument | null;
  requirements: (SAMARequirement & { mapping?: any })[];
  onClose: () => void;
  onNavigateToImpact: (reqId: string) => void;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  requirements,
  onClose,
  onNavigateToImpact
}) => {
  if (!document) return null;

  const docRequirements = requirements.filter((r) => r.doc_id === document.id);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {document.doc_type}
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {document.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">Ref: {document.ref_no || document.id}</span>
            </div>
            <h2 className="text-lg font-bold text-white leading-snug">{document.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-700 bg-slate-50/50">
          {/* Metadata Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Issuing SAMA Department</span>
              <div className="font-semibold text-slate-900 mt-0.5">{document.department}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Effective Date</span>
              <div className="font-bold text-slate-900 mt-0.5">{document.effective_date || document.date}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">Official Source</span>
              <div className="mt-0.5">
                <a
                  href={document.source_url || 'https://rulebook.sama.gov.sa/en'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>SAMA Rulebook Portal</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Raw Text Excerpt */}
          {document.raw_body_preview && (
            <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
              <span className="font-bold text-slate-900 text-xs block">Official Text Excerpt:</span>
              <p className="text-slate-600 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
                {document.raw_body_preview}
              </p>
            </div>
          )}

          {/* Extracted Clauses & Obligations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>Extracted Bank Obligations ({docRequirements.length})</span>
              </h3>
            </div>

            <div className="space-y-3">
              {docRequirements.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {req.clause_label}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {req.obligation_type}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">{req.id}</span>
                  </div>

                  <div className="font-bold text-slate-900 text-xs">
                    {req.clause_title || req.clause_label}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-medium">
                    {req.requirement}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500">
                      Mapped to: <strong className="text-slate-700">{req.mapping?.business_area_name || 'Cybersecurity & Governance'}</strong>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToImpact(req.id);
                      }}
                      className="flex items-center space-x-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      <span>Assess Bank Gap</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
