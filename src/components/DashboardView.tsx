import React from 'react';
import {
  DashboardStats,
  RegulatoryDocument,
  RegulatoryRegime
} from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Building,
  TrendingDown,
  Layers,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  CheckCircle,
  FileText,
  Activity
} from 'lucide-react';

interface DashboardViewProps {
  regime: RegulatoryRegime;
  stats: DashboardStats | null;
  documents: RegulatoryDocument[];
  onNavigate: (tab: any, filter?: string) => void;
  onOpenDoc: (docId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  regime,
  stats,
  documents,
  onNavigate,
  onOpenDoc
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className={`animate-spin rounded-full h-10 w-10 border-b-2 ${
          regime === 'SAMA' ? 'border-emerald-600' : 'border-indigo-600'
        }`} />
      </div>
    );
  }

  const isSAMA = regime === 'SAMA';
  const authorityName = isSAMA ? 'Saudi Central Bank (SAMA)' : 'Reserve Bank of India (RBI)';
  const frameworkName = isSAMA ? 'SAMA Rulebook' : 'RBI Master Directions';

  const getExposureStatus = (percentage: number) => {
    if (percentage >= 85) return { label: 'Low Exposure', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (percentage >= 70) return { label: 'Moderate Exposure', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (percentage >= 50) return { label: 'Elevated Exposure', color: 'bg-orange-50 text-orange-700 border-orange-200' };
    return { label: 'High Exposure', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  const exposure = getExposureStatus(stats.compliance_percentage);
  const exposureIndex = Math.max(0, 100 - stats.compliance_percentage);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome / Status Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">
                {frameworkName} Regulatory Posture & Executive Cockpit
              </h1>
              <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                isSAMA
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {isSAMA ? '🇸🇦 SAMA Supervisory Ready' : '🇮🇳 RBI RBS Ready'}
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-3xl">
              {isSAMA
                ? 'Continuous monitoring of Saudi Central Bank (SAMA) Rulebook publications, Cyber Security Framework (CSF v3.0), and circulars mapped across 3 Lines of Defense, internal policies, and core banking controls.'
                : 'Continuous monitoring of Reserve Bank of India (RBI) Master Directions, CSITE Cyber Security Framework, KYC/AML Directions, and circulars mapped across Three Lines of Defense and Risk-Based Supervision.'}
            </p>
          </div>

          {/* Exposure Index Dial */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[260px] justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {regime} Regulatory Exposure
              </div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {exposureIndex}
                </span>
                <span className="text-xs font-medium text-slate-500">/ 100 Risk Index</span>
              </div>
              <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded border ${exposure.color}`}>
                {exposure.label}
              </span>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-amber-500 flex items-center justify-center font-bold text-xs text-slate-700">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Action Highlights Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4 text-slate-600">
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>{stats.compliant_count} Compliant Controls</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{stats.partially_compliant_count} Partially Compliant</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>{stats.gap_count} Non-Compliant Gaps</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>{stats.to_be_confirmed_count} To Be Confirmed</span>
            </span>
          </div>

          <button
            onClick={() => onNavigate('exceptions')}
            className={`flex items-center space-x-1 font-semibold transition ${
              isSAMA ? 'text-emerald-700 hover:text-emerald-800' : 'text-indigo-700 hover:text-indigo-800'
            }`}
          >
            <span>Review {stats.exceptions_count} Active Exceptions</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate('intake')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">{regime} Active Directives</span>
            <div className={`p-2 rounded-lg ${isSAMA ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.total_documents}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{stats.total_obligations} {regime} obligations tracked</span>
            <span className={`font-medium ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`}>View Library →</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('impact')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Compliance Health</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {stats.compliance_percentage}%
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{stats.compliant_count} of {stats.total_obligations} obligations</span>
            <span className="text-emerald-600 font-medium">View Impact →</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('exceptions')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Open {regime} Gaps</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">
            {stats.gap_count}
          </div>
          <div className="text-xs text-rose-600 mt-1 flex items-center justify-between font-medium">
            <span>{stats.partially_compliant_count} Partial • {stats.to_be_confirmed_count} TBC</span>
            <span>Triage →</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate('actions')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Remediation Actions</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.active_actions}
          </div>
          <div className="text-xs mt-1 flex items-center justify-between">
            <span className="text-rose-600 font-semibold">{stats.overdue_actions} Overdue SLA</span>
            <span className="text-amber-700 font-medium">Manage →</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Breakdown by Business Area & Regulatory Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gaps by Business Area */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Regulatory Obligations by Bank Business Function
              </h2>
              <p className="text-xs text-slate-500">Distribution of {regime} requirements and identified compliance gaps</p>
            </div>
            <button
              onClick={() => onNavigate('impact')}
              className={`text-xs font-semibold hover:underline ${isSAMA ? 'text-emerald-700' : 'text-indigo-700'}`}
            >
              View Full Register
            </button>
          </div>

          <div className="space-y-3.5">
            {stats.obligations_by_business_area.map((area) => {
              const maxCount = Math.max(1, ...stats.obligations_by_business_area.map(b => b.count));
              const pct = Math.round((area.count / maxCount) * 100);
              return (
                <div key={area.area} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{area.area}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-[11px]">{area.count} obligations</span>
                      {area.gaps > 0 && (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                          {area.gaps} gaps
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        area.gaps > 0 ? 'bg-rose-500' : isSAMA ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Topic & Framework Breakdown */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  {regime} Supervised Topics
                </h2>
                <p className="text-xs text-slate-500">Breakdown of ingested regulations by supervisory topic</p>
              </div>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {stats.documents_by_topic.map((item) => (
                <div
                  key={item.topic}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition cursor-pointer"
                  onClick={() => onNavigate('intake')}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className={`h-4 w-4 ${isSAMA ? 'text-emerald-600' : 'text-indigo-600'}`} />
                    <span className="text-xs font-semibold text-slate-800">{item.topic}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {item.count} docs
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Evidence Items Verified: <strong className="text-emerald-700">{stats.evidence_verified_count}</strong></span>
            <button
              onClick={() => onNavigate('audit')}
              className={`font-semibold hover:underline ${isSAMA ? 'text-emerald-700' : 'text-indigo-700'}`}
            >
              Audit Vault →
            </button>
          </div>
        </div>
      </div>

      {/* Ingested Regulations List */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {regime} Frameworks & Circulars Active in Vault
            </h2>
            <p className="text-xs text-slate-500">Click any document to inspect extracted clauses and mapped controls</p>
          </div>
          <button
            onClick={() => onNavigate('intake')}
            className={`text-xs font-semibold hover:underline ${isSAMA ? 'text-emerald-700' : 'text-indigo-700'}`}
          >
            Manage Intake →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => onOpenDoc(doc.id)}
              className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                    isSAMA ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {doc.doc_type}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{doc.ref_no}</span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{doc.date}</span>
                </div>
                <div className="text-sm font-bold text-slate-800 hover:text-emerald-700 transition">
                  {doc.title}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 max-w-2xl">
                  {doc.raw_body_preview}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-700">{doc.department}</div>
                  <div className="text-[11px] text-slate-500">{doc.primary_topic}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
