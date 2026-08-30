import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@finsight/ui/button";

import { auth, getSession } from "~/auth/server";

export async function AuthShowcase() {
  const session = await getSession();

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <form>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-lg px-3 text-xs text-[#a09d95] hover:bg-white/6 hover:text-[#ece8df]"
            formAction={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/");
            }}
          >
            Sign out
          </Button>
        </form>
        <Button
          asChild
          size="sm"
          className="h-9 rounded-lg bg-[#ece8df] px-4 text-xs font-semibold text-[#171814] shadow-none hover:bg-white"
        >
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="h-9 rounded-lg px-3 text-xs text-[#aaa79f] hover:bg-white/6 hover:text-[#ece8df]"
    >
      <Link href="/auth">Sign in</Link>
    </Button>
  );
}
