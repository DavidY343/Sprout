import { getCsrfToken, refreshAccessToken, logout } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Variable para evitar múltiples refrescos simultáneos
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null;

async function attemptRefresh(): Promise<void> {
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }
    isRefreshing = true;
    refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
    });
    return refreshPromise;
}

/**
 * Core fetch wrapper. All requests include credentials (cookies).
 * State-changing methods include X-CSRF-Token header.
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false
): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    // Add CSRF header for state-changing methods
    if (method !== 'GET' && method !== 'HEAD') {
        headers['X-CSRF-Token'] = getCsrfToken();
    }

    // Default content-type if not set and body is not FormData
    if (!headers['Content-Type'] && options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
    };

    let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // If 401 and auth required, try refresh once
    if (response.status === 401 && requireAuth) {
        try {
            await attemptRefresh();
            // Update CSRF after refresh
            if (method !== 'GET' && method !== 'HEAD') {
                headers['X-CSRF-Token'] = getCsrfToken();
            }
            response = await fetch(`${API_BASE_URL}${endpoint}`, { ...config, headers });
        } catch {
            logout();
            throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
    }

    if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData.detail && Array.isArray(errorData.detail)) {
                errorMessage = errorData.detail.map((err: any) => err.msg).join(', ');
            } else {
                errorMessage = errorData.detail || errorData.message || errorMessage;
            }
        } catch {
            try {
                errorMessage = await response.text() || errorMessage;
            } catch {
                // ignore
            }
        }
        throw new Error(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    }

    return response.json();
}


export async function apiGet<T>(
    endpoint: string,
    requireAuth: boolean = false
): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'GET' }, requireAuth);
}


export async function apiPost<T>(
    endpoint: string,
    data: any,
    requireAuth: boolean = false
): Promise<T> {
    const config: RequestInit = {
        method: 'POST',
    };

    if (data instanceof FormData) {
        config.body = data;
    } else {
        config.body = JSON.stringify(data);
        config.headers = { 'Content-Type': 'application/json' };
    }

    return apiRequest<T>(endpoint, config, requireAuth);
}

export async function apiPut<T>(
    endpoint: string,
    data: any,
    requireAuth: boolean = false
): Promise<T> {
    return apiRequest<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    }, requireAuth);
}

export async function apiDelete<T>(
    endpoint: string,
    requireAuth: boolean = false
): Promise<T> {
    return apiRequest<T>(endpoint, { method: 'DELETE' }, requireAuth);
}