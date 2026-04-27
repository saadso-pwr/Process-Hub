import React, { useState } from "react";
import { categories, Category, SubCategory } from "./dashboard-data";
import imgPowerTechColor2 from "../../imports/V6UnifiedIntelliPlatformFlat/626497650540f79867391e3261f9bb174fe3e37b.png";

const BRAND_BLUE = "#00037C";

// ---- Header ----
function Header() {
  return (
    <div className="flex items-center gap-4 py-4 px-6 border-b border-black">
      <div className="relative h-[50px] w-[156px] shrink-0 overflow-hidden">
        <img
          alt="Power Technology"
          className="absolute h-[560%] left-[-77%] max-w-none top-[-230%] w-[254%]"
          src={imgPowerTechColor2}
        />
      </div>
      <div className="h-12 w-px bg-[#B7B7B7]" />
      <h1
        className="text-black whitespace-nowrap"
        style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "28px" }}
      >
        Offerings Process Maps
      </h1>
    </div>
  );
}

// ---- Category Button ----
function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[12px] px-3 py-2 border transition-all duration-150 cursor-pointer"
      style={{
        borderColor: active ? BRAND_BLUE : "#000",
        backgroundColor: active ? BRAND_BLUE : "transparent",
        color: active ? "#fff" : "#000",
        fontFamily: "'Manrope', sans-serif",
        fontWeight: active ? 700 : 400,
        fontSize: "12px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ---- Sub-Category Button ----
function SubCategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-[12px] px-3 py-2 border transition-all duration-150 cursor-pointer"
      style={{
        borderColor: active ? BRAND_BLUE : "#000",
        backgroundColor: active ? `${BRAND_BLUE}15` : "transparent",
        color: active ? BRAND_BLUE : "#000",
        fontFamily: "'Manrope', sans-serif",
        fontWeight: active ? 700 : 400,
        fontSize: "12px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ---- Tag Pill ----
function Tag({ label }: { label: string }) {
  return (
    <span
      className="inline-block rounded-full px-3 py-1 border border-black text-[12px] whitespace-nowrap"
      style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 600, color: "#000" }}
    >
      {label}
    </span>
  );
}

// ---- Process Step Card ----
function ProcessSteps({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 items-start">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px]"
          style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, color: "#333", maxWidth: "220px" }}
        >
          <span
            className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white"
            style={{ backgroundColor: BRAND_BLUE, fontWeight: 700 }}
          >
            {i + 1}
          </span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Row Section ----
function ProcessRow({
  label,
  subtitle,
  children,
  accent,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="flex gap-6 items-start py-5 border-b border-black"
      style={{ background: accent ? `${BRAND_BLUE}05` : "transparent" }}
    >
      {/* Left label */}
      <div className="w-[200px] shrink-0">
        <p
          className="uppercase tracking-[3px] leading-tight"
          style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "13px", color: "#000" }}
        >
          {label}
        </p>
        {subtitle && (
          <p
            className="mt-1"
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: "11px", color: "#666" }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {/* Content area */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ---- Owners Row ----
function OwnersRow({ owners }: { owners: { coreTeam: string[]; executionTeam: string[]; msps: string[] } }) {
  return (
    <div className="flex gap-4 flex-wrap">
      {[
        { title: "Core Team", members: owners.coreTeam },
        { title: "Execution Team", members: owners.executionTeam },
        { title: "MSPs", members: owners.msps },
      ].map((group) => (
        <div
          key={group.title}
          className="flex-1 min-w-[180px] border border-black rounded-lg p-4 flex flex-col gap-3"
        >
          <p
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "16px", color: "#000" }}
          >
            {group.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.members.map((m) => (
              <Tag key={m} label={m} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Empty State ----
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-24 text-gray-400 text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {message}
    </div>
  );
}

// ---- Main Dashboard ----
export function ProcessDashboard() {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const activeCategory: Category | undefined = categories.find((c) => c.id === activeCategoryId);
  const activeSubCategory: SubCategory | undefined = activeCategory?.subCategories.find(
    (s) => s.id === activeSubCategoryId
  );

  const handleCategoryClick = (id: string) => {
    if (activeCategoryId === id && !showAll) {
      setActiveCategoryId(null);
      setActiveSubCategoryId(null);
    } else {
      setShowAll(false);
      setActiveCategoryId(id);
      setActiveSubCategoryId(null);
    }
  };

  const handleSubCategoryClick = (id: string) => {
    setActiveSubCategoryId(activeSubCategoryId === id ? null : id);
  };

  const handleSeeAll = () => {
    setShowAll(true);
    setActiveCategoryId(null);
    setActiveSubCategoryId(null);
  };

  const process = activeSubCategory?.process;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Filters */}
      <div className="px-6 py-4 border-b border-black flex flex-col gap-4">
        {/* Category row */}
        <div className="flex flex-col gap-2">
          <p
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "12px", color: "#000" }}
          >
            Choose Category:
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleSeeAll}
              className="rounded-[12px] px-3 py-2 border flex items-center gap-2 transition-all duration-150 cursor-pointer"
              style={{
                borderColor: showAll ? BRAND_BLUE : "#000",
                backgroundColor: showAll ? BRAND_BLUE : "transparent",
                color: showAll ? "#fff" : "#000",
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <rect x="0" y="0" width="11" height="1.5" rx="0.75" fill={showAll ? "#fff" : "#333430"} />
                <rect x="0" y="3" width="11" height="1.5" rx="0.75" fill={showAll ? "#fff" : "#333430"} />
                <rect x="0" y="6" width="8" height="1.5" rx="0.75" fill={showAll ? "#fff" : "#333430"} />
              </svg>
              See All
            </button>
            {categories.map((cat) => (
              <CategoryButton
                key={cat.id}
                label={cat.label}
                active={activeCategoryId === cat.id && !showAll}
                onClick={() => handleCategoryClick(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Sub-category row */}
        <div className="flex flex-col gap-2">
          <p
            style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "12px", color: "#000" }}
          >
            Choose Sub-Category:
          </p>
          {activeCategory ? (
            <div className="flex flex-wrap gap-3">
              {activeCategory.subCategories.map((sub) => (
                <SubCategoryButton
                  key={sub.id}
                  label={sub.label}
                  active={activeSubCategoryId === sub.id}
                  onClick={() => handleSubCategoryClick(sub.id)}
                />
              ))}
            </div>
          ) : (
            <p
              className="italic"
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: "12px", color: "#999" }}
            >
              Select a category above to view sub-categories.
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-[3px] mx-6 my-0" style={{ backgroundColor: BRAND_BLUE }} />

      {/* Process Map Table */}
      <div className="px-6 py-2 flex-1">
        {/* Show All view */}
        {showAll && (
          <div className="py-4">
            <p
              className="mb-4"
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "18px", color: "#000" }}
            >
              All Offerings
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="border border-black rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setShowAll(false);
                    setActiveCategoryId(cat.id);
                    setActiveSubCategoryId(null);
                  }}
                >
                  <p
                    className="mb-3"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "14px", color: BRAND_BLUE }}
                  >
                    {cat.label}
                  </p>
                  <div className="flex flex-col gap-1">
                    {cat.subCategories.map((sub) => (
                      <p
                        key={sub.id}
                        className="cursor-pointer hover:underline"
                        style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: "12px", color: "#444" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAll(false);
                          setActiveCategoryId(cat.id);
                          setActiveSubCategoryId(sub.id);
                        }}
                      >
                        → {sub.label}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No selection prompt */}
        {!showAll && !activeCategoryId && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_BLUE}15` }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h10" stroke={BRAND_BLUE} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "18px", color: "#000" }}
            >
              Select a Category to Get Started
            </p>
            <p
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: "14px", color: "#666" }}
            >
              Choose a category and sub-category above to view the process map.
            </p>
          </div>
        )}

        {/* Category selected but no sub-category */}
        {!showAll && activeCategoryId && !activeSubCategoryId && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_BLUE}15` }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke={BRAND_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "18px", color: "#000" }}
            >
              {activeCategory?.label}
            </p>
            <p
              style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: "14px", color: "#666" }}
            >
              Now select a sub-category to view the detailed process map.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {activeCategory?.subCategories.map((sub) => (
                <SubCategoryButton
                  key={sub.id}
                  label={sub.label}
                  active={false}
                  onClick={() => setActiveSubCategoryId(sub.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Full process map */}
        {!showAll && process && activeSubCategory && (
          <div>
            {/* Breadcrumb */}
            <div className="py-3 flex items-center gap-2">
              <span
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: "12px", color: "#666" }}
              >
                {activeCategory?.label}
              </span>
              <span style={{ color: "#999" }}>›</span>
              <span
                style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: "12px", color: BRAND_BLUE }}
              >
                {activeSubCategory.label}
              </span>
            </div>

            <div className="border border-black rounded-none overflow-hidden">
              <div className="px-4">
                <ProcessRow label="Timeline">
                  <ProcessSteps items={process.timeline} />
                </ProcessRow>

                <ProcessRow label="Physical Evidence" subtitle="Key artifacts & deliverables" accent>
                  <div className="flex flex-wrap gap-2">
                    {process.physicalEvidence.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]"
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontWeight: 400,
                          color: "#333",
                          borderColor: "#ccc",
                          backgroundColor: "#f9f9f9",
                        }}
                      >
                        <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                          <path d="M2 0h4l4 4v8H0V0h2z" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="0.5" />
                          <path d="M6 0v4h4" fill="none" stroke="#9CA3AF" strokeWidth="0.5" />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                </ProcessRow>

                <ProcessRow label="Customer Actions">
                  <div className="flex flex-col gap-2">
                    {process.customerActions.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span
                          className="mt-0.5 shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center"
                          style={{ borderColor: "#ccc" }}
                        >
                          <span className="text-[9px]" style={{ color: BRAND_BLUE, fontWeight: 700 }}>✓</span>
                        </span>
                        <span
                          style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, fontSize: "12px", color: "#333" }}
                        >
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </ProcessRow>

                <ProcessRow label="Onstage Actions" accent>
                  <ProcessSteps items={process.onstageActions} />
                </ProcessRow>

                <ProcessRow label="Backstage Actions">
                  <ProcessSteps items={process.backstageActions} />
                </ProcessRow>

                <ProcessRow label="Supporting Processes" accent>
                  <div className="flex flex-wrap gap-2">
                    {process.supportingProcesses.map((item, i) => (
                      <span
                        key={i}
                        className="inline-block px-3 py-1.5 rounded-md text-[12px]"
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontWeight: 400,
                          color: BRAND_BLUE,
                          backgroundColor: `${BRAND_BLUE}10`,
                          border: `1px solid ${BRAND_BLUE}30`,
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </ProcessRow>

                <ProcessRow label={`Tools, Software,\nData, etc.`}>
                  <div className="flex flex-wrap gap-2">
                    {process.tools.map((item, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px]"
                        style={{
                          fontFamily: "'Manrope', sans-serif",
                          fontWeight: 600,
                          color: "#1a1a1a",
                          borderColor: "#000",
                          backgroundColor: "#fff",
                        }}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                          <circle cx="4" cy="4" r="3.5" fill={BRAND_BLUE} />
                        </svg>
                        {item}
                      </span>
                    ))}
                  </div>
                </ProcessRow>

                <ProcessRow label="Owners" subtitle="Roles & Responsibilities" accent>
                  <OwnersRow owners={process.owners} />
                </ProcessRow>
              </div>
            </div>

            <div className="h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
