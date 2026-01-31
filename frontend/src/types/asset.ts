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