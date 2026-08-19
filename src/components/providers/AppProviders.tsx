"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
