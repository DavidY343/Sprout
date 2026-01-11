import { AssetAllocation } from '../types/allocation'
import { apiGet } from './api'



export async function getGlobalAssetAllocation(userId: number, groupBy: 'type' | 'theme' | 'asset'): Promise<AssetAllocation[]> {

    try {
        const data = await apiGet<AssetAllocation[]>(`/portfolio/assets/${groupBy}/${userId}`)
        console.log(data)
        return data
    } catch (error) {
        console.error('Error fetching global asset allocation:', error)
        throw error
    }
}

export async function getAccountAssetAllocation(userId: number, accountId: number, groupBy: 'type' | 'theme' | 'asset' ): Promise<AssetAllocation[]> {

    try {
        const data = await apiGet<AssetAllocation[]>(`/portfolio/assets/${groupBy}/${accountId}/${userId}`)
        console.log(data)
        return data
    } catch (error) {
        console.error('Error fetching account asset allocation:', error)
        throw error
    }
}
