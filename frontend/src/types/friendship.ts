export interface Friendship {
  friendship_id: number
  friend_email: string
  friend_id: number
  status: 'pending' | 'accepted'
  direction: 'sent' | 'received'
  created_at: string
}
