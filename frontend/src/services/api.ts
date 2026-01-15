import { getAccessToken, refreshAccessToken, isAuthenticated, logout } from './authService';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Variable para evitar múltiples refrescos simultáneos
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
    refreshSubscribers.forEach(callback => callback(token));
    refreshSubscribers = [];
}

async function attemptRefresh(): Promise<string | null> {
    if (isRefreshing) {
        return new Promise((resolve) => {
            subscribeTokenRefresh(resolve);
        });
    }

    isRefreshing = true;
    
    try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);
        return newToken;
    } catch (error) {
        isRefreshing = false;
        refreshSubscribers = [];
        throw error;
    }
}


async function getHeaders(requireAuth: boolean): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        let token = getAccessToken();
    
        if (!token) {
            throw new Error('No autenticado. Por favor inicia sesión.');
        }
        if (!isAuthenticated()) {
            try {
                token = await attemptRefresh();
            } catch (refreshError) {
                logout();
                throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
            }
        }

        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

/**
 * Función base para peticiones HTTP
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = false
): Promise<T> {
    const headers = await getHeaders(requireAuth);
    
    const config: RequestInit = {
        ...options,
        headers: {
            ...headers,
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Manejar errores específicos
    if (!response.ok) {
        // Si es 401 y teníamos token, puede que haya expirado justo ahora
        if (response.status === 401 && requireAuth && isAuthenticated()) {
            try {
                // Intentar refresh y reintentar
                const newToken = await attemptRefresh();
                
                // Actualizar headers con nuevo token
                config.headers = {
                    ...config.headers,
                    'Authorization': `Bearer ${newToken}`,
                };
                
                // Reintentar la petición
                const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, config);
                
                if (retryResponse.ok) {
                    return retryResponse.json();
                }
            } catch (refreshError) {
                logout();
            }
        }

        // Manejo de otros errores
        let errorMessage = `API error: ${response.status}`;
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
            errorMessage = await response.text() || errorMessage;
        }
        
        throw new Error(errorMessage);
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

  if (data instanceof URLSearchParams) {
    config.body = data.toString();
    config.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  } else if (data instanceof FormData) {
    config.body = data;
  } else {
    config.body = JSON.stringify(data);
    config.headers = {
      'Content-Type': 'application/json',
    };
  }

  return apiRequest<T>(endpoint, config, requireAuth);
}

// export async function apiPut<T>(
//     endpoint: string, 
//     data: any, 
//     requireAuth: boolean = false
// ): Promise<T> {
//     return apiRequest<T>(endpoint, {
//         method: 'PUT',
//         body: JSON.stringify(data),
//     }, requireAuth);
// }

// export async function apiDelete<T>(
//     endpoint: string, 
//     requireAuth: boolean = false
// ): Promise<T> {
//     return apiRequest<T>(endpoint, { method: 'DELETE' }, requireAuth);
// }