export function sumAccountBalances(
  accounts: readonly { balance: string }[],
): number {
  return accounts.reduce((sum, account) => sum + Number(account.balance), 0);
}
