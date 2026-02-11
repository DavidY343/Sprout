import { apiGet, apiPost } from './api';
import { RebalanceSetting, RebalanceUpdate, RebalanceBulkUpdate } from '../types/rebalance';

export async function getRebalanceTable(): Promise<RebalanceSetting[]> {
    try {
        const data = await apiGet<RebalanceSetting[]>('/rebalance/', true);
        return data;
    } catch (error) {
        console.error('Error fetching rebalance table:', error);
        throw error;
    }
}

export async function saveRebalanceSettings(settings: RebalanceUpdate[]): Promise<{ message: string }> {
    try {
        const payload: RebalanceBulkUpdate = { settings };
        
        const data = await apiPost<{ message: string }>('/rebalance/save', payload, true);
        return data;
    } catch (error) {
        console.error('Error saving rebalance settings:', error);
        throw error;
    }
}