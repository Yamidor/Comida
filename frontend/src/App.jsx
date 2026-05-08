import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Cliente
import Menu from './pages/cliente/Menu';
import Checkout from './pages/cliente/Checkout';
import ConsultarPedido from './pages/cliente/ConsultarPedido';

// Auth
import Login from './pages/Login';

// Admin
import Dashboard from './pages/admin/Dashboard';
import Usuarios from './pages/admin/Usuarios';
import Clientes from './pages/admin/Clientes';
import Categorias from './pages/admin/Categorias';
import Productos from './pages/admin/Productos';
import Promociones from './pages/admin/Promociones';
import AdminPedidos from './pages/admin/Pedidos';
import Insumos from './pages/admin/Insumos';
import Gastos from './pages/admin/Gastos';
import Nomina from './pages/admin/Nomina';
import Balance from './pages/admin/Balance';

// Mesero
import MeseroPedidos from './pages/mesero/Pedidos';
import PedidoLocal from './pages/mesero/PedidoLocal';

// Protected Route Component
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.rol !== role && user.rol !== 'admin') {
    return <Navigate to={user.rol === 'mesero' ? '/mesero/pedidos' : '/login'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Navigate to="/menu" replace />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/consultar-pedido" element={<ConsultarPedido />} />
            <Route path="/login" element={<Login />} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute role="admin"><Usuarios /></ProtectedRoute>} />
            <Route path="/admin/clientes" element={<ProtectedRoute role="admin"><Clientes /></ProtectedRoute>} />
            <Route path="/admin/categorias" element={<ProtectedRoute role="admin"><Categorias /></ProtectedRoute>} />
            <Route path="/admin/productos" element={<ProtectedRoute role="admin"><Productos /></ProtectedRoute>} />
            <Route path="/admin/promociones" element={<ProtectedRoute role="admin"><Promociones /></ProtectedRoute>} />
            <Route path="/admin/pedidos" element={<ProtectedRoute role="admin"><AdminPedidos /></ProtectedRoute>} />
            <Route path="/admin/insumos" element={<ProtectedRoute role="admin"><Insumos /></ProtectedRoute>} />
            <Route path="/admin/gastos" element={<ProtectedRoute role="admin"><Gastos /></ProtectedRoute>} />
            <Route path="/admin/nomina" element={<ProtectedRoute role="admin"><Nomina /></ProtectedRoute>} />
            <Route path="/admin/balance" element={<ProtectedRoute role="admin"><Balance /></ProtectedRoute>} />

            {/* Mesero */}
            <Route path="/mesero/pedidos" element={<ProtectedRoute role="mesero"><MeseroPedidos /></ProtectedRoute>} />
            <Route path="/mesero/pedido-local" element={<ProtectedRoute role="mesero"><PedidoLocal /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
