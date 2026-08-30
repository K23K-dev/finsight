import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Github } from "lucide-react";

import { Button } from "@finsight/ui/button";

interface LandingHeroProps {
  authSlot: ReactNode;
}

const productFlow = [
  {
    label: "Linked accounts",
    description: "Balances and transaction history sync into one workspace.",
  },
  {
    label: "Reviewable activity",
    description: "Imported transactions stay searchable and editable.",
  },
  {
    label: "Cash flow and budgets",
    description: "Every view resolves back to the same source activity.",
  },
] as const;

export function LandingHero({ authSlot }: LandingHeroProps) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-[#080908] text-[#eee9dc] selection:bg-[#789c7d]/40">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 18%, rgb(99 134 104 / 18%), transparent 34%), linear-gradient(rgb(255 255 255 / 3%) 1px, transparent 1px)",
          backgroundSize: "auto, 100% 4rem",
        }}
      />

      <header className="relative z-10 border-b border-white/10 px-5 sm:px-8">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#9caf9c]"
          >
            <Image
              src="/favicon.svg"
              alt=""
              width={28}
              height={28}
              className="size-7"
              priority
            />
            <span className="text-sm font-semibold tracking-[-0.02em]">
              FinSight
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/K23K-dev/finsight"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#99988f] transition-colors outline-none hover:text-[#eee9dc] focus-visible:ring-2 focus-visible:ring-[#9caf9c] sm:flex"
            >
              <Github className="size-3.5" aria-hidden="true" />
              GitHub
            </a>
            {authSlot}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100svh-7.5rem)] max-w-6xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:gap-20">
        <section>
          <p className="font-mono text-[0.6875rem] font-medium tracking-[0.16em] text-[#91b695] uppercase">
            Personal finance, connected
          </p>
          <h1 className="font-display mt-6 max-w-3xl text-6xl leading-[0.9] font-medium tracking-[-0.045em] text-balance sm:text-7xl lg:text-[5.5rem]">
            Know where your money went—and what it changed.
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#aaa99d] sm:text-lg sm:leading-8">
            Link your accounts, review imported transactions, and keep cash flow
            and budgets tied to the same financial activity.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-lg bg-[#eee9dc] px-6 text-[#11120f] shadow-none hover:bg-white"
            >
              <Link href="/auth">
                Open FinSight
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <p className="flex items-center gap-2 px-1 text-xs text-[#7f8179] sm:px-3">
              <Check className="size-3.5 text-[#91b695]" aria-hidden="true" />
              You can edit every imported category.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="product-flow-title"
          className="border border-white/10 bg-[#10120f]/95 shadow-[0_30px_80px_rgb(0_0_0/35%)]"
        >
          <div className="border-b border-white/10 p-5 sm:p-6">
            <div>
              <p className="font-mono text-[0.625rem] tracking-[0.14em] text-[#92958c] uppercase">
                Product flow
              </p>
              <h2
                id="product-flow-title"
                className="mt-2 text-sm font-semibold text-[#e7e2d6]"
              >
                One source of truth
              </h2>
            </div>
          </div>

          <ol>
            {productFlow.map((item, index) => (
              <li
                key={item.label}
                className="grid grid-cols-[2rem_1fr] gap-4 border-b border-white/10 p-5 last:border-b-0 sm:p-6"
              >
                <span className="font-mono text-xs text-[#92958c]">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#d8d4c8]">
                    {item.label}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#8c8e85]">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 px-5 py-4 text-center text-[0.6875rem] text-[#8f9289] sm:px-8">
        Your account connections remain separate from Google sign-in.
      </footer>
    </div>
  );
}
