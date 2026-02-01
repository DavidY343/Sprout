export interface AccountWithBalance {
  account_id: number
  name: string
  type: string
  currency: string
  cash_balance: number
  invested_value: number
  total_value: number
}


export interface Account {
    account_id: number;
    user_id: number;
    name: string;
    type: string;
    currency: string;
    created_at: string;
    is_active: boolean;
}

export interface AccountCreate {
    name: string;
    type: string;
    currency: string;
}