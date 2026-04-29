"use client";

import { useRouter } from "next/navigation";
import { ProcessHeader } from "@/components/ProcessHeader";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ValueStreamMap } from "@/components/ValueStreamMap";
import { AIDueDiligenceMap } from "@/components/AIDueDiligenceMap";
import { PowerAIMap } from "@/components/PowerAIMap";
import { ConceptualModelMap } from "@/components/ConceptualModelMap";
import { NeosIntelligenceMap } from "@/components/NeosIntelligenceMap";
import { NBSSystemMap } from "@/components/NBSSystemMap";
import { categories } from "@/data/categories";

const BRAND_BLUE = "#00037C";

/* ─── See All tree ─── */
function AllCategoriesTree({
  onSelect,
}: {
  onSelect: (categoryId: string, subCategoryId: string) => void;
}) {
  return (
    <div className="py-6 flex flex-col gap-6">
      {categories.map((cat) => {
        const anyContent = cat.hasContent || cat.subCategories.some((s) => s.hasContent);
        return (
          <div key={cat.id} style={{ opacity: anyContent ? 1 : 0.4 }}>
            {/* Category heading */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: anyContent ? BRAND_BLUE : "#ccc" }} />
              <p className="text-[15px] font-bold text-black" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {cat.label}
              </p>
              {anyContent && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ fontFamily: "'Manrope', sans-serif", backgroundColor: `${BRAND_BLUE}15`, color: BRAND_BLUE, letterSpacing: "0.05em" }}>
                  LIVE
                </span>
              )}
            </div>

            {/* Sub-categories */}
            <div className="ml-5 flex flex-col gap-0 border-l-2 pl-4" style={{ borderColor: `${BRAND_BLUE}25` }}>
              {cat.subCategories.map((sub, i) => (
                <button
                  key={sub.id}
                  onClick={() => onSelect(cat.id, sub.id)}
                  className="group flex items-center gap-3 py-2.5 text-left w-full transition-all duration-150"
                  style={{
                    borderBottom: i < cat.subCategories.length - 1 ? "1px solid #f0f0f0" : "none",
                    opacity: sub.hasContent ? 1 : 0.45,
                  }}
                >
                  <svg className="shrink-0 opacity-30 group-hover:opacity-100 transition-opacity"
                    width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5l7 7-7 7" stroke={BRAND_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[13px] group-hover:underline"
                    style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 400, color: sub.hasContent ? "#222" : "#999" }}>
                    {sub.label}
                  </span>
                  {sub.hasContent && (
                    <span className="ml-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: BRAND_BLUE }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HomeClient({
  categoryId,
  subCategoryId,
}: {
  categoryId?: string;
  subCategoryId?: string;
}) {
  const router = useRouter();

  const showAll = !categoryId;
  const activeCategory = categoryId ? categories.find((c) => c.id === categoryId) ?? null : null;
  const activeSubCategory = subCategoryId && activeCategory
    ? activeCategory.subCategories.find((s) => s.id === subCategoryId) ?? null
    : null;
  const hasSubcategories = (activeCategory?.subCategories.length ?? 0) > 0;

  const handleCategoryClick = (id: string) => {
    if (categoryId === id) {
      router.push("/");
    } else {
      router.push(`/${id}`);
    }
  };

  const handleSubCategoryClick = (id: string) => {
    if (!categoryId) return;
    if (subCategoryId === id) {
      router.push(`/${categoryId}`);
    } else {
      router.push(`/${categoryId}/${id}`);
    }
  };

  const handleSeeAll = () => {
    router.push("/");
  };

  const handleTreeSelect = (catId: string, subId: string) => {
    router.push(`/${catId}/${subId}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <ProcessHeader />

      <CategoryFilter
        activeCategoryId={categoryId ?? null}
        activeSubCategoryId={subCategoryId ?? null}
        showAll={showAll}
        onCategoryClick={handleCategoryClick}
        onSubCategoryClick={handleSubCategoryClick}
        onSeeAll={handleSeeAll}
      />

      <div className="h-[3px]" style={{ backgroundColor: BRAND_BLUE }} />

      <div className="flex-1 px-8 py-6">

        {/* See All */}
        {showAll && <AllCategoriesTree onSelect={handleTreeSelect} />}

        {/* Category selected, awaiting subcategory */}
        {!showAll && activeCategory && hasSubcategories && !activeSubCategory && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${BRAND_BLUE}15` }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke={BRAND_BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[18px] font-bold text-black" style={{ fontFamily: "'Manrope', sans-serif" }}>
              {activeCategory.label}
            </p>
            <p className="text-[14px]" style={{ fontFamily: "'Manrope', sans-serif", color: "#666" }}>
              Select a sub-category to view the process map.
            </p>
          </div>
        )}

        {/* Subcategory selected */}
        {!showAll && activeSubCategory && (
          <div>
            <p className="text-[12px] mb-6" style={{ fontFamily: "'Manrope', sans-serif", color: "#999" }}>
              {activeCategory?.label}
              <span className="mx-2">›</span>
              <span style={{ color: BRAND_BLUE, fontWeight: 700 }}>{activeSubCategory.label}</span>
            </p>

            {activeSubCategory.id === "flash-reports" ? (
              <ValueStreamMap />
            ) : activeSubCategory.id === "ai-it-due-diligence" ? (
              <AIDueDiligenceMap />
            ) : activeSubCategory.id === "power-ai" ? (
              <PowerAIMap />
            ) : activeSubCategory.id === "conceptual-model" ? (
              <ConceptualModelMap />
            ) : activeSubCategory.id === "neos-intelligence" ? (
              <NeosIntelligenceMap />
            ) : activeSubCategory.id === "nbs-system-process" ? (
              <NBSSystemMap />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${BRAND_BLUE}15` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke={BRAND_BLUE} strokeWidth="2" />
                    <path d="M3 9h18M9 21V9" stroke={BRAND_BLUE} strokeWidth="2" />
                  </svg>
                </div>
                <p className="text-[18px] font-bold" style={{ fontFamily: "'Manrope', sans-serif", color: BRAND_BLUE }}>
                  {activeSubCategory.label}
                </p>
                <p className="text-[14px]" style={{ fontFamily: "'Manrope', sans-serif", color: "#666" }}>
                  Process map coming soon.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
