"use client";

import { categories, Category, SubCategory } from "@/data/categories";

const BRAND_BLUE = "#00037C";

function StatusDot({ live }: { live: boolean }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full shrink-0"
      style={{ backgroundColor: live ? BRAND_BLUE : "#cfcfcf" }}
    />
  );
}

function LiveCountBadge({
  live,
  total,
  active,
}: {
  live: number;
  total: number;
  active: boolean;
}) {
  if (total === 0) return null;
  const allDone = live === total && total > 0;
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
      style={{
        fontFamily: "'Manrope', sans-serif",
        backgroundColor: active
          ? "rgba(255,255,255,0.22)"
          : live === 0
          ? "#f0f0f0"
          : `${BRAND_BLUE}15`,
        color: active ? "#fff" : live === 0 ? "#999" : BRAND_BLUE,
      }}
    >
      {allDone ? `${live}` : `${live}/${total}`}
    </span>
  );
}

function CategoryButton({
  label,
  liveCount,
  totalCount,
  active,
  onClick,
}: {
  label: string;
  liveCount: number;
  totalCount: number;
  active: boolean;
  onClick: () => void;
}) {
  const dimmed = liveCount === 0;
  return (
    <button
      onClick={onClick}
      className="rounded-full pl-3.5 pr-2.5 py-1.5 border flex items-center gap-2 transition-all duration-150 cursor-pointer whitespace-nowrap text-[12px] hover:shadow-sm"
      style={{
        fontFamily: "'Manrope', sans-serif",
        borderColor: active ? BRAND_BLUE : dimmed ? "#e0e0e0" : "#000",
        backgroundColor: active ? BRAND_BLUE : "transparent",
        color: active ? "#fff" : dimmed ? "#999" : "#000",
        fontWeight: active ? 700 : 500,
      }}
      title={dimmed ? `${label} — coming soon` : label}
    >
      {!active && <StatusDot live={liveCount > 0} />}
      <span>{label}</span>
      <LiveCountBadge live={liveCount} total={totalCount} active={active} />
    </button>
  );
}

function SubCategoryButton({
  sub,
  active,
  onClick,
}: {
  sub: SubCategory;
  active: boolean;
  onClick: () => void;
}) {
  const live = !!sub.hasContent;
  return (
    <button
      onClick={onClick}
      className="rounded-full pl-3 pr-3 py-1.5 border flex items-center gap-2 transition-all duration-150 cursor-pointer whitespace-nowrap text-[12px] hover:shadow-sm"
      style={{
        fontFamily: "'Manrope', sans-serif",
        borderColor: active ? BRAND_BLUE : live ? "#000" : "#e0e0e0",
        backgroundColor: active ? `${BRAND_BLUE}15` : "transparent",
        color: active ? BRAND_BLUE : live ? "#000" : "#999",
        fontWeight: active ? 700 : 500,
      }}
      title={live ? sub.label : `${sub.label} — coming soon`}
    >
      <StatusDot live={live} />
      <span>{sub.label}</span>
      {!live && (
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full leading-none"
          style={{ backgroundColor: "#f0f0f0", color: "#888" }}
        >
          Soon
        </span>
      )}
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
  const activeCategory =
    categories.find((c) => c.id === activeCategoryId) ?? null;

  const activeLiveCount = activeCategory
    ? activeCategory.subCategories.filter((s) => s.hasContent).length
    : 0;
  const activeTotalCount = activeCategory
    ? activeCategory.subCategories.length
    : 0;

  return (
    <div className="px-6 py-4 border-b border-black/10 flex flex-col gap-3 bg-[#fafafa]">
      {/* Category row */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-2">
          <p
            className="text-[11px] font-bold uppercase tracking-wider text-black/70"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Step 1 — Category
          </p>
          <p
            className="text-[11px] text-black/45"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Pick an offering area
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {/* See All */}
          <button
            onClick={onSeeAll}
            className="rounded-full pl-3 pr-3.5 py-1.5 border flex items-center gap-2 transition-all duration-150 cursor-pointer text-[12px] font-bold hover:shadow-sm"
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
            Browse All
          </button>

          {categories.map((cat) => {
            const live = cat.subCategories.filter((s) => s.hasContent).length;
            const total = cat.subCategories.length;
            return (
              <CategoryButton
                key={cat.id}
                label={cat.label}
                liveCount={live}
                totalCount={total}
                active={activeCategoryId === cat.id && !showAll}
                onClick={() => onCategoryClick(cat.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Sub-category row */}
      <div className="flex flex-col gap-2 border-t border-black/5 pt-3">
        <div className="flex items-baseline gap-2">
          <p
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{
              fontFamily: "'Manrope', sans-serif",
              color: activeCategory ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.35)",
            }}
          >
            Step 2 — Sub-category
          </p>
          {activeCategory ? (
            <p
              className="text-[11px]"
              style={{ fontFamily: "'Manrope', sans-serif", color: "#666" }}
            >
              <span style={{ color: BRAND_BLUE, fontWeight: 700 }}>
                {activeLiveCount}
              </span>{" "}
              of {activeTotalCount} available in{" "}
              <span style={{ fontWeight: 700 }}>{activeCategory.label}</span>
            </p>
          ) : (
            <p
              className="text-[11px] text-black/45"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Pick a category first to see options
            </p>
          )}
        </div>
        {activeCategory && activeCategory.subCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeCategory.subCategories.map((sub) => (
              <SubCategoryButton
                key={sub.id}
                sub={sub}
                active={activeSubCategoryId === sub.id}
                onClick={() => onSubCategoryClick(sub.id)}
              />
            ))}
          </div>
        ) : (
          <div
            className="rounded-lg border border-dashed px-3 py-2 text-[12px] italic flex items-center gap-2"
            style={{
              fontFamily: "'Manrope', sans-serif",
              color: "#999",
              borderColor: "#e0e0e0",
              backgroundColor: "#fff",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#bbb" strokeWidth="2" />
              <path d="M12 8v4M12 16h.01" stroke="#bbb" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Select a category above to view sub-categories.
          </div>
        )}
      </div>
    </div>
  );
}
