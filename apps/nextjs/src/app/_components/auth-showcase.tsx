import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@finsight/ui/button";

import { auth, getSession } from "~/auth/server";

export async function AuthShowcase() {
  const session = await getSession();

  if (!session) {
    return (
      <form>
        <Button
          variant="default"
          formAction={async () => {
            "use server";
            const res = await auth.api.signInSocial({
              body: {
                provider: "google",
                callbackURL: "/",
              },
            });
            if (!res.url) {
              throw new Error("No URL returned from signInSocial");
            }
            redirect(res.url);
          }}
        >
          Sign In
        </Button>
      </form>
    );
  }

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
    </div>
  );
}
