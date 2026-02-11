export interface RebalanceSetting {
    asset_id: number;
    asset_name: string;
    ticker: string;
    target_percentage: number;
}

export interface RebalanceUpdate {
    asset_id: number;
    target_percentage: number;
}

export interface RebalanceBulkUpdate {
    settings: RebalanceUpdate[];
}