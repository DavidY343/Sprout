import React, { useState } from 'react';
import { TrendingUp, Shield, PieChart } from 'lucide-react';
import { login, register } from '../services/authService';
import { LoginCredentials } from '../types/auth';

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
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] to-[#15102a] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Columna izquierda - Info */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              {/* <TrendingUp className="w-8 h-8 text-white" /> */}
              <img src="../public/favicon-32x32.png" alt="Sprout Logo" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-white">Sprout - Financial Hub</h1>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight">
            Gestiona tu portfolio<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-400">
              de forma inteligente
            </span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <PieChart className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-gray-300">
                Visualización avanzada de tu distribución de activos
              </p>  
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-violet-500/10">
                <TrendingUp className="w-5 h-5 text-violet-400" />
              </div>
              <p className="text-gray-300">
                Seguimiento de rendimiento en tiempo real
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-gray-300">
                Seguridad bancaria con cifrado de extremo a extremo
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400">
              Únete a miles de inversores que ya gestionan sus portfolios con nosotros
            </p>
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="relative">
          <div className="
            relative rounded-2xl p-8
            bg-gradient-to-br from-[#15102a] to-[#0f0a20]
            border border-purple-500/40
            shadow-2xl
            before:absolute before:inset-0 before:rounded-2xl before:p-[1px]
            before:bg-gradient-to-r 
            before:from-purple-600/60 before:to-violet-600/60
            before:-z-10
            after:absolute after:inset-0 after:rounded-2xl after:m-[0.5px]
            after:bg-gradient-to-br after:from-[#15102a] after:to-[#0f0a20]
            after:-z-20
          ">
            {/* Efectos visuales */}
            <div className="absolute top-0 left-1/4 w-32 h-32 -translate-y-16 
              bg-purple-600/20 rounded-full blur-2xl -z-10"></div>
            <div className="absolute bottom-0 right-1/4 w-32 h-32 translate-y-16 
              bg-violet-600/20 rounded-full blur-2xl -z-10"></div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}
            {showRegister ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">Crear cuenta</h3>
                <p className="text-gray-400 mb-6">
                  Regístrate para empezar a gestionar tu portfolio
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirmar contraseña
                    </label>
                    <input
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium hover:opacity-90 transition"
                  >
                    {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 text-center">
                    ¿Ya tienes cuenta?{' '}
                    <button
                      onClick={() => setShowRegister(false)}
                      className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Iniciar sesión
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-white mb-2">Iniciar sesión</h3>
                <p className="text-gray-400 mb-6">
                  Accede a tu dashboard personalizado
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={credentials.email}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        email: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      placeholder="tu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({
                        ...credentials,
                        password: e.target.value
                      })}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition"
                      placeholder="••••••••"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        className="rounded bg-white/5 border-white/10"
                      />
                      Recordarme
                    </label>
                    <button
                      type="button"
                      className="text-purple-400 hover:text-purple-300"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white font-medium hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 text-center">
                    ¿No tienes cuenta?{' '}
                    <button
                      onClick={() => setShowRegister(true)}
                      className="text-purple-400 hover:text-purple-300 font-medium"
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