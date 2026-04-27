export type ProcessRow = {
  timeline: string[];
  physicalEvidence: string[];
  customerActions: string[];
  onstageActions: string[];
  backstageActions: string[];
  supportingProcesses: string[];
  tools: string[];
  owners: {
    coreTeam: string[];
    executionTeam: string[];
    msps: string[];
  };
};

export type SubCategory = {
  id: string;
  label: string;
  process: ProcessRow;
};

export type Category = {
  id: string;
  label: string;
  subCategories: SubCategory[];
};

export const categories: Category[] = [
  {
    id: "tech-assessment",
    label: "Technology Assessment & Advisory",
    subCategories: [
      {
        id: "single-company",
        label: "Single-Company Tech Assessment",
        process: {
          timeline: ["Week 1–2: Kickoff & Discovery", "Week 3–4: Stakeholder Interviews", "Week 5–6: Analysis & Findings", "Week 7: Report & Readout"],
          physicalEvidence: ["Discovery questionnaire", "IT asset inventory", "Architecture diagrams", "Final assessment report", "Executive presentation deck"],
          customerActions: ["Complete intake questionnaire", "Provide system access", "Participate in interviews", "Review draft findings", "Attend final readout"],
          onstageActions: ["Facilitate kickoff meeting", "Conduct stakeholder interviews", "Document current-state architecture", "Present recommendations"],
          backstageActions: ["Internal scoring & benchmarking", "Peer comparison analysis", "Draft report preparation", "Quality review process"],
          supportingProcesses: ["Data collection & normalization", "Risk scoring framework", "Technology maturity model", "Report generation pipeline"],
          tools: ["Notion (project mgmt)", "Miro (diagrams)", "PowerPoint (deliverables)", "Excel (scoring models)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Software", "Solutions", "Data"],
            msps: ["IT", "Marketing", "Finance"],
          },
        },
      },
      {
        id: "portfolio-wide",
        label: "Portfolio-Wide Tech Advisory",
        process: {
          timeline: ["Month 1: Portfolio mapping", "Month 2: Cross-company analysis", "Month 3: Synergy identification", "Month 4: Strategic roadmap"],
          physicalEvidence: ["Portfolio technology matrix", "Cross-company benchmark report", "Technology synergy map", "Consolidated roadmap deck"],
          customerActions: ["Submit per-company data", "Designate portfolio leads", "Participate in cross-portfolio workshops", "Approve final roadmap"],
          onstageActions: ["Lead portfolio workshops", "Synthesize multi-company findings", "Present synergy opportunities", "Facilitate roadmap sessions"],
          backstageActions: ["Build portfolio-wide scoring model", "Consolidate multi-source data", "Cross-reference technology stacks", "Internal review cycles"],
          supportingProcesses: ["Portfolio data aggregation", "Technology overlap analysis", "ROI modeling", "Change management planning"],
          tools: ["Airtable (portfolio tracker)", "Tableau (visualization)", "Miro (strategy maps)", "Slack (team comms)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Solutions", "Data", "Design"],
            msps: ["IT", "Finance"],
          },
        },
      },
      {
        id: "cyber-compliance-advisory",
        label: "Cybersecurity & Compliance",
        process: {
          timeline: ["Week 1: Scope definition", "Week 2–3: Security review", "Week 4: Gap analysis", "Week 5: Remediation plan"],
          physicalEvidence: ["Security posture report", "Gap analysis document", "Compliance checklist", "Remediation roadmap"],
          customerActions: ["Share security policies", "Provide network diagrams", "Participate in walkthroughs", "Review remediation plan"],
          onstageActions: ["Conduct security interviews", "Review existing controls", "Perform gap analysis", "Present findings & recommendations"],
          backstageActions: ["Threat modeling sessions", "Internal control testing", "NIST/ISO framework mapping", "Report drafting"],
          supportingProcesses: ["Security questionnaire framework", "Vulnerability scoring", "Compliance mapping library", "Risk register maintenance"],
          tools: ["Qualys (vulnerability mgmt)", "Vanta (compliance)", "Jira (issue tracking)", "Confluence (documentation)"],
          owners: {
            coreTeam: ["Zayd", "Josh"],
            executionTeam: ["Software", "Data"],
            msps: ["IT", "Finance"],
          },
        },
      },
    ],
  },
  {
    id: "it-due-diligence",
    label: "IT Due Diligence",
    subCategories: [
      {
        id: "pre-loi",
        label: "Pre-LOI Assessment",
        process: {
          timeline: ["Days 1–3: Initial screen", "Days 4–7: Red flag review", "Day 8: Summary memo"],
          physicalEvidence: ["IT red flag memo", "High-level tech stack overview", "Key risk summary"],
          customerActions: ["Provide CIM / data room access", "Respond to clarifying questions", "Review summary memo"],
          onstageActions: ["Review data room materials", "Identify critical IT risks", "Draft executive summary"],
          backstageActions: ["Benchmarking against deal comps", "Internal risk scoring", "Memo drafting & review"],
          supportingProcesses: ["Deal screening framework", "Red flag identification checklist", "Risk tiering model"],
          tools: ["Datasite (VDR)", "Excel (analysis)", "Word (memos)", "Teams (comms)"],
          owners: {
            coreTeam: ["Zayd", "Josh"],
            executionTeam: ["Solutions", "Data"],
            msps: ["IT"],
          },
        },
      },
      {
        id: "post-loi",
        label: "Post-LOI Deep Dive",
        process: {
          timeline: ["Week 1–2: Deep discovery", "Week 3: Technical interviews", "Week 4–5: Analysis", "Week 6: Full DD report"],
          physicalEvidence: ["IT due diligence report", "Technology risk register", "Carve-out / integration considerations", "IT cost model"],
          customerActions: ["Provide full system access", "Make IT team available", "Respond to detailed RFIs", "Review findings"],
          onstageActions: ["Conduct deep-dive interviews", "Review code, infrastructure, contracts", "Assess IT team capability", "Present full findings"],
          backstageActions: ["Detailed architecture analysis", "Contract review", "Cost modeling", "Integration risk assessment"],
          supportingProcesses: ["IT due diligence workplan", "RFI management process", "Risk prioritization framework", "Report QA process"],
          tools: ["Datasite (VDR)", "Jira (workplan)", "Excel (cost models)", "PowerPoint (report)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Software", "Solutions", "Data"],
            msps: ["IT", "Finance"],
          },
        },
      },
      {
        id: "integration-planning",
        label: "Integration Planning",
        process: {
          timeline: ["Month 1: Integration strategy", "Month 2: Workstream planning", "Month 3: Day-1 readiness", "Month 4+: Execution"],
          physicalEvidence: ["IT integration playbook", "Day-1 readiness checklist", "Integration project plan", "Synergy tracking dashboard"],
          customerActions: ["Align on integration priorities", "Assign integration leads", "Complete readiness assessments", "Approve integration plan"],
          onstageActions: ["Facilitate integration workshops", "Define workstreams", "Build integration project plan", "Track milestones"],
          backstageActions: ["Dependency mapping", "Risk & issue logging", "Synergy quantification", "Vendor coordination"],
          supportingProcesses: ["Integration management office (IMO)", "Status reporting cadence", "Change management process", "Escalation protocols"],
          tools: ["Monday.com (PMO)", "Miro (workstreams)", "Excel (synergy tracking)", "Zoom (meetings)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Software", "Solutions", "Data", "Design"],
            msps: ["IT", "Marketing", "Finance"],
          },
        },
      },
    ],
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity & Compliance",
    subCategories: [
      {
        id: "risk-assessment",
        label: "Risk Assessment",
        process: {
          timeline: ["Week 1: Scoping", "Week 2–3: Risk identification", "Week 4: Analysis & scoring", "Week 5: Remediation roadmap"],
          physicalEvidence: ["Risk register", "Threat landscape report", "Risk scoring matrix", "Remediation roadmap"],
          customerActions: ["Define risk appetite", "Provide asset inventory", "Review risk register", "Approve remediation plan"],
          onstageActions: ["Facilitate risk workshops", "Conduct asset interviews", "Score & prioritize risks", "Present findings"],
          backstageActions: ["Threat intelligence gathering", "Risk modeling", "CVSS scoring", "Internal benchmarking"],
          supportingProcesses: ["Risk assessment framework", "Asset classification process", "Threat modeling methodology", "Reporting cadence"],
          tools: ["RiskLens (risk quantification)", "Nessus (vuln scanning)", "Excel (risk register)", "PowerPoint (report)"],
          owners: {
            coreTeam: ["Zayd", "Josh"],
            executionTeam: ["Software", "Data"],
            msps: ["IT"],
          },
        },
      },
      {
        id: "compliance-audit",
        label: "Compliance Audit",
        process: {
          timeline: ["Week 1–2: Scoping & controls inventory", "Week 3–4: Evidence collection", "Week 5: Gap analysis", "Week 6: Audit report"],
          physicalEvidence: ["Controls inventory", "Evidence package", "Gap analysis report", "Audit findings report"],
          customerActions: ["Designate compliance lead", "Provide evidence & documentation", "Respond to auditor inquiries", "Review draft findings"],
          onstageActions: ["Review controls documentation", "Test control effectiveness", "Identify gaps", "Present audit findings"],
          backstageActions: ["Framework mapping (SOC 2, ISO 27001, etc.)", "Control testing workpapers", "Evidence organization", "Report drafting"],
          supportingProcesses: ["Evidence collection process", "Control testing methodology", "Deficiency classification", "Remediation tracking"],
          tools: ["Vanta (compliance automation)", "Drata (evidence collection)", "Excel (gap tracker)", "Confluence (documentation)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Software", "Solutions", "Data"],
            msps: ["IT", "Finance"],
          },
        },
      },
      {
        id: "security-architecture",
        label: "Security Architecture",
        process: {
          timeline: ["Month 1: Current-state assessment", "Month 2: Future-state design", "Month 3: Implementation roadmap", "Month 4+: Build & deploy"],
          physicalEvidence: ["Current-state architecture diagram", "Future-state blueprint", "Security architecture playbook", "Implementation roadmap"],
          customerActions: ["Share existing architecture", "Define security objectives", "Review future-state design", "Approve implementation plan"],
          onstageActions: ["Assess current architecture", "Design future-state blueprint", "Define security controls", "Present architecture recommendations"],
          backstageActions: ["Zero-trust framework design", "Network segmentation planning", "Identity & access management design", "Vendor evaluation"],
          supportingProcesses: ["Architecture review board process", "Design documentation standards", "Security control catalog", "Vendor RFP process"],
          tools: ["Lucidchart (architecture diagrams)", "AWS/Azure (cloud platforms)", "Okta (IAM)", "Palo Alto (network security)"],
          owners: {
            coreTeam: ["Zayd", "Josh"],
            executionTeam: ["Software", "Solutions", "Data"],
            msps: ["IT"],
          },
        },
      },
    ],
  },
  {
    id: "erp",
    label: "ERP / Systems Selection & Implementation",
    subCategories: [
      {
        id: "needs-analysis",
        label: "Needs Analysis",
        process: {
          timeline: ["Week 1–2: Business process mapping", "Week 3: Requirements gathering", "Week 4: Prioritization workshop", "Week 5: Requirements document"],
          physicalEvidence: ["Business process maps", "Requirements document", "Vendor shortlist criteria", "Prioritized feature matrix"],
          customerActions: ["Provide process documentation", "Participate in workshops", "Review & validate requirements", "Approve requirements document"],
          onstageActions: ["Facilitate process mapping sessions", "Conduct requirements interviews", "Build requirements document", "Lead prioritization workshop"],
          backstageActions: ["Process documentation review", "Best-practice benchmarking", "Requirements synthesis", "Internal review cycles"],
          supportingProcesses: ["Business process mapping methodology", "Requirements management process", "Stakeholder alignment cadence", "Document version control"],
          tools: ["Miro (process mapping)", "Confluence (documentation)", "Excel (requirements matrix)", "Zoom (workshops)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Solutions", "Data"],
            msps: ["IT", "Finance"],
          },
        },
      },
      {
        id: "vendor-selection",
        label: "Vendor Selection",
        process: {
          timeline: ["Week 1–2: RFP development", "Week 3–4: Vendor demos", "Week 5: Scoring & evaluation", "Week 6: Vendor recommendation"],
          physicalEvidence: ["RFP document", "Demo scorecards", "Vendor comparison matrix", "Selection recommendation report"],
          customerActions: ["Review & approve RFP", "Attend vendor demos", "Participate in scoring", "Make final vendor selection"],
          onstageActions: ["Develop & distribute RFP", "Facilitate vendor demos", "Score vendor responses", "Present recommendation"],
          backstageActions: ["Vendor market scan", "Reference checks", "Scoring model development", "Commercial benchmarking"],
          supportingProcesses: ["RFP management process", "Demo facilitation playbook", "Vendor scoring methodology", "Contract negotiation support"],
          tools: ["Excel (scoring matrix)", "Gartner (market research)", "DocuSign (contracts)", "Teams (vendor comms)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Software", "Solutions"],
            msps: ["IT", "Finance"],
          },
        },
      },
      {
        id: "implementation",
        label: "Implementation & Rollout",
        process: {
          timeline: ["Month 1–2: System configuration", "Month 3: Data migration", "Month 4: UAT & training", "Month 5: Go-live & stabilization"],
          physicalEvidence: ["Implementation project plan", "Configuration workbook", "Data migration runbook", "Training materials", "Go-live checklist"],
          customerActions: ["Assign super users", "Complete data cleansing", "Conduct UAT testing", "Participate in training", "Sign off on go-live"],
          onstageActions: ["Configure & customize system", "Facilitate data migration", "Manage UAT process", "Deliver user training", "Manage go-live"],
          backstageActions: ["System configuration", "Data transformation & validation", "Integration development", "Performance testing", "Hypercare support"],
          supportingProcesses: ["Agile project management", "Change management & comms", "Data governance process", "Incident management", "Hypercare protocol"],
          tools: ["SAP / NetSuite / Dynamics (ERP)", "Jira (project mgmt)", "Celigo (integrations)", "Loom (training videos)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Software", "Solutions", "Data", "Design"],
            msps: ["IT", "Marketing", "Finance"],
          },
        },
      },
    ],
  },
  {
    id: "reporting-data-ai",
    label: "Reporting, Data & AI Strategy",
    subCategories: [
      {
        id: "data-audit",
        label: "Data Audit",
        process: {
          timeline: ["Week 1–2: Data source inventory", "Week 3: Quality assessment", "Week 4: Gap analysis", "Week 5: Data improvement roadmap"],
          physicalEvidence: ["Data source catalog", "Data quality scorecard", "Data gap analysis report", "Data improvement roadmap"],
          customerActions: ["Identify data owners", "Provide data samples", "Review quality findings", "Approve improvement roadmap"],
          onstageActions: ["Inventory data sources", "Profile data quality", "Identify gaps & risks", "Present findings & roadmap"],
          backstageActions: ["Automated data profiling", "Lineage mapping", "Quality rule development", "Benchmark against best practices"],
          supportingProcesses: ["Data cataloging process", "Data quality scoring methodology", "Data governance framework", "Roadmap prioritization"],
          tools: ["Alation (data catalog)", "dbt (data transformation)", "Great Expectations (quality)", "Tableau (profiling)"],
          owners: {
            coreTeam: ["Zayd", "Josh"],
            executionTeam: ["Data", "Solutions"],
            msps: ["IT", "Finance"],
          },
        },
      },
      {
        id: "analytics-strategy",
        label: "Analytics Strategy",
        process: {
          timeline: ["Month 1: Current-state assessment", "Month 2: Future-state visioning", "Month 3: Analytics roadmap", "Month 4: Quick wins delivery"],
          physicalEvidence: ["Analytics maturity assessment", "KPI framework", "Analytics roadmap", "Dashboard mockups"],
          customerActions: ["Define key business questions", "Identify KPI owners", "Review dashboard prototypes", "Approve analytics roadmap"],
          onstageActions: ["Assess analytics maturity", "Facilitate KPI workshops", "Design dashboard mockups", "Present analytics roadmap"],
          backstageActions: ["Maturity model scoring", "KPI library development", "Prototype dashboard builds", "Vendor evaluation for BI tools"],
          supportingProcesses: ["KPI definition & governance", "Dashboard development lifecycle", "Self-service analytics enablement", "Reporting cadence design"],
          tools: ["Tableau / Power BI (visualization)", "Looker (embedded analytics)", "Snowflake (data warehouse)", "dbt (transformation)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Data", "Design", "Solutions"],
            msps: ["IT", "Finance"],
          },
        },
      },
      {
        id: "ai-roadmap",
        label: "AI Roadmap",
        process: {
          timeline: ["Month 1: AI readiness assessment", "Month 2: Use case identification", "Month 3: Prioritization & business case", "Month 4: Pilot design"],
          physicalEvidence: ["AI readiness scorecard", "Use case inventory", "Business case documents", "Pilot project charter", "AI governance framework"],
          customerActions: ["Define AI ambitions", "Identify use case candidates", "Review business cases", "Select pilot use cases", "Approve AI governance policy"],
          onstageActions: ["Assess AI readiness", "Facilitate use case workshops", "Develop business cases", "Design pilot program", "Present AI roadmap"],
          backstageActions: ["AI/ML feasibility assessments", "Data readiness evaluation", "Build vs. buy analysis", "Risk & ethics review", "Vendor landscape scan"],
          supportingProcesses: ["AI governance framework", "Use case scoring methodology", "MLOps pipeline design", "Model monitoring process"],
          tools: ["OpenAI / Azure AI (LLMs)", "Python / Jupyter (modeling)", "Databricks (ML platform)", "MLflow (model management)"],
          owners: {
            coreTeam: ["Zayd", "Josh", "Mo"],
            executionTeam: ["Software", "Data", "Solutions"],
            msps: ["IT"],
          },
        },
      },
    ],
  },
];
