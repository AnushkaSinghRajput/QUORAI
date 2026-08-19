"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LoaderCircle } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/leads/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not join the waitlist.");
        return;
      }
      setStatus("done");
      setMessage(data.message ?? "You’re on the list.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="work@company.com"
        className="h-11 flex-1 rounded-full border border-line bg-black/30 px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-violet/40"
      />
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          "Join waitlist"
        )}
      </Button>
      {message && (
        <p
          className={`text-xs sm:hidden ${status === "error" ? "text-danger" : "text-success"}`}
        >
          {message}
        </p>
      )}
      {message && (
        <p
          className={`hidden self-center text-xs sm:block ${status === "error" ? "text-danger" : "text-cyan"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/leads/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, organization, message }),
      });
      const data = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setStatus("error");
        setFeedback(data.error ?? "Could not send.");
        return;
      }
      setStatus("done");
      setFeedback(data.message ?? "Received. A human will reply from the QUORAI desk.");
      setName("");
      setEmail("");
      setOrganization("");
      setMessage("");
    } catch {
      setStatus("error");
      setFeedback("Network error. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="h-11 w-full rounded-2xl border border-line bg-black/30 px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-violet/40"
      />
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="h-11 w-full rounded-2xl border border-line bg-black/30 px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-violet/40"
      />
      <input
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="Organization (optional)"
        className="h-11 w-full rounded-2xl border border-line bg-black/30 px-4 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-violet/40"
      />
      <textarea
        required
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What problem should QUORAI solve?"
        className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-violet/40"
      />
      {feedback && (
        <p className={`text-sm ${status === "error" ? "text-danger" : "text-cyan"}`}>
          {feedback}
        </p>
      )}
      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          "Send brief"
        )}
      </Button>
    </form>
  );
}
