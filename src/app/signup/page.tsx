import type { Metadata } from "next";
import { SignupView } from "@/components/marketing/SignupView";

export const metadata: Metadata = {
  title: "Join beta",
};

export default function SignupPage() {
  return <SignupView />;
}
