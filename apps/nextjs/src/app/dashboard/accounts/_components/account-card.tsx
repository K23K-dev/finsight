import { Building2, Eye, EyeOff, Pencil } from "lucide-react";

import type { RouterOutputs } from "@finsight/api";
import { cn } from "@finsight/ui";
import { Button } from "@finsight/ui/button";

import { sumAccountBalances } from "~/utils/account-balances";
import { formatCurrency } from "~/utils/format";
import { getAccountTypeInfo, getInstitutionName } from "../_lib/constants";
import { Logo } from "../../_components/logo";

type FinancialAccount = RouterOutputs["account"]["getAll"][number];

interface AccountsOverviewProps {
  accounts: readonly FinancialAccount[];
  onEdit: (account: FinancialAccount) => void;
  onToggleHidden: (account: FinancialAccount) => void;
}

export function AccountsOverview({
  accounts,
  onEdit,
  onToggleHidden,
}: AccountsOverviewProps) {
  const sortedAccounts = [...accounts].sort((a, b) => {
    if (a.hidden === b.hidden) return 0;
    return a.hidden ? 1 : -1;
  });
  const activeAccounts = sortedAccounts.filter((account) => !account.hidden);
  const assets = activeAccounts.filter(
    (account) => Number(account.balance) >= 0,
  );
  const liabilities = activeAccounts.filter(
    (account) => Number(account.balance) < 0,
  );
  const hiddenAccounts = sortedAccounts.filter((account) => account.hidden);
  const totalAssets = sumAccountBalances(assets);
  const totalLiabilities = Math.abs(sumAccountBalances(liabilities));
  const groups = [
    {
      key: "assets",
      title: "Assets",
      description: "Cash and positive balances",
      accounts: assets,
      total: totalAssets,
    },
    {
      key: "liabilities",
      title: "Liabilities",
      description: "Credit and negative balances",
      accounts: liabilities,
      total: -totalLiabilities,
    },
    {
      key: "hidden",
      title: "Hidden",
      description: "Excluded from your active view",
      accounts: hiddenAccounts,
      total: sumAccountBalances(hiddenAccounts),
    },
  ].filter((group) => group.accounts.length > 0);

  return (
    <>
      <section
        aria-labelledby="accounts-total-heading"
        className="bg-card/48 border-border/70 rounded-lg border px-5 py-6 sm:px-7 sm:py-7"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              Total net worth
            </p>
            <h2
              id="accounts-total-heading"
              className="mt-2 text-3xl font-semibold tracking-[-0.03em] tabular-nums sm:text-4xl"
            >
              {formatCurrency(totalAssets - totalLiabilities, {
                decimals: true,
              })}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Net across {activeAccounts.length} visible{" "}
              {activeAccounts.length === 1 ? "account" : "accounts"}
            </p>
          </div>

          <dl className="border-border/60 divide-border/60 grid w-full grid-cols-2 divide-x border-y py-3 sm:w-auto sm:min-w-[300px]">
            <BalanceFigure label="Assets" value={totalAssets} />
            <BalanceFigure label="Liabilities" value={totalLiabilities} />
          </dl>
        </div>
      </section>

      <div className="bg-card/48 border-border/70 overflow-hidden rounded-lg border">
        <div className="bg-background/35 border-border/60 text-muted-foreground hidden grid-cols-[44px_minmax(180px,1.4fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_140px_88px] items-center gap-3 border-b px-5 py-3 text-xs font-medium md:grid">
          <span aria-hidden="true" />
          <span>Account</span>
          <span>Type</span>
          <span>Last sync</span>
          <span className="text-right">Balance</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="divide-border/60 divide-y">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={group.key}>
              <div className="bg-background/24 border-border/55 flex items-end justify-between gap-4 border-b px-5 py-3.5">
                <div>
                  <h2 id={group.key} className="text-sm font-semibold">
                    {group.title}
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {group.description}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(group.total, { decimals: true })}
                </p>
              </div>

              <div className="divide-border/55 divide-y">
                {group.accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={onEdit}
                    onToggleHidden={onToggleHidden}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

interface AccountCardProps {
  account: FinancialAccount;
  onEdit: (account: FinancialAccount) => void;
  onToggleHidden: (account: FinancialAccount) => void;
}

function AccountCard({ account, onEdit, onToggleHidden }: AccountCardProps) {
  const balance = Number(account.balance);
  const isNegative = balance < 0;
  const typeInfo = getAccountTypeInfo(account.accountType);
  const TypeIcon = typeInfo?.icon;
  const accountName = account.customName ?? account.name;
  const institutionName = account.institution
    ? getInstitutionName(account.institution)
    : "Institution not set";

  return (
    <div
      className={cn(
        "hover:bg-muted/25 grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 transition-colors md:grid-cols-[44px_minmax(180px,1.4fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_140px_88px]",
        account.hidden && "text-muted-foreground opacity-70",
      )}
    >
      <div className="bg-background/50 ring-border/50 flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg ring-1">
        <Logo
          domain={account.institution}
          size={40}
          fallback={<Building2 className="text-muted-foreground h-5 w-5" />}
          className="rounded-lg"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{accountName}</p>
        <p className="text-muted-foreground truncate text-xs">
          {institutionName}
        </p>
        <div className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs md:hidden">
          {TypeIcon && <TypeIcon className="h-3 w-3" aria-hidden="true" />}
          <span className="capitalize">
            {typeInfo?.label ?? account.accountType ?? account.currency}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {account.lastSyncedAt
              ? `Synced ${new Date(account.lastSyncedAt).toLocaleDateString()}`
              : "Never synced"}
          </span>
        </div>
      </div>

      <div className="text-muted-foreground hidden items-center gap-1.5 text-sm md:flex">
        {TypeIcon && <TypeIcon className="h-4 w-4" aria-hidden="true" />}
        <span className="truncate capitalize">
          {typeInfo?.label ?? account.accountType ?? account.currency}
        </span>
      </div>

      <p className="text-muted-foreground hidden truncate text-sm md:block">
        {account.lastSyncedAt
          ? new Date(account.lastSyncedAt).toLocaleDateString()
          : "Never synced"}
      </p>

      <p
        className={cn(
          "text-right text-sm font-semibold tabular-nums",
          isNegative && "text-foreground/75",
        )}
      >
        {formatCurrency(balance, {
          currency: account.currency,
          decimals: true,
        })}
      </p>

      <div className="col-span-3 flex justify-end gap-1 pt-1 md:col-span-1 md:pt-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(account)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/45 h-8 w-8 rounded-md"
          aria-label={`Edit ${accountName}`}
          title="Edit account"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleHidden(account)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted/45 h-8 w-8 rounded-md"
          aria-label={`${account.hidden ? "Show" : "Hide"} ${accountName}`}
          title={account.hidden ? "Show account" : "Hide account"}
        >
          {account.hidden ? (
            <Eye className="h-4 w-4" aria-hidden="true" />
          ) : (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
}

function BalanceFigure({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-4 first:pl-0 last:pr-0">
      <dt className="text-muted-foreground truncate text-xs font-medium">
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold tabular-nums">
        {formatCurrency(value)}
      </dd>
    </div>
  );
}
