import { TradeHistory } from '../types/trade';
import { apiGet } from './api';

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