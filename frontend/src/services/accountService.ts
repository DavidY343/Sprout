import { apiGet, apiPost, apiDelete, apiPatch } from './api'
import { AccountWithBalance, Account, AccountCreate } from './../types/account'

export async function getAccountsWithBalance(): Promise<AccountWithBalance[]> {
  
  try {
    const data = await apiGet<AccountWithBalance[]>(`/portfolio/accounts`, true)
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

export async function removeAccount(accountId: number): Promise<void> {
    try {
        await apiDelete(`/accounts/${accountId}`, true);
    } catch (error) {
        console.error('Error removing account:', error);
        throw error;
    }
}

export async function updateAccount(accountId: number, data: { name?: string; type?: string }): Promise<Account> {
    try {
        return await apiPatch<Account>(`/accounts/${accountId}`, data, true);
    } catch (error) {
        console.error('Error updating account:', error);
        throw error;
    }
}

export async function syncAccount(accountId: number): Promise<void> {
    try {
        await apiPost<any>(`/accounts/${accountId}/sync`, {}, true);
    } catch (error) {
        console.error('Error syncing account:', error);
        throw error;
    }
}

export async function syncAllAccounts(): Promise<void> {
    try {
        await apiPost<any>(`/accounts/sync-all`, {}, true);
    } catch (error) {
        console.error('Error syncing all accounts:', error);
        throw error;
    }
}
