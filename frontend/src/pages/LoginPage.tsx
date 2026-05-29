import React, { useState } from 'react';
import { TrendingUp, Shield, PieChart } from 'lucide-react';
import { login, register } from '../services/authService';
import { LoginCredentials } from '../types/auth';
import { surface, text, input, button } from '../styles/theme';

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showRegister, setShowRegister] = useState<boolean>(false);

  const [registerData, setRegisterData] = useState({
  email: '',
  password: '',
  confirmPassword: ''
  });
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(credentials);

      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (registerData.password !== registerData.confirmPassword) {
    setError('Las contraseñas no coinciden');
    return;
  }

  if (registerData.password.length < 8) {
    setError('La contraseña debe tener al menos 8 caracteres');
    return;
  }

  setLoading(true);
  try {
    await register({
      email: registerData.email,
      password: registerData.password
    });
    
    window.location.reload();
  } catch (err: any) {
    setError(err.message || 'Error al crear la cuenta');
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Columna izquierda - Info */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--border)]">
              <img src="/favicon-32x32.png" alt="Sprout Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Sprout - Financial Hub</h1>
          </div>

          <h2 className="text-4xl font-bold text-[var(--text-primary)] leading-tight">
            Gestiona tu portfolio<br />
            <span className="text-[var(--accent-blue)]">
              de forma inteligente
            </span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[var(--accent-blue)]/10">
                <PieChart className="w-5 h-5 text-[var(--accent-blue)]" />
              </div>
              <p className="text-[var(--text-secondary)]">
                Visualización avanzada de tu distribución de activos
              </p>  
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[var(--accent-green)]/10">
                <TrendingUp className="w-5 h-5 text-[var(--accent-green)]" />
              </div>
              <p className="text-[var(--text-secondary)]">
                Seguimiento de rendimiento en tiempo real
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#C4A35A]/10">
                <Shield className="w-5 h-5 text-[#C4A35A]" />
              </div>
              <p className="text-[var(--text-secondary)]">
                Seguridad bancaria con cifrado de extremo a extremo
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--text-muted)]">
              Únete a miles de inversores que ya gestionan sus portfolios con nosotros
            </p>
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="relative">
          <div className={surface.heroPanel + ' shadow-md'}>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 text-[var(--accent-red)] text-sm">
                {error}
              </div>
            )}
            {showRegister ? (
              <>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Crear cuenta</h3>
                <p className="text-[var(--text-muted)] mb-6">
                  Regístrate para empezar a gestionar tu portfolio
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className={text.fieldLabel}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className={input.glass}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className={text.fieldLabel}>
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className={input.glass}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className={text.fieldLabel}>
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      className={input.glass}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={button.primary}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] text-center">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => setShowRegister(false)}
                      className="text-[var(--accent-blue)] hover:text-[#3A5F95] font-medium"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Iniciar sesión</h3>
                <p className="text-[var(--text-muted)] mb-6">
                  Accede a tu dashboard personalizado
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className={text.fieldLabel}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={credentials.email}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        email: e.target.value
                      })}
                      className={input.glass}
                      placeholder="tu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className={text.fieldLabel}>
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        password: e.target.value
                      })}
                      className={input.glass}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <input
                        type="checkbox"
                        className="rounded bg-[var(--bg-surface-alt)] border-[var(--border-input)]"
                      />
                      Recordarme
                    </label>
                    <button
                      type="button"
                      className="text-[var(--accent-blue)] hover:text-[#3A5F95]"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className={button.primary}
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-muted)] text-center">
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => setShowRegister(true)}
                      className="text-[var(--accent-blue)] hover:text-[#3A5F95] font-medium"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}