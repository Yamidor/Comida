import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminLinks = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/pedidos', icon: '📋', label: 'Pedidos' },
  { to: '/admin/productos', icon: '🍽️', label: 'Productos' },
  { to: '/admin/categorias', icon: '🏷️', label: 'Categorías' },
  { to: '/admin/promociones', icon: '🔥', label: 'Promociones' },
  { to: '/admin/clientes', icon: '👥', label: 'Clientes' },
  { to: '/admin/usuarios', icon: '👤', label: 'Usuarios' },
  { to: '/admin/insumos', icon: '📦', label: 'Insumos' },
  { to: '/admin/gastos', icon: '💰', label: 'Gastos' },
  { to: '/admin/nomina', icon: '👷', label: 'Nómina' },
  { to: '/admin/balance', icon: '📈', label: 'Balance' },
];

const meseroLinks = [
  { to: '/mesero/pedidos', icon: '📋', label: 'Pedidos' },
  { to: '/mesero/pedido-local', icon: '🏪', label: 'Atención Local' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isAdmin ? adminLinks : meseroLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-cafe to-cafe-light flex flex-col fixed left-0 top-0 z-20 shadow-2xl">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-dorado text-2xl">🍴</span>
          <div>
            <h1 className="font-display font-bold text-white text-lg tracking-widest leading-none">ARAQUIU</h1>
            <p className="text-white/40 text-[9px] tracking-widest uppercase">Comidas & Bebidas</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-white font-semibold text-sm truncate">{user?.nombre}</p>
          <span className={`text-xs font-bold uppercase tracking-wider ${isAdmin ? 'text-dorado' : 'text-verde-light'}`}>
            {isAdmin ? '👑 Admin' : '👨‍🍳 Mesero'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto sheet-scroll">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <a href="/menu" target="_blank"
          className="sidebar-link text-xs">
          <span>🌐</span> Ver Menú del Cliente
        </a>
        <button onClick={handleLogout}
          className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <span>🚪</span> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
