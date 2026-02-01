export interface AssetAllocation {
  group_key: string
  total_value: number
  allocation_pct: number
  asset_count: number
}

export interface AssetTableRow {
  account_id: number
  account_name: string
  asset_id: number
  name: string
  ticker: string
  isin?: string
  type: string
  theme: string
  quantity: number
  current_price: number
  total_value: number
  invested_value: number
  performance: number
}

export interface Asset {
    asset_id: number;
    ticker?: string;
    isin?: string;
    name: string;
    currency: string;
    theme?: string;
    type: string;
    is_active: boolean;
}

export interface AssetCreate {
    ticker?: string;
    isin?: string;
    name: string;
    currency: string;
    theme?: string;
    type: string;
}