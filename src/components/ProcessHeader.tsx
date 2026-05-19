"use client";

const BRAND_BLUE = "#00037C";

type Crumb = {
  label: string;
  onClick?: () => void;
};

export function ProcessHeader({
  crumbs = [],
  liveCount,
  totalCount,
  onHomeClick,
}: {
  crumbs?: Crumb[];
  liveCount?: number;
  totalCount?: number;
  onHomeClick?: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-black/10 bg-white px-6 py-3">
      <button
        onClick={onHomeClick}
        className="group flex shrink-0 cursor-pointer flex-col text-left"
        aria-label="Go to Process Hub home"
      >
        <span
          className="text-[11px] font-bold uppercase tracking-wider text-black/45"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          PowerOne
        </span>
        <h1
          className="whitespace-nowrap text-[22px] font-bold leading-tight text-black transition-opacity group-hover:opacity-70"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Process Hub
        </h1>
      </button>

      {crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 ml-2 min-w-0 overflow-hidden">
          <BreadcrumbSeparator />
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <div key={i} className="flex items-center gap-1.5 min-w-0">
                {c.onClick && !isLast ? (
                  <button
                    onClick={c.onClick}
                    className="text-[13px] truncate hover:underline"
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    {c.label}
                  </button>
                ) : (
                  <span
                    className="text-[13px] truncate"
                    style={{
                      fontFamily: "'Manrope', sans-serif",
                      color: isLast ? BRAND_BLUE : "#666",
                      fontWeight: isLast ? 700 : 500,
                    }}
                  >
                    {c.label}
                  </span>
                )}
                {!isLast && <BreadcrumbSeparator />}
              </div>
            );
          })}
        </nav>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Live count badge */}
      {typeof liveCount === "number" && typeof totalCount === "number" && (
        <div
          className="hidden md:flex items-center gap-2 rounded-full px-3 py-1.5 shrink-0"
          style={{
            backgroundColor: `${BRAND_BLUE}10`,
            border: `1px solid ${BRAND_BLUE}25`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: BRAND_BLUE }}
          />
          <span
            className="text-[11px] font-semibold whitespace-nowrap"
            style={{ fontFamily: "'Manrope', sans-serif", color: BRAND_BLUE }}
          >
            {liveCount} live · {totalCount - liveCount} coming soon
          </span>
        </div>
      )}
    </div>
  );
}

function BreadcrumbSeparator() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-40">
      <path d="M9 5l7 7-7 7" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
