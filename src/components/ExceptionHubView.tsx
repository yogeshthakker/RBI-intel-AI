import React, { useState } from 'react';
import { ExceptionItem } from '../types';
import {
  AlertTriangle,
  Clock,
  FileText,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle,
  Zap,
  Sparkles
} from 'lucide-react';

interface ExceptionHubViewProps {
  exceptions: ExceptionItem[];
  onSelectException: (item: ExceptionItem) => void;
  onNavigate: (tab: any, filter?: string) => void;
}

export const ExceptionHubView: React.FC<ExceptionHubViewProps> = ({
  exceptions,
  onSelectException,
  onNavigate
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const filterTabs = [
    { id: 'ALL', label: 'All Exceptions', count: exceptions.length },
    {
      id: 'OVERDUE_ACTION',
      label: 'Overdue Actions',
      count: exceptions.filter((e) => e.type === 'OVERDUE_ACTION').length,
      color: 'text-rose-600'
    },
    {
      id: 'UNRESOLVED_GAP',
      label: 'Critical Gaps',
      count: exceptions.filter((e) => e.type === 'UNRESOLVED_GAP').length,
      color: 'text-rose-600'
    },
    {
      id: 'NEW_REGULATION',
      label: 'New RBI Changes',
      count: exceptions.filter((e) => e.type === 'NEW_REGULATION').length,
      color: 'text-blue-600'
    },
    {
      id: 'FAILED_VALIDATION',
      label: 'Un-reviewed AI Mappings',
      count: exceptions.filter((e) => e.type === 'FAILED_VALIDATION').length,
      color: 'text-amber-600'
    }
  ];

  const filtered = exceptions.filter((item) => {
    if (filterType !== 'ALL' && item.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.suggested_action.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getExceptionIcon = (type: ExceptionItem['type']) => {
    switch (type) {
      case 'OVERDUE_ACTION':
        return <Clock className="h-5 w-5 text-rose-600" />;
      case 'UNRESOLVED_GAP':
        return <AlertTriangle className="h-5 w-5 text-rose-600" />;
      case 'NEW_REGULATION':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'FAILED_VALIDATION':
        return <Sparkles className="h-5 w-5 text-amber-600" />;
      default:
        return <ShieldAlert className="h-5 w-5 text-slate-600" />;
    }
  };

  const getSeverityBadge = (severity: ExceptionItem['severity']) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h1 className="text-xl font-bold text-slate-900">
                Exception-Based Compliance Workflow
              </h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Principle: Focus attention solely on high-risk breaches, SLA overruns, newly published circulars, and unverified AI recommendations.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold">
              {filtered.length} items requiring attention
            </span>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterType === tab.id ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search exceptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Exception List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800">No active exceptions in this filter</p>
            <p className="text-xs text-slate-500 mt-1">All obligations, actions, and validations in this category are fully reconciled.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="flex items-start space-x-4 max-w-3xl">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shrink-0 mt-0.5">
                  {getExceptionIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getSeverityBadge(item.severity)}`}>
                      {item.severity}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                    {item.days_overdue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white">
                        {item.days_overdue} Days Overdue
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600">{item.subtitle}</p>

                  <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded inline-flex items-center space-x-1 mt-1 border border-emerald-100 font-medium">
                    <span className="font-bold text-emerald-900">Recommended Action:</span>
                    <span>{item.suggested_action}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                {item.entity_type === 'action' && (
                  <button
                    onClick={() => onNavigate('actions', item.entity_id)}
                    className="flex items-center space-x-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    <span>Resolve Action</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {item.entity_type === 'requirement' && (
                  <button
                    onClick={() => onNavigate('impact', item.entity_id)}
                    className="flex items-center space-x-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    <span>Assess Impact & Gap</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {item.entity_type === 'document' && (
                  <button
                    onClick={() => onNavigate('intake', item.entity_id)}
                    className="flex items-center space-x-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg shadow-sm transition"
                  >
                    <span>Triage Circular</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
