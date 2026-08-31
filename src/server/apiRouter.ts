import { Router } from 'express';
import { dataStore } from './dataStore';
import { analyzeDocumentWithGemini, generateRemediationPlan, complianceAdvisorChat } from './geminiService';
import { RBIClause, RBIRequirement, ReqMapping } from '../types';

export const apiRouter = Router();

// Current active session user
const DEFAULT_USER = {
  email: 'compliance.officer@bank.com',
  name: 'Rajesh Sharma (Compliance Officer)'
};

// 1. Documents API
apiRouter.get('/documents', (req, res) => {
  try {
    const { status, department, search } = req.query as Record<string, string>;
    const docs = dataStore.getDocuments({ status, department, search });
    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.get('/documents/:id', (req, res) => {
  try {
    const { id } = req.params;
    const docData = dataStore.getDocumentById(id);
    if (!docData.document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, data: docData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/documents', (req, res) => {
  try {
    const newDoc = dataStore.createDocument(req.body);
    res.status(201).json({ success: true, data: newDoc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Ingest + Auto AI Extraction
apiRouter.post('/documents/ingest-with-ai', async (req, res) => {
  try {
    const { title, rawText, refNo, docType, department, sourceUrl } = req.body;
    if (!title || !rawText) {
      return res.status(400).json({ success: false, error: 'Title and raw text are required.' });
    }

    // 1. Run Gemini extraction
    const aiAnalysis = await analyzeDocumentWithGemini(title, rawText);

    // 2. Create document record
    const docId = `rbi:doc:${Date.now().toString(36)}`;
    const createdDoc = dataStore.createDocument({
      id: docId,
      title,
      doc_type: docType || 'Circular',
      department: aiAnalysis.department || department || 'Department of Regulation (DoR)',
      primary_topic: aiAnalysis.primary_topic || 'Regulatory Compliance',
      effective_date: aiAnalysis.effective_date,
      ref_no: refNo || `RBI/2026-27/${Math.floor(200 + Math.random() * 700)}`,
      source_url: sourceUrl || 'https://rbi.org.in',
      raw_body_preview: aiAnalysis.summary || rawText.slice(0, 300)
    });

    // 3. Create clauses & requirements from AI extraction
    const createdRequirements: any[] = [];
    aiAnalysis.clauses.forEach((c, idx) => {
      const clauseId = `${docId}#CLAUSE-${idx + 1}`;
      const clause: RBIClause = {
        id: clauseId,
        doc_id: docId,
        clause_label: c.clause_label || `Clause ${idx + 1}`,
        chapter: 'Extracted Clauses',
        seq: idx + 1,
        text: c.requirement,
        needs_review: false
      };
      dataStore.clauses.set(clauseId, clause);

      const reqId = `req:${docId.replace('rbi:', '')}:${(idx + 1).toString().padStart(2, '0')}`;
      const requirement: RBIRequirement = {
        id: reqId,
        clause_id: clauseId,
        doc_id: docId,
        doc_title: createdDoc.title,
        clause_label: clause.clause_label,
        clause_title: c.clause_title,
        requirement: c.requirement,
        obligation_type: c.obligation_type || 'Process',
        applicability: c.applicability || 'Commercial Banks',
        branch_relevance: c.branch_relevance || 'Medium',
        timeline: c.timeline,
        keywords: c.keywords || ['rbi compliance'],
        extracted_at: new Date().toISOString(),
        model: 'gemini-2.5-flash',
        needs_review: false
      };
      dataStore.requirements.set(reqId, requirement);

      // Create initial seeded mapping
      const mapping: ReqMapping = {
        req_id: reqId,
        business_area: 'BA-01',
        business_area_name: c.suggested_business_area || 'KYC Governance & Policy',
        policy: c.suggested_policy || 'Internal Operating Policy (POL-OPS-01)',
        process: 'Standard Bank Operating Process (PRC-01)',
        control: c.suggested_control || 'Automated Compliance Control Gate (CTL-01)',
        control_type: c.suggested_control_type || 'Preventive',
        owner_process: 'OWN-13',
        owner_process_name: 'Head — Digital Banking & Technology',
        owner_process_line: 'First line',
        owner_control: 'OWN-08',
        owner_control_name: 'Chief Compliance Officer',
        owner_control_line: 'Second line',
        products_impacted: ['Core Banking', 'Digital Channels'],
        tech_systems_impacted: ['Core Banking CBS', 'Risk Portal'],
        evidence_required: 'Board/Committee approval notes, system parameter screenshots, and process verification logs.',
        classification: c.initial_classification || 'To Be Confirmed',
        finding: c.initial_finding || 'AI Initial Assessment: Awaiting compliance team review.',
        recommendation: c.initial_recommendation || 'Review operational controls and assign remediation owner.',
        severity: c.severity || 'Medium',
        provenance: 'seeded',
        created_at: new Date().toISOString()
      };
      dataStore.mappings.set(reqId, mapping);

      createdRequirements.push({ ...requirement, mapping });
    });

    dataStore.logAudit({
      user_email: 'gemini-ai@rbi-intel.bank',
      user_name: 'Gemini Regulatory AI',
      event_type: 'AI_ANALYSIS_COMPLETED',
      entity_type: 'DOCUMENT',
      entity_id: docId,
      entity_title: createdDoc.title,
      details: `Extracted ${aiAnalysis.clauses.length} actionable requirements and generated baseline impact assessments.`
    });

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
    const { doc_id, classification, obligation_type, business_area, search } = req.query as Record<string, string>;
    const reqs = dataStore.getRequirements({ doc_id, classification, obligation_type, business_area, search });
    res.json({ success: true, data: reqs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/requirements/:id/assessment', (req, res) => {
  try {
    const { id } = req.params;
    const updated = dataStore.updateMapping(id, req.body, DEFAULT_USER);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Actions & Evidence API
apiRouter.get('/actions', (req, res) => {
  try {
    const { status, priority, owner, search } = req.query as Record<string, string>;
    const actions = dataStore.getActions({ status, priority, owner, search });
    res.json({ success: true, data: actions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/actions', (req, res) => {
  try {
    const newAction = dataStore.createAction(req.body, DEFAULT_USER);
    res.status(201).json({ success: true, data: newAction });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/actions/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updated = dataStore.updateAction(id, req.body, DEFAULT_USER);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/actions/:id/evidence', (req, res) => {
  try {
    const { id } = req.params;
    const evidence = dataStore.addEvidenceToAction(id, req.body, DEFAULT_USER);
    res.status(201).json({ success: true, data: evidence });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.put('/actions/:id/evidence/:evidenceId/verify', (req, res) => {
  try {
    const { id, evidenceId } = req.params;
    const { status, notes } = req.body;
    const verified = dataStore.verifyEvidence(id, evidenceId, { status, notes }, DEFAULT_USER);
    res.json({ success: true, data: verified });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Exception Feed API
apiRouter.get('/exceptions', (req, res) => {
  try {
    const exceptions = dataStore.getExceptions();
    res.json({ success: true, data: exceptions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Dashboard & Analytics API
apiRouter.get('/dashboard/stats', (req, res) => {
  try {
    const stats = dataStore.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Audit Trail API
apiRouter.get('/audit-trail', (req, res) => {
  try {
    const { entity_type, user, search } = req.query as Record<string, string>;
    const logs = dataStore.getAuditTrail({ entity_type, user, search });
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Reference Taxonomies API
apiRouter.get('/metadata/taxonomies', (req, res) => {
  res.json({
    success: true,
    data: {
      business_areas: dataStore.businessAreas,
      owners: dataStore.owners
    }
  });
});

// 8. Gemini AI Services
apiRouter.post('/ai/analyze-raw', async (req, res) => {
  try {
    const { title, text } = req.body;
    const result = await analyzeDocumentWithGemini(title || 'RBI Circular', text || '');
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/ai/generate-action-plan', async (req, res) => {
  try {
    const { requirement, finding, severity } = req.body;
    const plan = await generateRemediationPlan(requirement, finding, severity || 'High');
    res.json({ success: true, data: plan });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/ai/chat-advisor', async (req, res) => {
  try {
    const { query } = req.body;
    const stats = dataStore.getDashboardStats();
    const context = `Total active directions: ${stats.total_active_directions}, Requirements: ${stats.total_requirements}, Open Gaps: ${stats.total_open_gaps} (Critical: ${stats.gaps_by_severity.critical}, High: ${stats.gaps_by_severity.high}). Overdue Actions: ${stats.actions_breakdown.overdue}.`;
    const reply = await complianceAdvisorChat(query, context);
    res.json({ success: true, data: { response: reply } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
