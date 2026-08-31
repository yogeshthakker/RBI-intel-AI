export type RegulatoryRegime = 'SAMA' | 'RBI';

export type DocumentStatus = 'active' | 'superseded' | 'repealed' | 'withdrawn' | 'amended';

export type ObligationType =
  | 'Governance'
  | 'Process'
  | 'Screening'
  | 'Assurance'
  | 'Timeline'
  | 'Reporting'
  | 'Capital'
  | 'Cybersecurity'
  | 'Prudential'
  | 'Disclosure';

export type BranchRelevance = 'High' | 'Medium' | 'Low' | 'N/A';

export type ComplianceClassification =
  | 'Compliant'
  | 'Partially Compliant'
  | 'Gap'
  | 'Not Applicable'
  | 'To Be Confirmed';

export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type ProvenanceType = 'seeded' | 'reviewed' | 'sourced';

export type ControlType = 'Preventive' | 'Detective' | 'Corrective';

export type ActionStatus =
  | 'Draft'
  | 'Assigned'
  | 'In Progress'
  | 'Under Review'
  | 'Approved'
  | 'Closed';

export type ActionPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type LineOfDefense = 'First line' | 'Second line' | 'Third line' | 'Board / Senior Management' | 'Governance';

export interface RegulatoryDocument {
  id: string;
  regulator: RegulatoryRegime;
  doc_type: string;
  title: string;
  date: string;
  effective_date?: string;
  department?: string;
  category?: string;
  institution_type?: string;
  primary_topic?: string;
  secondary_topics?: string[];
  ref_no?: string;
  source_url: string;
  pdf_url?: string;
  status: DocumentStatus;
  has_update: boolean;
  withdrawn_reason?: string;
  withdrawn_date?: string;
  applicability: string;
  applicability_override?: string;
  applicability_override_reason?: string;
  applicability_overridden_by?: string;
  applicability_overridden_at?: string;
  indexed_at: string;
  last_changed?: string;
  clauses_count?: number;
  requirements_count?: number;
  open_gaps_count?: number;
  total_actions_count?: number;
  raw_body_preview?: string;
}

export interface RegulatoryClause {
  id: string;
  doc_id: string;
  clause_label: string;
  chapter?: string;
  seq: number;
  text: string;
  needs_review?: boolean;
}

export interface RegulatoryRequirement {
  id: string;
  clause_id: string;
  doc_id: string;
  doc_title?: string;
  clause_label?: string;
  chapter?: string;
  clause_title?: string;
  requirement: string;
  obligation_type: ObligationType;
  applicability: string;
  branch_relevance: BranchRelevance;
  timeline?: string;
  keywords: string[];
  extracted_at: string;
  model?: string;
  needs_review?: boolean;
  mapping?: ReqMapping;
}

// Aliases for compatibility
export type SAMADocument = RegulatoryDocument;
export type SAMAClause = RegulatoryClause;
export type SAMARequirement = RegulatoryRequirement;

export type RBIDocument = RegulatoryDocument;
export type RBIClause = RegulatoryClause;
export type RBIRequirement = RegulatoryRequirement;

export interface ReqMapping {
  req_id: string;
  business_area: string;
  business_area_name?: string;
  business_area_guess?: string;
  policy: string;
  process: string;
  control: string;
  control_type: ControlType;
  owner_process: string;
  owner_process_name?: string;
  owner_process_line?: LineOfDefense;
  owner_control: string;
  owner_control_name?: string;
  owner_control_line?: LineOfDefense;
  products_impacted?: string[];
  tech_systems_impacted?: string[];
  evidence_required: string;
  classification: ComplianceClassification;
  finding: string;
  recommendation: string;
  severity: SeverityLevel;
  provenance: ProvenanceType;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  actions_count?: number;
}

export interface BusinessArea {
  id: string;
  name: string;
  description: string;
  code?: string;
  regulator?: RegulatoryRegime;
}

export interface OwnerRole {
  id: string;
  role_title?: string;
  name?: string;
  line_of_defense?: LineOfDefense;
  line?: LineOfDefense;
  department: string;
  default_assignee_name?: string;
  regulator?: RegulatoryRegime;
}

export interface RemediationAction {
  id: string;
  req_id: string;
  doc_id?: string;
  doc_title?: string;
  clause_label?: string;
  requirement_summary?: string;
  title: string;
  description: string;
  owner_id: string;
  owner_name: string;
  approver_id: string;
  approver_name: string;
  status: ActionStatus;
  priority: ActionPriority;
  due_date: string;
  target_quarter?: string;
  sla_status?: 'On Track' | 'At Risk' | 'Overdue';
  is_overdue?: boolean;
  progress_pct?: number;
  created_at: string;
  updated_at: string;
  evidence_items?: EvidenceItem[];
  milestones?: { title: string; completed: boolean; target_date?: string }[];
  closure_notes?: string;
  closed_at?: string;
  closed_by?: string;
  regulator?: RegulatoryRegime;
}

export interface EvidenceItem {
  id: string;
  action_id: string;
  title?: string;
  file_name: string;
  file_type: string;
  file_size?: number | string;
  uploaded_at?: string;
  uploaded_by?: string;
  sha256_hash?: string;
  status?: 'Pending' | 'Verified' | 'Rejected';
  verification_status?: 'Pending' | 'Verified' | 'Rejected';
  verification_notes?: string;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  storage_path?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user_email: string;
  user_name: string;
  user_role?: string;
  event_type:
    | 'DOCUMENT_INGESTED'
    | 'AI_ANALYSIS_COMPLETED'
    | 'TRIAGE_OVERRIDDEN'
    | 'ASSESSMENT_UPDATED'
    | 'ACTION_CREATED'
    | 'ACTION_STATUS_CHANGED'
    | 'EVIDENCE_UPLOADED'
    | 'EVIDENCE_VERIFIED'
    | 'REGIME_SWITCHED'
    | string;
  entity_type: 'document' | 'requirement' | 'action' | 'evidence' | 'system' | string;
  entity_id: string;
  entity_title?: string;
  details: string;
  metadata?: Record<string, any>;
  regulator?: RegulatoryRegime;
}

export interface ExceptionItem {
  id: string;
  type:
    | 'CRITICAL_GAP'
    | 'OVERDUE_ACTION'
    | 'NEW_REGULATION'
    | 'PENDING_REVIEW'
    | 'UNMAPPED_REQUIREMENT'
    | 'UNRESOLVED_GAP'
    | 'FAILED_VALIDATION';
  title: string;
  subtitle?: string;
  description: string;
  suggested_action?: string;
  severity: SeverityLevel;
  entity_id: string;
  entity_type: 'document' | 'requirement' | 'action';
  created_at: string;
  regulator?: RegulatoryRegime;
}

export interface DashboardStats {
  total_documents: number;
  total_obligations: number;
  compliant_count: number;
  partially_compliant_count: number;
  gap_count: number;
  to_be_confirmed_count: number;
  compliance_percentage: number;
  active_actions: number;
  overdue_actions: number;
  evidence_verified_count: number;
  exceptions_count: number;
  active_regime: RegulatoryRegime;
  documents_by_topic: { topic: string; count: number }[];
  obligations_by_type: { type: string; count: number }[];
  obligations_by_business_area: { area: string; count: number; gaps: number }[];
  severity_distribution: { severity: string; count: number }[];
}
