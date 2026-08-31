import {
  RegulatoryDocument,
  RegulatoryClause,
  RegulatoryRequirement,
  ReqMapping,
  RemediationAction,
  EvidenceItem,
  AuditEvent,
  ExceptionItem,
  DashboardStats,
  BusinessArea,
  OwnerRole,
  RegulatoryRegime,
} from '../types';

export const api = {
  async getDocuments(params?: { regulator?: RegulatoryRegime; status?: string; department?: string; search?: string }): Promise<RegulatoryDocument[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/documents?${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getDocumentById(id: string): Promise<{
    document: RegulatoryDocument;
    clauses: RegulatoryClause[];
    requirements: (RegulatoryRequirement & { mapping?: ReqMapping })[];
    actions: RemediationAction[];
  }> {
    const res = await fetch(`/api/documents/${encodeURIComponent(id)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async ingestDocumentWithAI(data: {
    title: string;
    rawText: string;
    refNo?: string;
    docType?: string;
    department?: string;
    sourceUrl?: string;
    regulator?: RegulatoryRegime;
  }): Promise<{
    document: RegulatoryDocument;
    summary: string;
    requirements: (RegulatoryRequirement & { mapping?: ReqMapping })[];
  }> {
    const res = await fetch('/api/documents/ingest-with-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getRequirements(params?: {
    regulator?: RegulatoryRegime;
    doc_id?: string;
    classification?: string;
    obligation_type?: string;
    business_area?: string;
    search?: string;
  }): Promise<(RegulatoryRequirement & { mapping?: ReqMapping })[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/requirements?${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async updateAssessment(reqId: string, mappingUpdate: Partial<ReqMapping>): Promise<ReqMapping> {
    const res = await fetch(`/api/requirements/${encodeURIComponent(reqId)}/assessment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mappingUpdate),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getActions(params?: { regulator?: RegulatoryRegime; status?: string; priority?: string; owner?: string; search?: string }): Promise<RemediationAction[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/actions?${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async createAction(action: Partial<RemediationAction>): Promise<RemediationAction> {
    const res = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async updateAction(id: string, updates: Partial<RemediationAction>): Promise<RemediationAction> {
    const res = await fetch(`/api/actions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async uploadEvidence(actionId: string, evidence: Partial<EvidenceItem>): Promise<EvidenceItem> {
    const res = await fetch(`/api/actions/${encodeURIComponent(actionId)}/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidence),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async verifyEvidence(actionId: string, evidenceId: string, verification: { status: 'Verified' | 'Rejected'; notes?: string }): Promise<EvidenceItem> {
    const res = await fetch(`/api/actions/${encodeURIComponent(actionId)}/evidence/${encodeURIComponent(evidenceId)}/verify`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verification),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getExceptions(params?: { regulator?: RegulatoryRegime }): Promise<ExceptionItem[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/exceptions?${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getDashboardStats(params?: { regulator?: RegulatoryRegime }): Promise<DashboardStats> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/dashboard/stats?${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getStats(params?: { regulator?: RegulatoryRegime }): Promise<DashboardStats> {
    return this.getDashboardStats(params);
  },

  async getAuditTrail(params?: { regulator?: RegulatoryRegime; entity_type?: string; user?: string; search?: string }): Promise<AuditEvent[]> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/audit-trail?${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getAuditEvents(params?: { regulator?: RegulatoryRegime; entity_type?: string; user?: string; search?: string }): Promise<AuditEvent[]> {
    return this.getAuditTrail(params);
  },

  async getTaxonomies(params?: { regulator?: RegulatoryRegime }): Promise<{ business_areas: BusinessArea[]; owners: OwnerRole[] }> {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/metadata/taxonomies?${query}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async getTaxonomy(params?: { regulator?: RegulatoryRegime }): Promise<{ businessAreas: BusinessArea[]; owners: OwnerRole[] }> {
    const data = await this.getTaxonomies(params);
    return {
      businessAreas: data.business_areas,
      owners: data.owners
    };
  },

  async generateActionPlanAI(params: { requirement: string; finding: string; severity?: string; regulator?: RegulatoryRegime }) {
    const res = await fetch('/api/ai/generate-action-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  },

  async askComplianceAdvisor(query: string, regulator: RegulatoryRegime = 'SAMA'): Promise<string> {
    const res = await fetch('/api/ai/chat-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, regulator }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data.response;
  },

  async askAIAdvisor(params: { query: string; history?: any[]; institution?: string; regulator?: RegulatoryRegime }): Promise<{ response: string }> {
    const res = await fetch('/api/ai/chat-advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data;
  }
};
