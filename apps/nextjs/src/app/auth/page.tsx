"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@finsight/ui/button";
import { Field, FieldLabel, FieldSeparator } from "@finsight/ui/field";
import { Input } from "@finsight/ui/input";

import { authClient } from "~/auth/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Placeholder for email auth
      console.log("Email sign in not implemented yet", email);
      // You would call authClient.signIn.email({ email, password }) here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
      alert("Email authentication is not yet enabled. Please use Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left Side - Auth Form */}
      <div className="flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 xl:p-24">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
              F
            </div>
            FinSight
          </div>

          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Sign up</h1>
              <p className="text-muted-foreground text-sm">
                Welcome to FinSight. Enter your details below to create your
                account.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <Button variant="outline" className="w-full" disabled>
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-1.23 3.7-1.04.73.07 2.7.67 3.64 2.05-.1.07-2.13 1.25-2.11 3.73.02 2.94 2.58 3.98 2.61 4.01-.03.04-1.53 3.54-2.92 5.48zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
                Continue with Google
              </Button>
            </div>

            <FieldSeparator>OR</FieldSeparator>

            <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Your Email Address</FieldLabel>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign up with email"}
              </Button>
            </form>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth" className="hover:text-primary underline">
                Sign in
              </Link>
            </div>

            <div className="text-muted-foreground text-center text-xs">
              By creating an account, you agree to our{" "}
              <Link href="#" className="hover:text-primary underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="#" className="hover:text-primary underline">
                Privacy Policy
              </Link>
              .
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Graphics/Testimonial */}
      <div className="bg-muted relative hidden h-full flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right_bottom,rgba(0,0,0,0.8),rgba(0,0,0,0.4)),url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center" />

        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-950/50 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-zinc-400">
                  Total Portfolio
                </div>
                <div className="text-3xl font-bold text-white">$124,592.00</div>
              </div>
              <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                +12.5%
              </div>
            </div>

            {/* CSS-only Line Chart */}
            <div className="relative h-48 w-full pt-4">
              <svg
                className="h-full w-full overflow-visible"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 100 L0 70 C20 65 40 80 60 50 S80 30 100 10 L100 100 Z"
                  fill="url(#chartGradient)"
                />
                <path
                  d="M0 70 C20 65 40 80 60 50 S80 30 100 10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Chart Points */}
              <div className="absolute top-[10%] right-0 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>

            <div className="mt-6 flex justify-between text-xs text-zinc-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
