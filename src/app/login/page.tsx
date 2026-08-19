import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { BetaShell } from "@/components/marketing/BetaShell";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <BetaShell
      kicker="Welcome back"
      title="Log in to QUORAI."
      subtitle="Continue a thread. Same paths, same citations."
      altHref="/signup"
      altLabel="Join beta"
    >
      <AuthForm mode="login" compact showAltLink={false} />
    </BetaShell>
  );
}
