import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";

import { cn } from "@finsight/ui";

import { env } from "~/env";

interface LogoProps {
  domain: string | null | undefined;
  size?: number;
  className?: string;
  fallback: ReactNode;
  alt?: string;
}

export function Logo({
  domain,
  size = 32,
  className,
  fallback,
  alt = "",
}: LogoProps) {
  const [failedDomain, setFailedDomain] = useState<string | null>(null);

  if (!domain || failedDomain === domain) {
    return fallback;
  }

  return (
    <Image
      src={`https://img.logokit.com/${domain}?token=${env.NEXT_PUBLIC_LOGOKIT_TOKEN}`}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded", className)}
      onError={() => setFailedDomain(domain)}
      unoptimized
    />
  );
}
