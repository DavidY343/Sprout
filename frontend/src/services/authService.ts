import { apiPost } from './api';
import { LoginCredentials, RegisterData, AuthResponse, RefreshResponse } from '../types/auth';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_EMAIL_KEY = 'user_email';


function storeAuthData(accessToken: string, refreshToken: string, email?: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (email) {
        localStorage.setItem(USER_EMAIL_KEY, email);
    }
}

export function clearAuthData(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
}

export function getUserEmail(): string | null { return localStorage.getItem(USER_EMAIL_KEY); }

export function getAccessToken(): string | null { return localStorage.getItem(ACCESS_TOKEN_KEY); }
export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_TOKEN_KEY); }


export function isAuthenticated(): boolean {
    const token = getAccessToken();
    if (!token) return false;

    // Verificar si el token expira en menos de 60 segundos
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        const buffer = 60;
        return payload.exp > (now + buffer);
    } catch {
        return false;
    }
}

export async function register(data: RegisterData): Promise<AuthResponse> {
    try {
        const response = await apiPost<AuthResponse>('/auth/register', data);
        
        if (response.access_token && response.refresh_token) {
            storeAuthData(response.access_token, response.refresh_token, data.email);
        }
        
        return response;
    } catch (error) {
        clearAuthData();
        throw error;
    }
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
        const params = new URLSearchParams();
        params.append('username', credentials.email);
        params.append('password', credentials.password);

        const response = await apiPost<AuthResponse>('/auth/login', params);
        
        if (response.access_token && response.refresh_token) {
            storeAuthData(response.access_token, response.refresh_token, credentials.email);
        }
        
        return response;
    } catch (error) {
        clearAuthData();
        throw error;
    }
}

export function logout(): void {
    clearAuthData();
    // Redirigir al login
    window.location.href = '/login';
}

export async function refreshAccessToken(): Promise<string> {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await apiPost<RefreshResponse>('/auth/refresh', {
            refresh_token: refreshToken
        });
        
        if (response.access_token) {
            localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token);
            return response.access_token;
        }
        
        throw new Error('Invalid refresh response');
    } catch (error: any) {
        const isAuthError = error.response?.status === 401 || error.response?.status === 403;

        if (isAuthError) {
            logout();
        } else { //e.g ERROR 500 NETWORK
            console.error("Error de red o del servidor, manteniendo sesión activa por ahora.");
        }

        throw error;
    }
}

