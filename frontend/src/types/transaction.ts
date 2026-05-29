export interface Transaction {
  transaction_id: number;
  account_id: number;
  account_name: string;
  category: string | null;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description: string | null;
  created_at: string;
}

export interface TransactionCreate {
  account_id: number;
  category?: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description?: string;
}