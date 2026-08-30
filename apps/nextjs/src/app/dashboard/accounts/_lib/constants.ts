import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Bitcoin,
  Building,
  CreditCard,
  Home,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const ACCOUNT_TYPES = [
  { id: "checking", label: "Checking", icon: Wallet },
  { id: "savings", label: "Savings", icon: PiggyBank },
  { id: "credit", label: "Credit Card", icon: CreditCard },
  { id: "brokerage", label: "Brokerage", icon: TrendingUp },
  { id: "retirement", label: "Retirement", icon: Landmark },
  { id: "loan", label: "Loan", icon: Building },
  { id: "mortgage", label: "Mortgage", icon: Home },
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
] as const;

export const INSTITUTIONS = [
  { id: "ally.com", name: "Ally" },
  { id: "americanexpress.com", name: "American Express" },
  { id: "bankofamerica.com", name: "Bank of America" },
  { id: "capitalone.com", name: "Capital One" },
  { id: "schwab.com", name: "Charles Schwab" },
  { id: "chase.com", name: "Chase" },
  { id: "citi.com", name: "Citi" },
  { id: "citizensbank.com", name: "Citizens Bank" },
  { id: "coinbase.com", name: "Coinbase" },
  { id: "discover.com", name: "Discover" },
  { id: "etrade.com", name: "E*TRADE" },
  { id: "fidelity.com", name: "Fidelity" },
  { id: "fifththird.com", name: "Fifth Third Bank" },
  { id: "huntington.com", name: "Huntington" },
  { id: "keybank.com", name: "KeyBank" },
  { id: "marcus.com", name: "Marcus by Goldman Sachs" },
  { id: "merrilledge.com", name: "Merrill Edge" },
  { id: "navyfederal.org", name: "Navy Federal" },
  { id: "pnc.com", name: "PNC" },
  { id: "regions.com", name: "Regions" },
  { id: "robinhood.com", name: "Robinhood" },
  { id: "sofi.com", name: "SoFi" },
  { id: "synchrony.com", name: "Synchrony" },
  { id: "tdbank.com", name: "TD Bank" },
  { id: "truist.com", name: "Truist" },
  { id: "usaa.com", name: "USAA" },
  { id: "usbank.com", name: "US Bank" },
  { id: "vanguard.com", name: "Vanguard" },
  { id: "wellsfargo.com", name: "Wells Fargo" },
] as const;

export function getAccountTypeInfo(typeId: string | null): {
  label: string;
  icon: LucideIcon;
} | null {
  if (!typeId) return null;
  const found = ACCOUNT_TYPES.find((t) => t.id === typeId);
  return found ? { label: found.label, icon: found.icon } : null;
}

export function getInstitutionName(
  institutionId: string | null,
): string | null {
  if (!institutionId) return null;
  const found = INSTITUTIONS.find((i) => i.id === institutionId);
  return found?.name ?? institutionId;
}
