import { apiGet, apiPost, apiPut, apiDelete } from './api'
import { Friendship } from '../types/friendship'
import { AccountWithBalance } from '../types/account'
import { PerformanceResponse } from '../types/performance'

export async function getFriends(): Promise<Friendship[]> {
  return apiGet<Friendship[]>('/friends', true)
}

export async function sendFriendRequest(email: string): Promise<Friendship> {
  return apiPost<Friendship>('/friends', { email }, true)
}

export async function acceptFriendRequest(friendshipId: number): Promise<Friendship> {
  return apiPut<Friendship>(`/friends/${friendshipId}/accept`, {}, true)
}

export async function removeFriend(friendshipId: number): Promise<void> {
  await apiDelete(`/friends/${friendshipId}`, true)
}

// --- Friend's dashboard data (read-only) ---

export async function getFriendAccounts(friendId: number): Promise<AccountWithBalance[]> {
  return apiGet<AccountWithBalance[]>(`/friends/${friendId}/portfolio/accounts`, true)
}

export async function getFriendAllAssets(friendId: number) {
  return apiGet(`/friends/${friendId}/portfolio/assets/all`, true)
}

export async function getFriendAssetsGrouped(friendId: number, groupBy: string) {
  return apiGet(`/friends/${friendId}/portfolio/assets/${groupBy}`, true)
}

export async function getFriendPerformance(friendId: number): Promise<PerformanceResponse> {
  return apiGet<PerformanceResponse>(`/friends/${friendId}/portfolio/performance`, true)
}
