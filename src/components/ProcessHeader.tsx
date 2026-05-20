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
    <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <button
            onClick={onHomeClick}
            className="group flex shrink-0 cursor-pointer flex-col text-left"
            aria-label="Go to Process Hub home"
          >
            <span
              className="text-[11px] font-bold uppercase tracking-wider text-zinc-500"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Process maps
            </span>
            <h1
              className="whitespace-nowrap text-[22px] font-bold leading-tight text-zinc-950 transition-opacity group-hover:opacity-70"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Process Hub
            </h1>
          </button>

          {crumbs.length > 0 && (
            <nav className="hidden min-w-0 items-center gap-1.5 overflow-hidden md:flex">
              <BreadcrumbSeparator />
              {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                  <div key={i} className="flex min-w-0 items-center gap-1.5">
                    {c.onClick && !isLast ? (
                      <button
                        onClick={c.onClick}
                        className="truncate text-[13px] hover:underline"
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
                        className="truncate text-[13px]"
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
        </div>

        {typeof liveCount === "number" && typeof totalCount === "number" && (
          <div
            className="hidden items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold md:flex"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            <span className="flex items-center gap-1.5 text-zinc-950">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: BRAND_BLUE }}
              />
              {liveCount} live
            </span>
            <span className="h-4 w-px bg-zinc-200" />
            <span className="text-zinc-500">
              {totalCount - liveCount} coming soon
            </span>
          </div>
        )}
      </div>

      {crumbs.length > 0 && (
        <nav
          className="mt-2 flex min-w-0 items-center gap-1.5 overflow-hidden md:hidden"
          aria-label="Process breadcrumb"
        >
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <div key={i} className="flex min-w-0 items-center gap-1.5">
                {c.onClick && !isLast ? (
                  <button
                    onClick={c.onClick}
                    className="truncate text-[12px] hover:underline"
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
                    className="truncate text-[12px]"
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
