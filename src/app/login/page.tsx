import { Suspense } from "react";
import type { Metadata } from "next";

import { LocalLogin } from "@/components/LocalLogin";

export const metadata: Metadata = {
  title: "Login | Process Hub",
  description: "Local Process Hub access",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LocalLogin />
    </Suspense>
  );
}
