import { apiGet } from './api'
import { AccountWithBalance } from './../types/account'

export async function getAccountsWithBalance(
  userId: number
): Promise<AccountWithBalance[]> {
  return apiGet<AccountWithBalance[]>(`/portfolio/accounts/${userId}`)
}
