export type ProcessMap = {
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
  hasContent?: boolean;
  process?: ProcessMap;
};

export type Category = {
  id: string;
  label: string;
  /** true = has a live process map; false/undefined = coming soon */
  hasContent?: boolean;
  subCategories: SubCategory[];
};

export const categories: Category[] = [
  // ── first after "See All" ──
  {
    id: "reporting-data-ai",
    label: "Reporting, Data & AI Strategy",
    subCategories: [
      { id: "flash-reports",       label: "Flash Reports & Performance Reporting", hasContent: true },
      { id: "ai-digital-strategy", label: "AI & Digital Strategy" },
      { id: "data-consolidation",  label: "Data Consolidation" },
    ],
  },
  {
    id: "tech-assessment",
    label: "Technology Assessment & Advisory",
    subCategories: [
      { id: "single-company",  label: "Single-Company Tech Assessment" },
      { id: "portfolio-wide",  label: "Portfolio-Wide Tech Advisory" },
    ],
  },
  {
    id: "it-due-diligence",
    label: "IT Due Diligence",
    subCategories: [
      { id: "ai-it-due-diligence", label: "AI IT Due Diligence", hasContent: true },
      { id: "pre-acquisition",     label: "Pre-Acquisition / M&A IT Due Diligence" },
      { id: "portfolio-level",     label: "Portfolio-Level Due Diligence Advisory" },
    ],
  },
  {
    id: "cybersecurity",
    label: "Cybersecurity & Compliance",
    subCategories: [
      { id: "maturity-assessment",   label: "Cybersecurity Maturity Assessment" },
      { id: "regulatory-compliance", label: "Regulatory & Framework Compliance" },
    ],
  },
  {
    id: "erp",
    label: "ERP / Systems Selection & Implementation",
    subCategories: [
      { id: "erp-advisory",          label: "ERP Advisory & Implementation" },
      { id: "specialized-selection", label: "Specialized System Selection (Non-ERP)" },
      { id: "operating-model",       label: "Operating Model & Process Transformation" },
    ],
  },
  {
    id: "internal-process",
    label: "Internal Process / Products",
    subCategories: [
      { id: "power-ai",               label: "Power AI",               hasContent: true },
      { id: "conceptual-model",       label: "Conceptual Model",       hasContent: true },
      { id: "neos-intelligence",      label: "Neos Intelligence",      hasContent: true },
    ],
  },
];
