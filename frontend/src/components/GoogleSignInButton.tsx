import { useEffect, useRef } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

interface Props {
  onSuccess: () => void
  onError: (msg: string) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
        }
      }
    }
  }
}

export default function GoogleSignInButton({ onSuccess, onError }: Props) {
  const buttonRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        locale: 'es',
      })
    }

    // Google script might already be loaded
    if (window.google) {
      renderButton()
    } else {
      // Wait for the script
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          renderButton()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [])

  async function handleCredentialResponse(response: { credential: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential: response.credential }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        onError(err.detail || 'Error con Google login')
        return
      }

      const data = await res.json()
      localStorage.setItem('user_email', data.email)
      onSuccess()
    } catch (e: any) {
      onError(e.message || 'Error de conexión')
    }
  }

  if (!GOOGLE_CLIENT_ID) return null

  return <div ref={buttonRef} className="w-full flex justify-center" />
}
