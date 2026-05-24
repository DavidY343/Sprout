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
    <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Columna izquierda - Info */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#E5DED3]">
              <img src="/favicon-32x32.png" alt="Sprout Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-[#2C2C2C]">Sprout - Financial Hub</h1>
          </div>

          <h2 className="text-4xl font-bold text-[#2C2C2C] leading-tight">
            Gestiona tu portfolio<br />
            <span className="text-[#4A6FA5]">
              de forma inteligente
            </span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#4A6FA5]/10">
                <PieChart className="w-5 h-5 text-[#4A6FA5]" />
              </div>
              <p className="text-[#5A5549]">
                Visualización avanzada de tu distribución de activos
              </p>  
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#6B8F71]/10">
                <TrendingUp className="w-5 h-5 text-[#6B8F71]" />
              </div>
              <p className="text-[#5A5549]">
                Seguimiento de rendimiento en tiempo real
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#C4A35A]/10">
                <Shield className="w-5 h-5 text-[#C4A35A]" />
              </div>
              <p className="text-[#5A5549]">
                Seguridad bancaria con cifrado de extremo a extremo
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5DED3]">
            <p className="text-sm text-[#8B8578]">
              Únete a miles de inversores que ya gestionan sus portfolios con nosotros
            </p>
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="relative">
          <div className={surface.heroPanel + ' shadow-md'}>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[#C25B3F]/10 border border-[#C25B3F]/30 text-[#C25B3F] text-sm">
                {error}
              </div>
            )}
            {showRegister ? (
              <>
                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">Crear cuenta</h3>
                <p className="text-[#8B8578] mb-6">
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

                <div className="mt-6 pt-6 border-t border-[#E5DED3]">
                  <p className="text-sm text-[#8B8578] text-center">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => setShowRegister(false)}
                      className="text-[#4A6FA5] hover:text-[#3A5F95] font-medium"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">Iniciar sesión</h3>
                <p className="text-[#8B8578] mb-6">
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
                    <label className="flex items-center gap-2 text-[#5A5549]">
                      <input
                        type="checkbox"
                        className="rounded bg-[#FAF7F0] border-[#D5CEC2]"
                      />
                      Recordarme
                    </label>
                    <button
                      type="button"
                      className="text-[#4A6FA5] hover:text-[#3A5F95]"
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

                <div className="mt-6 pt-6 border-t border-[#E5DED3]">
                  <p className="text-sm text-[#8B8578] text-center">
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => setShowRegister(true)}
                      className="text-[#4A6FA5] hover:text-[#3A5F95] font-medium"
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