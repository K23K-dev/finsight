"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Check,
  ChevronsUpDown,
  CreditCard,
  Layers,
  LayoutGrid,
  LogOut,
  Menu,
  Monitor,
  Moon,
  PanelLeft,
  PieChart,
  Sun,
} from "lucide-react";

import { cn } from "@finsight/ui";
import { Button } from "@finsight/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@finsight/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@finsight/ui/sheet";
import { useTheme } from "@finsight/ui/theme";
import { toast } from "@finsight/ui/toast";

import { authClient } from "~/auth/client";
import { UserAvatar } from "./user-avatar";

const navigationItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/accounts", label: "Accounts", icon: Layers },
  {
    href: "/dashboard/transactions",
    label: "Transactions",
    icon: CreditCard,
  },
  { href: "/dashboard/cash-flow", label: "Cash flow", icon: BarChart3 },
  { href: "/dashboard/budgets", label: "Budgets", icon: PieChart },
] as const;

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function routeIsActive(pathname: string, href: string) {
  return href === "/dashboard"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userAvatar = (
    <UserAvatar image={session?.user.image} name={session?.user.name} />
  );
  const userDetails = (
    <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">
        {session?.user.name ?? "User"}
      </span>
      <span className="text-muted-foreground truncate text-xs">
        {session?.user.email ?? ""}
      </span>
    </span>
  );

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      const result = await authClient.signOut();

      if (result.error) {
        toast.error(result.error.message ?? "Sign out failed. Try again.");
        return;
      }

      setMobileOpen(false);
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Sign out failed. Try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const renderNavigation = (isCollapsed: boolean, onNavigate?: () => void) => (
    <>
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-2",
          isCollapsed ? "px-2" : "px-3",
        )}
      >
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            aria-label="Expand navigation"
            title="Expand navigation"
            className="mx-auto"
          >
            <Image src="/favicon.svg" alt="" width={24} height={24} />
          </Button>
        ) : (
          <>
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1 outline-none focus-visible:ring-2"
            >
              <Image
                src="/favicon.svg"
                alt=""
                width={28}
                height={28}
                className="ring-border/70 size-7 shrink-0 rounded-lg ring-1"
              />
              <span className="truncate text-base font-semibold tracking-tight">
                FinSight
              </span>
            </Link>
            {!onNavigate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse navigation"
                title="Collapse navigation"
                className="text-muted-foreground hover:text-foreground"
              >
                <PanelLeft />
              </Button>
            )}
          </>
        )}
      </div>

      <nav
        aria-label="Primary navigation"
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
      >
        <ul className="space-y-0.5">
          {navigationItems.map((item) => {
            const isActive = routeIsActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "focus-visible:ring-sidebar-ring hover:bg-sidebar-accent/55 hover:text-sidebar-accent-foreground flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-inset",
                    isActive &&
                      "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
                    isCollapsed && "justify-center px-0",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cn("shrink-0", isCollapsed ? "p-2" : "p-3")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "data-[state=open]:bg-sidebar-accent hover:bg-sidebar-accent/55 h-12 w-full justify-start px-2",
                isCollapsed && "size-10 justify-center p-0",
              )}
              aria-label={isCollapsed ? "Open account menu" : undefined}
            >
              {userAvatar}
              {!isCollapsed && (
                <>
                  {userDetails}
                  <ChevronsUpDown className="size-4" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56"
            side="top"
            align="start"
            sideOffset={6}
            collisionPadding={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                {userAvatar}
                {userDetails}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">
              Appearance
            </DropdownMenuLabel>
            {themeOptions.map((option) => {
              const Icon = option.icon;

              return (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => setTheme(option.value)}
                  aria-current={theme === option.value ? "true" : undefined}
                >
                  <Icon className="mr-2 size-4" />
                  {option.label}
                  {theme === option.value && (
                    <Check className="text-positive ml-auto size-4" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
              <LogOut className="mr-2 size-4" />
              {isSigningOut ? "Signing out…" : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="bg-sidebar flex h-svh min-h-0 w-full overflow-hidden">
      <aside
        className={cn(
          "border-sidebar-border bg-sidebar text-sidebar-foreground m-2 mr-0 hidden shrink-0 flex-col overflow-hidden rounded-lg border shadow-sm transition-[width] duration-150 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {renderNavigation(collapsed)}
      </aside>

      <main className="bg-background relative flex h-svh min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:m-2 md:rounded-lg md:border md:shadow-sm">
        <header className="border-border/60 flex h-14 shrink-0 items-center gap-3 border-b px-3 md:hidden">
          <Button
            variant="ghost"
            size="icon-lg"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <Link
            href="/dashboard"
            className="text-base font-semibold tracking-tight"
          >
            FinSight
          </Link>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          {children}
        </div>
      </main>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="bg-sidebar text-sidebar-foreground w-70 gap-0 p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>FinSight navigation menu</SheetDescription>
          </SheetHeader>
          {renderNavigation(false, () => setMobileOpen(false))}
        </SheetContent>
      </Sheet>
    </div>
  );
}
