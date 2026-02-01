import { apiGet, apiPost } from './api'
import { AccountWithBalance, Account, AccountCreate } from './../types/account'

export async function getAccountsWithBalance(): Promise<AccountWithBalance[]> {
  
  try {
    const data = await apiGet<AccountWithBalance[]>(`/portfolio/accounts/`, true)
    return data
  } catch (error) {
    console.error('Error fetching accounts:', error)
    throw error
  }
}

export async function getAccountWithBalance(accountId: number): Promise<AccountWithBalance> {

  try {
    const data = await apiGet<AccountWithBalance[]>(`/portfolio/accounts/${accountId}`, true)
    return data[0]
  } catch (error) {
    console.error('Error fetching account:', error)
    throw error
  }
}

export async function createAccount(accountData: AccountCreate): Promise<Account> {
    try {
        const data = await apiPost<Account>('/accounts/create', accountData, true);
        return data;
    } catch (error) {
        console.error('Error creating account:', error);
        throw error;
    }
}

export async function getUserAccounts(): Promise<Account[]> {
    try {
        const data = await apiGet<Account[]>('/accounts/user-accounts', true);
        return data;
    } catch (error) {
        console.error('Error fetching user accounts:', error);
        throw error;
    }
}
