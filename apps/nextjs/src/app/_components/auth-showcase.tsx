import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@finsight/ui/button";

import { auth, getSession } from "~/auth/server";

export async function AuthButtons() {
  const session = await getSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">Hi, {session.user.name}</span>
        <form>
          <Button
            variant="secondary"
            formAction={async () => {
              "use server";
              await auth.api.signOut({
                headers: await headers(),
              });
              redirect("/");
            }}
          >
            Sign Out
          </Button>
        </form>
        <Link href="/dashboard">
          <Button variant="default">Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <Link href="/auth">
        <Button variant="ghost">Sign In</Button>
      </Link>
    </div>
  );
}

export async function AuthShowcase() {
  return <AuthButtons />;
}
