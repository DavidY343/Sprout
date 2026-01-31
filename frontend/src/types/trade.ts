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