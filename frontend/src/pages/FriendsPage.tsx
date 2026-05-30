import { useEffect, useState } from 'react'
import { Users, Eye } from 'lucide-react'
import { getFriends } from '../services/friendService'
import { Friendship } from '../types/friendship'
import FriendDashboard from './FriendDashboard'
import { layout, surface, text } from '../styles/theme'

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingFriend, setViewingFriend] = useState<Friendship | null>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try { setFriends(await getFriends()) } catch { /* */ }
    finally { setLoading(false) }
  }

  if (viewingFriend) {
    return (
      <FriendDashboard
        friendId={viewingFriend.friend_id}
        friendEmail={viewingFriend.friend_email}
        onBack={() => setViewingFriend(null)}
      />
    )
  }

  const accepted = friends.filter(f => f.status === 'accepted')

  return (
    <div className={layout.pageStack}>
      <div>
        <h2 className={text.sectionTitle}>Amigos</h2>
        <p className={text.sectionDesc}>Selecciona un amigo para ver su cartera. Gestiona amigos desde Configuración.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]" />
        </div>
      ) : accepted.length === 0 ? (
        <div className={`${surface.card} flex flex-col items-center justify-center py-12 gap-3`}>
          <Users className="w-12 h-12 text-[var(--text-muted)]" />
          <p className="text-[var(--text-muted)]">No tienes amigos aún</p>
          <p className="text-sm text-[var(--text-muted)]">Añade amigos desde el panel de Configuración</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accepted.map(f => (
            <button
              key={f.friendship_id}
              onClick={() => setViewingFriend(f)}
              className={`${surface.card} flex items-center justify-between hover:border-[var(--border-focus)] transition cursor-pointer group`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-alt)] flex items-center justify-center text-[var(--text-muted)] text-sm font-semibold">
                  {f.friend_email.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{f.friend_email}</span>
              </div>
              <Eye className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
