import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@finsight/ui/button";

import { AuthShowcase } from "./_components/auth-showcase";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-black text-white">
      {/* Navbar */}
      <nav className="container flex w-full items-center justify-between py-6">
        <div className="text-2xl font-bold tracking-tighter">FinSight</div>
        <div className="flex items-center gap-4">
          <AuthShowcase />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
        <div className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-400">
          ✨ Now with AI-powered insights
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Master Your <span className="text-primary">Money</span>
        </h1>
        <p className="max-w-2xl leading-normal text-zinc-400 sm:text-xl sm:leading-8">
          Track spending, visualize investments, and plan for retirement with
          the world&apos;s most advanced AI financial assistant.
        </p>
        <div className="flex gap-4">
          <Button size="lg" className="h-12 px-8 text-lg">
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-lg text-black dark:text-white"
          >
            View Demo
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container py-24">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            title="Expense Tracking"
            description="Automatically categorize transactions and see exactly where your money goes every month."
            icon="💸"
          />
          <FeatureCard
            title="Investment Portfolio"
            description="Real-time visualization of your stocks, crypto, and retirement accounts in one unified dashboard."
            icon="📈"
          />
          <FeatureCard
            title="AI Financial Advisor"
            description="Ask questions like 'Can I afford a trip to Japan?' and get instant, data-backed answers."
            icon="🤖"
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:bg-zinc-900">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 text-xl font-bold">{title}</h3>
      <p className="text-zinc-400">{description}</p>
    </div>
  );
}
