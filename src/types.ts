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

export interface RBIDocument {
  id: string;
  regulator: string;
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

export interface RBIClause {
  id: string;
  doc_id: string;
  clause_label: string;
  chapter?: string;
  seq: number;
  text: string;
  needs_review: boolean;
}

export interface RBIRequirement {
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
  needs_review: boolean;
  mapping?: ReqMapping;
}

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
}

export interface OwnerRole {
  id: string;
  role: string;
  line: LineOfDefense;
}

export interface EvidenceItem {
  id: string;
  action_id: string;
  title: string;
  file_name?: string;
  file_type?: string;
  file_size?: string;
  file_url?: string;
  uploaded_by: string;
  uploaded_at: string;
  verification_status: 'Pending' | 'Verified' | 'Rejected';
  verified_by?: string;
  verified_at?: string;
  notes?: string;
  hash_checksum?: string;
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
  owner_line?: LineOfDefense;
  approver_id: string;
  approver_name: string;
  due_date: string;
  priority: ActionPriority;
  status: ActionStatus;
  progress_pct: number;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  closed_by?: string;
  evidence_items: EvidenceItem[];
  remediation_notes?: string;
  is_overdue?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user_email: string;
  user_name: string;
  event_type:
    | 'DOCUMENT_INGESTED'
    | 'AI_ANALYSIS_COMPLETED'
    | 'TRIAGE_OVERRIDE'
    | 'ASSESSMENT_UPDATED'
    | 'PROVENANCE_UPGRADED'
    | 'ACTION_CREATED'
    | 'ACTION_STATUS_CHANGED'
    | 'EVIDENCE_UPLOADED'
    | 'EVIDENCE_VERIFIED'
    | 'GAP_CLOSED'
    | 'AUDIT_PACK_EXPORTED';
  entity_type: 'DOCUMENT' | 'REQUIREMENT' | 'MAPPING' | 'ACTION' | 'EVIDENCE' | 'REPORT';
  entity_id: string;
  entity_title?: string;
  details: string;
  diff?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export interface ExceptionItem {
  id: string;
  type: 'NEW_REGULATION' | 'HIGH_IMPACT' | 'OVERDUE_ACTION' | 'FAILED_VALIDATION' | 'UNRESOLVED_GAP';
  title: string;
  subtitle: string;
  severity: SeverityLevel;
  due_date?: string;
  days_overdue?: number;
  entity_id: string;
  entity_type: 'document' | 'requirement' | 'action';
  department?: string;
  owner?: string;
  suggested_action: string;
}

export interface DashboardStats {
  regulatory_exposure_index: number; // 0 - 100
  exposure_status: 'Low' | 'Moderate' | 'Elevated' | 'High';
  total_active_directions: number;
  total_requirements: number;
  compliance_breakdown: {
    compliant: number;
    partially_compliant: number;
    gap: number;
    to_be_confirmed: number;
    not_applicable: number;
  };
  total_actions: number;
  actions_breakdown: {
    draft: number;
    assigned: number;
    in_progress: number;
    under_review: number;
    approved: number;
    closed: number;
    overdue: number;
  };
  total_open_gaps: number;
  gaps_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  gaps_by_business_area: {
    area_id: string;
    area_name: string;
    gap_count: number;
  }[];
  lines_of_defense_distribution: {
    line: string;
    requirement_count: number;
    action_count: number;
    gap_count: number;
  }[];
  upcoming_effective_dates: {
    doc_id: string;
    doc_title: string;
    effective_date: string;
    days_remaining: number;
    department: string;
    impact_level: SeverityLevel;
  }[];
  recent_exceptions_count: number;
}
