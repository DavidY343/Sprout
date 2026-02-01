import { TradeHistory, Operation, OperationCreate } from '../types/trade';
import { apiGet, apiPost } from './api';

/**
 * Obtiene el historial completo de operaciones del usuario
 * Incluye todas las operaciones de compra/venta de todas las cuentas
 */
export async function getTradeHistory(): Promise<TradeHistory[]> {
    try {
        const data = await apiGet<TradeHistory[]>('/trades/history', true);
        return data;
    } catch (error) {
        console.error('Error fetching trade history:', error);
        throw error;
    }
}   


export async function createTrade(operationData: OperationCreate): Promise<Operation> {
    try {
        const data = await apiPost<Operation>('/trades/create', operationData, true);
        return data;
    } catch (error) {
        console.error('Error creating trade:', error);
        throw error;
    }
}

export async function createTradeWithPriceHistory(
    operationData: OperationCreate,
    updatePriceHistory: boolean = false
): Promise<Operation> {
    try {
        const data = await apiPost<Operation>(
            `/trades/create?update_price_history=${updatePriceHistory}`,
            operationData,
            true
        );
        return data;
    } catch (error) {
        console.error('Error creating trade with price history:', error);
        throw error;
    }
}