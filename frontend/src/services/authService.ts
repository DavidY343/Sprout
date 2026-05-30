import { LoginCredentials, RegisterData, AuthResponse } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const USER_EMAIL_KEY = 'user_email';

/** Read the csrf_token cookie value (not HttpOnly, readable by JS). */
export function getCsrfToken(): string {
    const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function getUserEmail(): string | null {
    return localStorage.getItem(USER_EMAIL_KEY);
}

/**
 * Check auth status by calling /auth/me.
 * Returns true if the access_token cookie is valid.
 */
export async function checkAuth(): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem(USER_EMAIL_KEY, data.email);
            return true;
        }
        // Try refreshing
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });
        if (refreshRes.ok) {
            const retryRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
            if (retryRes.ok) {
                const data = await retryRes.json();
                localStorage.setItem(USER_EMAIL_KEY, data.email);
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
}

export function isAuthenticated(): boolean {
    // Quick check: do we have a csrf_token cookie? (proxy for being logged in)
    return getCsrfToken() !== '';
}

export async function register(data: RegisterData): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Registration failed');
    }
    const response = await res.json();
    localStorage.setItem(USER_EMAIL_KEY, response.email);
    return response;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Login failed');
    }
    const response = await res.json();
    localStorage.setItem(USER_EMAIL_KEY, response.email);
    return response;
}

export async function logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    }).catch(() => {});
    localStorage.removeItem(USER_EMAIL_KEY);
    window.location.reload();
}

export async function refreshAccessToken(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error('Refresh failed');
    }
}

export async function forgotPassword(email: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Reset failed');
    }
}

export async function verifyEmail(token: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Verification failed');
    }
}
