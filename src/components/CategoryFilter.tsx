"use client";

import { categories, Category, SubCategory } from "@/data/categories";

const BRAND_BLUE = "#00037C";

function StatusDot({ live }: { live: boolean }) {
  return (
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: live ? BRAND_BLUE : "#cfcfcf" }}
    />
  );
}

function LiveCountBadge({
  live,
  total,
  active,
  compact = false,
}: {
  live: number;
  total: number;
  active: boolean;
  compact?: boolean;
}) {
  if (total === 0) return null;
  const allDone = live === total && total > 0;
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
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
      {compact || allDone ? `${live}` : `${live}/${total}`}
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
      aria-pressed={active}
      className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-all duration-150 hover:-translate-y-px hover:shadow-sm"
      style={{
        fontFamily: "'Manrope', sans-serif",
        borderColor: active ? BRAND_BLUE : "#e4e4e7",
        backgroundColor: active ? BRAND_BLUE : "#fff",
        color: active ? "#fff" : dimmed ? "#a1a1aa" : "#18181b",
        fontWeight: active ? 700 : 600,
        boxShadow: active ? "0 10px 24px rgba(0, 3, 124, 0.16)" : undefined,
      }}
      title={dimmed ? `${label} — coming soon` : label}
    >
      <StatusDot live={liveCount > 0} />
      <span className="max-w-[260px] truncate">{label}</span>
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
      aria-pressed={active}
      className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm transition-all duration-150 hover:-translate-y-px hover:shadow-sm"
      style={{
        fontFamily: "'Manrope', sans-serif",
        borderColor: active ? BRAND_BLUE : "#e4e4e7",
        backgroundColor: active ? `${BRAND_BLUE}12` : "#fff",
        color: active ? BRAND_BLUE : live ? "#18181b" : "#a1a1aa",
        fontWeight: active ? 700 : 600,
      }}
      title={live ? sub.label : `${sub.label} — coming soon`}
    >
      <StatusDot live={live} />
      <span className="max-w-[300px] truncate">{sub.label}</span>
      {!live && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider leading-none"
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
  const totalLiveCount = categories.reduce(
    (count, category) =>
      count + category.subCategories.filter((sub) => sub.hasContent).length,
    0,
  );
  const totalMapCount = categories.reduce(
    (count, category) => count + category.subCategories.length,
    0,
  );

  return (
    <section className="border-b border-zinc-200 bg-zinc-50 px-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-wider text-zinc-500"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            Offering area
          </p>
          <p
            className="mt-1 text-sm font-semibold text-zinc-950"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {activeCategory ? activeCategory.label : "All process maps"}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 md:hidden">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-950">
            <StatusDot live />
            {totalLiveCount} live
          </span>
          <span className="h-4 w-px bg-zinc-200" />
          <span className="text-xs font-semibold text-zinc-500">
            {totalMapCount - totalLiveCount} coming soon
          </span>
        </div>
      </div>

      <div className="-mx-1 mt-3 overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-2 px-1">
          <button
            onClick={onSeeAll}
            aria-pressed={showAll}
            className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-bold transition-all duration-150 hover:-translate-y-px hover:shadow-sm"
            style={{
              fontFamily: "'Manrope', sans-serif",
              borderColor: showAll ? BRAND_BLUE : "#e4e4e7",
              backgroundColor: showAll ? BRAND_BLUE : "transparent",
              color: showAll ? "#fff" : "#18181b",
              boxShadow: showAll ? "0 10px 24px rgba(0, 3, 124, 0.16)" : undefined,
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

      {activeCategory ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className="text-[11px] font-bold uppercase tracking-wider text-zinc-500"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Process map
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              <StatusDot live={activeLiveCount > 0} />
              <span>{activeLiveCount} of {activeTotalCount} live</span>
            </div>
          </div>

          <div className="-mx-1 mt-3 overflow-x-auto pb-1">
            <div className="flex min-w-max gap-2 px-1">
              {activeCategory.subCategories.map((sub) => (
                <SubCategoryButton
                  key={sub.id}
                  sub={sub}
                  active={activeSubCategoryId === sub.id}
                  onClick={() => onSubCategoryClick(sub.id)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
