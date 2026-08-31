import { Router } from 'express';
import { regulatoryDataStore } from './dataStore';
import { analyzeDocumentWithGemini, generateRemediationPlan, complianceAdvisorChat } from './geminiService';
import { RegulatoryClause, RegulatoryRequirement, ReqMapping, RegulatoryRegime } from '../types';

export const apiRouter = Router();

// Current active session user
const DEFAULT_USER = {
  email: 'compliance.officer@bank.portal',
  name: 'Chief Compliance Officer'
};

// 1. Documents API
apiRouter.get('/documents', (req, res) => {
  try {
    const { regulator, status, department, search } = req.query as Record<string, string>;
    const regime = (regulator as RegulatoryRegime) || undefined;
    const docs = regulatoryDataStore.getDocuments(regime, { status, department, search });
    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const docData = regulatoryDataStore.getDocumentById(id);
    if (!docData || !docData.document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: docData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/documents', (req, res) => {
  try {
    const newDoc = regulatoryDataStore.addDocument(req.body);
    res.status(201).json({ success: true, data: newDoc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/documents/:id/triage', (req, res) => {
  try {
    const { id } = req.params;
    const { override, reason } = req.body;
    const updated = regulatoryDataStore.updateDocumentApplicability(id, override, reason, DEFAULT_USER.email);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ingest + Auto AI Extraction for SAMA or RBI
apiRouter.post('/documents/ingest-with-ai', async (req, res) => {
  try {
    const { title, rawText, refNo, docType, department, sourceUrl, regulator } = req.body;
    if (!title || !rawText) {
      return res.status(400).json({ success: false, error: 'Title and raw text are required.' });
    }

    const regime: RegulatoryRegime = regulator === 'RBI' ? 'RBI' : 'SAMA';
    const isRBI = regime === 'RBI';

    // 1. Run Gemini extraction
    const aiAnalysis = await analyzeDocumentWithGemini(title, rawText, regime);

    // 2. Create document record
    const prefix = isRBI ? 'rbi' : 'sama';
    const docId = `${prefix}:doc:${Date.now().toString(36)}`;
    const createdDoc = regulatoryDataStore.addDocument({
      id: docId,
      regulator: regime,
      title,
      date: new Date().toISOString().split('T')[0],
      doc_type: docType || (isRBI ? 'Master Direction' : 'Circular'),
      department: aiAnalysis.department || department || (isRBI ? 'Department of Regulation' : 'Banking Supervision Department'),
      primary_topic: aiAnalysis.primary_topic || 'Regulatory Compliance',
      effective_date: aiAnalysis.effective_date,
      ref_no: refNo || (isRBI ? `RBI/2026-27/${Math.floor(100 + Math.random() * 900)}` : `SAMA Circular No. ${Math.floor(40000000 + Math.random() * 9000000)}`),
      source_url: sourceUrl || (isRBI ? 'https://www.rbi.org.in' : 'https://rulebook.sama.gov.sa/en'),
      status: 'active',
      has_update: true,
      applicability: 'Applicable',
      indexed_at: new Date().toISOString(),
      raw_body_preview: aiAnalysis.summary || rawText.slice(0, 300)
    });

    // 3. Create clauses & requirements from AI extraction
    const createdRequirements: any[] = [];
    const clausesToInsert: RegulatoryClause[] = [];
    const reqsToInsert: RegulatoryRequirement[] = [];
    const mappingsToInsert: ReqMapping[] = [];

    aiAnalysis.clauses.forEach((c, idx) => {
      const clauseId = `${docId}#CLAUSE-${idx + 1}`;
      const clause: RegulatoryClause = {
        id: clauseId,
        doc_id: docId,
        clause_label: c.clause_label || (isRBI ? `Para ${idx + 1}` : `Clause ${idx + 1}`),
        chapter: 'Extracted Clauses',
        seq: idx + 1,
        text: c.requirement,
        needs_review: false
      };
      clausesToInsert.push(clause);

      const reqId = `req:${docId.replace(`${prefix}:`, '')}:${(idx + 1).toString().padStart(2, '0')}`;
      const requirement: RegulatoryRequirement = {
        id: reqId,
        clause_id: clauseId,
        doc_id: docId,
        doc_title: createdDoc.title,
        clause_label: clause.clause_label,
        clause_title: c.clause_title,
        requirement: c.requirement,
        obligation_type: c.obligation_type || 'Process',
        applicability: c.applicability || (isRBI ? 'All Scheduled Commercial Banks' : 'Commercial Banks in KSA'),
        branch_relevance: c.branch_relevance || 'Medium',
        timeline: c.timeline,
        keywords: c.keywords || [isRBI ? 'rbi direction' : 'sama rulebook', 'compliance'],
        extracted_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        needs_review: false
      };
      reqsToInsert.push(requirement);

      // Create initial seeded mapping
      const mapping: ReqMapping = {
        req_id: reqId,
        business_area: isRBI ? 'RBI-BA-01' : 'SAMA-BA-01',
        business_area_name: c.suggested_business_area || (isRBI ? 'IT Governance, Risk & Controls' : 'Corporate Governance & Board Oversight'),
        policy: c.suggested_policy || `${regime} Regulatory Governance Policy (POL-${regime}-01)`,
        process: 'Standard Bank Operating Process (PRC-01)',
        control: c.suggested_control || `Automated ${regime} Regulatory Control Gate (CTL-${regime}-01)`,
        control_type: c.suggested_control_type || 'Preventive',
        owner_process: isRBI ? 'RBI-OWN-06' : 'SAMA-OWN-05',
        owner_process_name: isRBI ? 'Head of Digital Banking & Payments' : 'Head of Digital Banking & Channels',
        owner_process_line: 'First line',
        owner_control: isRBI ? 'RBI-OWN-02' : 'SAMA-OWN-02',
        owner_control_name: 'Chief Compliance Officer (CCO)',
        owner_control_line: 'Second line',
        products_impacted: ['Core Banking', 'Digital Channels', 'Payment Rails'],
        tech_systems_impacted: ['Core Banking CBS', 'Risk Portal'],
        evidence_required: 'Board/Committee approval notes, system configuration change logs, and 2nd line compliance signoff certificates.',
        classification: c.initial_classification || 'To Be Confirmed',
        finding: c.initial_finding || 'AI Initial Assessment: Awaiting compliance team review.',
        recommendation: c.initial_recommendation || 'Review operational controls and assign remediation owner.',
        severity: c.severity || 'Medium',
        provenance: 'seeded',
        created_at: new Date().toISOString()
      };
      mappingsToInsert.push(mapping);

      createdRequirements.push({ ...requirement, mapping });
    });

    regulatoryDataStore.bulkCreateParsedClauses(docId, clausesToInsert, reqsToInsert, mappingsToInsert);

    res.status(201).json({
      success: true,
      data: {
        document: createdDoc,
        summary: aiAnalysis.summary,
        requirements: createdRequirements
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Requirements & Impact Mappings API
apiRouter.get('/requirements', (req, res) => {
  try {
    const { regulator, doc_id, classification, obligation_type, business_area, search } = req.query as Record<string, string>;
    const regime = (regulator as RegulatoryRegime) || undefined;
    const reqs = regulatoryDataStore.getRequirements(regime, { doc_id, classification, obligation_type, business_area, search });
    res.json({ success: true, data: reqs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/requirements/:id/assessment', (req, res) => {
  try {
    const { id } = req.params;
    const updated = regulatoryDataStore.updateRequirementMapping(id, req.body, DEFAULT_USER.name);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Actions & Evidence API
apiRouter.get('/actions', (req, res) => {
  try {
    const { regulator, status, priority, owner, search } = req.query as Record<string, string>;
    const regime = (regulator as RegulatoryRegime) || undefined;
    const actions = regulatoryDataStore.getActions(regime, { status, priority, owner, search });
    res.json({ success: true, data: actions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/actions', (req, res) => {
  try {
    const actionId = req.body.id || `ACT-${Date.now().toString(36).toUpperCase()}`;
    const newAction = regulatoryDataStore.addAction({
      ...req.body,
      id: actionId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sla_status: 'On Track'
    });
    res.status(201).json({ success: true, data: newAction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/actions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = regulatoryDataStore.updateAction(id, req.body, DEFAULT_USER.name);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/actions/:id/evidence', (req, res) => {
  try {
    const { id } = req.params;
    const evidenceId = req.body.id || `EVD-${Date.now().toString(36)}`;
    const evidence = regulatoryDataStore.addEvidence(
      id,
      {
        ...req.body,
        id: evidenceId,
        action_id: id,
        uploaded_at: new Date().toISOString(),
        uploaded_by: req.body.uploaded_by || DEFAULT_USER.name,
        sha256_hash: req.body.sha256_hash || Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: req.body.status || 'Pending'
      },
      DEFAULT_USER.name
    );
    res.status(201).json({ success: true, data: evidence });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/actions/:id/evidence/:evidenceId/verify', (req, res) => {
  try {
    const { id, evidenceId } = req.params;
    const { status, notes } = req.body;
    const verified = regulatoryDataStore.verifyEvidence(id, evidenceId, {
      status,
      notes,
      verifier: DEFAULT_USER.name
    });
    res.json({ success: true, data: verified });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Exception Feed API
apiRouter.get('/exceptions', (req, res) => {
  try {
    const { regulator } = req.query as Record<string, string>;
    const regime = (regulator as RegulatoryRegime) || undefined;
    const exceptions = regulatoryDataStore.getExceptions(regime);
    res.json({ success: true, data: exceptions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Dashboard & Analytics API
apiRouter.get('/dashboard/stats', (req, res) => {
  try {
    const { regulator } = req.query as Record<string, string>;
    const regime: RegulatoryRegime = regulator === 'RBI' ? 'RBI' : 'SAMA';
    const stats = regulatoryDataStore.getDashboardStats(regime);
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Audit Trail API
apiRouter.get('/audit-trail', (req, res) => {
  try {
    const { regulator, entity_type, user, search } = req.query as Record<string, string>;
    const regime = (regulator as RegulatoryRegime) || undefined;
    const logs = regulatoryDataStore.getAuditTrail(regime, { entity_type, user, search });
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Reference Taxonomies API
apiRouter.get('/metadata/taxonomies', (req, res) => {
  try {
    const { regulator } = req.query as Record<string, string>;
    const regime = (regulator as RegulatoryRegime) || undefined;
    const taxonomies = regulatoryDataStore.getTaxonomies(regime);
    res.json({ success: true, data: taxonomies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Gemini AI Services
apiRouter.post('/ai/analyze-raw', async (req, res) => {
  try {
    const { title, text, regulator } = req.body;
    const regime: RegulatoryRegime = regulator === 'RBI' ? 'RBI' : 'SAMA';
    const result = await analyzeDocumentWithGemini(title || `${regime} Directive`, text || '', regime);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/ai/generate-action-plan', async (req, res) => {
  try {
    const { requirement, finding, severity, regulator } = req.body;
    const regime: RegulatoryRegime = regulator === 'RBI' ? 'RBI' : 'SAMA';
    const plan = await generateRemediationPlan(requirement, finding, severity || 'High', regime);
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/ai/chat-advisor', async (req, res) => {
  try {
    const { query, regulator } = req.body;
    const regime: RegulatoryRegime = regulator === 'RBI' ? 'RBI' : 'SAMA';
    const stats = regulatoryDataStore.getDashboardStats(regime);
    const context = `Active Regulatory Regime: ${regime}. Total Documents: ${stats.total_documents}, Obligations: ${stats.total_obligations}, Open Gaps: ${stats.gap_count}, Active Actions: ${stats.active_actions}, Overdue: ${stats.overdue_actions}, Overall Compliance: ${stats.compliance_percentage}%.`;
    const reply = await complianceAdvisorChat(query, context, regime);
    res.json({ success: true, data: { response: reply } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
