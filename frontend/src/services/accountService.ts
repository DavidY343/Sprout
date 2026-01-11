import { apiGet } from './api'
import { AccountWithBalance } from './../types/account'

export async function getAccountsWithBalance(userId: number): Promise<AccountWithBalance[]> {
  try {
    const data = await apiGet<AccountWithBalance[]>(`/portfolio/accounts/${userId}`)
    return data
  } catch (error) {
    console.error('Error fetching accounts:', error)
    throw error
  }
}

export async function getAccountWithBalance(userId: number, accountId: number): Promise<AccountWithBalance> {
  try {
    const data = await apiGet<AccountWithBalance[]>(`/portfolio/accounts/${userId}/${accountId}`)
    return data[0]
  } catch (error) {
    console.error('Error fetching account:', error)
    throw error
  }
}