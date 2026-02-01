export interface TradeHistory {
    ticker: string | null;
    isin: string | null;
    asset_name: string;
    currency: string;
    date: string;
    quantity: number;
    price: number;
    operation_type: 'buy' | 'sell';
    fees: number;
    account_name: string;
}

export interface Operation {
    operation_id: number;
    asset_id: number;
    account_id: number;
    date: string;
    quantity: number;
    price: number;
    fees: number;
    operation_type: 'buy' | 'sell';
}

export interface OperationCreate {
    asset_id: number;
    account_id: number;
    date: string;
    quantity: number;
    price: number;
    fees?: number;
    operation_type: 'buy' | 'sell';
}