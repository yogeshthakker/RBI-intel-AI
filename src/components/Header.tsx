import React from 'react';
import {
  ShieldCheck,
  Bot,
  AlertTriangle,
  Building2,
  FileText,
  Sliders,
  CheckCircle2,
  ListTodo,
  History,
  LayoutDashboard,
  ExternalLink,
  Globe2
} from 'lucide-react';
import { RegulatoryRegime } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'exceptions'
  | 'intake'
  | 'intelligence'
  | 'impact'
  | 'actions'
  | 'audit';

interface HeaderProps {
  regime: RegulatoryRegime;
  setRegime: (regime: RegulatoryRegime) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  exceptionCount: number;
  openAdvisor: () => void;
  institution: string;
  setInstitution: (inst: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  regime,
  setRegime,
  activeTab,
  setActiveTab,
  exceptionCount,
  openAdvisor,
  institution,
  setInstitution
}) => {
  const isSAMA = regime === 'SAMA';

  const navItems = [
    { id: 'dashboard', label: 'Executive Cockpit', icon: LayoutDashboard },
    {
      id: 'exceptions',
      label: 'Exception Hub',
      icon: AlertTriangle,
      badge: exceptionCount > 0 ? exceptionCount : undefined
    },
    { id: 'intake', label: isSAMA ? 'SAMA Rulebook Intake' : 'RBI Direction Intake', icon: FileText },
    { id: 'intelligence', label: 'AI Intelligence', icon: Sliders },
    { id: 'impact', label: 'Impact & Gaps', icon: CheckCircle2 },
    { id: 'actions', label: 'Action Management', icon: ListTodo },
    { id: 'audit', label: isSAMA ? 'Supervisory Audit Trail' : 'RBI Audit & RBS Trail', icon: History }
  ];

  return (
    <header id="reg-intel-header" className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold shadow-inner border ${
              isSAMA
                ? 'bg-emerald-600 border-emerald-400/30'
                : 'bg-indigo-600 border-indigo-400/30'
            }`}>
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  {isSAMA ? 'SAMA RULEBOOK INTEL' : 'RBI COMPLIANCE INTEL'}
                </span>
                <span className={`text-[11px] uppercase px-2 py-0.5 rounded font-semibold border ${
                  isSAMA
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                }`}>
                  {isSAMA ? '🇸🇦 Saudi Central Bank' : '🇮🇳 Reserve Bank of India'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                {isSAMA
                  ? 'SAMA Rulebook Monitoring, Multi-Dimensional Impact & 3-Lines Audit Vault'
                  : 'RBI Master Directions, Risk-Based Supervision & Multi-Dimensional Compliance'}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Version / Regime Switcher */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-700/80 shadow-inner">
              <button
                id="btn-regime-sama"
                onClick={() => {
                  setRegime('SAMA');
                  setInstitution('Commercial Bank (KSA)');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                  isSAMA
                    ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Switch to SAMA (Saudi Central Bank) Rulebook Version"
              >
                <span>🇸🇦 SAMA</span>
              </button>
              <button
                id="btn-regime-rbi"
                onClick={() => {
                  setRegime('RBI');
                  setInstitution('Scheduled Commercial Bank (India)');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                  !isSAMA
                    ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Switch to RBI (Reserve Bank of India) Master Directions Version"
              >
                <span>🇮🇳 RBI</span>
              </button>
            </div>

            {/* Official Regulator Portal Link */}
            <a
              id="link-official-portal"
              href={isSAMA ? 'https://rulebook.sama.gov.sa/en' : 'https://www.rbi.org.in'}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden lg:flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                isSAMA
                  ? 'hover:bg-slate-700/80 text-emerald-400 hover:text-emerald-300 border-emerald-500/30'
                  : 'hover:bg-slate-700/80 text-indigo-400 hover:text-indigo-300 border-indigo-500/30'
              }`}
              title={isSAMA ? 'Open Official SAMA Rulebook (rulebook.sama.gov.sa)' : 'Open Official RBI Portal (rbi.org.in)'}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>{isSAMA ? 'SAMA Rulebook' : 'RBI Master Directions'}</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {/* Regulated Entity Context Selector */}
            <div className="flex items-center space-x-2 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <Building2 className={`h-4 w-4 ${isSAMA ? 'text-emerald-400' : 'text-indigo-400'}`} />
              <label htmlFor="inst-selector" className="text-xs text-slate-400 font-medium hidden sm:inline">Entity:</label>
              <select
                id="inst-selector"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                aria-label="Select regulated entity type"
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[160px] sm:max-w-none"
              >
                {isSAMA ? (
                  <>
                    <option value="Commercial Bank (KSA)" className="bg-slate-800 text-slate-100">Saudi Commercial Bank (SCB)</option>
                    <option value="Islamic Bank (KSA)" className="bg-slate-800 text-slate-100">Islamic Bank (KSA)</option>
                    <option value="Foreign Bank Branch (KSA)" className="bg-slate-800 text-slate-100">Foreign Bank Branch in KSA</option>
                    <option value="Digital Bank (SAMA)" className="bg-slate-800 text-slate-100">Digital Bank (SAMA Licensed)</option>
                    <option value="Financing Company (NBFI)" className="bg-slate-800 text-slate-100">Financing & Microfinance Co. (NBFI)</option>
                    <option value="Payment Services Provider" className="bg-slate-800 text-slate-100">Payment Services Provider (mada/PSP)</option>
                  </>
                ) : (
                  <>
                    <option value="Scheduled Commercial Bank (India)" className="bg-slate-800 text-slate-100">Scheduled Commercial Bank (SCB)</option>
                    <option value="Private Sector Bank (India)" className="bg-slate-800 text-slate-100">Private Sector Bank</option>
                    <option value="Foreign Bank (India Branch)" className="bg-slate-800 text-slate-100">Foreign Bank (India Branch)</option>
                    <option value="Small Finance Bank (SFB)" className="bg-slate-800 text-slate-100">Small Finance Bank (SFB)</option>
                    <option value="Payments Bank (RBI)" className="bg-slate-800 text-slate-100">Payments Bank (RBI Licensed)</option>
                    <option value="NBFC (Upper/Middle Layer)" className="bg-slate-800 text-slate-100">NBFC (Scale-Based Regulated)</option>
                  </>
                )}
              </select>
            </div>

            {/* AI Advisor Button */}
            <button
              id="btn-open-ai-advisor"
              onClick={openAdvisor}
              className={`flex items-center space-x-2 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all border ${
                isSAMA
                  ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 border-emerald-400/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-indigo-400/30'
              }`}
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">{isSAMA ? 'SAMA AI Advisor' : 'RBI AI Advisor'}</span>
              <span className="sm:hidden">AI</span>
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
                      ? isSAMA
                        ? 'bg-slate-800 text-emerald-400 font-semibold border-b-2 border-emerald-500 shadow-sm'
                        : 'bg-slate-800 text-indigo-300 font-semibold border-b-2 border-indigo-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${
                    isActive
                      ? isSAMA ? 'text-emerald-400' : 'text-indigo-400'
                      : 'text-slate-400'
                  }`} />
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
