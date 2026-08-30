import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const SIMPLEFIN_TIMEOUT_MS = 30_000;
const SIMPLEFIN_HISTORY_DAYS = 90;

type SimpleFinErrorCode =
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "TIMEOUT"
  | "INTERNAL_SERVER_ERROR";

function simpleFinError(
  message: string,
  code: SimpleFinErrorCode = "BAD_REQUEST",
) {
  return new TRPCError({ code, message });
}

function createScopedId(prefix: string, parts: readonly string[]) {
  const digest = createHash("sha256")
    .update(JSON.stringify(parts))
    .digest("hex");
  return `${prefix}_${digest}`;
}

export function createSimpleFinAccountId(
  userId: string,
  connectionId: string,
  providerAccountId: string,
) {
  return createScopedId("sfin_account", [
    userId,
    connectionId,
    providerAccountId,
  ]);
}

export function createSimpleFinTransactionId(
  accountId: string,
  providerTransactionId: string,
) {
  return createScopedId("sfin_transaction", [accountId, providerTransactionId]);
}

async function fetchWithAuth(accessUrl: string) {
  const parsedUrl = parseHttpsUrl(accessUrl, "SimpleFin access URL");
  await assertPublicHost(parsedUrl, "SimpleFin access URL");
  // URL accessors return percent-encoded values; Basic auth needs the raw ones.
  let username: string;
  let password: string;
  try {
    username = decodeURIComponent(parsedUrl.username);
    password = decodeURIComponent(parsedUrl.password);
  } catch {
    throw simpleFinError("SimpleFin returned invalid access credentials.");
  }

  parsedUrl.username = "";
  parsedUrl.password = "";

  const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  return secureFetch(
    parsedUrl,
    {
      cache: "no-store",
      headers: { Authorization: authHeader },
    },
    "SimpleFin did not respond in time. Your data was not changed.",
    "SimpleFin could not be reached securely. Your data was not changed.",
  );
}

function isTimeoutError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

async function secureFetch(
  url: URL,
  options: RequestInit,
  timeoutMessage: string,
  failureMessage: string,
) {
  try {
    return await fetch(url, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(SIMPLEFIN_TIMEOUT_MS),
    });
  } catch (error) {
    throw simpleFinError(
      isTimeoutError(error) ? timeoutMessage : failureMessage,
      isTimeoutError(error) ? "TIMEOUT" : "BAD_REQUEST",
    );
  }
}

function isPrivateHost(hostname: string) {
  const host = hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");
  const isIpv6Literal = host.includes(":");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    (isIpv6Literal &&
      (host === "::" ||
        host === "::1" ||
        host.startsWith("::ffff:") ||
        host.startsWith("fc") ||
        host.startsWith("fd") ||
        /^fe[89ab]/.test(host)))
  ) {
    return true;
  }

  const octets = host.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first = -1, second = -1] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    first >= 224
  );
}

async function assertPublicHost(parsedUrl: URL, label: string) {
  const hostname = parsedUrl.hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "");

  let addresses: { address: string; family: number }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw simpleFinError(`${label} could not be resolved.`);
  }

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => isPrivateHost(address))
  ) {
    throw simpleFinError(`${label} cannot target a private network.`);
  }
}

function parseHttpsUrl(value: string, label: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw simpleFinError(`${label} is invalid.`);
  }

  if (parsedUrl.protocol !== "https:") {
    throw simpleFinError(`${label} must use HTTPS.`);
  }

  if (isPrivateHost(parsedUrl.hostname)) {
    throw simpleFinError(`${label} cannot target a private network.`);
  }

  return parsedUrl;
}

export async function claimAccessUrl(setupToken: string) {
  const normalizedToken = setupToken.replace(/\s/g, "");
  const claimUrlValue = Buffer.from(normalizedToken, "base64").toString(
    "utf-8",
  );
  const claimUrl = parseHttpsUrl(claimUrlValue, "SimpleFin setup token");
  await assertPublicHost(claimUrl, "SimpleFin setup token");

  const response = await secureFetch(
    claimUrl,
    {
      method: "POST",
      headers: { "Content-Length": "0" },
    },
    "SimpleFin did not respond while claiming the token. Existing data was not changed.",
    "The SimpleFin token endpoint could not be reached securely. Existing data was not changed.",
  );

  if (!response.ok) {
    throw simpleFinError(
      response.status === 403
        ? "This setup token is invalid or has already been claimed."
        : "SimpleFin could not claim this setup token.",
      response.status === 403 ? "FORBIDDEN" : "BAD_REQUEST",
    );
  }

  let accessUrl: string;
  try {
    accessUrl = (await response.text()).trim();
  } catch {
    throw simpleFinError(
      "SimpleFin did not return a usable access URL. Existing data was not changed.",
    );
  }
  parseHttpsUrl(accessUrl, "SimpleFin access URL");
  return accessUrl;
}

const NumericStringSchema = z.union([z.string(), z.number()]).transform(String);

const SimpleFinTransactionSchema = z.object({
  id: z.string(),
  posted: z.number(),
  amount: NumericStringSchema,
  description: z.string(),
  payee: z.string().optional(),
  memo: z.string().optional(),
  category: z.string().optional(),
  pending: z.boolean().optional(),
});

