"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LoaderCircle } from "lucide-react";

import { Button } from "@finsight/ui/button";
import { toast } from "@finsight/ui/toast";

import { authClient } from "~/auth/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285f4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.01v2.53h3.24c1.9-1.75 2.98-4.32 2.98-7.38Z"
      />
      <path
        fill="#34a853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.25-2.52c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#fbbc05"
        d="M6.39 13.88A6 6 0 0 1 6.07 12c0-.65.11-1.29.32-1.88v-2.6H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.48l3.35-2.6Z"
      />
      <path
        fill="#ea4335"
        d="M12 5.99c1.47 0 2.79.5 3.82 1.49l2.88-2.88A9.68 9.68 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.6C7.18 7.75 9.39 5.99 12 5.99Z"
      />
    </svg>
  );
}

export function AuthClientPage() {
  const [isPending, setIsPending] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });

      if (result.error) {
        toast.error(
          result.error.message ??
            "Google sign-in could not be started. Try again.",
        );
      }
    } catch {
      toast.error("Google sign-in could not be started. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#080908] px-5 py-16 text-[#eee9dc] sm:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 12%, rgb(99 134 104 / 18%), transparent 34%), linear-gradient(rgb(255 255 255 / 3%) 1px, transparent 1px)",
          backgroundSize: "auto, 100% 4rem",
        }}
      />

      <Link
        href="/"
        className="absolute top-5 left-5 z-10 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#9c9b92] transition-colors outline-none hover:text-[#eee9dc] focus-visible:ring-2 focus-visible:ring-[#9caf9c] sm:top-7 sm:left-8"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        Back
      </Link>

      <section className="relative z-10 w-full max-w-sm border border-white/10 bg-[#10120f]/95 p-7 shadow-[0_30px_90px_rgb(0_0_0/40%)] sm:p-9">
        <div className="flex items-center gap-2.5">
          <Image
            src="/favicon.svg"
            alt=""
            width={30}
            height={30}
            className="size-7.5"
            priority
          />
          <span className="text-sm font-semibold">FinSight</span>
        </div>

        <h1 className="font-display mt-10 text-5xl leading-[0.92] font-medium tracking-[-0.035em] text-balance">
          Continue to your finances.
        </h1>
        <p className="mt-5 text-sm leading-6 text-[#96958c]">
          Sign in with Google to return to your linked accounts, transactions,
          cash flow, and budgets.
        </p>

        <Button
          type="button"
          size="lg"
          className="mt-8 h-12 w-full justify-center gap-3 rounded-lg bg-[#eee9dc] text-sm font-semibold text-[#171814] shadow-none hover:bg-white"
          onClick={handleGoogleSignIn}
          disabled={isPending}
          aria-live="polite"
        >
          {isPending ? (
            <LoaderCircle
              className="size-4 motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : (
            <GoogleIcon />
          )}
          {isPending ? "Opening Google…" : "Continue with Google"}
        </Button>

        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-[#92958c]">
          Google identifies your workspace. Financial connections are managed
          separately inside FinSight.
        </p>
      </section>
    </main>
  );
}
