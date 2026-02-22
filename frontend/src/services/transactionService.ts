import { apiGet, apiPost } from './api';
import { Transaction, TransactionCreate } from '../types/transaction';

/**
 * Obtiene todas las transacciones del usuario actual
 */
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await apiGet<Transaction[]>('/transactions/me', true);
    return data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Crea una nueva transacción (Ingreso o Gasto)
 */
export async function createTransaction(transaction: TransactionCreate): Promise<Transaction> {
  try {
    const data = await apiPost<Transaction>('/transactions/create', transaction, true);
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}