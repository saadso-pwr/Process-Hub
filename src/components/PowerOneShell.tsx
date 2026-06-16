"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type ComponentType,
  type FormEvent,
  type ReactNode,
  type SVGProps,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { categories } from "@/data/categories";
import { PowerTechLogo } from "@/components/PowerTechLogo";
import { PresentationContext } from "@/components/presentation";

const LOCAL_AUTH_KEY = "process-hub.local-session";
const PROCESS_HUB_BASE_PATH = "/process-hub";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const CREATE_PATH = "/create";

type PrimaryBucket = {
  key: string;
  label: string;
  href: string;
  icon: IconComponent;
  disabled?: boolean;
  /** Pathname prefix that marks this bucket active. */
  match?: string;
};

const primaryBuckets: PrimaryBucket[] = [
  { key: "workspace", label: "Workspace", href: "#", icon: GridIcon, disabled: true },
  { key: "process", label: "Process Hub", href: PROCESS_HUB_BASE_PATH, icon: ProcessIcon, match: PROCESS_HUB_BASE_PATH },
  { key: "create", label: "Create", href: CREATE_PATH, icon: PlusIcon, match: CREATE_PATH },
  { key: "knowledge", label: "Knowledge", href: "#", icon: BookIcon, disabled: true },
  { key: "directory", label: "Directory", href: "#", icon: UsersIcon, disabled: true },
  { key: "ai", label: "AI", href: "#", icon: SparklesIcon, disabled: true },
  { key: "admin", label: "Admin", href: "#", icon: ShieldIcon, disabled: true },
];

