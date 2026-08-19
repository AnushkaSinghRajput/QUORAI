"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SignUpButton } from "@/components/auth/SignUpButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

const SOLUTION_LINKS = [
  { href: "/solutions#foundational", label: "Foundational" },
  { href: "/solutions#operational", label: "Operational" },
  { href: "/solutions#strategic", label: "Strategic" },
];

const NAV_LINKS = [
  { href: "/product", label: "Product" },
  { href: "/company", label: "Company" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
];

export function Header({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 px-4 pt-3 sm:px-6">
      <div
        className={cn(
          "mx-auto flex h-14 w-full max-w-6xl items-center gap-2 overflow-visible rounded-2xl border px-3 backdrop-blur-xl transition-all duration-300 sm:px-4",
          scrolled
            ? "border-white/20 bg-black/50 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
            : "border-white/15 bg-black/35",
        )}
      >
        <Logo compact={compact} className="mr-1 shrink-0" />
        <nav className="ml-1 hidden min-w-0 items-center text-sm text-ink-soft lg:flex">
          <Link
            href="/product"
            className={cn(
              "rounded-full px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40",
              isActive("/product")
                ? "bg-white/10 text-ink"
                : "hover:bg-white/8 hover:text-ink",
            )}
          >
            Product
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-2 transition",
                isActive("/solutions")
                  ? "bg-white/10 text-ink"
                  : "hover:bg-white/8 hover:text-ink",
              )}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              Solutions
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition",
                  open && "rotate-180",
                )}
              />
            </button>
            {open && (
              <div className="absolute left-0 top-full z-50 min-w-[200px] rounded-2xl border border-line bg-bg-elevated p-2 shadow-lg backdrop-blur-xl">
                {SOLUTION_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-bg-muted hover:text-ink"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-line" />
                <Link
                  href="/solutions"
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-accent hover:bg-bg-muted"
                  onClick={() => setOpen(false)}
                >
                  All solutions →
                </Link>
              </div>
            )}
          </div>
          {NAV_LINKS.filter((item) => item.href !== "/product").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-2 transition",
                isActive(item.href)
                  ? "bg-white/10 text-ink"
                  : "hover:bg-white/8 hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden sm:inline-flex" />
          {!user && (
            <Link
              href="/login"
              className="hidden rounded-full px-3 py-2 text-sm text-ink-soft transition hover:text-ink sm:inline"
            >
              Log in
            </Link>
          )}
          <SignUpButton />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-white/10 lg:hidden"
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            onClick={() => setMobile((v) => !v)}
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="mx-auto mt-2 w-full max-w-6xl rounded-2xl border border-white/15 bg-black/80 p-3 backdrop-blur-2xl lg:hidden">
          <Link
            href="/product"
            className="block rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-white/8 hover:text-ink"
            onClick={() => setMobile(false)}
          >
            Product
          </Link>
          <Link
            href="/solutions"
            className="block rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-white/8 hover:text-ink"
            onClick={() => setMobile(false)}
          >
            Solutions
          </Link>
          {NAV_LINKS.filter((item) => item.href !== "/product").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-white/8 hover:text-ink"
              onClick={() => setMobile(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 h-px bg-line" />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-ink-faint">Theme</span>
            <ThemeToggle />
          </div>
          {!user && (
            <Link
              href="/login"
              className="block rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-white/8 hover:text-ink"
              onClick={() => setMobile(false)}
            >
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
