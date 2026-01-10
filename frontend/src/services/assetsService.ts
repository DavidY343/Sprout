import { apiGet } from './api'
import { AssetAllocation } from '../types/allocation'

export async function getAssetAllocation(
  userId: number,
  groupBy: 'type' | 'theme' | 'asset',
  accountId?: number
): Promise<AssetAllocation[]> {
  if (accountId) {
    return apiGet<AssetAllocation[]>(
      `/assets/${groupBy}/${accountId}/${userId}`
    )
  }

  return apiGet<AssetAllocation[]>(
    `/assets/${groupBy}/${userId}`
  )
}
