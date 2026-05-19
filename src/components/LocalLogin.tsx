"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { PowerTechLogo } from "@/components/PowerTechLogo";

const LOCAL_AUTH_KEY = "process-hub.local-session";
const DEFAULT_REDIRECT = "/process-hub";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  if (value.startsWith("/login")) {
    return DEFAULT_REDIRECT;
  }

  return value;
}

export function LocalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));

  function handleLocalSignIn() {
    setIsSigningIn(true);
    window.localStorage.setItem(LOCAL_AUTH_KEY, "active");
    window.dispatchEvent(new Event("process-hub-local-auth"));
    router.replace(redirectTo);
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-zinc-100 p-4">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <PowerTechLogo className="h-12 w-40 rounded-md border border-zinc-200" />
          <h1 className="mt-4 text-xl font-semibold text-zinc-950">Welcome to PowerOne</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Continue into the local Process Hub workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLocalSignIn}
          disabled={isSigningIn}
          className="mt-6 flex h-10 w-full items-center justify-center rounded-md bg-black px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-70"
        >
          {isSigningIn ? "Opening..." : "Continue locally"}
        </button>
      </section>
    </main>
  );
}
