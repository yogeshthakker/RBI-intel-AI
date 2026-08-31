import React from 'react';
import {
  DashboardStats,
  RBIDocument
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
  FileSpreadsheet
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  documents: RBIDocument[];
  onNavigate: (tab: any, filter?: string) => void;
  onOpenDoc: (docId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  documents,
  onNavigate,
  onOpenDoc
}) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  const totalEvaluated =
    stats.compliance_breakdown.compliant +
    stats.compliance_breakdown.partially_compliant +
    stats.compliance_breakdown.gap;

  const complianceRate =
    totalEvaluated > 0
      ? Math.round((stats.compliance_breakdown.compliant / totalEvaluated) * 100)
      : 0;

  const getExposureBadge = (status: string) => {
    switch (status) {
      case 'Low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Elevated':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome / Status Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">
                Bank Regulatory Intelligence & Compliance Posture
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                Live Audit Ready
              </span>
            </div>
            <p className="text-sm text-slate-600 max-w-3xl">
              Automated intake of RBI Master Directions and circulars mapped across 3 Lines of Defense, internal policies, and Core Banking controls.
            </p>
          </div>

          {/* Exposure Index Dial */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[260px] justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Regulatory Exposure Index
              </div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {stats.regulatory_exposure_index}
                </span>
                <span className="text-xs font-medium text-slate-500">/ 100</span>
              </div>
              <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded border ${getExposureBadge(stats.exposure_status)}`}>
                {stats.exposure_status} Exposure
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
              <span>{stats.compliance_breakdown.compliant} Compliant Controls</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{stats.compliance_breakdown.partially_compliant} Partially Compliant</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>{stats.compliance_breakdown.gap} Non-Compliant Gaps</span>
            </span>
          </div>

          <button
            onClick={() => onNavigate('exceptions')}
            className="flex items-center space-x-1 font-semibold text-emerald-700 hover:text-emerald-800 transition"
          >
            <span>Review {stats.recent_exceptions_count} Active Exceptions</span>
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
            <span className="text-xs font-semibold text-slate-500 uppercase">Active Directions</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.total_active_directions}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{stats.total_requirements} obligations tracked</span>
            <span className="text-blue-600 font-medium">View Library →</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('impact')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Compliance Posture</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {complianceRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{stats.compliance_breakdown.compliant} of {totalEvaluated} assessed</span>
            <span className="text-emerald-600 font-medium">View Gaps →</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('exceptions')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Open Gaps</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">
            {stats.total_open_gaps}
          </div>
          <div className="text-xs text-rose-600 mt-1 flex items-center justify-between font-medium">
            <span>{stats.gaps_by_severity.critical} Critical • {stats.gaps_by_severity.high} High</span>
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
            {stats.total_actions}
          </div>
          <div className="text-xs mt-1 flex items-center justify-between">
            <span className="text-rose-600 font-semibold">{stats.actions_breakdown.overdue} Overdue SLA</span>
            <span className="text-amber-700 font-medium">Manage →</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Heatmap by Business Area & 3 Lines of Defense */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Gaps by Business Area */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Regulatory Gaps by Bank Business Function
              </h2>
              <p className="text-xs text-slate-500">Distribution of non-compliant & partially compliant requirements</p>
            </div>
            <button
              onClick={() => onNavigate('impact')}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View Full Register
            </button>
          </div>

          <div className="space-y-3.5">
            {stats.gaps_by_business_area.slice(0, 5).map((area) => {
              const maxGap = Math.max(1, ...stats.gaps_by_business_area.map(b => b.gap_count));
              const pct = Math.round((area.gap_count / maxGap) * 100);
              return (
                <div key={area.area_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{area.area_name}</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                      {area.gap_count} gaps
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Three Lines of Defense Impact */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  <span>3 Lines of Defense Distribution</span>
                </h2>
                <p className="text-xs text-slate-500">Accountability & control ownership alignment</p>
              </div>
            </div>

            <div className="space-y-3">
              {stats.lines_of_defense_distribution.map((lod, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs font-bold text-slate-800 mb-2">
                    {lod.line}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <div className="text-slate-400 text-[10px] uppercase font-medium">Mapped Reqs</div>
                      <div className="font-bold text-slate-800">{lod.requirement_count}</div>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <div className="text-slate-400 text-[10px] uppercase font-medium">Open Gaps</div>
                      <div className="font-bold text-rose-600">{lod.gap_count}</div>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-slate-200">
                      <div className="text-slate-400 text-[10px] uppercase font-medium">Active Actions</div>
                      <div className="font-bold text-amber-600">{lod.action_count}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Governance Principle:</span> AI recommends assignments. 2nd line risk validates; 1st line business owns remediation.
          </div>
        </div>
      </div>

      {/* Bottom Section: Upcoming RBI Effective Dates & Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Statutory Deadlines */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Approaching RBI Statutory Effective Dates</span>
              </h2>
              <p className="text-xs text-slate-500">Enforceable timeline milestones requiring bank operational readiness</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {stats.upcoming_effective_dates.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                onClick={() => onOpenDoc(item.doc_id)}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer transition text-xs"
              >
                <div className="space-y-0.5 max-w-xl">
                  <div className="font-semibold text-slate-900 line-clamp-1">{item.doc_title}</div>
                  <div className="text-slate-500 text-[11px] flex items-center space-x-2">
                    <span className="font-medium text-slate-700">{item.department}</span>
                    <span>•</span>
                    <span>Effective: <strong className="text-slate-800">{item.effective_date}</strong></span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                    item.days_remaining <= 30
                      ? 'bg-rose-100 text-rose-800'
                      : item.days_remaining <= 60
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.days_remaining > 0 ? `${item.days_remaining} days left` : 'Effective Now'}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Auditing & Export Hub */}
        <div className="lg:col-span-4 bg-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Supervisory & Audit Pack</h3>
            </div>
            <p className="text-xs text-slate-300">
              Generate full lineage reports tracing RBI publications to internal controls, gap findings, owner sign-offs, and verified evidence files for RBI annual inspection.
            </p>
          </div>

          <div className="space-y-2 mt-6">
            <button
              onClick={() => onNavigate('audit')}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-lg font-semibold text-xs transition"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Open Audit & Lineage Pack</span>
            </button>
            <button
              onClick={() => onNavigate('intake')}
              className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-4 rounded-lg font-semibold text-xs border border-slate-700 transition"
            >
              <span>+ Ingest New RBI Circular</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
