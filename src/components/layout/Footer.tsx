import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { BRAND } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative mt-20">
      <div className="gradient-divider" />
      <div className="bg-black/25">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[220px] text-sm leading-relaxed text-ink-soft">
              {BRAND.description}
            </p>
            <Link
              href="/#console"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent transition hover:text-accent-strong"
            >
              Launch console
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Product
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
              <li>
                <Link href="/product" className="transition hover:text-ink">
                  Overview
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="transition hover:text-ink">
                  Solutions
                </Link>
              </li>
              <li>
                <Link href="/models" className="transition hover:text-ink">
                  Models
                </Link>
              </li>
              <li>
                <Link href="/developers" className="transition hover:text-ink">
                  API
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Company
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
              <li>
                <Link href="/company" className="transition hover:text-ink">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="transition hover:text-ink">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-ink">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
              Resources
            </p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink-soft">
              <li>
                <Link href="/faq" className="transition hover:text-ink">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/signup" className="transition hover:text-ink">
                  Join beta
                </Link>
              </li>
              <li>
                <Link href="/#console" className="transition hover:text-ink">
                  Console
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="gradient-divider" />
        <div className="flex flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
            © {new Date().getFullYear()} {BRAND.name}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            One query · Many paths · A cited brief
          </p>
        </div>
      </div>
    </footer>
  );
}
