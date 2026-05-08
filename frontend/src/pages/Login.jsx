import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      login(res.data.user, res.data.token);
      navigate(res.data.user.rol === 'admin' ? '/admin/dashboard' : '/mesero/pedidos');
    } catch (e) {
      setError(e.response?.data?.error || 'Credenciales incorrectas');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cafe to-cafe-light flex items-center justify-center px-4">
      {/* Background deco */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-naranja/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-dorado/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-naranja rounded-2xl shadow-warm-lg mb-4">
            <span className="text-3xl">🍴</span>
          </div>
          <h1 className="font-display font-bold text-white text-3xl tracking-widest">ARAQUIU</h1>
          <p className="text-white/50 text-sm mt-1">Panel de gestión</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <h2 className="font-display font-semibold text-white text-xl mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@araquiu.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-naranja focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-naranja focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl px-4 py-2.5 text-sm animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-naranja hover:bg-naranja-dark text-white font-bold py-3.5 rounded-xl transition-all duration-200 hover:shadow-warm-lg active:scale-95 mt-2 disabled:opacity-50">
              {loading ? '⏳ Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <a href="/menu" className="text-white/40 hover:text-white/70 text-sm transition-colors">
              ← Ver menú del cliente
            </a>
          </div>
        </div>

        {/* Hints */}
        <div className="mt-4 text-center text-white/30 text-xs">
          <p>Admin: admin@araquiu.com / password</p>
          <p>Mesero: mesero@araquiu.com / password</p>
        </div>
      </div>
    </div>
  );
}
