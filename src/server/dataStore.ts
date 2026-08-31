import {
  RegulatoryRegime,
  RegulatoryDocument,
  RegulatoryClause,
  RegulatoryRequirement,
  ReqMapping,
  BusinessArea,
  OwnerRole,
  RemediationAction,
  EvidenceItem,
  AuditEvent,
  ExceptionItem,
  DashboardStats,
} from '../types';

class RegulatoryDataStore {
  public businessAreas: BusinessArea[] = [];
  public owners: OwnerRole[] = [];
  public documents: Map<string, RegulatoryDocument> = new Map();
  public clauses: Map<string, RegulatoryClause> = new Map();
  public requirements: Map<string, RegulatoryRequirement> = new Map();
  public mappings: Map<string, ReqMapping> = new Map();
  public actions: Map<string, RemediationAction> = new Map();
  public auditEvents: AuditEvent[] = [];

  constructor() {
    this.initializeSeedData();
  }

  private initializeSeedData() {
    // 1. Business Areas for SAMA and RBI
    this.businessAreas = [
      // SAMA Business Areas
      { id: 'SAMA-BA-01', name: 'Corporate Governance & Board Oversight', description: 'SAMA Corporate Governance Principles, Board Committees, Fit & Proper approval.', regulator: 'SAMA' },
      { id: 'SAMA-BA-02', name: 'AML/CFT Governance & Sanctions', description: 'Saudi AML Law, SAFIU real-time reporting, UNSC & Presidency of State Security (PSS) lists.', regulator: 'SAMA' },
      { id: 'SAMA-BA-03', name: 'Customer Due Diligence (CDD) & KYC', description: 'Nafath/Absher verification, 5% Beneficial Ownership threshold, high-risk screening.', regulator: 'SAMA' },
      { id: 'SAMA-BA-04', name: 'Digital Onboarding & E-KYC', description: 'Remote onboarding, biometric liveness validation, Nafath API integration.', regulator: 'SAMA' },
      { id: 'SAMA-BA-05', name: 'Transaction Monitoring & SAFIU Filing', description: 'Real-time alert monitoring, threshold rules, 24-hour SAFIU STR XML filing.', regulator: 'SAMA' },
      { id: 'SAMA-BA-06', name: 'Cyber Security Framework (CSF) & SOC', description: 'SAMA CSF v3.0, Maturity Level 3+, CISO independence, 2-hour CTI incident reporting.', regulator: 'SAMA' },
      { id: 'SAMA-BA-07', name: 'Threat-Led Penetration Testing (TLPT)', description: 'SAMA Red Teaming / TLPT framework, simulated attacks, 30-day remediation.', regulator: 'SAMA' },
      { id: 'SAMA-BA-08', name: 'Cloud Computing & Data Sovereignty', description: 'SAMA Cloud Framework, In-Kingdom data residency, Class 1-4 data isolation.', regulator: 'SAMA' },
      { id: 'SAMA-BA-09', name: 'Open Banking & Financial APIs', description: 'SAMA Open Banking Phase 2, PISP/AISP APIs, OAuth2 mTLS security, Open Banking Portal.', regulator: 'SAMA' },
      { id: 'SAMA-BA-10', name: 'Payment Systems & National Rails (SARIE/mada)', description: 'SARIE RTGS/IPS, mada debit rails, Sadad bill presentment, instant limit controls.', regulator: 'SAMA' },
      { id: 'SAMA-BA-11', name: 'Consumer Protection & Fair Treatment', description: 'SAMA Consumer Protection Principles, Financial Rights Charter, 10-day grievance SLA.', regulator: 'SAMA' },
      { id: 'SAMA-BA-12', name: 'Responsible Lending & APR / DBR Ceilings', description: 'Debt Burden Ratio (DBR 33.33% salary / 45% mortgage), standardized APR Key Facts Statement.', regulator: 'SAMA' },
      { id: 'SAMA-BA-13', name: 'SIMAH Credit Bureau Reporting', description: 'Mandatory monthly credit data upload to SIMAH, 30-day default updates.', regulator: 'SAMA' },
      { id: 'SAMA-BA-14', name: 'Capital Adequacy & Basel III Accord', description: 'CET1, Tier 1, Total Capital ratios, Capital Conservation Buffer (2.5%), D-SIB surcharges.', regulator: 'SAMA' },
      { id: 'SAMA-BA-15', name: 'Internal Audit & Assurance (3rd Line)', description: 'Risk-Based Internal Audit (RBIA), Board Audit Committee independence.', regulator: 'SAMA' },

      // RBI Business Areas
      { id: 'RBI-BA-01', name: 'IT Governance, Risk & Controls', description: 'RBI Master Direction on IT Governance, IT Strategy Committee, CISO independence.', regulator: 'RBI' },
      { id: 'RBI-BA-02', name: 'Cyber Security Framework & CSITE', description: 'SOC 24x7, 2-6 hour incident reporting to CERT-In & RBI, air-gapped backups, red teaming.', regulator: 'RBI' },
      { id: 'RBI-BA-03', name: 'KYC, CKYCR & Digital Customer Identification', description: 'CKYC Registry upload within 3 days, Video KYC (V-CIP), 10% UBO threshold.', regulator: 'RBI' },
      { id: 'RBI-BA-04', name: 'AML / CFT & FIU-IND Reporting', description: 'PMLA requirements, FINnet 2.0 XML gateway, automated CTR/STR generation within 7 days.', regulator: 'RBI' },
      { id: 'RBI-BA-05', name: 'Digital Payment Security Controls (DPSS)', description: 'Two-factor auth (AFA), velocity checks, cooling periods on beneficiary additions, UPI risk engine.', regulator: 'RBI' },
      { id: 'RBI-BA-06', name: 'IT Outsourcing & Cloud Service Providers', description: 'RBI Master Direction on Outsourcing IT Services, Board oversight, concentration limits.', regulator: 'RBI' },
      { id: 'RBI-BA-07', name: 'Prudential Framework for Stressed Assets (NPA)', description: 'Day-1 default recognition, CRILC weekly reporting, 180-day Resolution Plan (RP).', regulator: 'RBI' },
      { id: 'RBI-BA-08', name: 'Customer Protection & Grievance Redressal (CMS)', description: 'RBI Integrated Ombudsman Scheme (RB-IOS), 30-day resolution, zero-liability unauthorized transactions.', regulator: 'RBI' },
      { id: 'RBI-BA-09', name: 'Credit Risk & Large Exposure Framework (LEF)', description: 'Single counterparty (20%) and group (25%) Tier 1 capital ceilings, LEI verification.', regulator: 'RBI' },
      { id: 'RBI-BA-10', name: 'Liquidity Risk & Basel III (LCR / NSFR)', description: 'Liquidity Coverage Ratio (LCR >= 100%), Net Stable Funding Ratio, daily HQLA tracking.', regulator: 'RBI' },
      { id: 'RBI-BA-11', name: 'Priority Sector Lending (PSL) & Targets', description: '40% ANBC priority sector quota, Agriculture (18%), Micro Enterprises (7.5%), RIDF investments.', regulator: 'RBI' },
      { id: 'RBI-BA-12', name: 'Risk-Based Internal Audit (RBIA)', description: 'Annual Board-approved audit plan, independent reporting line to Audit Committee of Board (ACB).', regulator: 'RBI' }
    ];

    // 2. Owners for SAMA and RBI
    this.owners = [
      // SAMA Owners
      { id: 'SAMA-OWN-01', role_title: 'Chief Information Security Officer (CISO)', line: 'Second line', department: 'Cybersecurity & Information Security Division', default_assignee_name: 'Fahad Al-Husseini', regulator: 'SAMA' },
      { id: 'SAMA-OWN-02', role_title: 'Chief Compliance Officer (CCO)', line: 'Second line', department: 'Regulatory Compliance & Supervision Division', default_assignee_name: 'Ahmed Al-Mansoor', regulator: 'SAMA' },
      { id: 'SAMA-OWN-03', role_title: 'Money Laundering Reporting Officer (MLRO)', line: 'Second line', department: 'Financial Crimes & AML Compliance Unit', default_assignee_name: 'Sara Al-Otaibi', regulator: 'SAMA' },
      { id: 'SAMA-OWN-04', role_title: 'Chief Risk Officer (CRO)', line: 'Second line', department: 'Enterprise Risk Management (ERM)', default_assignee_name: 'Dr. Tariq Al-Ghamdi', regulator: 'SAMA' },
      { id: 'SAMA-OWN-05', role_title: 'Head of Digital Banking & Channels', line: 'First line', department: 'Digital Transformation & Retail Channels', default_assignee_name: 'Khalid Al-Zahrani', regulator: 'SAMA' },
      { id: 'SAMA-OWN-06', role_title: 'Head of Banking Operations & Payments', line: 'First line', department: 'Central Operations (SARIE/mada/SADAD)', default_assignee_name: 'Mohammed Al-Shehri', regulator: 'SAMA' },
      { id: 'SAMA-OWN-07', role_title: 'Chief Technology Officer (CTO)', line: 'First line', department: 'Information Technology & Cloud Infrastructure', default_assignee_name: 'Bandar Al-Khatib', regulator: 'SAMA' },
      { id: 'SAMA-OWN-08', role_title: 'Head of Internal Audit (CAE)', line: 'Third line', department: 'Internal Audit Directorate', default_assignee_name: 'Nouf Al-Dosari', regulator: 'SAMA' },

      // RBI Owners
      { id: 'RBI-OWN-01', role_title: 'Chief Information Security Officer (CISO)', line: 'Second line', department: 'Information Security Group', default_assignee_name: 'Vikramaditya Sharma', regulator: 'RBI' },
      { id: 'RBI-OWN-02', role_title: 'Chief Compliance Officer (CCO)', line: 'Second line', department: 'Compliance Department', default_assignee_name: 'Meera Venkataraman', regulator: 'RBI' },
      { id: 'RBI-OWN-03', role_title: 'Principal Officer / MLRO (AML/CFT)', line: 'Second line', department: 'Financial Crime Prevention Group', default_assignee_name: 'Sunil Nair', regulator: 'RBI' },
      { id: 'RBI-OWN-04', role_title: 'Chief Risk Officer (CRO)', line: 'Second line', department: 'Risk Management Department', default_assignee_name: 'Rajesh Iyer', regulator: 'RBI' },
      { id: 'RBI-OWN-05', role_title: 'Chief Technology Officer (CTO)', line: 'First line', department: 'Information Technology & Core Banking Group', default_assignee_name: 'Anand Kulkarni', regulator: 'RBI' },
      { id: 'RBI-OWN-06', role_title: 'Head of Digital Banking & Payments', line: 'First line', department: 'Digital Channels & Payments (UPI/IMPS/NEFT)', default_assignee_name: 'Pooja Agarwal', regulator: 'RBI' },
      { id: 'RBI-OWN-07', role_title: 'Head of Credit & Underwriting', line: 'First line', department: 'Credit Policy & Underwriting Group', default_assignee_name: 'Suresh Menon', regulator: 'RBI' },
      { id: 'RBI-OWN-08', role_title: 'Chief Audit Executive (CAE)', line: 'Third line', department: 'Internal Audit Department', default_assignee_name: 'Kavita Subramanian', regulator: 'RBI' }
    ];

    // 3. Pre-seed SAMA Documents
    const samaDocs: RegulatoryDocument[] = [
      {
        id: 'sama:csf:2026',
        regulator: 'SAMA',
        doc_type: 'Regulatory Framework',
        title: 'SAMA Cyber Security Framework (CSF v3.0) & Threat-Led Penetration Testing (TLPT) Mandate',
        date: '2026-07-15',
        effective_date: '2026-10-01',
        department: 'Cyber Risk & Technology Supervision Department',
        category: 'Banking & Financial Institutions',
        institution_type: 'Commercial Banks',
        primary_topic: 'Cybersecurity & Tech Resilience',
        secondary_topics: ['Threat-Led Penetration Testing (TLPT)', 'CISO Independence', 'Cloud Data Sovereignty', 'SOC 24/7 Monitoring'],
        ref_no: 'SAMA Circular No. 46012431',
        source_url: 'https://rulebook.sama.gov.sa/en/rules/cyber-security-framework-v3',
        pdf_url: 'https://rulebook.sama.gov.sa/en/files/SAMA_CSF_v3_2026.pdf',
        status: 'active',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2026-07-20T08:00:00Z',
        last_changed: '2026-08-15T14:30:00Z',
        raw_body_preview: 'Mandates full alignment with SAMA CSF Maturity Level 3+, direct CISO reporting line to Board Risk Committee, mandatory In-Kingdom Class 4 sovereign cloud data hosting, Threat-Led Penetration Testing (TLPT / Red Teaming) every 24 months, and 2-hour cyber incident notification to SAMA Cyber Threat Intelligence (CTI) Center.'
      },
      {
        id: 'sama:aml:2026',
        regulator: 'SAMA',
        doc_type: 'Implementing Regulations',
        title: 'SAMA Anti-Money Laundering & Combating Financing of Terrorism Rules — Beneficial Ownership (5%) & Real-Time SAFIU Integration',
        date: '2026-06-30',
        effective_date: '2026-09-15',
        department: 'AML / CFT Supervision Department',
        category: 'All Regulated Entities',
        institution_type: 'Commercial Banks',
        primary_topic: 'AML / CFT & Sanctions',
        secondary_topics: ['Beneficial Ownership 5% Threshold', 'SAFIU Electronic Integration', 'Nafath Biometric Verification', 'Presidency of State Security (PSS) Lists'],
        ref_no: 'SAMA Circular No. 45019820',
        source_url: 'https://rulebook.sama.gov.sa/en/rules/aml-cft-rules-2026',
        status: 'amended',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2026-07-02T10:00:00Z',
        last_changed: '2026-07-01T09:00:00Z',
        raw_body_preview: 'Lowers mandatory beneficial ownership identification and verification threshold from 20% to 5% for all commercial corporate accounts, enforces mandatory real-time electronic Suspicious Transaction Report (STR) transmission to the Saudi Financial Intelligence Unit (SAFIU) within 24 hours, and mandates continuous screening against Presidency of State Security (PSS) terror lists.'
      },
      {
        id: 'sama:cpr:2026',
        regulator: 'SAMA',
        doc_type: 'Regulatory Principles',
        title: 'SAMA Banking Consumer Protection Principles & Financial Consumer Rights Charter (2026 Revision)',
        date: '2026-08-01',
        effective_date: '2026-11-01',
        department: 'Consumer Protection Department',
        category: 'Retail & Commercial Banking',
        institution_type: 'Commercial Banks',
        primary_topic: 'Consumer Protection & Fair Lending',
        secondary_topics: ['Debt Burden Ratio (DBR) 33.33%', 'Total Cost of Credit & APR Disclosure', '10-Day Customer Complaint SLA', 'Early Settlement Rebates'],
        ref_no: 'SAMA Circular No. 45009812',
        source_url: 'https://rulebook.sama.gov.sa/en/rules/consumer-protection-principles',
        status: 'active',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2026-08-05T11:00:00Z',
        last_changed: '2026-08-01T11:00:00Z',
        raw_body_preview: 'Strictly enforces Debt Burden Ratio (DBR) ceiling of 33.33% for salary-backed consumer loans and 45% for residential mortgages, mandates standardized Key Facts Statements (KFS) displaying exact APR schedules, and sets maximum 10-business-day turnaround for customer grievance resolution.'
      },
      {
        id: 'sama:obk:2026',
        regulator: 'SAMA',
        doc_type: 'Technical Framework',
        title: 'SAMA Open Banking Framework — Phase 2: Payment Initiation Services (PISP) & Technical API Security Guidelines',
        date: '2026-05-18',
        effective_date: '2026-12-01',
        department: 'Payment Systems & FinTech Supervision Department',
        category: 'Commercial Banks & FinTechs',
        institution_type: 'Commercial Banks',
        primary_topic: 'Open Banking & FinTech APIs',
        secondary_topics: ['Payment Initiation (PISP)', 'Customer Consent Lifecycle', 'OAuth 2.0 & mTLS Security', 'Open Banking Portal Registry'],
        ref_no: 'SAMA Circular No. 44091218',
        source_url: 'https://rulebook.sama.gov.sa/en/rules/open-banking-framework',
        status: 'active',
        has_update: false,
        applicability: 'Applicable',
        indexed_at: '2026-05-20T09:30:00Z',
        last_changed: '2026-05-18T09:30:00Z',
        raw_body_preview: 'Mandates production rollout of SAMA Open Banking Payment Initiation Service (PISP) APIs across all Saudi commercial banks, requiring FAPI-compliant mutual TLS (mTLS), standardized consent dashboards in mobile banking, and real-time transaction limits validation.'
      },
      {
        id: 'sama:gov:2025',
        regulator: 'SAMA',
        doc_type: 'Governance Regulations',
        title: 'SAMA Key Principles of Corporate Governance in Financial Institutions (Circular 44055248)',
        date: '2025-11-10',
        effective_date: '2026-01-01',
        department: 'Banking Supervision Department',
        category: 'Commercial Banks',
        institution_type: 'Commercial Banks',
        primary_topic: 'Corporate Governance & Board Oversight',
        secondary_topics: ['Board Independence 50%', 'Fit & Proper SAMA Approval', 'Three Lines of Defense', 'Executive Remuneration Clawback'],
        ref_no: 'SAMA Circular No. 44055248',
        source_url: 'https://rulebook.sama.gov.sa/en/rules/corporate-governance-regulations',
        status: 'active',
        has_update: false,
        applicability: 'Applicable',
        indexed_at: '2025-11-15T10:00:00Z',
        last_changed: '2025-11-10T10:00:00Z',
        raw_body_preview: 'Establishes governance standards requiring at least 50% independent board directors, mandatory SAMA prior written non-objection for key executive appointments, structured 3 Lines of Defense separation, and mandatory clawback provisions on executive bonuses.'
      },
      {
        id: 'sama:cld:2026',
        regulator: 'SAMA',
        doc_type: 'Regulatory Rules',
        title: 'SAMA Cloud Computing Regulatory Framework — In-Kingdom Sovereign Hosting & Data Classification Class 4',
        date: '2026-04-12',
        effective_date: '2026-08-30',
        department: 'Cyber Risk & Technology Supervision Department',
        category: 'Banking & Payments',
        institution_type: 'Commercial Banks',
        primary_topic: 'Cloud Sovereignty & Data Protection',
        secondary_topics: ['Class 4 Sensitive Banking Data', 'In-Kingdom Data Residency', 'HSM Cryptographic Key Control', 'Tenant Logical Isolation'],
        ref_no: 'SAMA Circular No. 43088192',
        source_url: 'https://rulebook.sama.gov.sa/en/rules/cloud-computing-framework',
        status: 'active',
        has_update: false,
        applicability: 'Applicable',
        indexed_at: '2026-04-15T12:00:00Z',
        last_changed: '2026-04-12T12:00:00Z',
        raw_body_preview: 'Mandates that all Class 4 (Confidential & Highly Restricted) banking customer data and cryptographic encryption keys must reside strictly within certified cloud data centers physically located inside the Kingdom of Saudi Arabia.'
      }
    ];

    // 4. Pre-seed RBI Documents
    const rbiDocs: RegulatoryDocument[] = [
      {
        id: 'rbi:itgov:2023',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'RBI Master Direction — Information Technology Governance, Risk, Controls and Assurance Practices (2023/2024)',
        date: '2023-11-07',
        effective_date: '2024-04-01',
        department: 'Department of Supervision (DoS) / IT Examination Cell',
        category: 'Commercial Banks, SFBs & NBFCs',
        institution_type: 'Scheduled Commercial Banks',
        primary_topic: 'IT Governance & Enterprise Architecture',
        secondary_topics: ['IT Strategy Committee', 'CISO Independence', 'Disaster Recovery (DR) Drills', 'Annual IT Audit'],
        ref_no: 'RBI/2023-24/107 DoS.CO.CSITE.SEC.No.1852/31.01.015/2023-24',
        source_url: 'https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=12562',
        pdf_url: 'https://rbidocs.rbi.org.in/rdocs/notification/PDFs/107MDITGOV07112023.pdf',
        status: 'active',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2023-11-10T10:00:00Z',
        last_changed: '2024-04-01T09:00:00Z',
        raw_body_preview: 'Establishes statutory IT governance architecture for banks in India. Requires Board IT Strategy Committee, direct CISO reporting to Risk Committee, mandatory bi-annual live DR failover drills with RTO < 2 hours, and comprehensive third-party vendor risk governance.'
      },
      {
        id: 'rbi:kyc:2016',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'RBI Master Direction — Know Your Customer (KYC) Direction, 2016 (Updated 2024/2025)',
        date: '2016-02-25',
        effective_date: '2024-01-04',
        department: 'Department of Regulation (DoR)',
        category: 'All Regulated Entities',
        institution_type: 'Scheduled Commercial Banks',
        primary_topic: 'KYC, AML & Digital Onboarding',
        secondary_topics: ['CKYCR 3-Day Upload', 'Video KYC (V-CIP) AI Controls', '10% Beneficial Ownership Threshold', 'Periodic KYC Updation'],
        ref_no: 'RBI/DBR/2015-16/18 Master Direction DBR.AML.BC.No.81/14.01.001/2015-16',
        source_url: 'https://www.rbi.org.in/Scripts/BS_ViewMasDirections.aspx?id=11566',
        status: 'amended',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2024-01-10T08:00:00Z',
        last_changed: '2024-01-04T12:00:00Z',
        raw_body_preview: 'Mandates CKYC registry record upload within 3 calendar days of onboarding, specifies V-CIP video recording with geo-tagging, live facial matching, Aadhaar OTP XML decryption, and sets 10% ultimate beneficial ownership threshold.'
      },
      {
        id: 'rbi:csite:2016',
        regulator: 'RBI',
        doc_type: 'Supervisory Circular',
        title: 'RBI Cyber Security Framework in Banks — CSITE Mandate & Rapid Incident Reporting',
        date: '2016-06-02',
        effective_date: '2016-06-02',
        department: 'Cyber Security and Information Technology Examination Cell (CSITE)',
        category: 'Commercial Banks',
        institution_type: 'Scheduled Commercial Banks',
        primary_topic: 'Cyber Resilience & Threat Intelligence',
        secondary_topics: ['2-6 Hour Incident Notification', '24x7 Security Operations Center', 'Air-Gapped Golden Backups', 'Red Teaming Exercises'],
        ref_no: 'RBI/2015-16/418 DBS.CO/CSITE/BC.11/31.01.015/2015-16',
        source_url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=10435',
        status: 'active',
        has_update: true,
        applicability: 'Applicable',
        indexed_at: '2023-01-15T11:00:00Z',
        last_changed: '2024-03-10T14:00:00Z',
        raw_body_preview: 'Enforces mandatory 24x7 Security Operations Center (SOC), air-gapped immutable ransomware backups, Red Teaming / Adversary Emulation, and urgent notification of cyber incidents to RBI CSITE & CERT-In within 2 to 6 hours.'
      },
      {
        id: 'rbi:outsourcing:2023',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'RBI Master Direction on Outsourcing of Information Technology Services (2023)',
        date: '2023-04-10',
        effective_date: '2023-10-01',
        department: 'Department of Supervision (DoS)',
        category: 'Banks & NBFCs',
        institution_type: 'Scheduled Commercial Banks',
        primary_topic: 'Third Party & Cloud Outsourcing',
        secondary_topics: ['Core Banking Outsourcing Ban', 'Unrestricted Audit Rights', 'Vendor Concentration Risk', 'Exit Strategy & Escrow'],
        ref_no: 'RBI/2022-23/159 DoS.CO.CSITE.SEC.No.8/31.01.015/2022-23',
        source_url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12486',
        status: 'active',
        has_update: false,
        applicability: 'Applicable',
        indexed_at: '2023-04-15T09:00:00Z',
        last_changed: '2023-04-10T09:00:00Z',
        raw_body_preview: 'Prohibits outsourcing of core management functions, mandates unhindered right of audit for RBI supervisors and bank auditors into cloud service provider facilities, and requires tested exit plans.'
      },
      {
        id: 'rbi:dpss:2021',
        regulator: 'RBI',
        doc_type: 'Master Direction',
        title: 'RBI Master Direction on Digital Payment Security Controls (2021/2024)',
        date: '2021-02-18',
        effective_date: '2021-08-18',
        department: 'Department of Payment and Settlement Systems (DPSS)',
        category: 'Commercial Banks & Payment Banks',
        institution_type: 'Scheduled Commercial Banks',
        primary_topic: 'Payment Systems Security',
        secondary_topics: ['Additional Factor of Authentication (AFA)', 'Cooling Period for Beneficiaries', 'Behavioral Biometrics', 'UPI Fraud Engine'],
        ref_no: 'RBI/2020-21/74 DPSS.CO.OD.No.753/06.11.001/2020-21',
        source_url: 'https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=12032',
        status: 'active',
        has_update: false,
        applicability: 'Applicable',
        indexed_at: '2021-02-20T10:00:00Z',
        last_changed: '2024-02-15T10:00:00Z',
        raw_body_preview: 'Enforces Multi-Factor Authentication for all digital payment channels, mandatory minimum 30-minute cooling period and transaction caps on newly added payees, velocity checks, and encrypted card storage.'
      }
    ];

    // Store docs
    [...samaDocs, ...rbiDocs].forEach((doc) => this.documents.set(doc.id, doc));

    // 5. Pre-seed SAMA Requirements & Mappings
    const samaReqsData = [
      {
        id: 'req:csf:01',
        doc_id: 'sama:csf:2026',
        clause_id: 'sama:csf:2026#SEC-3.1',
        clause_label: 'Section 3.1',
        clause_title: 'CISO Reporting Line & Board Risk Independence',
        requirement: 'The bank shall ensure that the Chief Information Security Officer (CISO) operates as an independent executive reporting directly to the Board Risk Committee and CEO, without operational conflict with IT delivery or commercial revenue functions.',
        obligation_type: 'Governance' as const,
        applicability: 'All Commercial Banks in KSA',
        branch_relevance: 'Low' as const,
        timeline: 'Effective 2026-10-01',
        keywords: ['ciso independence', 'board risk committee', 'governance', 'sama csf'],
        extracted_at: '2026-07-20T08:30:00Z',
        mapping: {
          req_id: 'req:csf:01',
          business_area: 'SAMA-BA-06',
          business_area_name: 'Cyber Security Framework (CSF) & SOC',
          policy: 'Cyber Security Governance Policy (POL-SAMA-CSF-01)',
          process: 'CISO Governance & Escalation Framework (PRC-SEC-01)',
          control: 'Direct Board Risk Committee Reporting Matrix & Non-Interference Charter (CTL-SEC-001)',
          control_type: 'Preventive' as const,
          owner_process: 'SAMA-OWN-01',
          owner_process_name: 'Chief Information Security Officer (CISO)',
          owner_process_line: 'Second line' as const,
          owner_control: 'SAMA-OWN-04',
          owner_control_name: 'Chief Risk Officer (CRO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['All Banking Systems', 'Board Secretariat'],
          tech_systems_impacted: ['GRC Portal', 'BoardVantage Portal'],
          evidence_required: 'Board Minutes approving CISO reporting charter & independent budget allocation.',
          classification: 'Compliant' as const,
          finding: 'CISO currently has documented direct reporting access to the Board Risk Committee.',
          recommendation: 'Formalize charter update in next quarterly Board Risk pack for SAMA supervision.',
          severity: 'High' as const,
          provenance: 'reviewed' as const,
          created_at: '2026-07-20T09:00:00Z',
          actions_count: 0
        }
      },
      {
        id: 'req:csf:02',
        doc_id: 'sama:csf:2026',
        clause_id: 'sama:csf:2026#SEC-4.8',
        clause_label: 'Section 4.8',
        clause_title: 'SAMA Cyber Threat Intelligence (CTI) 2-Hour Incident Notification',
        requirement: 'Regulated banks must immediately notify the SAMA Cyber Threat Intelligence (CTI) center within 2 hours of detecting any severity 1 or severity 2 cyber incident, denial of service attack, or confirmed data exposure via the SAMA CTI automated portal.',
        obligation_type: 'Timeline' as const,
        applicability: 'All Commercial & Digital Banks',
        branch_relevance: 'High' as const,
        timeline: 'Mandatory within 120 minutes of detection',
        keywords: ['cti reporting', '2 hours sla', 'cyber incident', 'sama alert'],
        extracted_at: '2026-07-20T08:35:00Z',
        mapping: {
          req_id: 'req:csf:02',
          business_area: 'SAMA-BA-06',
          business_area_name: 'Cyber Security Framework (CSF) & SOC',
          policy: 'Cyber Incident Response & Crisis Management Policy (POL-SAMA-SEC-04)',
          process: '24/7 SOC Critical Incident Escalation & SAMA CTI Dispatch (PRC-SOC-02)',
          control: 'Automated SIEM/SOAR Playbook with SAMA CTI Portal API Dispatcher (CTL-SOC-014)',
          control_type: 'Detective' as const,
          owner_process: 'SAMA-OWN-01',
          owner_process_name: 'Chief Information Security Officer (CISO)',
          owner_process_line: 'Second line' as const,
          owner_control: 'SAMA-OWN-02',
          owner_control_name: 'Chief Compliance Officer (CCO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Online Banking', 'Mobile Banking', 'SARIE Rails', 'ATM Network'],
          tech_systems_impacted: ['Splunk Enterprise Security', 'Palo Alto XSOAR', 'SAMA CTI Gateway'],
          evidence_required: 'Simulated 2-hour SOAR drill log, SAMA CTI dispatch receipt, and Incident Management SOP.',
          classification: 'Partially Compliant' as const,
          finding: 'SOC triggers alerts within 30 minutes, but formal SAMA CTI dispatch script requires manual CISO authorization taking ~150 mins.',
          recommendation: 'Configure automated pre-authorized SOAR dispatch workflow to guarantee SAMA notification within 90 minutes.',
          severity: 'Critical' as const,
          provenance: 'reviewed' as const,
          created_at: '2026-07-20T09:15:00Z',
          actions_count: 1
        }
      },
      {
        id: 'req:aml:01',
        doc_id: 'sama:aml:2026',
        clause_id: 'sama:aml:2026#ART-14.2',
        clause_label: 'Article 14.2',
        clause_title: '5% Beneficial Ownership (UBO) Threshold for Corporate Accounts',
        requirement: 'Financial institutions must identify, verify, and document the identity of all natural persons who ultimately own or control 5% or more of the capital or voting rights in any commercial corporate customer opening an account in the Kingdom.',
        obligation_type: 'Screening' as const,
        applicability: 'All Commercial Banks & Corporate Branches',
        branch_relevance: 'High' as const,
        timeline: 'Effective 2026-09-15',
        keywords: ['5% ubo', 'beneficial ownership', 'commercial registry', 'sama aml'],
        extracted_at: '2026-07-02T10:15:00Z',
        mapping: {
          req_id: 'req:aml:01',
          business_area: 'SAMA-BA-03',
          business_area_name: 'Customer Due Diligence (CDD) & KYC',
          policy: 'Corporate AML/CFT Customer Due Diligence Policy (POL-SAMA-AML-02)',
          process: 'Commercial Onboarding & Legal Entity Shareholder Verification (PRC-CORP-01)',
          control: 'Automated Corporate Registry (Wathq) & 5% UBO Shareholder Resolution Rule (CTL-AML-008)',
          control_type: 'Preventive' as const,
          owner_process: 'SAMA-OWN-03',
          owner_process_name: 'Money Laundering Reporting Officer (MLRO)',
          owner_process_line: 'Second line' as const,
          owner_control: 'SAMA-OWN-02',
          owner_control_name: 'Chief Compliance Officer (CCO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Corporate Current Accounts', 'Trade Finance', 'Treasury Facilities'],
          tech_systems_impacted: ['Oracle Flexcube CBS', 'Fenergo CLM', 'Wathq Ministry API'],
          evidence_required: 'CBS parameter screenshot (5% threshold), CLM UAT sign-off report, updated corporate onboarding SOP.',
          classification: 'Gap' as const,
          finding: 'Core Banking system (Flexcube) and corporate onboarding workflow still hardcoded to old 20% beneficial ownership threshold.',
          recommendation: 'Deploy CBS parameter update to enforce 5% threshold and re-screen top 2,000 corporate accounts.',
          severity: 'Critical' as const,
          provenance: 'reviewed' as const,
          created_at: '2026-07-02T10:45:00Z',
          actions_count: 1
        }
      },
      {
        id: 'req:cpr:01',
        doc_id: 'sama:cpr:2026',
        clause_id: 'sama:cpr:2026#PRIN-7',
        clause_label: 'Principle 7',
        clause_title: 'Debt Burden Ratio (DBR 33.33%) & Standardized APR Disclosure',
        requirement: 'Banks are strictly prohibited from approving salary-backed consumer personal loans where total monthly debt installments exceed 33.33% of verified net monthly salary (or 45% for residential mortgages), calculated via mandatory SIMAH inquiry.',
        obligation_type: 'Prudential' as const,
        applicability: 'All Commercial Retail Banks',
        branch_relevance: 'High' as const,
        timeline: 'Mandatory Continuous',
        keywords: ['debt burden ratio', 'dbr 33.33%', 'simah pull', 'consumer protection'],
        extracted_at: '2026-08-05T11:30:00Z',
        mapping: {
          req_id: 'req:cpr:01',
          business_area: 'SAMA-BA-12',
          business_area_name: 'Responsible Lending & APR / DBR Ceilings',
          policy: 'Retail Credit Risk & Responsible Lending Policy (POL-SAMA-RET-01)',
          process: 'Automated Loan Origination System (LOS) DBR Calculation & SIMAH Fetch (PRC-LOS-03)',
          control: 'Hard LOS Decisioning Gate Blocking DBR > 33.33% with No Manual Override (CTL-LOS-004)',
          control_type: 'Preventive' as const,
          owner_process: 'SAMA-OWN-05',
          owner_process_name: 'Head of Digital Banking & Channels',
          owner_process_line: 'First line' as const,
          owner_control: 'SAMA-OWN-04',
          owner_control_name: 'Chief Risk Officer (CRO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Personal Loans', 'Auto Murabaha', 'Credit Cards', 'Residential Mortgages'],
          tech_systems_impacted: ['Loan Origination System (LOS)', 'SIMAH B2B Gateway', 'Core Banking'],
          evidence_required: 'LOS business rule configuration dump, SIMAH real-time log samples, sample loan files audit.',
          classification: 'Compliant' as const,
          finding: 'LOS system hardcoded with 33.33% DBR ceiling; SIMAH score pull enforced on 100% of retail applications.',
          recommendation: 'Maintain quarterly sample audit to ensure no credit deviation bypass.',
          severity: 'High' as const,
          provenance: 'reviewed' as const,
          created_at: '2026-08-05T12:00:00Z',
          actions_count: 0
        }
      },
      {
        id: 'req:obk:01',
        doc_id: 'sama:obk:2026',
        clause_id: 'sama:obk:2026#SPEC-5.3',
        clause_label: 'Section 5.3',
        clause_title: 'FAPI 1.0 Advanced Security & mTLS for Open Banking PISP APIs',
        requirement: 'All Payment Initiation Service Provider (PISP) APIs exposed by the bank must comply with Financial-grade API (FAPI 1.0 Advanced) standards, requiring Mutual TLS (mTLS), cryptographic client assertion, and granular customer consent validation.',
        obligation_type: 'Cybersecurity' as const,
        applicability: 'All Commercial Banks',
        branch_relevance: 'Medium' as const,
        timeline: 'Effective 2026-12-01',
        keywords: ['open banking', 'pisp apis', 'fapi advanced', 'sama open banking'],
        extracted_at: '2026-05-20T10:00:00Z',
        mapping: {
          req_id: 'req:obk:01',
          business_area: 'SAMA-BA-09',
          business_area_name: 'Open Banking & Financial APIs',
          policy: 'Open Banking Security & API Architecture Standard (POL-SAMA-API-01)',
          process: 'FinTech Onboarding & API Key Rotation Lifecycle (PRC-API-01)',
          control: 'Kong API Gateway FAPI 1.0 mTLS Enforcement & Dynamic Consent Token Gate (CTL-API-009)',
          control_type: 'Preventive' as const,
          owner_process: 'SAMA-OWN-05',
          owner_process_name: 'Head of Digital Banking & Channels',
          owner_process_line: 'First line' as const,
          owner_control: 'SAMA-OWN-01',
          owner_control_name: 'Chief Information Security Officer (CISO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Open Banking APIs', 'Digital Wallet Integration'],
          tech_systems_impacted: ['Kong Enterprise API Gateway', 'WSO2 Identity Server', 'Open Banking KSA Sandbox'],
          evidence_required: 'Open Banking KSA sandbox conformance test certification, mTLS certificate chain audit.',
          classification: 'Partially Compliant' as const,
          finding: 'mTLS implemented on API gateway, but customer consent revocation callback requires integration with Mobile Banking app.',
          recommendation: 'Complete Mobile Banking consent dashboard integration before SAMA Phase 2 live audit.',
          severity: 'High' as const,
          provenance: 'reviewed' as const,
          created_at: '2026-05-20T10:30:00Z',
          actions_count: 1
        }
      }
    ];

    // 6. Pre-seed RBI Requirements & Mappings
    const rbiReqsData = [
      {
        id: 'rbi:req:itgov:01',
        doc_id: 'rbi:itgov:2023',
        clause_id: 'rbi:itgov:2023#CH-2.1',
        clause_label: 'Chapter II, Para 4',
        clause_title: 'IT Strategy Committee of the Board & Independent Review',
        requirement: 'The bank shall constitute an IT Strategy Committee of the Board headed by an Independent Director, meeting at least quarterly to review IT alignment, cyber posture, and high-value technology investments.',
        obligation_type: 'Governance' as const,
        applicability: 'All Scheduled Commercial Banks (India)',
        branch_relevance: 'Low' as const,
        timeline: 'Effective 2024-04-01',
        keywords: ['it strategy committee', 'board governance', 'independent director', 'rbi it gov'],
        extracted_at: '2023-11-10T10:30:00Z',
        mapping: {
          req_id: 'rbi:req:itgov:01',
          business_area: 'RBI-BA-01',
          business_area_name: 'IT Governance, Risk & Controls',
          policy: 'IT Governance & Board Oversight Policy (POL-RBI-ITG-01)',
          process: 'Quarterly Board IT Strategy Review Workflow (PRC-ITG-01)',
          control: 'Board IT Strategy Committee Charter & Quorum Verification (CTL-ITG-001)',
          control_type: 'Preventive' as const,
          owner_process: 'RBI-OWN-05',
          owner_process_name: 'Chief Technology Officer (CTO)',
          owner_process_line: 'First line' as const,
          owner_control: 'RBI-OWN-02',
          owner_control_name: 'Chief Compliance Officer (CCO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['All Bank Technology'],
          tech_systems_impacted: ['Board Portal', 'GRC Solution'],
          evidence_required: 'Board resolution constituting IT Strategy Committee with independent chair and quarterly meeting minutes.',
          classification: 'Compliant' as const,
          finding: 'IT Strategy Committee constituted with Independent Director as Chair; met 4 times in FY2025.',
          recommendation: 'Continue maintaining Board minutes and tracking action items for annual RBI RBS inspection.',
          severity: 'High' as const,
          provenance: 'reviewed' as const,
          created_at: '2023-11-10T11:00:00Z',
          actions_count: 0
        }
      },
      {
        id: 'rbi:req:kyc:01',
        doc_id: 'rbi:kyc:2016',
        clause_id: 'rbi:kyc:2016#SEC-56',
        clause_label: 'Section 56',
        clause_title: 'Central KYC Records Registry (CKYCR) 3-Day Upload SLA',
        requirement: 'Regulated entities shall capture the KYC information and upload the KYC record onto the Central KYC Records Registry (CKYCR) within 3 calendar days of commencement of an account-based relationship with the customer.',
        obligation_type: 'Timeline' as const,
        applicability: 'All Regulated Entities in India',
        branch_relevance: 'High' as const,
        timeline: 'Within 3 calendar days of onboarding',
        keywords: ['ckyc upload', 'cersai', '3 days timeline', 'rbi kyc'],
        extracted_at: '2024-01-10T08:30:00Z',
        mapping: {
          req_id: 'rbi:req:kyc:01',
          business_area: 'RBI-BA-03',
          business_area_name: 'KYC, CKYCR & Digital Customer Identification',
          policy: 'Master KYC & Customer Identification Policy (POL-RBI-KYC-01)',
          process: 'Automated CERSAI CKYC Batch Upload and Reconciliation (PRC-KYC-03)',
          control: 'Daily Automated CKYC SFTP Upload & ACK Reconciliation Job (CTL-KYC-005)',
          control_type: 'Detective' as const,
          owner_process: 'RBI-OWN-06',
          owner_process_name: 'Head of Digital Banking & Payments',
          owner_process_line: 'First line' as const,
          owner_control: 'RBI-OWN-03',
          owner_control_name: 'Principal Officer / MLRO (AML/CFT)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Savings Accounts', 'Current Accounts', 'Fixed Deposits', 'Credit Cards'],
          tech_systems_impacted: ['Finacle CBS', 'CERSAI CKYC Gateway', 'CRM Onboarding'],
          evidence_required: 'Daily SFTP upload logs, CKYC ACK reconciliation reports, and pending upload exception dashboard.',
          classification: 'Partially Compliant' as const,
          finding: '92% of retail customer CKYC uploads complete within 3 days; rural branch manual files experiencing 4-5 day delays.',
          recommendation: 'Implement automated centralized batch queue with auto-retry and real-time SMS alerts to branch operations.',
          severity: 'High' as const,
          provenance: 'reviewed' as const,
          created_at: '2024-01-10T09:00:00Z',
          actions_count: 1
        }
      },
      {
        id: 'rbi:req:csite:01',
        doc_id: 'rbi:csite:2016',
        clause_id: 'rbi:csite:2016#ANN-1',
        clause_label: 'Annex 1, Para 2',
        clause_title: 'Mandatory 2 to 6-Hour Cyber Security Incident Reporting to RBI & CERT-In',
        requirement: 'Banks shall report all unusual cyber security incidents (including ransomware, DDOS, unauthorized SWIFT/payment rail access, data breaches) to the RBI Cyber Security and Information Technology Examination Cell (CSITE) and CERT-In within 2 to 6 hours of occurrence.',
        obligation_type: 'Timeline' as const,
        applicability: 'All Commercial Banks',
        branch_relevance: 'High' as const,
        timeline: 'Within 2-6 hours of detection',
        keywords: ['csite reporting', 'cert-in', 'cyber incident', 'rbi circular'],
        extracted_at: '2023-01-15T11:30:00Z',
        mapping: {
          req_id: 'rbi:req:csite:01',
          business_area: 'RBI-BA-02',
          business_area_name: 'Cyber Security Framework & CSITE',
          policy: 'Cyber Incident Response & Crisis Escalation Policy (POL-RBI-SEC-02)',
          process: '24/7 SOC Critical Incident Escalation & Regulatory Dispatch (PRC-SEC-04)',
          control: 'SIEM Incident Triage & Automated CSITE/CERT-In Email Dispatch Formatter (CTL-SEC-011)',
          control_type: 'Detective' as const,
          owner_process: 'RBI-OWN-01',
          owner_process_name: 'Chief Information Security Officer (CISO)',
          owner_process_line: 'Second line' as const,
          owner_control: 'RBI-OWN-02',
          owner_control_name: 'Chief Compliance Officer (CCO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Internet Banking', 'Mobile Banking', 'NEFT/RTGS', 'UPI Switch'],
          tech_systems_impacted: ['Splunk SIEM', 'CrowdStrike EDR', 'Secure Email Gateway'],
          evidence_required: 'Simulated 2-hour reporting drill logs, sample CSITE notification acknowledgment receipts.',
          classification: 'Compliant' as const,
          finding: 'SOC playbooks aligned with CSITE format; bi-annual tabletop drills executed with zero SLA breaches.',
          recommendation: 'Ensure annual refresher training for newly onboarded Tier-1 SOC analysts.',
          severity: 'Critical' as const,
          provenance: 'reviewed' as const,
          created_at: '2023-01-15T12:00:00Z',
          actions_count: 0
        }
      },
      {
        id: 'rbi:req:dpss:01',
        doc_id: 'rbi:dpss:2021',
        clause_id: 'rbi:dpss:2021#SEC-4',
        clause_label: 'Section 4',
        clause_title: 'Mandatory Cooling Period & Velocity Limits for New Digital Beneficiaries',
        requirement: 'For newly added beneficiaries in Internet Banking, Mobile Banking, and UPI, banks must enforce a mandatory minimum 30-minute cooling period during which fund transfer limits are capped to prevent unauthorized account takeover.',
        obligation_type: 'Process' as const,
        applicability: 'All Commercial Banks & Payment Banks',
        branch_relevance: 'High' as const,
        timeline: 'Mandatory Continuous',
        keywords: ['cooling period', 'beneficiary addition', 'two factor auth', 'rbi dpss'],
        extracted_at: '2021-02-20T10:30:00Z',
        mapping: {
          req_id: 'rbi:req:dpss:01',
          business_area: 'RBI-BA-05',
          business_area_name: 'Digital Payment Security Controls (DPSS)',
          policy: 'Digital Payment Security & Fraud Risk Policy (POL-RBI-DPS-01)',
          process: 'Digital Beneficiary Addition & Velocity Control Lifecycle (PRC-DPS-02)',
          control: 'Core Banking Cooling Period Gate & Limit Enforcer (CTL-DPS-007)',
          control_type: 'Preventive' as const,
          owner_process: 'RBI-OWN-06',
          owner_process_name: 'Head of Digital Banking & Payments',
          owner_process_line: 'First line' as const,
          owner_control: 'RBI-OWN-01',
          owner_control_name: 'Chief Information Security Officer (CISO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Retail Internet Banking', 'Mobile Banking App', 'UPI Rails'],
          tech_systems_impacted: ['Finacle Core Banking', 'Payment Switch Gateway'],
          evidence_required: 'Core system parameter dump showing 30-min timer and ₹50,000 cap; UAT test scripts.',
          classification: 'Compliant' as const,
          finding: '30-minute cooling period and ₹50,000 cap strictly enforced across Internet & Mobile banking.',
          recommendation: 'Extend same cooling restrictions to corporate multi-user beneficiary addition workflows.',
          severity: 'High' as const,
          provenance: 'reviewed' as const,
          created_at: '2021-02-20T11:00:00Z',
          actions_count: 0
        }
      },
      {
        id: 'rbi:req:out:01',
        doc_id: 'rbi:outsourcing:2023',
        clause_id: 'rbi:outsourcing:2023#PARA-6',
        clause_label: 'Para 6',
        clause_title: 'Core Management Functions Outsourcing Prohibition & Unrestricted Audit Rights',
        requirement: 'Regulated entities shall not outsource core management functions (including internal audit, KYC compliance decisioning, credit appraisal). All IT outsourcing agreements must contain clauses granting unrestricted right of physical and electronic inspection to RBI supervisors and auditors.',
        obligation_type: 'Governance' as const,
        applicability: 'All Commercial Banks & NBFCs',
        branch_relevance: 'Medium' as const,
        timeline: 'Mandatory in all contracts',
        keywords: ['it outsourcing', 'core banking', 'unrestricted audit rights', 'rbi directive'],
        extracted_at: '2023-04-15T09:30:00Z',
        mapping: {
          req_id: 'rbi:req:out:01',
          business_area: 'RBI-BA-06',
          business_area_name: 'IT Outsourcing & Cloud Service Providers',
          policy: 'Information Technology Outsourcing Policy (POL-RBI-OUT-01)',
          process: 'Vendor Contracting & Mandatory Regulatory Clause Insertion (PRC-OUT-01)',
          control: 'Legal & Compliance Master Services Agreement (MSA) Clause Verification Gate (CTL-OUT-003)',
          control_type: 'Preventive' as const,
          owner_process: 'RBI-OWN-05',
          owner_process_name: 'Chief Technology Officer (CTO)',
          owner_process_line: 'First line' as const,
          owner_control: 'RBI-OWN-02',
          owner_control_name: 'Chief Compliance Officer (CCO)',
          owner_control_line: 'Second line' as const,
          products_impacted: ['Third-Party SaaS', 'Cloud Infrastructure', 'Vendor Contracts'],
          tech_systems_impacted: ['Vendor Management System (VMS)', 'Contract Repository'],
          evidence_required: 'Signed vendor MSAs with RBI audit right clause, annual vendor risk assessment reports.',
          classification: 'Gap' as const,
          finding: '3 legacy software vendor contracts lack explicit clauses allowing direct RBI supervisory on-site inspection.',
          recommendation: 'Execute mandatory contract addenda with legacy vendors within 45 days.',
          severity: 'High' as const,
          provenance: 'reviewed' as const,
          created_at: '2023-04-15T10:00:00Z',
          actions_count: 1
        }
      }
    ];

    // Store requirements and mappings
    [...samaReqsData, ...rbiReqsData].forEach((r) => {
      const { mapping, ...req } = r;
      this.requirements.set(req.id, req);
      if (mapping) {
        this.mappings.set(mapping.req_id, mapping);
      }
    });

    // 7. Pre-seed Remediation Actions for SAMA and RBI
    const actionsSeed: RemediationAction[] = [
      // SAMA Actions
      {
        id: 'ACT-SAMA-01',
        req_id: 'req:aml:01',
        requirement_summary: 'Identify, verify, and document identity of natural persons owning 5%+ beneficial ownership in corporate accounts.',
        title: 'Reconfigure Oracle Flexcube & Fenergo CLM for 5% Beneficial Ownership Threshold',
        description: 'Update CBS schema parameters and digital corporate onboarding validation rules from 20% to 5%. Re-screen existing commercial client database and upload revised SOP to 2nd Line Compliance.',
        owner_id: 'SAMA-OWN-05',
        owner_name: 'Khalid Al-Zahrani (Head of Digital Banking & Channels)',
        approver_id: 'SAMA-OWN-02',
        approver_name: 'Ahmed Al-Mansoor (Chief Compliance Officer)',
        status: 'In Progress',
        priority: 'Critical',
        due_date: '2026-09-10',
        target_quarter: 'Q3 2026',
        sla_status: 'On Track',
        created_at: '2026-07-05T10:00:00Z',
        updated_at: '2026-08-20T14:00:00Z',
        regulator: 'SAMA',
        milestones: [
          { title: 'Core Banking parameter update script approved in UAT', completed: true, target_date: '2026-08-15' },
          { title: 'Corporate CLM onboarding portal workflow patch deployment', completed: false, target_date: '2026-09-01' },
          { title: 'Independent 2nd Line Compliance validation signoff', completed: false, target_date: '2026-09-10' }
        ],
        evidence_items: [
          {
            id: 'EVD-SAMA-01',
            action_id: 'ACT-SAMA-01',
            file_name: 'Oracle_Flexcube_5pct_UBO_UAT_Signoff_Signed.pdf',
            file_type: 'application/pdf',
            file_size: 2450000,
            uploaded_at: '2026-08-16T11:30:00Z',
            uploaded_by: 'Khalid Al-Zahrani',
            sha256_hash: '9f83ab293847aef12345bcdef9876543210123456789abcdef0123456789abcd',
            status: 'Verified',
            verification_notes: 'Verified against SAMA AML/CFT Rules 2026 clause 14.2. UAT test results show 5% trigger verified.',
            verified_by: 'Ahmed Al-Mansoor (CCO)',
            verified_at: '2026-08-18T09:00:00Z'
          }
        ]
      },
      {
        id: 'ACT-SAMA-02',
        req_id: 'req:csf:02',
        requirement_summary: 'Regulated banks must immediately notify SAMA CTI center within 2 hours of detecting Sev 1/2 cyber incident.',
        title: 'Deploy Automated Palo Alto XSOAR Playbook for Instant SAMA CTI Portal XML Dispatch',
        description: 'Build automated SOAR integration with SAMA Cyber Threat Intelligence (CTI) API to trigger incident dispatch payload within 45 minutes of SIEM correlation alert.',
        owner_id: 'SAMA-OWN-01',
        owner_name: 'Fahad Al-Husseini (CISO)',
        approver_id: 'SAMA-OWN-02',
        approver_name: 'Ahmed Al-Mansoor (Chief Compliance Officer)',
        status: 'Assigned',
        priority: 'Critical',
        due_date: '2026-09-25',
        target_quarter: 'Q3 2026',
        sla_status: 'On Track',
        created_at: '2026-07-22T08:00:00Z',
        updated_at: '2026-08-10T12:00:00Z',
        regulator: 'SAMA',
        milestones: [
          { title: 'SAMA CTI API certificate configuration', completed: true, target_date: '2026-08-15' },
          { title: 'XSOAR simulated drill execution', completed: false, target_date: '2026-09-15' },
          { title: 'CISO emergency operational procedure update', completed: false, target_date: '2026-09-25' }
        ],
        evidence_items: []
      },
      {
        id: 'ACT-SAMA-03',
        req_id: 'req:obk:01',
        requirement_summary: 'FAPI 1.0 Advanced Security & mTLS for Open Banking PISP APIs with customer consent lifecycle.',
        title: 'Integrate Mobile Banking Customer Open Banking Consent Management Dashboard',
        description: 'Implement real-time consumer dashboard in Mobile Banking to view, approve, and instantly revoke Open Banking Payment Initiation Service (PISP) authorizations.',
        owner_id: 'SAMA-OWN-05',
        owner_name: 'Khalid Al-Zahrani (Head of Digital Banking & Channels)',
        approver_id: 'SAMA-OWN-04',
        approver_name: 'Dr. Tariq Al-Ghamdi (CRO)',
        status: 'In Progress',
        priority: 'High',
        due_date: '2026-11-15',
        target_quarter: 'Q4 2026',
        sla_status: 'On Track',
        created_at: '2026-05-25T11:00:00Z',
        updated_at: '2026-08-12T09:30:00Z',
        regulator: 'SAMA',
        milestones: [
          { title: 'Mobile UI Wireframes & SAMA Brand Guideline Approval', completed: true, target_date: '2026-06-30' },
          { title: 'OAuth2 Token Revocation API Integration', completed: true, target_date: '2026-08-10' },
          { title: 'End-to-end security penetration testing', completed: false, target_date: '2026-10-30' }
        ],
        evidence_items: []
      },

      // RBI Actions
      {
        id: 'ACT-RBI-01',
        req_id: 'rbi:req:kyc:01',
        requirement_summary: 'Upload KYC record onto CKYCR within 3 calendar days of customer account opening.',
        title: 'Automate CERSAI CKYC Real-Time API Gateway & Exception Queue for Rural Branches',
        description: 'Replace manual daily batch SFTP upload with real-time CKYCR API integration on Finacle core banking. Configure automated fallback retry and branch manager escalation alerts for pending documents.',
        owner_id: 'RBI-OWN-06',
        owner_name: 'Pooja Agarwal (Head of Digital Banking & Payments)',
        approver_id: 'RBI-OWN-03',
        approver_name: 'Sunil Nair (Principal Officer / MLRO)',
        status: 'In Progress',
        priority: 'High',
        due_date: '2026-09-30',
        target_quarter: 'Q3 2026',
        sla_status: 'On Track',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2026-08-15T11:00:00Z',
        regulator: 'RBI',
        milestones: [
          { title: 'CERSAI API connectivity in UAT environment', completed: true, target_date: '2026-06-30' },
          { title: 'Branch exception monitoring queue implementation', completed: true, target_date: '2026-08-10' },
          { title: 'Production rollout across all 850 branches', completed: false, target_date: '2026-09-30' }
        ],
        evidence_items: [
          {
            id: 'EVD-RBI-01',
            action_id: 'ACT-RBI-01',
            file_name: 'CERSAI_CKYC_API_UAT_Conformance_Report.pdf',
            file_type: 'application/pdf',
            file_size: 1890000,
            uploaded_at: '2026-08-12T14:20:00Z',
            uploaded_by: 'Pooja Agarwal',
            sha256_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678abcdef9012345678abcdef01',
            status: 'Verified',
            verification_notes: 'Verified compliance against RBI Master Direction KYC Para 56. 3-day upload SLA achieved in testing.',
            verified_by: 'Sunil Nair (MLRO)',
            verified_at: '2026-08-14T10:30:00Z'
          }
        ]
      },
      {
        id: 'ACT-RBI-02',
        req_id: 'rbi:req:out:01',
        requirement_summary: 'Execute mandatory vendor addenda ensuring unrestricted right of physical/electronic audit for RBI supervisors.',
        title: 'Execute Mandatory RBI Supervisory Audit Addenda for 3 Legacy IT Vendors',
        description: 'Issue formal legal amendments to legacy IT vendors (Data Center Co-location, SMS Gateway Provider, ATM Switch Maintenance) incorporating unconditional on-site audit inspection clauses for RBI and internal auditors.',
        owner_id: 'RBI-OWN-05',
        owner_name: 'Anand Kulkarni (Chief Technology Officer)',
        approver_id: 'RBI-OWN-02',
        approver_name: 'Meera Venkataraman (Chief Compliance Officer)',
        status: 'Assigned',
        priority: 'High',
        due_date: '2026-09-15',
        target_quarter: 'Q3 2026',
        sla_status: 'On Track',
        created_at: '2024-04-20T09:00:00Z',
        updated_at: '2026-08-01T15:00:00Z',
        regulator: 'RBI',
        milestones: [
          { title: 'Legal draft template vetted by Compliance', completed: true, target_date: '2026-07-15' },
          { title: 'Formal dispatch to vendor executive management', completed: true, target_date: '2026-08-01' },
          { title: 'Countersigned MSA execution and repository upload', completed: false, target_date: '2026-09-15' }
        ],
        evidence_items: []
      }
    ];

    actionsSeed.forEach((act) => this.actions.set(act.id, act));

    // 8. Pre-seed Audit Events
    this.auditEvents = [
      {
        id: 'EVT-001',
        timestamp: '2026-08-20T08:00:00Z',
        user_email: 'compliance.officer@bank.sa',
        user_name: 'Ahmed Al-Mansoor (CCO)',
        event_type: 'DOCUMENT_INGESTED',
        entity_type: 'document',
        entity_id: 'sama:csf:2026',
        entity_title: 'SAMA Cyber Security Framework (CSF v3.0)',
        details: 'Ingested SAMA CSF v3.0 publication from rulebook.sama.gov.sa with SHA-256 integrity verification.',
        regulator: 'SAMA'
      },
      {
        id: 'EVT-002',
        timestamp: '2026-08-20T08:15:00Z',
        user_email: 'gemini.engine@system',
        user_name: 'Gemini Regulatory AI Model',
        event_type: 'AI_ANALYSIS_COMPLETED',
        entity_type: 'document',
        entity_id: 'sama:csf:2026',
        entity_title: 'SAMA Cyber Security Framework (CSF v3.0)',
        details: 'Extracted 5 key statutory obligations and classified multi-dimensional impact across 1st & 2nd Lines.',
        regulator: 'SAMA'
      },
      {
        id: 'EVT-003',
        timestamp: '2026-08-20T09:30:00Z',
        user_email: 'compliance.officer@bank.sa',
        user_name: 'Ahmed Al-Mansoor (CCO)',
        event_type: 'ASSESSMENT_UPDATED',
        entity_type: 'requirement',
        entity_id: 'req:aml:01',
        entity_title: '5% Beneficial Ownership Threshold',
        details: 'Updated classification from Seeded to Reviewed: Confirmed Critical Gap in Oracle Flexcube CBS.',
        regulator: 'SAMA'
      },
      {
        id: 'EVT-004',
        timestamp: '2026-08-20T10:00:00Z',
        user_email: 'compliance.officer@bank.sa',
        user_name: 'Ahmed Al-Mansoor (CCO)',
        event_type: 'ACTION_CREATED',
        entity_type: 'action',
        entity_id: 'ACT-SAMA-01',
        entity_title: 'Reconfigure Oracle Flexcube & Fenergo CLM for 5% UBO',
        details: 'Assigned remediation action to Head of Digital Banking with due date 2026-09-10.',
        regulator: 'SAMA'
      },
      {
        id: 'EVT-005',
        timestamp: '2026-08-20T14:30:00Z',
        user_email: 'compliance.officer@bank.sa',
        user_name: 'Ahmed Al-Mansoor (CCO)',
        event_type: 'EVIDENCE_VERIFIED',
        entity_type: 'evidence',
        entity_id: 'EVD-SAMA-01',
        entity_title: 'Oracle_Flexcube_5pct_UBO_UAT_Signoff_Signed.pdf',
        details: 'Verified cryptographic SHA-256 evidence. UAT test results confirmed 5% trigger in core banking.',
        regulator: 'SAMA'
      },
      // RBI Events
      {
        id: 'EVT-101',
        timestamp: '2026-08-18T10:00:00Z',
        user_email: 'cco@bank.co.in',
        user_name: 'Meera Venkataraman (CCO)',
        event_type: 'DOCUMENT_INGESTED',
        entity_type: 'document',
        entity_id: 'rbi:itgov:2023',
        entity_title: 'RBI Master Direction — Information Technology Governance',
        details: 'Ingested Master Direction RBI/2023-24/107 from rbi.org.in with verified circular reference.',
        regulator: 'RBI'
      },
      {
        id: 'EVT-102',
        timestamp: '2026-08-18T14:20:00Z',
        user_email: 'mlro@bank.co.in',
        user_name: 'Sunil Nair (MLRO)',
        event_type: 'EVIDENCE_VERIFIED',
        entity_type: 'evidence',
        entity_id: 'EVD-RBI-01',
        entity_title: 'CERSAI_CKYC_API_UAT_Conformance_Report.pdf',
        details: 'Verified cryptographic SHA-256 evidence for CKYC API 3-day SLA compliance.',
        regulator: 'RBI'
      }
    ];
  }

  // --- QUERY & RETRIEVAL HELPERS ---

  public getDocuments(regulator?: RegulatoryRegime, filter?: { status?: string; department?: string; search?: string }): RegulatoryDocument[] {
    let docs = Array.from(this.documents.values());
    if (regulator) {
      docs = docs.filter((d) => d.regulator === regulator);
    }
    if (filter?.status && filter.status !== 'all') {
      docs = docs.filter((d) => d.status === filter.status);
    }
    if (filter?.department && filter.department !== 'all') {
      docs = docs.filter((d) => d.department === filter.department);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      docs = docs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.ref_no?.toLowerCase().includes(q) ||
          d.primary_topic?.toLowerCase().includes(q) ||
          d.department?.toLowerCase().includes(q)
      );
    }

    // Enrich with counts
    return docs.map((d) => {
      const docReqs = Array.from(this.requirements.values()).filter((r) => r.doc_id === d.id);
      const gaps = docReqs.filter((r) => {
        const m = this.mappings.get(r.id);
        return m?.classification === 'Gap';
      }).length;
      const actionsCount = Array.from(this.actions.values()).filter((a) => {
        const req = this.requirements.get(a.req_id);
        return req?.doc_id === d.id;
      }).length;

      return {
        ...d,
        requirements_count: docReqs.length,
        open_gaps_count: gaps,
        total_actions_count: actionsCount
      };
    });
  }

  public getAllDocuments(filter?: { regulator?: RegulatoryRegime; status?: string; department?: string; search?: string }): RegulatoryDocument[] {
    return this.getDocuments(filter?.regulator, filter);
  }

  public getDocumentById(id: string): {
    document: RegulatoryDocument | null;
    clauses: RegulatoryClause[];
    requirements: (RegulatoryRequirement & { mapping?: ReqMapping })[];
    actions: RemediationAction[];
  } {
    const doc = this.documents.get(id) || null;
    if (!doc) {
      return { document: null, clauses: [], requirements: [], actions: [] };
    }
    const clauses = Array.from(this.clauses.values()).filter((c) => c.doc_id === id);
    const reqs = Array.from(this.requirements.values())
      .filter((r) => r.doc_id === id)
      .map((r) => ({
        ...r,
        mapping: this.mappings.get(r.id)
      }));
    const actions = Array.from(this.actions.values()).filter((a) => {
      const r = this.requirements.get(a.req_id);
      return r?.doc_id === id;
    });

    return {
      document: doc,
      clauses,
      requirements: reqs,
      actions
    };
  }

  public addDocument(doc: RegulatoryDocument): RegulatoryDocument {
    this.documents.set(doc.id, doc);
    this.logAuditEvent({
      event_type: 'DOCUMENT_INGESTED',
      entity_type: 'document',
      entity_id: doc.id,
      entity_title: doc.title,
      details: `Ingested ${doc.regulator} regulatory document: "${doc.title}" (Ref: ${doc.ref_no || 'N/A'})`,
      regulator: doc.regulator
    });
    return doc;
  }

  public updateDocumentApplicability(id: string, override: string, reason: string, user: string): RegulatoryDocument | null {
    const doc = this.documents.get(id);
    if (!doc) return null;
    doc.applicability_override = override;
    doc.applicability_override_reason = reason;
    doc.applicability_overridden_by = user;
    doc.applicability_overridden_at = new Date().toISOString();
    this.documents.set(id, doc);

    this.logAuditEvent({
      event_type: 'TRIAGE_OVERRIDDEN',
      entity_type: 'document',
      entity_id: doc.id,
      entity_title: doc.title,
      details: `Applicability changed to "${override}". Justification: ${reason}`,
      regulator: doc.regulator
    });

    return doc;
  }

  public getRequirements(regulator?: RegulatoryRegime, filter?: {
    doc_id?: string;
    classification?: string;
    obligation_type?: string;
    business_area?: string;
    search?: string;
  }): (RegulatoryRequirement & { mapping?: ReqMapping })[] {
    let reqs = Array.from(this.requirements.values());

    if (regulator) {
      reqs = reqs.filter((r) => {
        const doc = this.documents.get(r.doc_id);
        return doc?.regulator === regulator;
      });
    }

    if (filter?.doc_id && filter.doc_id !== 'all') {
      reqs = reqs.filter((r) => r.doc_id === filter.doc_id);
    }
    if (filter?.obligation_type && filter.obligation_type !== 'all') {
      reqs = reqs.filter((r) => r.obligation_type === filter.obligation_type);
    }

    let enriched = reqs.map((r) => {
      const doc = this.documents.get(r.doc_id);
      const mapping = this.mappings.get(r.id);
      const actionsCount = Array.from(this.actions.values()).filter((a) => a.req_id === r.id).length;
      return {
        ...r,
        doc_title: doc?.title || r.doc_title,
        mapping: mapping ? { ...mapping, actions_count: actionsCount } : undefined
      };
    });

    if (filter?.classification && filter.classification !== 'all') {
      enriched = enriched.filter((r) => r.mapping?.classification === filter.classification);
    }

    if (filter?.business_area && filter.business_area !== 'all') {
      enriched = enriched.filter((r) => r.mapping?.business_area === filter.business_area);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      enriched = enriched.filter(
        (r) =>
          r.requirement.toLowerCase().includes(q) ||
          r.clause_label?.toLowerCase().includes(q) ||
          r.doc_title?.toLowerCase().includes(q) ||
          r.mapping?.control.toLowerCase().includes(q) ||
          r.mapping?.policy.toLowerCase().includes(q) ||
          r.mapping?.finding.toLowerCase().includes(q)
      );
    }

    return enriched;
  }

  public updateRequirementMapping(reqId: string, update: Partial<ReqMapping>, user: string): ReqMapping {
    const existing = this.mappings.get(reqId) || {
      req_id: reqId,
      business_area: 'SAMA-BA-01',
      business_area_name: 'Corporate Governance & Board Oversight',
      policy: '',
      process: '',
      control: '',
      control_type: 'Preventive',
      owner_process: 'SAMA-OWN-05',
      owner_process_line: 'First line',
      owner_control: 'SAMA-OWN-02',
      owner_control_line: 'Second line',
      evidence_required: '',
      classification: 'To Be Confirmed',
      finding: '',
      recommendation: '',
      severity: 'Medium',
      provenance: 'reviewed',
      created_at: new Date().toISOString(),
    };

    const updated: ReqMapping = {
      ...existing,
      ...update,
      reviewed_by: user,
      reviewed_at: new Date().toISOString(),
      provenance: 'reviewed'
    };

    this.mappings.set(reqId, updated);

    const req = this.requirements.get(reqId);
    const doc = req ? this.documents.get(req.doc_id) : undefined;

    this.logAuditEvent({
      event_type: 'ASSESSMENT_UPDATED',
      entity_type: 'requirement',
      entity_id: reqId,
      entity_title: req?.clause_label || reqId,
      details: `Compliance classification set to "${updated.classification}" (Severity: ${updated.severity}). Control: ${updated.control}`,
      regulator: doc?.regulator || 'SAMA'
    });

    return updated;
  }

  public getActions(regulator?: RegulatoryRegime, filter?: { status?: string; priority?: string; owner?: string; search?: string }): RemediationAction[] {
    let acts = Array.from(this.actions.values());

    if (regulator) {
      acts = acts.filter((a) => a.regulator === regulator);
    }

    if (filter?.status && filter.status !== 'all') {
      acts = acts.filter((a) => a.status === filter.status);
    }
    if (filter?.priority && filter.priority !== 'all') {
      acts = acts.filter((a) => a.priority === filter.priority);
    }
    if (filter?.owner && filter.owner !== 'all') {
      acts = acts.filter((a) => a.owner_id === filter.owner);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      acts = acts.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.owner_name.toLowerCase().includes(q) ||
          a.approver_name.toLowerCase().includes(q)
      );
    }
    return acts;
  }

  public addAction(action: RemediationAction): RemediationAction {
    this.actions.set(action.id, action);

    this.logAuditEvent({
      event_type: 'ACTION_CREATED',
      entity_type: 'action',
      entity_id: action.id,
      entity_title: action.title,
      details: `Created remediation action assigned to ${action.owner_name}. Target SLA: ${action.due_date}`,
      regulator: action.regulator || 'SAMA'
    });

    return action;
  }

  public updateAction(id: string, update: Partial<RemediationAction>, user: string): RemediationAction | null {
    const act = this.actions.get(id);
    if (!act) return null;

    const updated: RemediationAction = {
      ...act,
      ...update,
      updated_at: new Date().toISOString()
    };

    if (update.status && update.status !== act.status) {
      this.logAuditEvent({
        event_type: 'ACTION_STATUS_CHANGED',
        entity_type: 'action',
        entity_id: id,
        entity_title: act.title,
        details: `Status progressed from "${act.status}" to "${update.status}" by ${user}.`,
        regulator: act.regulator
      });
    }

    this.actions.set(id, updated);
    return updated;
  }

  public addEvidence(actionId: string, evidence: EvidenceItem, user: string): EvidenceItem | null {
    const act = this.actions.get(actionId);
    if (!act) return null;

    if (!act.evidence_items) {
      act.evidence_items = [];
    }
    act.evidence_items.push(evidence);
    act.updated_at = new Date().toISOString();
    this.actions.set(actionId, act);

    this.logAuditEvent({
      event_type: 'EVIDENCE_UPLOADED',
      entity_type: 'evidence',
      entity_id: evidence.id,
      entity_title: evidence.file_name,
      details: `Evidence uploaded for action ${act.id}. SHA-256: ${evidence.sha256_hash.slice(0, 16)}...`,
      regulator: act.regulator
    });

    return evidence;
  }

  public verifyEvidence(actionId: string, evidenceId: string, verification: { status: 'Verified' | 'Rejected'; notes?: string; verifier: string }): EvidenceItem | null {
    const act = this.actions.get(actionId);
    if (!act || !act.evidence_items) return null;

    const item = act.evidence_items.find((e) => e.id === evidenceId);
    if (!item) return null;

    item.status = verification.status;
    item.verification_notes = verification.notes;
    item.verified_by = verification.verifier;
    item.verified_at = new Date().toISOString();

    act.updated_at = new Date().toISOString();
    this.actions.set(actionId, act);

    this.logAuditEvent({
      event_type: 'EVIDENCE_VERIFIED',
      entity_type: 'evidence',
      entity_id: item.id,
      entity_title: item.file_name,
      details: `Evidence ${verification.status} by ${verification.verifier}. Notes: ${verification.notes || 'None'}`,
      regulator: act.regulator
    });

    return item;
  }

  public getExceptions(regulator?: RegulatoryRegime): ExceptionItem[] {
    const exceptions: ExceptionItem[] = [];
    const now = new Date();

    // 1. Critical Gaps
    const reqs = this.getRequirements(regulator);
    reqs.forEach((r) => {
      if (r.mapping?.classification === 'Gap' && (r.mapping.severity === 'Critical' || r.mapping.severity === 'High')) {
        const doc = this.documents.get(r.doc_id);
        exceptions.push({
          id: `EXC-GAP-${r.id}`,
          type: 'CRITICAL_GAP',
          title: `Critical Compliance Gap: ${r.clause_label || r.id}`,
          description: r.mapping.finding || r.requirement,
          severity: r.mapping.severity,
          entity_id: r.id,
          entity_type: 'requirement',
          created_at: r.extracted_at,
          regulator: doc?.regulator
        });
      }
    });

    // 2. Overdue Actions
    const acts = this.getActions(regulator);
    acts.forEach((a) => {
      const isPast = new Date(a.due_date) < now && a.status !== 'Closed';
      if (isPast) {
        exceptions.push({
          id: `EXC-ACT-${a.id}`,
          type: 'OVERDUE_ACTION',
          title: `Overdue Remediation Action: ${a.title}`,
          description: `Assigned to ${a.owner_name}, was due on ${a.due_date}. Current status: ${a.status}.`,
          severity: a.priority,
          entity_id: a.id,
          entity_type: 'action',
          created_at: a.created_at,
          regulator: a.regulator
        });
      }
    });

    // 3. New Publications with Updates
    const docs = this.getDocuments(regulator);
    docs.forEach((d) => {
      if (d.has_update) {
        exceptions.push({
          id: `EXC-DOC-${d.id}`,
          type: 'NEW_REGULATION',
          title: `Active Regulatory Alert: ${d.title}`,
          description: `Supervisory publication effective ${d.effective_date || d.date}. Requires 1st/2nd line gap assessment.`,
          severity: 'High',
          entity_id: d.id,
          entity_type: 'document',
          created_at: d.indexed_at,
          regulator: d.regulator
        });
      }
    });

    return exceptions;
  }

  public getDashboardStats(regulator: RegulatoryRegime = 'SAMA'): DashboardStats {
    const docs = this.getDocuments(regulator);
    const reqs = this.getRequirements(regulator);
    const acts = this.getActions(regulator);
    const excs = this.getExceptions(regulator);

    let compliant = 0;
    let partiallyCompliant = 0;
    let gap = 0;
    let toBeConfirmed = 0;

    const typeCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    const baStats: Record<string, { count: number; gaps: number }> = {};

    reqs.forEach((r) => {
      // Classification
      const c = r.mapping?.classification || 'To Be Confirmed';
      if (c === 'Compliant') compliant++;
      else if (c === 'Partially Compliant') partiallyCompliant++;
      else if (c === 'Gap') gap++;
      else toBeConfirmed++;

      // Type
      typeCounts[r.obligation_type] = (typeCounts[r.obligation_type] || 0) + 1;

      // Severity
      if (r.mapping?.severity) {
        severityCounts[r.mapping.severity] = (severityCounts[r.mapping.severity] || 0) + 1;
      }

      // Business Area
      const baName = r.mapping?.business_area_name || 'Unassigned';
      if (!baStats[baName]) {
        baStats[baName] = { count: 0, gaps: 0 };
      }
      baStats[baName].count++;
      if (c === 'Gap') {
        baStats[baName].gaps++;
      }
    });

    docs.forEach((d) => {
      const t = d.primary_topic || 'Other';
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });

    const activeActs = acts.filter((a) => a.status !== 'Closed').length;
    const now = new Date();
    const overdueActs = acts.filter((a) => new Date(a.due_date) < now && a.status !== 'Closed').length;

    let verifiedEvidence = 0;
    acts.forEach((a) => {
      a.evidence_items?.forEach((e) => {
        if (e.status === 'Verified') verifiedEvidence++;
      });
    });

    const totalAssessed = compliant + partiallyCompliant + gap;
    const compliancePercentage = totalAssessed > 0 ? Math.round(((compliant + partiallyCompliant * 0.5) / totalAssessed) * 100) : 0;

    return {
      total_documents: docs.length,
      total_obligations: reqs.length,
      compliant_count: compliant,
      partially_compliant_count: partiallyCompliant,
      gap_count: gap,
      to_be_confirmed_count: toBeConfirmed,
      compliance_percentage: compliancePercentage,
      active_actions: activeActs,
      overdue_actions: overdueActs,
      evidence_verified_count: verifiedEvidence,
      exceptions_count: excs.length,
      active_regime: regulator,
      documents_by_topic: Object.entries(topicCounts).map(([topic, count]) => ({ topic, count })),
      obligations_by_type: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
      obligations_by_business_area: Object.entries(baStats).map(([area, data]) => ({ area, count: data.count, gaps: data.gaps })),
      severity_distribution: Object.entries(severityCounts).map(([severity, count]) => ({ severity, count }))
    };
  }

  public getTaxonomies(regulator?: RegulatoryRegime): { business_areas: BusinessArea[]; owners: OwnerRole[] } {
    let bas = this.businessAreas;
    let ows = this.owners;
    if (regulator) {
      bas = bas.filter((b) => !b.regulator || b.regulator === regulator);
      ows = ows.filter((o) => !o.regulator || o.regulator === regulator);
    }
    return {
      business_areas: bas,
      owners: ows
    };
  }

  public getAuditTrail(regulator?: RegulatoryRegime, filter?: { entity_type?: string; user?: string; search?: string }): AuditEvent[] {
    let events = [...this.auditEvents].reverse();

    if (regulator) {
      events = events.filter((e) => !e.regulator || e.regulator === regulator);
    }

    if (filter?.entity_type && filter.entity_type !== 'all') {
      events = events.filter((e) => e.entity_type === filter.entity_type);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      events = events.filter(
        (e) =>
          e.details.toLowerCase().includes(q) ||
          e.user_name.toLowerCase().includes(q) ||
          e.entity_title?.toLowerCase().includes(q) ||
          e.event_type.toLowerCase().includes(q)
      );
    }
    return events;
  }

  public bulkCreateParsedClauses(
    docId: string,
    clauses: RegulatoryClause[],
    requirements: RegulatoryRequirement[],
    mappings: ReqMapping[]
  ) {
    clauses.forEach((c) => this.clauses.set(c.id, c));
    requirements.forEach((r) => this.requirements.set(r.id, r));
    mappings.forEach((m) => this.mappings.set(m.req_id, m));

    const doc = this.documents.get(docId);
    this.logAuditEvent({
      event_type: 'AI_ANALYSIS_COMPLETED',
      entity_type: 'document',
      entity_id: docId,
      entity_title: doc?.title || docId,
      details: `AI extracted ${requirements.length} obligations and generated initial multi-dimensional mappings.`,
      regulator: doc?.regulator || 'SAMA'
    });
  }

  private logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'user_email' | 'user_name'> & { user_email?: string; user_name?: string }) {
    const newEvent: AuditEvent = {
      id: `EVT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      user_email: event.user_email || 'compliance.officer@bank.portal',
      user_name: event.user_name || 'Compliance Officer',
      ...event
    };
    this.auditEvents.push(newEvent);
  }
}

export const regulatoryDataStore = new RegulatoryDataStore();
