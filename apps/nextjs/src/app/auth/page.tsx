import { redirect } from "next/navigation";

import { Button } from "@finsight/ui/button";

import { auth } from "~/auth/server";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <div className="flex w-full max-w-md flex-col gap-6 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tighter">
            Welcome to FinSight
          </h1>
          <p className="text-sm text-zinc-400">
            Sign in to access your financial dashboard
          </p>
        </div>

        <form className="flex flex-col gap-4">
          <Button
            variant="outline"
            className="w-full text-white hover:bg-zinc-800"
            formAction={async () => {
              "use server";
              const res = await auth.api.signInSocial({
                body: {
                  provider: "google",
                  callbackURL: "/dashboard",
                },
              });
              if (!res.url) {
                throw new Error("No URL returned from signInSocial");
              }
              redirect(res.url);
            }}
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
        </form>

        <div className="text-center text-xs text-zinc-500">
          By clicking continue, you agree to our{" "}
          <span className="underline hover:text-zinc-300">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline hover:text-zinc-300">Privacy Policy</span>.
        </div>
      </div>
    </div>
  );
}

