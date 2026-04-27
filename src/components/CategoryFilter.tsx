"use client";

import { categories, Category, SubCategory } from "@/data/categories";

const BRAND_BLUE = "#00037C";

function CategoryButton({
  label, active, hasContent, onClick,
}: {
  label: string; active: boolean; hasContent?: boolean; onClick: () => void;
}) {
  const dimmed = !hasContent;
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 border transition-all duration-150 cursor-pointer whitespace-nowrap text-[12px]"
      style={{
        fontFamily: "'Manrope', sans-serif",
        borderColor: active ? BRAND_BLUE : dimmed ? "#ccc" : "#000",
        backgroundColor: active ? BRAND_BLUE : "transparent",
        color: active ? "#fff" : dimmed ? "#aaa" : "#000",
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}

function SubCategoryButton({
  label, active, hasContent, onClick,
}: {
  label: string; active: boolean; hasContent?: boolean; onClick: () => void;
}) {
  const dimmed = !hasContent;
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2 border transition-all duration-150 cursor-pointer whitespace-nowrap text-[12px]"
      style={{
        fontFamily: "'Manrope', sans-serif",
        borderColor: active ? BRAND_BLUE : dimmed ? "#ccc" : "#000",
        backgroundColor: active ? `${BRAND_BLUE}18` : "transparent",
        color: active ? BRAND_BLUE : dimmed ? "#aaa" : "#000",
        fontWeight: active ? 700 : 400,
      }}
    >
      {label}
    </button>
  );
}

export type FilterState = {
  category: Category | null;
  subCategory: SubCategory | null;
  showAll: boolean;
};

export function CategoryFilter({
  activeCategoryId,
  activeSubCategoryId,
  showAll,
  onCategoryClick,
  onSubCategoryClick,
  onSeeAll,
}: {
  activeCategoryId: string | null;
  activeSubCategoryId: string | null;
  showAll: boolean;
  onCategoryClick: (id: string) => void;
  onSubCategoryClick: (id: string) => void;
  onSeeAll: () => void;
}) {
  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? null;

  return (
    <div className="px-6 py-4 border-b border-black flex flex-col gap-4">
      {/* Category row */}
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-bold text-black" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Choose Category:
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          {/* See All */}
          <button
            onClick={onSeeAll}
            className="rounded-full px-4 py-2 border flex items-center gap-2 transition-all duration-150 cursor-pointer text-[12px] font-bold"
            style={{
              fontFamily: "'Manrope', sans-serif",
              borderColor: showAll ? BRAND_BLUE : "#000",
              backgroundColor: showAll ? BRAND_BLUE : "transparent",
              color: showAll ? "#fff" : "#000",
            }}
          >
            <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
              <rect x="0" y="0" width="11" height="1.5" rx="0.75" fill={showAll ? "#fff" : "#333430"} />
              <rect x="0" y="3" width="11" height="1.5" rx="0.75" fill={showAll ? "#fff" : "#333430"} />
              <rect x="0" y="6" width="8"  height="1.5" rx="0.75" fill={showAll ? "#fff" : "#333430"} />
            </svg>
            See All
          </button>

          {categories.map((cat) => (
            <CategoryButton
              key={cat.id}
              label={cat.label}
              active={activeCategoryId === cat.id && !showAll}
              hasContent={cat.hasContent ?? cat.subCategories.some(s => s.hasContent)}
              onClick={() => onCategoryClick(cat.id)}
            />
          ))}
        </div>
      </div>

      {/* Sub-category row */}
      <div className="flex flex-col gap-2">
        <p className="text-[12px] font-bold text-black" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Choose Sub-Category:
        </p>
        {activeCategory && activeCategory.subCategories.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {activeCategory.subCategories.map((sub) => (
              <SubCategoryButton
                key={sub.id}
                label={sub.label}
                active={activeSubCategoryId === sub.id}
                hasContent={sub.hasContent}
                onClick={() => onSubCategoryClick(sub.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-[12px] italic" style={{ fontFamily: "'Manrope', sans-serif", color: "#999" }}>
            Select a category above to view sub-categories.
          </p>
        )}
      </div>
    </div>
  );
}
