"use client";

import { createContext, useContext } from "react";

/** True while the app is in full-screen "Present" mode (chrome hidden). */
export const PresentationContext = createContext(false);

export function usePresenting() {
  return useContext(PresentationContext);
}
