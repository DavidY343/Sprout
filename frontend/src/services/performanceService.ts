import { apiGet } from './api'
import { PerformanceResponse } from '../types/performance';


/**
 * Obtiene las métricas de rendimiento (1m, 3m, YTD, Total)
 */
export async function getPerformanceMetrics(accountId?: number | 'all'): Promise<PerformanceResponse> {
  try {
    const url = accountId && accountId !== 'all' ? `/portfolio/performance?account_id=${accountId}` : '/portfolio/performance';
    return await apiGet<PerformanceResponse>(url, true);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
}