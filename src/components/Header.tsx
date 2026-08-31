import React from 'react';
import {
  ShieldAlert,
  Bot,
  AlertTriangle,
  Building2,
  FileText,
  Sliders,
  CheckCircle2,
  ListTodo,
  History,
  LayoutDashboard
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'exceptions'
  | 'intake'
  | 'intelligence'
  | 'impact'
  | 'actions'
  | 'audit';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  exceptionCount: number;
  openAdvisor: () => void;
  institution: string;
  setInstitution: (inst: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  exceptionCount,
  openAdvisor,
  institution,
  setInstitution
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Cockpit', icon: LayoutDashboard },
    {
      id: 'exceptions',
      label: 'Exception Hub',
      icon: AlertTriangle,
      badge: exceptionCount > 0 ? exceptionCount : undefined
    },
    { id: 'intake', label: 'Regulatory Intake', icon: FileText },
    { id: 'intelligence', label: 'AI Intelligence', icon: Sliders },
    { id: 'impact', label: 'Impact & Gaps', icon: CheckCircle2 },
    { id: 'actions', label: 'Action Management', icon: ListTodo },
    { id: 'audit', label: 'Audit & Lineage', icon: History }
  ];

  return (
    <header id="rbi-intel-header" className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-sm">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-inner">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">RBI INTEL</span>
                <span className="text-xs uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Bank TOM v6
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Regulatory Intelligence, Impact Assessment & Audit Evidence Engine
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-4">
            {/* Institution Context Selector */}
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <Building2 className="h-4 w-4 text-slate-400" />
              <label htmlFor="inst-selector" className="text-xs text-slate-400 font-medium">Entity:</label>
              <select
                id="inst-selector"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                aria-label="Select entity type"
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Commercial Bank" className="bg-slate-800 text-slate-100">Scheduled Commercial Bank (SCB)</option>
                <option value="Foreign Bank Branch" className="bg-slate-800 text-slate-100">Foreign Bank Branch in India</option>
                <option value="Small Finance Bank" className="bg-slate-800 text-slate-100">Small Finance Bank (SFB)</option>
                <option value="Payments Bank" className="bg-slate-800 text-slate-100">Payments Bank</option>
              </select>
            </div>

            {/* AI Advisor Button */}
            <button
              id="btn-open-ai-advisor"
              onClick={openAdvisor}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Bot className="h-4 w-4 text-indigo-200 animate-pulse" />
              <span>AI Compliance Advisor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-slate-900/90 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 font-semibold border-b-2 border-emerald-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
