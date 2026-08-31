import React, { useState, useEffect } from 'react';
import {
  DashboardStats,
  RBIDocument,
  RBIRequirement,
  RemediationAction,
  AuditEvent,
  BusinessArea,
  OwnerRole,
  ExceptionItem
} from './types';
import { api } from './services/api';
import { Header, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ExceptionHubView } from './components/ExceptionHubView';
import { IntakeView } from './components/IntakeView';
import { IntelligenceView } from './components/IntelligenceView';
import { ImpactAssessmentView } from './components/ImpactAssessmentView';
import { ActionManagementView } from './components/ActionManagementView';
import { AuditTrailView } from './components/AuditTrailView';
import { AIAdvisorModal } from './components/AIAdvisorModal';
import { DocumentDetailModal } from './components/DocumentDetailModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [institution, setInstitution] = useState<string>('Commercial Bank');

  // Core state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<RBIDocument[]>([]);
  const [requirements, setRequirements] = useState<(RBIRequirement & { mapping?: any })[]>([]);
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [owners, setOwners] = useState<OwnerRole[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Deep linking & Modals
  const [selectedReqId, setSelectedReqId] = useState<string | undefined>(undefined);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState<boolean>(false);
  const [actionCreateData, setActionCreateData] = useState<Partial<RemediationAction> | null>(null);

  const loadAllData = async () => {
    try {
      const [
        statsData,
        docsData,
        reqsData,
        actionsData,
        auditData,
        taxonomyData,
        exceptionsData
      ] = await Promise.all([
        api.getStats(),
        api.getDocuments(),
        api.getRequirements(),
        api.getActions(),
        api.getAuditEvents(),
        api.getTaxonomy(),
        api.getExceptions()
      ]);

      setStats(statsData);
      setDocuments(docsData);
      setRequirements(reqsData);
      setActions(actionsData);
      setAuditEvents(auditData);
      setBusinessAreas(taxonomyData.businessAreas || []);
      setOwners(taxonomyData.owners || []);
      setExceptions(exceptionsData);
    } catch (err) {
      console.error('Error fetching RBI Intel data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleNavigate = (tab: ActiveTab, entityId?: string) => {
    setActiveTab(tab);
    if (tab === 'impact' && entityId) {
      setSelectedReqId(entityId);
    } else if (tab === 'intake' && entityId) {
      setSelectedDocId(entityId);
    }
  };

  const handleOpenDoc = (docId: string) => {
    setSelectedDocId(docId);
  };

  const handleCreateActionFromImpact = (actionData: any) => {
    setActionCreateData(actionData);
    setActiveTab('actions');
  };

  const activeDocObj = selectedDocId
    ? documents.find((d) => d.id === selectedDocId) || null
    : null;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exceptionCount={exceptions.length}
        openAdvisor={() => setIsAdvisorOpen(true)}
        institution={institution}
        setInstitution={setInstitution}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
            <p className="text-sm font-semibold text-slate-600">
              Loading RBI Regulatory Intelligence Engine...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                documents={documents}
                onNavigate={handleNavigate}
                onOpenDoc={handleOpenDoc}
              />
            )}

            {activeTab === 'exceptions' && (
              <ExceptionHubView
                exceptions={exceptions}
                onSelectException={(item) => handleNavigate(item.entity_type === 'action' ? 'actions' : item.entity_type === 'requirement' ? 'impact' : 'intake', item.entity_id)}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'intake' && (
              <IntakeView
                documents={documents}
                onOpenDoc={handleOpenDoc}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'intelligence' && (
              <IntelligenceView
                requirements={requirements}
                documents={documents}
                onNavigateToImpact={(reqId) => handleNavigate('impact', reqId)}
              />
            )}

            {activeTab === 'impact' && (
              <ImpactAssessmentView
                requirements={requirements}
                businessAreas={businessAreas}
                owners={owners}
                selectedReqId={selectedReqId}
                onRefresh={loadAllData}
                onCreateAction={handleCreateActionFromImpact}
              />
            )}

            {activeTab === 'actions' && (
              <ActionManagementView
                actions={actions}
                owners={owners}
                onRefresh={loadAllData}
                initialCreateData={actionCreateData}
                onClearInitialCreate={() => setActionCreateData(null)}
              />
            )}

            {activeTab === 'audit' && (
              <AuditTrailView
                auditEvents={auditEvents}
                documents={documents}
                requirements={requirements}
                actions={actions}
              />
            )}
          </>
        )}
      </main>

      {/* Floating AI Compliance Advisor Modal */}
      <AIAdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
        institution={institution}
      />

      {/* Document Detail Drilldown Modal */}
      <DocumentDetailModal
        document={activeDocObj}
        requirements={requirements}
        onClose={() => setSelectedDocId(null)}
        onNavigateToImpact={(reqId) => {
          setSelectedDocId(null);
          handleNavigate('impact', reqId);
        }}
      />
    </div>
  );
}
