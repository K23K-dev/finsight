import { Suspense } from "react";
import { ArrowRight, BarChart3, Bot, PieChart, Wallet } from "lucide-react";

import { Button } from "@finsight/ui/button";
import { AuthShowcase } from "./_components/auth-showcase";
import { FeatureCard } from "./_components/feature-card";

export default function HomePage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Navbar */}
      <nav className="container mx-auto flex w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-lg">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">FinSight</span>
        </div>
        <div className="flex items-center gap-4">
          <Suspense>
            <AuthShowcase />
          </Suspense>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto flex flex-col items-center justify-center gap-8 px-6 py-24 text-center md:py-32">
        <div className="bg-muted text-muted-foreground inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium">
          <span>Introducing AI Insights</span>
          <ArrowRight className="ml-1 h-4 w-4" />
        </div>

        <div className="max-w-4xl space-y-4">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Intelligent finance for <br className="hidden sm:block" />
            <span className="text-primary">smarter decisions</span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">
            Experience the future of wealth management. Track assets, analyze
            spending, and forecast your financial freedom with enterprise-grade
            precision.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button size="lg" className="h-12 px-8 text-base">
            Start Free Trial
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-8 text-base">
            Live Demo
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            title="Smart Expense Tracking"
            description="Automated categorization and spending analysis to help you optimize your cash flow effortlessly."
            icon={<PieChart className="h-6 w-6" />}
          />
          <FeatureCard
            title="Portfolio Analytics"
            description="Real-time performance tracking across all your investment accounts in a single, unified dashboard."
            icon={<BarChart3 className="h-6 w-6" />}
          />
          <FeatureCard
            title="AI Financial Advisor"
            description="Get personalized financial guidance and answers to complex questions from your dedicated AI assistant."
            icon={<Bot className="h-6 w-6" />}
          />
        </div>
      </section>
    </main>
  );
}
