import { Suspense } from "react";

import { AuthShowcase } from "./_components/auth-showcase";
import { LandingHero } from "./_components/landing-hero";

export default function HomePage() {
  return (
    <LandingHero
      authSlot={
        <Suspense fallback={<div className="h-9 w-20" />}>
          <AuthShowcase />
        </Suspense>
      }
    />
  );
}