const SimpleFinOrganizationSchema = z.object({
  domain: z.string().nullish(),
  url: z.string().nullish(),
});

const SimpleFinConnectionSchema = z.object({
  conn_id: z.string(),
  org_url: z.string().nullish(),
});

const SimpleFinAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  conn_id: z.string().min(1),
  org: SimpleFinOrganizationSchema.nullish(),
  balance: NumericStringSchema,
  "balance-date": z.number(),
  currency: z.string(),
  transactions: z.array(SimpleFinTransactionSchema).optional(),
});

const SimpleFinErrorSchema = z.object({
  msg: z.string(),
});

const SimpleFinResponseSchema = z
  .object({
    errlist: z.array(SimpleFinErrorSchema).optional(),
    errors: z.array(z.string()).optional(),
    connections: z.array(SimpleFinConnectionSchema).nullish(),
    accounts: z.array(SimpleFinAccountSchema),
  })
  .refine((data) => data.errlist !== undefined || data.errors !== undefined, {
    message: "SimpleFin response is missing its error list.",
  });

type ParsedSimpleFinAccount = z.infer<typeof SimpleFinAccountSchema>;
type SimpleFinConnection = z.infer<typeof SimpleFinConnectionSchema>;

export type SimpleFinAccount = ParsedSimpleFinAccount & {
  institution: string | null;
  accountType: string | null;
};

function institutionDomain(value: string | null | undefined) {
  const candidate = value?.trim();
  if (!candidate) return null;

  try {
    const url = new URL(
      candidate.includes("://") ? candidate : `https://${candidate}`,
    );
    const hostname = url.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/\.$/, "");
    return hostname.includes(".") ? hostname : null;
  } catch {
    return null;
  }
}

function accountInstitution(
  account: ParsedSimpleFinAccount,
  connection: SimpleFinConnection | null | undefined,
) {
  return (
    institutionDomain(account.org?.domain) ??
    institutionDomain(account.org?.url) ??
    institutionDomain(connection?.org_url)
  );
}

const ACCOUNT_TYPE_RULES = [
  [
    "retirement",
    /\b(?:traditional|rollover|roth|sep|simple)?\s*ira\b|\b(?:401\s*\(?k\)?|403\s*\(?b\)?|457\s*\(?b\)?)\b|\b(?:retirement|pension)\b/,
  ],
  ["crypto", /\b(?:crypto|cryptocurrency|bitcoin|ethereum)\b/],
  ["mortgage", /\bmortgage\b/],
  [
    "credit",
    /\b(?:credit card|visa signature|cash rewards|travel rewards|amex|american express|discover it)\b/,
  ],
  ["savings", /\b(?:savings?|hysa|high[- ]yield savings)\b/],
  ["checking", /\b(?:checking|safe ?balance)\b/],
  [
    "brokerage",
    /\b(?:brokerage|taxable investment|investment account)\b|cma[- ]?edge|robinhood.*individual|individual.*robinhood/,
  ],
  ["loan", /\b(?:loan|auto finance|financing|line of credit)\b/],
  ["cash", /^cash(?: account)?(?:\b|[-(])/],
] as const;

function inferAccountType(name: string, institution: string | null) {
  const text = `${name} ${institution ?? ""}`.trim().toLowerCase();
  return (
    ACCOUNT_TYPE_RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? null
  );
}

export async function fetchAccountSet(accessUrl: string) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - SIMPLEFIN_HISTORY_DAYS);

  const requestUrl = parseHttpsUrl(accessUrl, "SimpleFin access URL");
  requestUrl.pathname = `${requestUrl.pathname.replace(/\/$/, "")}/accounts`;
  requestUrl.searchParams.set("version", "2");
  requestUrl.searchParams.set(
    "start-date",
    Math.floor(startDate.getTime() / 1000).toString(),
  );
  requestUrl.searchParams.set("pending", "1");

  const response = await fetchWithAuth(requestUrl.toString());

  if (!response.ok) {
    throw simpleFinError(
      response.status === 403
        ? "Access denied. Please reconnect your account."
        : `Fetch accounts failed: ${response.statusText}`,
      response.status === 403 ? "FORBIDDEN" : "BAD_REQUEST",
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw simpleFinError(
      "SimpleFin returned an invalid response. Your data was not changed.",
    );
  }

  const parsed = SimpleFinResponseSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Failed to parse the SimpleFin accounts response.");
    throw simpleFinError(
      "Unexpected SimpleFin response. Please try again later.",
      "INTERNAL_SERVER_ERROR",
    );
  }

  const connectionById = new Map<string, SimpleFinConnection | null>();
  for (const connection of parsed.data.connections ?? []) {
    connectionById.set(
      connection.conn_id,
      connectionById.has(connection.conn_id) ? null : connection,
    );
  }

  return {
    providerErrors: [
      ...(parsed.data.errlist?.map((error) => error.msg) ?? []),
      ...(parsed.data.errors ?? []),
    ],
    accounts: parsed.data.accounts.map((account): SimpleFinAccount => {
      const institution = accountInstitution(
        account,
        connectionById.get(account.conn_id),
      );

      return {
        ...account,
        institution,
        accountType: inferAccountType(account.name, institution),
      };
    }),
  };
}
