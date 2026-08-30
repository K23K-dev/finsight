import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { AuthClientPage } from "./auth-client-page";

export default async function AuthPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <AuthClientPage />;
}