function buildProcessHref(...parts: string[]) {
  const clean = parts.filter(Boolean).map((part) => part.replace(/^\/+|\/+$/g, ""));
  return [PROCESS_HUB_BASE_PATH, ...clean].join("/");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function subscribeToLocalAuth(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("process-hub-local-auth", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("process-hub-local-auth", onStoreChange);
  };
}

function getLocalAuthSnapshot() {
  return window.localStorage.getItem(LOCAL_AUTH_KEY) === "active";
}

function getServerAuthSnapshot() {
  return false;
}

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const searchIndex = useMemo(() => {
    return categories.flatMap((category) => [
      {
        label: category.label,
        href: buildProcessHref(category.id),
      },
      ...category.subCategories.map((subCategory) => ({
        label: `${category.label} ${subCategory.label}`,
        href: buildProcessHref(category.id, subCategory.id),
      })),
    ]);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return;

      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;

    const match = searchIndex.find((item) =>
      item.label.toLowerCase().includes(normalized),
    );

    if (match) {
      router.push(match.href);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <SearchIcon className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
      <input
        ref={inputRef}
        type="search"
        placeholder="Search process maps"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 pl-8 pr-10 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-500 focus:border-zinc-400 focus:bg-white"
      />
      <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-500">
        /
      </kbd>
    </form>
  );
}

function PowerOneHeader({ onSignOut, onPresent }: { onSignOut: () => void; onPresent: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-4">
      <Link href={PROCESS_HUB_BASE_PATH} className="flex min-w-0 items-center gap-3">
        <PowerTechLogo className="h-8 w-28 rounded-md border border-zinc-200" />
        <div className="hidden h-7 w-px bg-zinc-200 sm:block" />
        <div className="hidden min-w-0 items-baseline gap-2 sm:flex">
          <span className="text-sm font-semibold text-zinc-950">PowerOne</span>
          <span className="rounded-full bg-[#00037C]/10 px-2 py-0.5 text-[11px] font-semibold text-[#00037C]">
            Process Hub
          </span>
        </div>
      </Link>

      <div className="ml-auto hidden w-full max-w-sm sm:block">
        <SearchBar />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPresent}
          className="mr-1 flex h-9 items-center gap-1.5 rounded-md border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          aria-label="Present"
          title="Present (full-screen)"
        >
          <PresentIcon className="size-4" />
          <span className="hidden sm:inline">Present</span>
        </button>
        <a
          href="https://powertech-space.slack.com/archives/C0AUFBDL2MS"
          target="_blank"
          rel="noopener noreferrer"
          className="flex size-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          aria-label="Help"
          title="Help"
        >
          <HelpIcon className="size-4" />
        </a>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#31BAF0]" />
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="ml-1 flex size-9 items-center justify-center rounded-full bg-zinc-950 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
          aria-label="Sign out"
          title="Sign out"
        >
          {getInitials("Local User")}
        </button>
      </div>
    </header>
  );
}

function PrimaryRail({ pathname }: { pathname: string }) {
  return (
    <nav className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-black py-3 sm:flex">
      {primaryBuckets.map((bucket) => {
        const isActive =
          !!bucket.match &&
          (bucket.match === CREATE_PATH
            ? pathname === CREATE_PATH
            : pathname.startsWith(bucket.match));
        const Icon = bucket.icon;

        if (bucket.disabled) {
          return (
            <button
              key={bucket.key}
              type="button"
              disabled
              title={`${bucket.label} lives in PowerOne`}
              className="flex size-10 items-center justify-center rounded-lg text-zinc-600"
            >
              <Icon className="size-5" />
              <span className="sr-only">{bucket.label}</span>
            </button>
          );
        }

        return (
          <Link
            key={bucket.key}
            href={bucket.href}
            title={bucket.label}
            className={`flex size-10 items-center justify-center rounded-lg transition-colors ${
              isActive
                ? "bg-[#31BAF0] text-white"
                : "text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="size-5" />
            <span className="sr-only">{bucket.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ShellLoading() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-white">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-[#31BAF0]" />
      </div>
    </div>
  );
}

export function PowerOneShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginRoute = pathname === "/login";
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    if (!presenting) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPresenting(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting]);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const isLocallySignedIn = useSyncExternalStore(
    subscribeToLocalAuth,
    getLocalAuthSnapshot,
    getServerAuthSnapshot,
  );

  useEffect(() => {
    if (isHydrated && !isLoginRoute && !isLocallySignedIn) {
      const redirectTo = encodeURIComponent(pathname || PROCESS_HUB_BASE_PATH);
      router.replace(`/login?redirectTo=${redirectTo}`);
    }
  }, [isHydrated, isLocallySignedIn, isLoginRoute, pathname, router]);

  function handleSignOut() {
    window.localStorage.removeItem(LOCAL_AUTH_KEY);
    window.dispatchEvent(new Event("process-hub-local-auth"));
    router.replace("/login");
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (!isHydrated || !isLocallySignedIn) {
    return <ShellLoading />;
  }

  return (
    <PresentationContext.Provider value={presenting}>
      <div className="flex h-svh w-full overflow-hidden bg-white text-zinc-950">
        {!presenting && <PrimaryRail pathname={pathname} />}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {!presenting && (
            <PowerOneHeader onSignOut={handleSignOut} onPresent={() => setPresenting(true)} />
          )}
          <main className="min-w-0 flex-1 overflow-y-auto bg-white">{children}</main>
        </div>
        {presenting && (
          <button
            type="button"
            onClick={() => setPresenting(false)}
            className="fixed right-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition-colors hover:bg-zinc-900"
            title="Exit presentation (Esc)"
          >
            <CloseIcon className="size-3.5" />
            Exit · Esc
          </button>
        )}
      </div>
    </PresentationContext.Provider>
  );
}

function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="4" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="4" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="14" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ProcessIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 7h6M13 7h6M5 17h6M13 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="5" cy="7" r="2" fill="currentColor" />
      <circle cx="19" cy="7" r="2" fill="currentColor" />
      <circle cx="5" cy="17" r="2" fill="currentColor" />
      <circle cx="19" cy="17" r="2" fill="currentColor" />
    </svg>
  );
}

function PresentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 21h6M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="m10.5 8 4 2.5-4 2.5V8Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v15H7.5A2.5 2.5 0 0 0 5 20.5v-15Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="currentColor" strokeWidth="2" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="m12 3 1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-5L6 9.3l4.3-1.7L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 21s7-3.5 7-10V5l-7-3-7 3v6c0 6.5 7 10 7 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HelpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.3c0 1.8-2.6 2-2.6 3.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 17h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
