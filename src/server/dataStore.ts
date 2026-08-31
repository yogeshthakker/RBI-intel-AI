import {
  RBIDocument,
  RBIClause,
  RBIRequirement,
  ReqMapping,
  BusinessArea,
  OwnerRole,
  RemediationAction,
  EvidenceItem,
  AuditEvent,
  ExceptionItem,
  DashboardStats,
} from '../types';
import businessAreasSeed from '../data/seed/business_areas.json';
import ownersSeed from '../data/seed/owners.json';

// In-memory data store with rich pre-loaded RBI data
class RegulatoryDataStore {
  public businessAreas: BusinessArea[] = [];
  public owners: OwnerRole[] = [];
  public documents: Map<string, RBIDocument> = new Map();
  public clauses: Map<string, RBIClause> = new Map();
  public requirements: Map<string, RBIRequirement> = new Map();
  public mappings: Map<string, ReqMapping> = new Map();
  public actions: Map<string, RemediationAction> = new Map();
  public auditEvents: AuditEvent[] = [];

  constructor() {
    this.initializeSeedData();
  }

  private initializeSeedData() {
    // 1. Load Business Areas & Owners
    this.businessAreas = businessAreasSeed as BusinessArea[];
    this.owners = ownersSeed as OwnerRole[];

    // 2. Pre-seed authentic RBI Master Directions & Circulars
    const docs: RBIDocument[] = [
      {
        id: 'rbi:md:13643',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'Reserve Bank of India (Commercial Banks – Cybersecurity, Technology: Risk, Resilience and Assurance Framework) Directions, 2026',
        date: '2026-07-31',
        effective_date: '2026-10-01',
        department: 'Department of Supervision (DoS)',
        category: 'Commercial Banks',
        institution_type: 'Commercial Banks',
        primary_topic: 'Cybersecurity & IT Risk',
        secondary_topics: ['Technology Governance', 'Vendor Risk', 'Business Continuity', 'Incident Response'],
        ref_no: 'RBI/DoS/2026-27/410',
        source_url: 'https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13643',
        pdf_url: 'https://rbidocs.rbi.org.in/rdocs/notification/PDFs/CSITEG4102627.PDF',
        status: 'active',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2026-08-01T08:00:00Z',
        last_changed: '2026-08-20T14:30:00Z',
        raw_body_preview: 'Directions mandate comprehensive IT governance, CISO reporting directly to ED/CRO, Board IT Strategy Committee oversight, SOC 24x7 monitoring, teleworking controls, and vendor cloud resilience attestations.'
      },
      {
        id: 'rbi:md:13159',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'Reserve Bank of India (Commercial Banks – Credit Risk Management) Directions, 2025 (Updated as on July 01, 2026)',
        date: '2025-06-30',
        effective_date: '2026-07-01',
        department: 'Department of Regulation (DoR)',
        category: 'Commercial Banks',
        institution_type: 'Commercial Banks',
        primary_topic: 'Credit Risk Management',
        secondary_topics: ['Loan Underwriting', 'Large Exposures', 'Early Warning Signals (EWS)', 'Stressed Assets'],
        ref_no: 'RBI/DoR/2025-26/112',
        source_url: 'https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13159',
        status: 'amended',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2026-07-02T10:00:00Z',
        last_changed: '2026-07-01T09:00:00Z',
        raw_body_preview: 'Mandates single borrower exposure limits, group exposure frameworks, real-time integration with CRILC reporting, independent credit risk validation, and mandatory internal ratings migration review.'
      },
      {
        id: 'rbi:md:13640',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'Reserve Bank of India (Commercial Banks – Internal Audit Function & RBIA) Directions, 2026',
        date: '2026-06-15',
        effective_date: '2026-09-01',
        department: 'Department of Supervision (DoS)',
        category: 'Commercial Banks',
        institution_type: 'Commercial Banks',
        primary_topic: 'Internal Audit & Governance',
        secondary_topics: ['RBIA Methodology', 'Audit Independence', 'Staff Rotation', 'Annual Audit Plan'],
        ref_no: 'RBI/DoS/2026-27/218',
        source_url: 'https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=13640',
        status: 'active',
        has_update: false,
        applicability: 'Applicable',
        indexed_at: '2026-06-20T11:00:00Z',
        last_changed: '2026-06-15T11:00:00Z',
        raw_body_preview: 'Mandates Risk Based Internal Audit (RBIA), Board Audit Committee independence, minimum staff tenures in audit, exclusion of audit remuneration from business unit profit metrics, and continuous off-site monitoring.'
      },
      {
        id: 'rbi:cir:2026:54',
        regulator: 'RBI',
        doc_type: 'Circular',
        title: 'Master Direction – Know Your Customer (KYC) Direction, 2026 — Amendments to V-CIP & Beneficial Ownership Rules',
        date: '2026-08-14',
        effective_date: '2026-11-01',
        department: 'Department of Regulation (DoR)',
        category: 'Commercial Banks',
        institution_type: 'Commercial Banks',
        primary_topic: 'KYC & AML / CFT',
        secondary_topics: ['V-CIP Verification', 'Beneficial Ownership Threshold 10%', 'CKYCR Sync', 'Periodic Updation'],
        ref_no: 'RBI/DoR/2026-27/54',
        source_url: 'https://rbi.org.in/Scripts/NotificationUser.aspx?Id=14298',
        status: 'active',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2026-08-15T09:30:00Z',
        last_changed: '2026-08-14T09:30:00Z',
        raw_body_preview: 'Tightens beneficial ownership threshold to 10% for legal entities, mandates live geo-location geotagging and AI liveness check in Video KYC (V-CIP), and prescribes 30-day timeline for CKYCR registry sync.'
      },
      {
        id: 'rbi:md:10404',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'Reserve Bank of India (Establishment of Branch Office / Liaison Office / Project Office in India) Directions, 2026',
        date: '2026-05-10',
        effective_date: '2026-06-01',
        department: 'Foreign Exchange Department (FED)',
        category: 'Foreign Banks & Cross-Border Entities',
        institution_type: 'Foreign Banks',
        primary_topic: 'FEMA & Cross-Border Operations',
        secondary_topics: ['Liaison Office', 'Project Office', 'FCRA Declarations', 'AD Category-I Bank Approvals'],
        ref_no: 'RBI/FED/2026-27/18',
        source_url: 'https://rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=10404',
        status: 'active',
        has_update: false,
        applicability: 'Likely Applicable',
        indexed_at: '2026-05-15T12:00:00Z',
        last_changed: '2026-05-10T12:00:00Z',
        raw_body_preview: 'Governs approval mechanisms for foreign corporate branch offices, KYC documentation for foreign parents, embassy attestations, and annual activity certificate (AAC) compliance.'
      },
      {
        id: 'rbi:cir:2026:88',
        regulator: 'RBI',
        doc_type: 'Circular',
        title: 'Prudential Framework on Liquidity Coverage Ratio (LCR) & Run-off Factors for Internet & Mobile Banking Deposits',
        date: '2026-08-22',
        effective_date: '2027-01-01',
        department: 'Department of Regulation (DoR)',
        category: 'Commercial Banks',
        institution_type: 'Commercial Banks',
        primary_topic: 'Liquidity & ALM',
        secondary_topics: ['LCR Haircuts', 'Digital Run-Off Factor', 'HQLA Buffer', 'Stress Testing'],
        ref_no: 'RBI/DoR/2026-27/88',
        source_url: 'https://rbi.org.in/Scripts/NotificationUser.aspx?Id=14332',
        status: 'active',
        has_update: false,
        applicability: 'Applicable',
        indexed_at: '2026-08-23T06:00:00Z',
        last_changed: '2026-08-22T06:00:00Z',
        raw_body_preview: 'Introduces an additional 5% run-off factor for retail deposits enabled with Internet Banking and Mobile Banking (IMB) in LCR computations to address rapid withdrawal risk.'
      }
    ];

    docs.forEach(doc => this.documents.set(doc.id, doc));

    // 3. Pre-seed Clauses & Requirements
    const sampleClauses: RBIClause[] = [
      // Cybersecurity MD 13643
      {
        id: 'rbi:md:13643#CHI-A-2',
        doc_id: 'rbi:md:13643',
        clause_label: 'Clause 2 (Commencement)',
        chapter: 'Chapter I - Preliminary',
        seq: 1,
        text: 'The regulatory directions are applicable and enforceable from the date of issue with transition timelines specified in Annexure II.',
        needs_review: false
      },
      {
        id: 'rbi:md:13643#CHII-A-7',
        doc_id: 'rbi:md:13643',
        clause_label: 'Clause 7 (Board Governance)',
        chapter: 'Chapter II - Role of the Board',
        seq: 2,
        text: 'The Board of Directors is responsible for reviewing and authorizing the strategic frameworks and policies governing information technology, asset management, business continuity, and cybersecurity, including protocols for incident response and cyber crisis management at least annually.',
        needs_review: false
      },
      {
        id: 'rbi:md:13643#CHIII-E-15',
        doc_id: 'rbi:md:13643',
        clause_label: 'Clause 15 (CISO Reporting)',
        chapter: 'Chapter III - IT Governance',
        seq: 3,
        text: 'The Chief Information Security Officer (CISO) shall be a designated independent executive reporting directly to the Executive Director or Chief Risk Officer (CRO) and having direct access to the IT Strategy Committee of the Board.',
        needs_review: false
      },
      {
        id: 'rbi:md:13643#CHV-B-24',
        doc_id: 'rbi:md:13643',
        clause_label: 'Clause 24 (DLP & Data Protection)',
        chapter: 'Chapter V - Baseline Cybersecurity',
        seq: 4,
        text: 'Banks must deploy comprehensive Data Leak Prevention (DLP) across endpoints, network perimeters, and email gateways, with automated blocking of unencrypted personally identifiable information (PII) and customer financial records.',
        needs_review: false
      },
      {
        id: 'rbi:md:13643#CHV-K-31',
        doc_id: 'rbi:md:13643',
        clause_label: 'Clause 31 (Vulnerability & Patch Mgmt)',
        chapter: 'Chapter V - Baseline Cybersecurity',
        seq: 5,
        text: 'Banks shall mandate remediation of critical cybersecurity vulnerabilities within 48 hours and high-severity vulnerabilities within 7 days of disclosure. Zero-day threats require immediate compensatory controls and incident notification to CSITE within 6 hours.',
        needs_review: false
      },
      {
        id: 'rbi:md:13643#CHV-N-38',
        doc_id: 'rbi:md:13643',
        clause_label: 'Clause 38 (Multi-Factor Authentication)',
        chapter: 'Chapter V - Baseline Cybersecurity',
        seq: 6,
        text: 'Mandatory Multi-Factor Authentication (MFA) or adaptive risk-based authentication for all privileged internal administrators, remote access teleworking channels, and digital customer fund transfers above INR 50,000.',
        needs_review: false
      },

      // Credit Risk MD 13159
      {
        id: 'rbi:md:13159#CHII-B-4',
        doc_id: 'rbi:md:13159',
        clause_label: 'Clause 4 (Credit Risk Policy)',
        chapter: 'Chapter II - Credit Risk Governance',
        seq: 1,
        text: 'Banks shall formulate a Board-approved Credit Risk Management Policy laying down prudential exposure ceilings for single borrowers, connected counterparties, sensitive sectors, and geographical concentrations.',
        needs_review: false
      },
      {
        id: 'rbi:md:13159#CHIII-D-12',
        doc_id: 'rbi:md:13159',
        clause_label: 'Clause 12 (Early Warning Signals - EWS)',
        chapter: 'Chapter III - Credit Underwriting & Monitoring',
        seq: 2,
        text: 'Banks must institute an automated Early Warning Signals (EWS) system integrated with Central Repository of Information on Large Credits (CRILC), Goods and Services Tax (GST) data feeds, and MCA registry to detect red flags in accounts with aggregate exposure of INR 5 Crore and above.',
        needs_review: false
      },
      {
        id: 'rbi:md:13159#CHIV-A-18',
        doc_id: 'rbi:md:13159',
        clause_label: 'Clause 18 (Independent Credit Validation)',
        chapter: 'Chapter IV - Credit Review & Risk Validation',
        seq: 3,
        text: 'The Credit Risk Department must conduct an independent risk assessment separate from business sanctioning teams for all corporate credit proposals exceeding INR 25 Crore prior to sanction.',
        needs_review: false
      },

      // RBIA MD 13640
      {
        id: 'rbi:md:13640#CHI-A-PRE',
        doc_id: 'rbi:md:13640',
        clause_label: 'Preamble (RBIA Adoption)',
        chapter: 'Chapter I - Preliminary',
        seq: 1,
        text: 'Banks are mandated to implement a Risk Based Internal Audit (RBIA) system that emphasizes the evaluation of risk management frameworks and internal controls, moving beyond purely transaction-focused audit.',
        needs_review: false
      },
      {
        id: 'rbi:md:13640#CHII-A-7',
        doc_id: 'rbi:md:13640',
        clause_label: 'Clause 7 (Audit Staff Tenure & Rotation)',
        chapter: 'Chapter II - Board & Management Oversight',
        seq: 2,
        text: 'The Board or Local Advisory Board must establish a minimum service duration for personnel within the internal audit department (at least 3 years), and establish structured temporary rotation into the audit function for subject matter specialists.',
        needs_review: false
      },
      {
        id: 'rbi:md:13640#CHIII-B-15',
        doc_id: 'rbi:md:13640',
        clause_label: 'Clause 15 (Audit Compensation Independence)',
        chapter: 'Chapter III - Audit Independence',
        seq: 3,
        text: 'Banks must ensure that the pay and variable bonuses of internal audit personnel are strictly independent of the financial performance or profit targets of the business areas they audit.',
        needs_review: false
      },

      // KYC Circular 2026:54
      {
        id: 'rbi:cir:2026:54#PARA-3',
        doc_id: 'rbi:cir:2026:54',
        clause_label: 'Paragraph 3 (Beneficial Ownership 10% Threshold)',
        chapter: 'Amendments to Master Direction on KYC',
        seq: 1,
        text: 'The threshold for identifying the Beneficial Owner (BO) of non-individual corporate clients is revised downwards from 25% (or 15% for partnerships) to a strict 10% ownership or voting right threshold.',
        needs_review: false
      },
      {
        id: 'rbi:cir:2026:54#PARA-7',
        doc_id: 'rbi:cir:2026:54',
        clause_label: 'Paragraph 7 (V-CIP Live Geotagging & AI Liveness)',
        chapter: 'Amendments to Master Direction on KYC',
        seq: 2,
        text: 'In Video Customer Identification Process (V-CIP), banks must verify live GPS latitude/longitude within Indian territory and incorporate automated facial biometric liveness detection to prevent deepfakes and spoofed media.',
        needs_review: false
      },

      // LCR Circular 2026:88
      {
        id: 'rbi:cir:2026:88#PARA-4',
        doc_id: 'rbi:cir:2026:88',
        clause_label: 'Paragraph 4 (Digital Deposit Run-Off Factor)',
        chapter: 'Liquidity Coverage Ratio Guidelines',
        seq: 1,
        text: 'Banks shall assign an additional 5% run-off factor on retail and small business deposits that are enabled for Internet and Mobile Banking (IMB), resulting in a 10% total expected run-off rate in 30-day stress scenarios.',
        needs_review: false
      }
    ];

    sampleClauses.forEach(cl => this.clauses.set(cl.id, cl));

    // 4. Pre-seed Parsed Requirements & AI Paraphrases
    const sampleReqs: RBIRequirement[] = [
      // Req 1: Cyber Board Policy
      {
        id: 'req:13643:01',
        clause_id: 'rbi:md:13643#CHII-A-7',
        doc_id: 'rbi:md:13643',
        doc_title: 'RBI Cybersecurity, Technology Risk & Assurance Directions, 2026',
        clause_label: 'Clause 7',
        chapter: 'Role of the Board',
        clause_title: 'Annual Board Review of Cybersecurity & Tech Policies',
        requirement: 'Bank Board must annually review and formally approve IT Strategy, Cybersecurity Policy, Cyber Crisis Management Plan (CCMP), and Business Continuity Plan (BCP) with documented minutes.',
        obligation_type: 'Governance',
        applicability: 'All Commercial Banks & Foreign Bank Branches',
        branch_relevance: 'Low',
        timeline: 'Annual board approval cycle (due before Oct 31 each fiscal year)',
        keywords: ['cybersecurity policy', 'board approval', 'ccmp', 'bcp', 'it strategy committee'],
        extracted_at: '2026-08-01T08:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 2: CISO Independence
      {
        id: 'req:13643:02',
        clause_id: 'rbi:md:13643#CHIII-E-15',
        doc_id: 'rbi:md:13643',
        doc_title: 'RBI Cybersecurity, Technology Risk & Assurance Directions, 2026',
        clause_label: 'Clause 15',
        chapter: 'IT Governance',
        clause_title: 'CISO Independent Reporting Line to CRO/ED',
        requirement: 'Appoint an independent CISO who reports hierarchically to the Executive Director or Chief Risk Officer, free from operational IT / DevOps responsibilities.',
        obligation_type: 'Governance',
        applicability: 'Commercial Banks',
        branch_relevance: 'Low',
        timeline: 'Immediate compliance upon direction issuance',
        keywords: ['ciso', 'reporting line', 'cro', 'executive director', 'segregation of duties'],
        extracted_at: '2026-08-01T08:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 3: DLP Enforcement
      {
        id: 'req:13643:03',
        clause_id: 'rbi:md:13643#CHV-B-24',
        doc_id: 'rbi:md:13643',
        doc_title: 'RBI Cybersecurity, Technology Risk & Assurance Directions, 2026',
        clause_label: 'Clause 24',
        chapter: 'Baseline Cybersecurity',
        clause_title: 'Data Leak Prevention (DLP) for PII and Financial Records',
        requirement: 'Implement automated DLP rules across endpoints, USB ports, web gateways, and emails to detect and block unencrypted PAN, Aadhaar, and account number exfiltration.',
        obligation_type: 'Cybersecurity',
        applicability: 'All Commercial Banks',
        branch_relevance: 'High',
        timeline: 'Full rollout across all branch terminals by Nov 30, 2026',
        keywords: ['dlp', 'data loss prevention', 'endpoint security', 'pii protection', 'usb blocking'],
        extracted_at: '2026-08-01T08:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 4: 48-Hour Critical Patching
      {
        id: 'req:13643:04',
        clause_id: 'rbi:md:13643#CHV-K-31',
        doc_id: 'rbi:md:13643',
        doc_title: 'RBI Cybersecurity, Technology Risk & Assurance Directions, 2026',
        clause_label: 'Clause 31',
        chapter: 'Baseline Cybersecurity',
        clause_title: 'Critical Vulnerability Patching SLA (48 Hours) & CSITE Reporting',
        requirement: 'Enforce mandatory patching of CVSS 9.0+ critical vulnerabilities on internet-facing assets within 48 hours; report cyber incidents to RBI CSITE within 6 hours.',
        obligation_type: 'Timeline',
        applicability: 'All Commercial Banks',
        branch_relevance: 'Low',
        timeline: '48h for Critical, 7 days for High, 6h CSITE notification',
        keywords: ['vulnerability management', 'patching sla', '48 hours', 'csite reporting', 'soc'],
        extracted_at: '2026-08-01T08:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 5: Credit Risk EWS
      {
        id: 'req:13159:01',
        clause_id: 'rbi:md:13159#CHIII-D-12',
        doc_id: 'rbi:md:13159',
        doc_title: 'RBI Commercial Banks – Credit Risk Management Directions, 2025',
        clause_label: 'Clause 12',
        chapter: 'Credit Underwriting & Monitoring',
        clause_title: 'Automated Early Warning Signals (EWS) for Large Exposures',
        requirement: 'Automate EWS alerts tracking 42 red flag indicators across CRILC defaults, GST return filing delays, bounced cheques, and rating downgrades for borrowers >= INR 5 Cr.',
        obligation_type: 'Process',
        applicability: 'Commercial Banks (excluding SFBs and PBs)',
        branch_relevance: 'Medium',
        timeline: 'Continuous real-time alert generation and monthly committee review',
        keywords: ['ews', 'early warning signals', 'crilc', 'gst data', 'red flags', 'credit monitoring'],
        extracted_at: '2026-07-02T10:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 6: Credit Independent Validation
      {
        id: 'req:13159:02',
        clause_id: 'rbi:md:13159#CHIV-A-18',
        doc_id: 'rbi:md:13159',
        doc_title: 'RBI Commercial Banks – Credit Risk Management Directions, 2025',
        clause_label: 'Clause 18',
        chapter: 'Credit Review & Risk Validation',
        clause_title: 'Independent 2nd Line Credit Risk Review for Exposures > 25 Cr',
        requirement: 'Credit proposals exceeding INR 25 Crore must have an independent risk vetting and score validation by Second Line Credit Risk team prior to Credit Committee approval.',
        obligation_type: 'Assurance',
        applicability: 'All Commercial Banks',
        branch_relevance: 'Low',
        timeline: 'Pre-sanction workflow gate',
        keywords: ['independent credit review', 'second line', 'sanction gate', 'large credit'],
        extracted_at: '2026-07-02T10:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 7: RBIA Audit Staff Tenure
      {
        id: 'req:13640:01',
        clause_id: 'rbi:md:13640#CHII-A-7',
        doc_id: 'rbi:md:13640',
        doc_title: 'RBI Commercial Banks – Internal Audit Function & RBIA Directions, 2026',
        clause_label: 'Clause 7',
        chapter: 'Board & Management Oversight',
        clause_title: 'Internal Audit Staff Minimum 3-Year Tenure Policy',
        requirement: 'Establish formal HR policy prescribing minimum 3-year tenure for internal audit professionals and cooling-off period of 2 years before auditing prior operational departments.',
        obligation_type: 'Governance',
        applicability: 'Commercial Banks',
        branch_relevance: 'Low',
        timeline: 'Incorporate in Annual HR Policy review by Sept 2026',
        keywords: ['internal audit', 'staff tenure', 'cooling off', 'audit independence', 'hr policy'],
        extracted_at: '2026-06-20T11:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 8: KYC Beneficial Ownership 10%
      {
        id: 'req:2026:54:01',
        clause_id: 'rbi:cir:2026:54#PARA-3',
        doc_id: 'rbi:cir:2026:54',
        doc_title: 'RBI KYC Direction 2026 – Beneficial Ownership Amendments',
        clause_label: 'Paragraph 3',
        chapter: 'KYC Amendments',
        clause_title: '10% Beneficial Ownership Identification Threshold',
        requirement: 'Update onboarding CDD systems to identify and verify natural persons holding 10% or more capital/profits in companies, LLPs, and trusts, and perform PEP screening.',
        obligation_type: 'Screening',
        applicability: 'All Regulated Entities',
        branch_relevance: 'High',
        timeline: 'System update by Oct 15, 2026; re-KYC remediation for existing portfolio by March 31, 2027',
        keywords: ['beneficial ownership', 'bo 10 percent', 'cdd', 'pep screening', 'kyc policy'],
        extracted_at: '2026-08-15T10:00:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 9: V-CIP Live Geotagging & AI Liveness
      {
        id: 'req:2026:54:02',
        clause_id: 'rbi:cir:2026:54#PARA-7',
        doc_id: 'rbi:cir:2026:54',
        doc_title: 'RBI KYC Direction 2026 – Video KYC (V-CIP) Technical Controls',
        clause_label: 'Paragraph 7',
        chapter: 'V-CIP Controls',
        clause_title: 'V-CIP Territory Geo-Fencing & AI Biometric Anti-Spoofing',
        requirement: 'Incorporate live GPS coordinate validation restricting V-CIP calls to India boundaries and implement ISO 30107-3 compliant active/passive facial liveness detection in video KYC apps.',
        obligation_type: 'Process',
        applicability: 'Banks offering digital/remote account opening',
        branch_relevance: 'High',
        timeline: 'Mandatory enforcement by Nov 01, 2026',
        keywords: ['v-cip', 'video kyc', 'geotagging', 'facial liveness', 'anti spoofing', 'deepfake'],
        extracted_at: '2026-08-15T10:00:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      },
      // Req 10: LCR Digital Run-Off Factor
      {
        id: 'req:2026:88:01',
        clause_id: 'rbi:cir:2026:88#PARA-4',
        doc_id: 'rbi:cir:2026:88',
        doc_title: 'RBI Liquidity Coverage Ratio (LCR) Digital Deposit Run-off Norms',
        clause_label: 'Paragraph 4',
        chapter: 'LCR Computations',
        clause_title: 'Additional 5% Run-Off Factor for Internet & Mobile Enabled Deposits',
        requirement: 'Recalculate 30-day net cash outflows by applying an additional 5% run-off factor (total 10%) on retail deposits connected to digital channels, maintaining additional High-Quality Liquid Assets (HQLA).',
        obligation_type: 'Prudential',
        applicability: 'All Commercial Banks',
        branch_relevance: 'Low',
        timeline: 'Effective from Jan 01, 2027; quarterly ALCO reporting',
        keywords: ['lcr', 'liquidity coverage ratio', 'run-off factor', 'hqla buffer', 'digital deposits', 'alco'],
        extracted_at: '2026-08-23T06:30:00Z',
        model: 'gemini-2.5-flash',
        needs_review: false
      }
    ];

    sampleReqs.forEach(req => this.requirements.set(req.id, req));

    // 5. Pre-seed Mappings (Impact Assessment & Gap Evaluations)
    const sampleMappings: ReqMapping[] = [
      {
        req_id: 'req:13643:01',
        business_area: 'BA-01',
        business_area_name: 'KYC Governance & Policy',
        policy: 'Information Security & Cybersecurity Policy 2026 (POL-IT-01)',
        process: 'Annual Board IT Strategy & Policy Governance Process (PRC-GOV-03)',
        control: 'Board IT Strategy Committee Annual Approval Gate (CTL-IT-001)',
        control_type: 'Preventive',
        owner_process: 'OWN-13',
        owner_process_name: 'Head — Digital Banking & Technology',
        owner_process_line: 'First line',
        owner_control: 'OWN-11',
        owner_control_name: 'Chief Risk Officer',
        owner_control_line: 'Second line',
        products_impacted: ['Core Banking', 'Internet Banking Portal', 'Mobile Banking App'],
        tech_systems_impacted: ['Board Portal', 'Policy Management System'],
        evidence_required: 'Board resolution copy, signed Cyber Crisis Management Plan (CCMP), and IT Strategy Committee minutes.',
        classification: 'Compliant',
        finding: 'Board approved the revised Cybersecurity Policy and CCMP in June 2026 meeting; annual schedule is institutionalized.',
        recommendation: 'Ensure annual re-tablement schedule is tracked in Board Secretariat calendar for Q2 2027.',
        severity: 'Low',
        provenance: 'reviewed',
        reviewed_by: 'compliance.officer@bank.com',
        reviewed_at: '2026-08-20T10:00:00Z',
        created_at: '2026-08-01T09:00:00Z'
      },
      {
        req_id: 'req:13643:02',
        business_area: 'BA-13',
        business_area_name: 'Cybersecurity & Tech Risk',
        policy: 'Enterprise Risk Management Policy (POL-RM-02)',
        process: 'CISO Independent Reporting & Governance Mechanism (PRC-SEC-01)',
        control: 'Direct Executive Line of Reporting to CRO (CTL-SEC-004)',
        control_type: 'Preventive',
        owner_process: 'OWN-13',
        owner_process_name: 'Head — Digital Banking & Technology',
        owner_process_line: 'First line',
        owner_control: 'OWN-11',
        owner_control_name: 'Chief Risk Officer',
        owner_control_line: 'Second line',
        products_impacted: ['All Bank Operations'],
        tech_systems_impacted: ['HRMS Org Structure'],
        evidence_required: 'HR Appointment Letter, Org Hierarchy Chart showing CISO reporting to CRO, and Board minutes.',
        classification: 'Compliant',
        finding: 'CISO reporting line was restructured to CRO in January 2026; CISO does not hold operational IT responsibilities.',
        recommendation: 'Maintain direct access of CISO to the Board IT Strategy Committee.',
        severity: 'Low',
        provenance: 'sourced',
        reviewed_by: 'cro@bank.com',
        reviewed_at: '2026-08-18T14:20:00Z',
        created_at: '2026-08-01T09:00:00Z'
      },
      {
        req_id: 'req:13643:03',
        business_area: 'BA-13',
        business_area_name: 'Cybersecurity & Tech Risk',
        policy: 'Data Classification and Protection Policy (POL-SEC-09)',
        process: 'Endpoint & Network Data Loss Prevention Operations (PRC-SEC-12)',
        control: 'Automated DLP Policy Blocking Unencrypted PII at Endpoints (CTL-SEC-042)',
        control_type: 'Preventive',
        owner_process: 'OWN-13',
        owner_process_name: 'Head — Digital Banking & Technology',
        owner_process_line: 'First line',
        owner_control: 'OWN-08',
        owner_control_name: 'Chief Compliance Officer',
        owner_control_line: 'Second line',
        products_impacted: ['Branch Terminals', 'Corporate Email', 'Internal File Shares'],
        tech_systems_impacted: ['Symantec DLP / Forcepoint', 'Microsoft 365 Purview', 'Endpoint Antivirus Agent'],
        evidence_required: 'DLP rule base export, quarterly DLP block incident reports, and branch terminal agent coverage report (100%).',
        classification: 'Partially Compliant',
        finding: 'Network and email DLP are active, but 18% of older branch teller workstations in regional hubs lack endpoint USB blocking agents.',
        recommendation: 'Roll out updated DLP endpoint agent patch across all 420 branch tellers by Nov 30, 2026 with central agent health monitoring.',
        severity: 'High',
        provenance: 'reviewed',
        reviewed_by: 'ciso@bank.com',
        reviewed_at: '2026-08-25T16:00:00Z',
        created_at: '2026-08-01T09:00:00Z'
      },
      {
        req_id: 'req:13643:04',
        business_area: 'BA-13',
        business_area_name: 'Cybersecurity & Tech Risk',
        policy: 'Vulnerability and Patch Management Policy (POL-SEC-05)',
        process: 'Emergency Vulnerability Remediation & CSITE Incident Reporting (PRC-SEC-07)',
        control: 'Automated 48-Hour Critical Patch SLA Tracking (CTL-SEC-018)',
        control_type: 'Corrective',
        owner_process: 'OWN-13',
        owner_process_name: 'Head — Digital Banking & Technology',
        owner_process_line: 'First line',
        owner_control: 'OWN-11',
        owner_control_name: 'Chief Risk Officer',
        owner_control_line: 'Second line',
        products_impacted: ['Internet Banking', 'Payment Gateways', 'API Gateways'],
        tech_systems_impacted: ['Qualys / Tenable VM', 'SOC SIEM', 'Jira Service Management'],
        evidence_required: 'Monthly Vulnerability Scan reports, SLA closure evidence (<48h), and RBI CSITE notification log.',
        classification: 'Partially Compliant',
        finding: 'Patching for internal servers meets SLA, but perimeter web applications took average 86 hours in Q2 due to vendor change freeze windows.',
        recommendation: 'Institute an expedited Emergency Change Advisory Board (eCAB) procedure with 24-hour fast-track vendor deployment SLA.',
        severity: 'High',
        provenance: 'reviewed',
        reviewed_by: 'ciso@bank.com',
        reviewed_at: '2026-08-26T11:00:00Z',
        created_at: '2026-08-01T09:00:00Z'
      },
      {
        req_id: 'req:13159:01',
        business_area: 'BA-14',
        business_area_name: 'Credit Monitoring & Stressed Assets',
        policy: 'Credit Risk and Early Warning System Policy (POL-CR-04)',
        process: 'Automated EWS Signal Extraction & Red Flag Alert Workflow (PRC-CR-08)',
        control: 'Automated Daily Batch Ingestion of CRILC & GST EWS Triggers (CTL-CR-021)',
        control_type: 'Detective',
        owner_process: 'OWN-14',
        owner_process_name: 'Head — Credit Monitoring',
        owner_process_line: 'First line',
        owner_control: 'OWN-19',
        owner_control_name: 'Head — Credit Risk',
        owner_control_line: 'Second line',
        products_impacted: ['Commercial Working Capital', 'Term Loans', 'Trade Credit'],
        tech_systems_impacted: ['Early Warning System (EWS Engine)', 'Loan Management System (LMS)', 'CRILC Integration API'],
        evidence_required: 'EWS system architecture document, sample red-flag escalation logs, and monthly Credit Monitoring Committee minutes.',
        classification: 'Gap',
        finding: 'EWS system currently integrates only CRILC data; real-time GST return filing delays and MCA charge creation triggers are not yet automated and rely on quarterly manual analyst reviews.',
        recommendation: 'Commission automated API integration with GSTN and MCA21 databases into the bank EWS engine for all accounts above INR 5 Crore.',
        severity: 'Critical',
        provenance: 'reviewed',
        reviewed_by: 'head.credit@bank.com',
        reviewed_at: '2026-08-22T09:30:00Z',
        created_at: '2026-07-02T11:00:00Z'
      },
      {
        req_id: 'req:13159:02',
        business_area: 'BA-19',
        business_area_name: 'Credit Risk & Capital Planning',
        policy: 'Credit Underwriting and Sanctioning Policy (POL-CR-01)',
        process: 'Second Line Independent Credit Risk Vetting (PRC-CR-02)',
        control: 'Independent Pre-Sanction Credit Risk Assessment Sign-off (CTL-CR-007)',
        control_type: 'Preventive',
        owner_process: 'OWN-14',
        owner_process_name: 'Head — Credit Monitoring',
        owner_process_line: 'First line',
        owner_control: 'OWN-19',
        owner_control_name: 'Head — Credit Risk',
        owner_control_line: 'Second line',
        products_impacted: ['Corporate Loans', 'Syndicated Facilities', 'Infrastructure Financing'],
        tech_systems_impacted: ['Loan Origination System (LOS)', 'Credit Rating Tool (RAM / Crisil)'],
        evidence_required: 'Credit Committee appraisal notes with attached independent 2nd line risk vetting sheets.',
        classification: 'Compliant',
        finding: 'All corporate credit proposals > INR 25 Cr have mandatory LOS workflow approval gate requiring Head of Credit Risk sign-off.',
        recommendation: 'Continue quarterly audit sampling of sanctioned corporate files.',
        severity: 'Low',
        provenance: 'sourced',
        reviewed_by: 'head.creditrisk@bank.com',
        reviewed_at: '2026-08-15T15:00:00Z',
        created_at: '2026-07-02T11:00:00Z'
      },
      {
        req_id: 'req:13640:01',
        business_area: 'BA-20',
        business_area_name: 'Internal Audit & Assurance',
        policy: 'Internal Audit Charter & HR Governance Policy (POL-AUD-01)',
        process: 'Audit Staffing, Tenure & Rotational Mobility Process (PRC-AUD-04)',
        control: 'Mandatory Minimum 3-Year Service Tenure in Internal Audit (CTL-AUD-009)',
        control_type: 'Preventive',
        owner_process: 'OWN-12',
        owner_process_name: 'Head — Internal Audit',
        owner_process_line: 'Third line',
        owner_control: 'OWN-16',
        owner_control_name: 'Company Secretary / Board Secretariat',
        owner_control_line: 'Governance',
        products_impacted: ['All Bank Functions'],
        tech_systems_impacted: ['HRMS Employee Lifecycle Module'],
        evidence_required: 'Audit Committee approved Audit Charter, HR transfer policy guidelines, and tenure audit report.',
        classification: 'Partially Compliant',
        finding: 'Audit Charter states 3-year tenure, but 3 senior IT auditors were transferred to technology DevOps role after only 14 months due to critical project staffing crunch.',
        recommendation: 'Enforce strict Board Audit Committee exception approval prior to premature transfer of internal audit personnel.',
        severity: 'Medium',
        provenance: 'reviewed',
        reviewed_by: 'head.audit@bank.com',
        reviewed_at: '2026-08-10T12:00:00Z',
        created_at: '2026-06-20T12:00:00Z'
      },
      {
        req_id: 'req:2026:54:01',
        business_area: 'BA-05',
        business_area_name: 'Beneficial Ownership & CDD',
        policy: 'KYC, AML & CFT Master Policy 2026 (POL-KYC-01)',
        process: 'Non-Individual Customer Onboarding & Beneficial Owner Due Diligence (PRC-KYC-05)',
        control: '10% BO Threshold Rule Engine & PEP Screening Verification (CTL-KYC-014)',
        control_type: 'Preventive',
        owner_process: 'OWN-02',
        owner_process_name: 'Branch Operations Manager',
        owner_process_line: 'First line',
        owner_control: 'OWN-06',
        owner_control_name: 'Principal Officer (AML)',
        owner_control_line: 'Second line',
        products_impacted: ['Current Accounts', 'Corporate Banking', 'Trade Finance', 'Escrow Accounts'],
        tech_systems_impacted: ['Finacle CBS', 'AML Onboarding Portal (Accuity / LexisNexis)'],
        evidence_required: 'Updated KYC policy document, CBS parameter configuration change log, and sample onboarding dossiers.',
        classification: 'Gap',
        finding: 'Current onboarding form and Finacle rule engine still capture BO at legacy 25% threshold for corporate clients; IT parameter change is pending release in Sprint 44 (Oct 10).',
        recommendation: 'Expedite CBS parameter update to 10% threshold by Oct 01, 2026, and issue branch operational advisory for interim manual checking.',
        severity: 'Critical',
        provenance: 'reviewed',
        reviewed_by: 'aml.officer@bank.com',
        reviewed_at: '2026-08-28T17:00:00Z',
        created_at: '2026-08-15T11:00:00Z'
      },
      {
        req_id: 'req:2026:54:02',
        business_area: 'BA-04',
        business_area_name: 'Digital & Remote Onboarding',
        policy: 'Digital Customer Onboarding & V-CIP Policy (POL-KYC-03)',
        process: 'V-CIP Video Session Execution & Biometric Liveness Verification (PRC-KYC-09)',
        control: 'Automated GPS Geo-boundary Check & ISO Liveness AI Filter (CTL-KYC-033)',
        control_type: 'Preventive',
        owner_process: 'OWN-13',
        owner_process_name: 'Head — Digital Banking & Technology',
        owner_process_line: 'First line',
        owner_control: 'OWN-09',
        owner_control_name: 'Head — AML & KYC Cell',
        owner_control_line: 'Second line',
        products_impacted: ['Savings Accounts', 'Credit Cards', 'Digital Personal Loans'],
        tech_systems_impacted: ['V-CIP Video KYC App (HyperVerge / IDfy)', 'API Gateway'],
        evidence_required: 'V-CIP vendor technical certification (ISO 30107-3), audit logs of rejected spoofed attempts, and geo-location validation reports.',
        classification: 'Partially Compliant',
        finding: 'AI Liveness detection is active, but geo-tagging currently relies on client IP address geolocation rather than device GPS coordinates.',
        recommendation: 'Enable mandatory browser/mobile native GPS coordinate permissions in V-CIP SDK to block VPN / spoofed overseas IP proxies.',
        severity: 'High',
        provenance: 'reviewed',
        reviewed_by: 'aml.officer@bank.com',
        reviewed_at: '2026-08-28T17:30:00Z',
        created_at: '2026-08-15T11:00:00Z'
      },
      {
        req_id: 'req:2026:88:01',
        business_area: 'BA-18',
        business_area_name: 'Treasury / ALM & Liquidity Risk',
        policy: 'Liquidity Risk Management & Asset Liability Management Policy (POL-TR-03)',
        process: 'Daily Liquidity Coverage Ratio (LCR) Computation & Outflow Stress Testing (PRC-TR-06)',
        control: '10% Run-Off Factor Model in Treasury ALM Engine for IMB Deposits (CTL-TR-017)',
        control_type: 'Detective',
        owner_process: 'OWN-18',
        owner_process_name: 'Head — Treasury / ALM',
        owner_process_line: 'First line',
        owner_control: 'OWN-11',
        owner_control_name: 'Chief Risk Officer',
        owner_control_line: 'Second line',
        products_impacted: ['Internet Retail Deposits', 'Mobile Savings Accounts'],
        tech_systems_impacted: ['OFSAA ALM / Calypso Treasury Suite', 'Finacle Core Banking'],
        evidence_required: 'ALCO meeting presentation, LCR model calibration document, and simulated HQLA buffer calculation sheet.',
        classification: 'To Be Confirmed',
        finding: 'Treasury team is modeling the balance sheet impact of additional 5% run-off factor on digital deposits; preliminary estimation indicates need for INR 380 Cr additional HQLA government securities buffer.',
        recommendation: 'Present finalized LCR simulation and capital/liquidity provisioning plan to Board Risk Management Committee in September meeting.',
        severity: 'High',
        provenance: 'seeded',
        reviewed_by: 'treasury.head@bank.com',
        reviewed_at: '2026-08-26T09:00:00Z',
        created_at: '2026-08-23T07:00:00Z'
      }
    ];

    sampleMappings.forEach(m => this.mappings.set(m.req_id, m));

    // 6. Pre-seed Action Items & Evidence
    const sampleActions: RemediationAction[] = [
      {
        id: 'ACT-2026-001',
        req_id: 'req:13643:03',
        doc_id: 'rbi:md:13643',
        doc_title: 'RBI Cybersecurity & Tech Risk Directions, 2026',
        clause_label: 'Clause 24 (DLP)',
        requirement_summary: 'Mandate endpoint DLP with automated USB & PII blocking across all bank workstations.',
        title: 'Deploy Endpoint DLP Agent Patch on 420 Branch Teller Workstations',
        description: 'Complete centralized deployment of Symantec/Forcepoint DLP agent on remaining 18% branch teller PCs and configure automated blocking for USB mass storage and unencrypted PAN/Aadhaar.',
        owner_id: 'OWN-13',
        owner_name: 'Head — Digital Banking & Technology',
        owner_line: 'First line',
        approver_id: 'OWN-11',
        approver_name: 'Chief Risk Officer',
        due_date: '2026-11-15',
        priority: 'High',
        status: 'In Progress',
        progress_pct: 65,
        created_at: '2026-08-26T10:00:00Z',
        updated_at: '2026-08-29T15:00:00Z',
        remediation_notes: 'Rollout completed across North & West zone branches (290/420 PCs). South and East zone scheduled for next weekend maintenance.',
        evidence_items: [
          {
            id: 'EVD-001',
            action_id: 'ACT-2026-001',
            title: 'North Zone DLP Agent Deployment Status Report',
            file_name: 'DLP_Deployment_NorthZone_Aug2026.pdf',
            file_type: 'application/pdf',
            file_size: '2.4 MB',
            uploaded_by: 'it.infrastructure@bank.com',
            uploaded_at: '2026-08-28T14:30:00Z',
            verification_status: 'Verified',
            verified_by: 'ciso@bank.com',
            verified_at: '2026-08-29T09:15:00Z',
            notes: 'Verified 100% agent coverage and successful USB blocking test on 145 branch terminals in North zone.',
            hash_checksum: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
          }
        ]
      },
      {
        id: 'ACT-2026-002',
        req_id: 'req:13159:01',
        doc_id: 'rbi:md:13159',
        doc_title: 'RBI Credit Risk Management Directions, 2025',
        clause_label: 'Clause 12 (EWS)',
        requirement_summary: 'Automate Early Warning Signals (EWS) integrated with CRILC, GSTN, and MCA registry for loans >= INR 5 Cr.',
        title: 'Integrate Automated GSTN & MCA21 Real-time Feed into EWS Engine',
        description: 'Procure and integrate GSTN return filing delay API and MCA charge registration webhook with the bank internal Early Warning System (EWS) to eliminate manual credit analyst dependency.',
        owner_id: 'OWN-14',
        owner_name: 'Head — Credit Monitoring',
        owner_line: 'First line',
        approver_id: 'OWN-19',
        approver_name: 'Head — Credit Risk',
        due_date: '2026-09-30',
        priority: 'Critical',
        status: 'In Progress',
        progress_pct: 40,
        created_at: '2026-08-23T11:00:00Z',
        updated_at: '2026-08-27T16:00:00Z',
        remediation_notes: 'Vendor API sandbox testing underway. Middleware integration completed for GSTN filing status trigger.',
        evidence_items: [
          {
            id: 'EVD-002',
            action_id: 'ACT-2026-002',
            title: 'GSTN API Sandbox Integration Test Log',
            file_name: 'EWS_GSTN_API_Integration_Test_Signoff.pdf',
            file_type: 'application/pdf',
            file_size: '1.8 MB',
            uploaded_by: 'credit.monitoring@bank.com',
            uploaded_at: '2026-08-27T15:45:00Z',
            verification_status: 'Pending',
            notes: 'Test log demonstrating successful receipt of GST return filing delay alerts for 20 sample corporate test accounts.'
          }
        ]
      },
      {
        id: 'ACT-2026-003',
        req_id: 'req:2026:54:01',
        doc_id: 'rbi:cir:2026:54',
        doc_title: 'RBI KYC Direction 2026 – Beneficial Ownership Amendments',
        clause_label: 'Paragraph 3 (BO 10%)',
        requirement_summary: 'Revise Beneficial Owner identification threshold from 25% to 10% for non-individual clients.',
        title: 'Update CBS Onboarding Parameter to 10% BO Threshold & Issue Branch Operational Circular',
        description: 'Deploy CBS system configuration parameter changing BO threshold from 25% to 10%, update corporate onboarding form fields, and publish mandatory branch operational advisory.',
        owner_id: 'OWN-02',
        owner_name: 'Branch Operations Manager',
        owner_line: 'First line',
        approver_id: 'OWN-06',
        approver_name: 'Principal Officer (AML)',
        due_date: '2026-09-15',
        priority: 'Critical',
        status: 'In Progress',
        progress_pct: 80,
        created_at: '2026-08-16T12:00:00Z',
        updated_at: '2026-08-29T11:30:00Z',
        remediation_notes: 'Branch operational circular drafted and approved by CCO. CBS parameter change tested in UAT environment and scheduled for production deployment on Sept 05.',
        evidence_items: [
          {
            id: 'EVD-003',
            action_id: 'ACT-2026-003',
            title: 'Approved Branch Operational Circular on 10% BO Norms',
            file_name: 'Circular_OPS_2026_44_BO_10Percent.pdf',
            file_type: 'application/pdf',
            file_size: '890 KB',
            uploaded_by: 'compliance.team@bank.com',
            uploaded_at: '2026-08-29T11:00:00Z',
            verification_status: 'Verified',
            verified_by: 'aml.principalofficer@bank.com',
            verified_at: '2026-08-29T14:00:00Z',
            notes: 'Circular approved and signed by Chief Compliance Officer for bank-wide branch dissemination.'
          }
        ]
      },
      {
        id: 'ACT-2026-004',
        req_id: 'req:2026:54:02',
        doc_id: 'rbi:cir:2026:54',
        doc_title: 'RBI KYC Direction 2026 – V-CIP Technical Controls',
        clause_label: 'Paragraph 7 (V-CIP Geotagging)',
        requirement_summary: 'Enforce live device GPS geotagging within India and ISO 30107-3 biometric liveness in V-CIP calls.',
        title: 'Upgrade V-CIP Mobile SDK with Native GPS Validation & Biometric Liveness Filter',
        description: 'Upgrade V-CIP vendor mobile SDK to Version 4.2 with mandatory device GPS coordinate check to prevent VPN / overseas proxy spoofing.',
        owner_id: 'OWN-13',
        owner_name: 'Head — Digital Banking & Technology',
        owner_line: 'First line',
        approver_id: 'OWN-08',
        approver_name: 'Chief Compliance Officer',
        due_date: '2026-10-15',
        priority: 'High',
        status: 'Assigned',
        progress_pct: 25,
        created_at: '2026-08-16T14:00:00Z',
        updated_at: '2026-08-22T10:00:00Z',
        remediation_notes: 'Vendor has delivered new SDK build. Security architecture review currently in progress.',
        evidence_items: []
      },
      {
        id: 'ACT-2026-005',
        req_id: 'req:13643:04',
        doc_id: 'rbi:md:13643',
        doc_title: 'RBI Cybersecurity & Tech Risk Directions, 2026',
        clause_label: 'Clause 31 (48h Patching)',
        requirement_summary: 'Mandate 48-hour patching SLA for critical CVSS 9.0+ vulnerabilities on internet-facing assets.',
        title: 'Establish Emergency Change Advisory Board (eCAB) Protocol for Fast-Track 48h Patching',
        description: 'Formulate an expedited eCAB change procedure with standing authorization from CISO and Head IT to patch internet perimeters within 48 hours without waiting for scheduled weekend release cycles.',
        owner_id: 'OWN-13',
        owner_name: 'Head — Digital Banking & Technology',
        owner_line: 'First line',
        approver_id: 'OWN-11',
        approver_name: 'Chief Risk Officer',
        due_date: '2026-08-20', // Overdue deliberate test item
        priority: 'High',
        status: 'Under Review',
        progress_pct: 90,
        created_at: '2026-08-02T10:00:00Z',
        updated_at: '2026-08-25T17:00:00Z',
        remediation_notes: 'eCAB standard operating procedure drafted and reviewed by CISO; awaiting final signature from CRO.',
        is_overdue: true,
        evidence_items: [
          {
            id: 'EVD-004',
            action_id: 'ACT-2026-005',
            title: 'Draft eCAB SOP and Fast-Track Patching Governance Framework',
            file_name: 'SOP_IT_SEC_eCAB_Emergency_Patching_v1.0.docx',
            file_type: 'application/docx',
            file_size: '1.2 MB',
            uploaded_by: 'it.governance@bank.com',
            uploaded_at: '2026-08-24T16:00:00Z',
            verification_status: 'Pending',
            notes: 'Submitted for CRO sign-off.'
          }
        ]
      }
    ];

    sampleActions.forEach(act => this.actions.set(act.id, act));

    // 7. Pre-seed Audit Trail Events
    this.auditEvents = [
      {
        id: 'EVT-1001',
        timestamp: '2026-08-01T08:00:00Z',
        user_email: 'system.ingestion@rbi-intel.bank',
        user_name: 'RBI Intel Automated Ingestion Service',
        event_type: 'DOCUMENT_INGESTED',
        entity_type: 'DOCUMENT',
        entity_id: 'rbi:md:13643',
        entity_title: 'RBI Cybersecurity & Tech Risk Directions 2026',
        details: 'Ingested Master Direction RBI/DoS/2026-27/410 from official RBI publication repository.'
      },
      {
        id: 'EVT-1002',
        timestamp: '2026-08-01T08:30:00Z',
        user_email: 'gemini-ai@rbi-intel.bank',
        user_name: 'Gemini Regulatory Intelligence Engine',
        event_type: 'AI_ANALYSIS_COMPLETED',
        entity_type: 'DOCUMENT',
        entity_id: 'rbi:md:13643',
        entity_title: 'RBI Cybersecurity & Tech Risk Directions 2026',
        details: 'Extracted 6 clauses, 4 actionable requirements, classified obligation types, timelines, and seeded first-draft impact mappings.'
      },
      {
        id: 'EVT-1003',
        timestamp: '2026-08-15T09:30:00Z',
        user_email: 'system.ingestion@rbi-intel.bank',
        user_name: 'RBI Intel Automated Ingestion Service',
        event_type: 'DOCUMENT_INGESTED',
        entity_type: 'DOCUMENT',
        entity_id: 'rbi:cir:2026:54',
        entity_title: 'RBI KYC Direction 2026 Amendments',
        details: 'Ingested Circular RBI/DoR/2026-27/54 regarding 10% Beneficial Ownership and V-CIP requirements.'
      },
      {
        id: 'EVT-1004',
        timestamp: '2026-08-20T10:00:00Z',
        user_email: 'compliance.officer@bank.com',
        user_name: 'Rajesh Sharma (Compliance Officer)',
        event_type: 'ASSESSMENT_UPDATED',
        entity_type: 'MAPPING',
        entity_id: 'req:13643:01',
        entity_title: 'Board IT Strategy Review',
        details: 'Verified Board minutes from June 2026 meeting. Confirmed full compliance and upgraded provenance from seeded to reviewed.'
      },
      {
        id: 'EVT-1005',
        timestamp: '2026-08-23T11:00:00Z',
        user_email: 'head.credit@bank.com',
        user_name: 'Pooja Iyer (Head — Credit Monitoring)',
        event_type: 'ACTION_CREATED',
        entity_type: 'ACTION',
        entity_id: 'ACT-2026-002',
        entity_title: 'Integrate Automated GSTN & MCA21 Feed into EWS',
        details: 'Created Critical remediation action assigned to Credit Monitoring team with due date 2026-09-30.'
      },
      {
        id: 'EVT-1006',
        timestamp: '2026-08-28T14:30:00Z',
        user_email: 'it.infrastructure@bank.com',
        user_name: 'Amit Patel (Senior IT Manager)',
        event_type: 'EVIDENCE_UPLOADED',
        entity_type: 'EVIDENCE',
        entity_id: 'EVD-001',
        entity_title: 'North Zone DLP Deployment Status Report',
        details: 'Uploaded PDF evidence showing 100% DLP agent rollout across 145 branch teller machines in North Zone.'
      },
      {
        id: 'EVT-1007',
        timestamp: '2026-08-29T09:15:00Z',
        user_email: 'ciso@bank.com',
        user_name: 'Vikramaditya Sengupta (Chief Information Security Officer)',
        event_type: 'EVIDENCE_VERIFIED',
        entity_type: 'EVIDENCE',
        entity_id: 'EVD-001',
        entity_title: 'North Zone DLP Deployment Status Report',
        details: 'Verified DLP deployment evidence and certified compliance for North Zone branch workstations.'
      }
    ];
  }

  // --- Read Operations ---
  public getDocuments(filters?: { status?: string; department?: string; search?: string }): RBIDocument[] {
    let list = Array.from(this.documents.values());
    if (filters?.status && filters.status !== 'all') {
      list = list.filter(d => d.status === filters.status);
    }
    if (filters?.department && filters.department !== 'all') {
      list = list.filter(d => d.department?.toLowerCase().includes(filters.department!.toLowerCase()));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.ref_no?.toLowerCase().includes(q) ||
        d.primary_topic?.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    }

    // Attach counts
    return list.map(doc => {
      const docReqs = Array.from(this.requirements.values()).filter(r => r.doc_id === doc.id);
      const openGaps = docReqs.filter(r => {
        const m = this.mappings.get(r.id);
        return m?.classification === 'Gap' || m?.classification === 'Partially Compliant';
      }).length;
      const actions = Array.from(this.actions.values()).filter(a => a.doc_id === doc.id).length;

      return {
        ...doc,
        clauses_count: Array.from(this.clauses.values()).filter(c => c.doc_id === doc.id).length,
        requirements_count: docReqs.length,
        open_gaps_count: openGaps,
        total_actions_count: actions
      };
    });
  }

  public getDocumentById(id: string): {
    document: RBIDocument | null;
    clauses: RBIClause[];
    requirements: (RBIRequirement & { mapping?: ReqMapping })[];
    actions: RemediationAction[];
  } {
    const doc = this.documents.get(id) ?? null;
    if (!doc) {
      return { document: null, clauses: [], requirements: [], actions: [] };
    }

    const docClauses = Array.from(this.clauses.values())
      .filter(c => c.doc_id === id)
      .sort((a, b) => a.seq - b.seq);

    const docReqs = Array.from(this.requirements.values())
      .filter(r => r.doc_id === id)
      .map(r => ({
        ...r,
        mapping: this.mappings.get(r.id)
      }));

    const docActions = Array.from(this.actions.values()).filter(a => a.doc_id === id);

    return {
      document: doc,
      clauses: docClauses,
      requirements: docReqs,
      actions: docActions
    };
  }

  public getRequirements(filters?: {
    doc_id?: string;
    classification?: string;
    obligation_type?: string;
    business_area?: string;
    search?: string;
  }): (RBIRequirement & { mapping?: ReqMapping })[] {
    let list = Array.from(this.requirements.values());

    if (filters?.doc_id && filters.doc_id !== 'all') {
      list = list.filter(r => r.doc_id === filters.doc_id);
    }
    if (filters?.obligation_type && filters.obligation_type !== 'all') {
      list = list.filter(r => r.obligation_type === filters.obligation_type);
    }

    let enriched = list.map(r => ({
      ...r,
      mapping: this.mappings.get(r.id)
    }));

    if (filters?.classification && filters.classification !== 'all') {
      enriched = enriched.filter(r => r.mapping?.classification === filters.classification);
    }

    if (filters?.business_area && filters.business_area !== 'all') {
      enriched = enriched.filter(r => r.mapping?.business_area === filters.business_area);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      enriched = enriched.filter(r =>
        r.requirement.toLowerCase().includes(q) ||
        r.clause_title?.toLowerCase().includes(q) ||
        r.clause_label?.toLowerCase().includes(q) ||
        r.doc_title?.toLowerCase().includes(q) ||
        r.mapping?.finding?.toLowerCase().includes(q) ||
        r.mapping?.policy?.toLowerCase().includes(q) ||
        r.mapping?.control?.toLowerCase().includes(q)
      );
    }

    return enriched;
  }

  public getActions(filters?: { status?: string; priority?: string; owner?: string; search?: string }): RemediationAction[] {
    let list = Array.from(this.actions.values());

    const now = new Date();
    // Compute overdue dynamically
    list = list.map(a => {
      const isPastDue = new Date(a.due_date) < now && a.status !== 'Closed' && a.status !== 'Approved';
      return {
        ...a,
        is_overdue: isPastDue
      };
    });

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'overdue') {
        list = list.filter(a => a.is_overdue);
      } else {
        list = list.filter(a => a.status === filters.status);
      }
    }

    if (filters?.priority && filters.priority !== 'all') {
      list = list.filter(a => a.priority === filters.priority);
    }

    if (filters?.owner && filters.owner !== 'all') {
      list = list.filter(a => a.owner_id === filters.owner || a.owner_name.includes(filters.owner!));
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.owner_name.toLowerCase().includes(q) ||
        a.doc_title?.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }

  public getExceptions(): ExceptionItem[] {
    const exceptions: ExceptionItem[] = [];

    // 1. Overdue Actions
    const overdueActions = this.getActions({ status: 'overdue' });
    overdueActions.forEach(a => {
      const daysOverdue = Math.max(1, Math.floor((Date.now() - new Date(a.due_date).getTime()) / (1000 * 60 * 60 * 24)));
      exceptions.push({
        id: `EXP-ACT-${a.id}`,
        type: 'OVERDUE_ACTION',
        title: `Overdue Remediation Action: ${a.title}`,
        subtitle: `Assigned to ${a.owner_name} (${a.owner_line ?? '1st Line'}) • Due date was ${a.due_date}`,
        severity: a.priority === 'Critical' ? 'Critical' : 'High',
        due_date: a.due_date,
        days_overdue: daysOverdue,
        entity_id: a.id,
        entity_type: 'action',
        owner: a.owner_name,
        suggested_action: 'Escalate to Approver & re-evaluate technical SLA timeline.'
      });
    });

    // 2. Unresolved Critical/High Gaps
    const allReqs = this.getRequirements();
    allReqs.forEach(r => {
      if (r.mapping?.classification === 'Gap') {
        exceptions.push({
          id: `EXP-GAP-${r.id}`,
          type: 'UNRESOLVED_GAP',
          title: `Non-Compliant Regulatory Gap: ${r.clause_title ?? r.clause_label}`,
          subtitle: `${r.doc_title} • ${r.mapping.finding}`,
          severity: r.mapping.severity === 'Critical' ? 'Critical' : 'High',
          entity_id: r.id,
          entity_type: 'requirement',
          suggested_action: 'Assign formal remediation action item and notify CRO / Audit Committee.'
        });
      } else if (r.mapping?.classification === 'Partially Compliant' && r.mapping.severity === 'High') {
        exceptions.push({
          id: `EXP-PART-${r.id}`,
          type: 'HIGH_IMPACT',
          title: `High Severity Partial Compliance: ${r.clause_title ?? r.clause_label}`,
          subtitle: `${r.doc_title} • ${r.mapping.finding}`,
          severity: 'High',
          entity_id: r.id,
          entity_type: 'requirement',
          suggested_action: 'Review control blind spots and verify evidence milestone.'
        });
      }
    });

    // 3. New / Recent Regulatory Changes (past 30 days)
    const recentDocs = Array.from(this.documents.values()).filter(d => {
      const docDate = new Date(d.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 45);
      return docDate >= thirtyDaysAgo;
    });

    recentDocs.forEach(d => {
      exceptions.push({
        id: `EXP-DOC-${d.id}`,
        type: 'NEW_REGULATION',
        title: `Recent RBI Publication: ${d.title}`,
        subtitle: `Issued on ${d.date} • Effective: ${d.effective_date ?? 'Immediate'} • ${d.department}`,
        severity: 'Medium',
        due_date: d.effective_date,
        entity_id: d.id,
        entity_type: 'document',
        department: d.department,
        suggested_action: 'Complete human triage and verify multi-dimensional impact assessment.'
      });
    });

    // 4. Failed Validations / Unmapped Controls (Provenance still 'seeded' or missing owner)
    allReqs.forEach(r => {
      if (r.mapping?.provenance === 'seeded') {
        exceptions.push({
          id: `EXP-VAL-${r.id}`,
          type: 'FAILED_VALIDATION',
          title: `Un-reviewed AI Seeded Assessment: ${r.clause_title ?? r.clause_label}`,
          subtitle: `${r.doc_title} • Model-generated draft awaiting compliance sign-off`,
          severity: 'Medium',
          entity_id: r.id,
          entity_type: 'requirement',
          suggested_action: 'Review AI recommended controls and upgrade provenance to "reviewed" or "sourced".'
        });
      }
    });

    return exceptions;
  }

  public getDashboardStats(): DashboardStats {
    const allDocs = Array.from(this.documents.values());
    const allReqs = Array.from(this.requirements.values());
    const allMappings = Array.from(this.mappings.values());
    const allActions = this.getActions();

    const complianceBreakdown = {
      compliant: allMappings.filter(m => m.classification === 'Compliant').length,
      partially_compliant: allMappings.filter(m => m.classification === 'Partially Compliant').length,
      gap: allMappings.filter(m => m.classification === 'Gap').length,
      to_be_confirmed: allMappings.filter(m => m.classification === 'To Be Confirmed').length,
      not_applicable: allMappings.filter(m => m.classification === 'Not Applicable').length,
    };

    const actionsBreakdown = {
      draft: allActions.filter(a => a.status === 'Draft').length,
      assigned: allActions.filter(a => a.status === 'Assigned').length,
      in_progress: allActions.filter(a => a.status === 'In Progress').length,
      under_review: allActions.filter(a => a.status === 'Under Review').length,
      approved: allActions.filter(a => a.status === 'Approved').length,
      closed: allActions.filter(a => a.status === 'Closed').length,
      overdue: allActions.filter(a => a.is_overdue).length,
    };

    const gaps = allMappings.filter(m => m.classification === 'Gap' || m.classification === 'Partially Compliant');
    const gapsBySeverity = {
      critical: gaps.filter(g => g.severity === 'Critical').length,
      high: gaps.filter(g => g.severity === 'High').length,
      medium: gaps.filter(g => g.severity === 'Medium').length,
      low: gaps.filter(g => g.severity === 'Low').length,
    };

    // Calculate Regulatory Exposure Index (0 to 100)
    // Formula based on weighted critical gaps, overdue actions, and unreviewed requirements
    const totalGaps = gaps.length;
    const weightedGapScore = (gapsBySeverity.critical * 25) + (gapsBySeverity.high * 15) + (gapsBySeverity.medium * 5) + (gapsBySeverity.low * 1);
    const overduePenalty = actionsBreakdown.overdue * 12;
    const exposureIndex = Math.min(100, Math.max(10, Math.round((weightedGapScore + overduePenalty) / Math.max(1, allReqs.length) * 8.5)));

    let exposureStatus: 'Low' | 'Moderate' | 'Elevated' | 'High' = 'Moderate';
    if (exposureIndex < 25) exposureStatus = 'Low';
    else if (exposureIndex < 50) exposureStatus = 'Moderate';
    else if (exposureIndex < 75) exposureStatus = 'Elevated';
    else exposureStatus = 'High';

    // Group gaps by business area
    const areaMap = new Map<string, { area_name: string; count: number }>();
    gaps.forEach(g => {
      const area = this.businessAreas.find(b => b.id === g.business_area);
      const name = area?.name ?? g.business_area_name ?? 'General Compliance';
      const existing = areaMap.get(g.business_area) ?? { area_name: name, count: 0 };
      existing.count += 1;
      areaMap.set(g.business_area, existing);
    });

    const gapsByBusinessArea = Array.from(areaMap.entries()).map(([id, val]) => ({
      area_id: id,
      area_name: val.area_name,
      gap_count: val.count
    })).sort((a, b) => b.gap_count - a.gap_count);

    // 3 Lines of Defense
    const linesOfDefense = [
      {
        line: '1st Line (Business & Branch Operations)',
        requirement_count: allMappings.filter(m => m.owner_process_line === 'First line').length,
        action_count: allActions.filter(a => a.owner_line === 'First line').length,
        gap_count: gaps.filter(g => g.owner_process_line === 'First line').length
      },
      {
        line: '2nd Line (Risk & Compliance Management)',
        requirement_count: allMappings.filter(m => m.owner_control_line === 'Second line').length,
        action_count: allActions.filter(a => a.owner_line === 'Second line').length,
        gap_count: gaps.filter(g => g.owner_control_line === 'Second line').length
      },
      {
        line: '3rd Line (Internal Audit & Board Governance)',
        requirement_count: allMappings.filter(m => m.owner_process_line === 'Third line' || m.owner_control_line === 'Governance').length,
        action_count: allActions.filter(a => a.owner_line === 'Third line' || a.owner_line === 'Governance').length,
        gap_count: gaps.filter(g => g.owner_process_line === 'Third line' || g.owner_control_line === 'Governance').length
      }
    ];

    // Upcoming effective dates
    const upcomingEffectiveDates = allDocs
      .filter(d => d.effective_date)
      .map(d => {
        const diffDays = Math.ceil((new Date(d.effective_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          doc_id: d.id,
          doc_title: d.title,
          effective_date: d.effective_date!,
          days_remaining: diffDays,
          department: d.department ?? 'RBI',
          impact_level: (diffDays <= 45 ? 'Critical' : diffDays <= 90 ? 'High' : 'Medium') as any
        };
      })
      .sort((a, b) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime());

    return {
      regulatory_exposure_index: exposureIndex,
      exposure_status: exposureStatus,
      total_active_directions: allDocs.length,
      total_requirements: allReqs.length,
      compliance_breakdown: complianceBreakdown,
      total_actions: allActions.length,
      actions_breakdown: actionsBreakdown,
      total_open_gaps: totalGaps,
      gaps_by_severity: gapsBySeverity,
      gaps_by_business_area: gapsByBusinessArea,
      lines_of_defense_distribution: linesOfDefense,
      upcoming_effective_dates: upcomingEffectiveDates,
      recent_exceptions_count: this.getExceptions().length
    };
  }

  // --- Write / Mutation Operations ---

  public createDocument(doc: Partial<RBIDocument>): RBIDocument {
    const id = doc.id || `rbi:doc:${Date.now().toString(36)}`;
    const newDoc: RBIDocument = {
      id,
      regulator: doc.regulator || 'RBI',
      doc_type: doc.doc_type || 'Circular',
      title: doc.title || 'Untitled RBI Regulatory Document',
      date: doc.date || new Date().toISOString().split('T')[0],
      effective_date: doc.effective_date,
      department: doc.department || 'Department of Regulation (DoR)',
      category: doc.category || 'Commercial Banks',
      institution_type: doc.institution_type || 'Commercial Banks',
      primary_topic: doc.primary_topic || 'Regulatory Compliance',
      secondary_topics: doc.secondary_topics || [],
      ref_no: doc.ref_no || `RBI/2026-27/${Math.floor(100 + Math.random() * 900)}`,
      source_url: doc.source_url || 'https://rbi.org.in/Scripts/NotificationUser.aspx',
      pdf_url: doc.pdf_url,
      status: doc.status || 'active',
      has_update: false,
      applicability: doc.applicability || 'Applicable',
      indexed_at: new Date().toISOString(),
      last_changed: new Date().toISOString(),
      raw_body_preview: doc.raw_body_preview
    };

    this.documents.set(id, newDoc);

    this.logAudit({
      user_email: 'compliance.officer@bank.com',
      user_name: 'Compliance Intake Officer',
      event_type: 'DOCUMENT_INGESTED',
      entity_type: 'DOCUMENT',
      entity_id: id,
      entity_title: newDoc.title,
      details: `Manually ingested RBI document: ${newDoc.title} (${newDoc.ref_no})`
    });

    return newDoc;
  }

  public updateMapping(reqId: string, updates: Partial<ReqMapping>, user: { email: string; name: string }): ReqMapping {
    const existing = this.mappings.get(reqId);
    if (!existing) {
      throw new Error(`Mapping not found for requirement ${reqId}`);
    }

    const beforeState = { ...existing };
    const updated: ReqMapping = {
      ...existing,
      ...updates,
      reviewed_by: user.email,
      reviewed_at: new Date().toISOString(),
      provenance: updates.provenance || 'reviewed'
    };

    this.mappings.set(reqId, updated);

    this.logAudit({
      user_email: user.email,
      user_name: user.name,
      event_type: 'ASSESSMENT_UPDATED',
      entity_type: 'MAPPING',
      entity_id: reqId,
      entity_title: `Mapping for ${reqId}`,
      details: `Updated compliance assessment to ${updated.classification} (Severity: ${updated.severity}, Provenance: ${updated.provenance})`,
      diff: {
        before: { classification: beforeState.classification, severity: beforeState.severity, finding: beforeState.finding },
        after: { classification: updated.classification, severity: updated.severity, finding: updated.finding }
      }
    });

    return updated;
  }

  public createAction(action: Partial<RemediationAction>, user: { email: string; name: string }): RemediationAction {
    const id = action.id || `ACT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newAction: RemediationAction = {
      id,
      req_id: action.req_id || 'req:unlinked',
      doc_id: action.doc_id,
      doc_title: action.doc_title,
      clause_label: action.clause_label,
      requirement_summary: action.requirement_summary,
      title: action.title || 'Remediate Compliance Requirement',
      description: action.description || '',
      owner_id: action.owner_id || 'OWN-08',
      owner_name: action.owner_name || 'Chief Compliance Officer',
      owner_line: action.owner_line || 'Second line',
      approver_id: action.approver_id || 'OWN-11',
      approver_name: action.approver_name || 'Chief Risk Officer',
      due_date: action.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: action.priority || 'High',
      status: action.status || 'Assigned',
      progress_pct: action.progress_pct || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      evidence_items: action.evidence_items || [],
      remediation_notes: action.remediation_notes || ''
    };

    this.actions.set(id, newAction);

    this.logAudit({
      user_email: user.email,
      user_name: user.name,
      event_type: 'ACTION_CREATED',
      entity_type: 'ACTION',
      entity_id: id,
      entity_title: newAction.title,
      details: `Created remediation action: ${newAction.title} (Owner: ${newAction.owner_name}, Due: ${newAction.due_date})`
    });

    return newAction;
  }

  public updateAction(id: string, updates: Partial<RemediationAction>, user: { email: string; name: string }): RemediationAction {
    const existing = this.actions.get(id);
    if (!existing) {
      throw new Error(`Action ${id} not found`);
    }

    const beforeState = { ...existing };
    const updated: RemediationAction = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.status === 'Closed' && existing.status !== 'Closed') {
      updated.closed_at = new Date().toISOString();
      updated.closed_by = user.email;
      updated.progress_pct = 100;
    }

    this.actions.set(id, updated);

    this.logAudit({
      user_email: user.email,
      user_name: user.name,
      event_type: updates.status === 'Closed' ? 'GAP_CLOSED' : 'ACTION_STATUS_CHANGED',
      entity_type: 'ACTION',
      entity_id: id,
      entity_title: updated.title,
      details: `Updated Action status from ${beforeState.status} to ${updated.status} (Progress: ${updated.progress_pct}%)`,
      diff: {
        before: { status: beforeState.status, progress_pct: beforeState.progress_pct },
        after: { status: updated.status, progress_pct: updated.progress_pct }
      }
    });

    return updated;
  }

  public addEvidenceToAction(
    actionId: string,
    evidence: Partial<EvidenceItem>,
    user: { email: string; name: string }
  ): EvidenceItem {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }

    const id = evidence.id || `EVD-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEvidence: EvidenceItem = {
      id,
      action_id: actionId,
      title: evidence.title || 'Compliance Remediation Proof',
      file_name: evidence.file_name || 'evidence_attachment.pdf',
      file_type: evidence.file_type || 'application/pdf',
      file_size: evidence.file_size || '1.5 MB',
      file_url: evidence.file_url,
      uploaded_by: user.email,
      uploaded_at: new Date().toISOString(),
      verification_status: evidence.verification_status || 'Pending',
      notes: evidence.notes,
      hash_checksum: evidence.hash_checksum || `sha256:${Math.random().toString(16).substring(2)}${Date.now().toString(16)}`
    };

    action.evidence_items.push(newEvidence);
    action.updated_at = new Date().toISOString();
    this.actions.set(actionId, action);

    this.logAudit({
      user_email: user.email,
      user_name: user.name,
      event_type: 'EVIDENCE_UPLOADED',
      entity_type: 'EVIDENCE',
      entity_id: id,
      entity_title: newEvidence.title,
      details: `Uploaded evidence document "${newEvidence.title}" (${newEvidence.file_name}) for Action ${action.id}`
    });

    return newEvidence;
  }

  public verifyEvidence(
    actionId: string,
    evidenceId: string,
    verification: { status: 'Verified' | 'Rejected'; notes?: string },
    user: { email: string; name: string }
  ): EvidenceItem {
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Action ${actionId} not found`);

    const ev = action.evidence_items.find(e => e.id === evidenceId);
    if (!ev) throw new Error(`Evidence ${evidenceId} not found`);

    ev.verification_status = verification.status;
    ev.verified_by = user.email;
    ev.verified_at = new Date().toISOString();
    if (verification.notes) ev.notes = verification.notes;

    action.updated_at = new Date().toISOString();
    this.actions.set(actionId, action);

    this.logAudit({
      user_email: user.email,
      user_name: user.name,
      event_type: 'EVIDENCE_VERIFIED',
      entity_type: 'EVIDENCE',
      entity_id: evidenceId,
      entity_title: ev.title,
      details: `${verification.status} evidence item "${ev.title}" for Action ${action.id}`
    });

    return ev;
  }

  public logAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      id: `EVT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
      ...event
    };

    this.auditEvents.unshift(fullEvent);
    return fullEvent;
  }

  public getAuditTrail(filters?: { entity_type?: string; user?: string; search?: string }): AuditEvent[] {
    let list = [...this.auditEvents];
    if (filters?.entity_type && filters.entity_type !== 'all') {
      list = list.filter(e => e.entity_type === filters.entity_type);
    }
    if (filters?.user && filters.user !== 'all') {
      list = list.filter(e => e.user_email.includes(filters.user!) || e.user_name.includes(filters.user!));
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e =>
        e.details.toLowerCase().includes(q) ||
        e.entity_title?.toLowerCase().includes(q) ||
        e.user_name.toLowerCase().includes(q) ||
        e.event_type.toLowerCase().includes(q)
      );
    }
    return list;
  }
}

export const dataStore = new RegulatoryDataStore();
