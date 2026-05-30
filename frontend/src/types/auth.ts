export interface LoginCredentials {
    email: string;
    password: string;
    remember_me?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    password_confirmation?: string;
    remember_me?: boolean;
}

export interface AuthResponse {
    message: string;
    email: string;
    email_verified?: boolean;
}

export interface RefreshResponse {
    message: string;
}
