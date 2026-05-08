import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import Sidebar from '../../components/Sidebar';
import PrintTicket from '../../components/PrintTicket';
import { useAuth } from '../../context/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const ESTADO_COLORS = {
  pendiente: 'border-l-yellow-400 bg-yellow-50',
  aprobado: 'border-l-green-400 bg-green-50',
  rechazado: 'border-l-red-400 bg-red-50',
  despachado: 'border-l-gray-400 bg-gray-50',
};
const ESTADO_BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  despachado: 'bg-gray-100 text-gray-600',
};

export default function MeseroPedidos() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [pedidoPrint, setPedidoPrint] = useState(null);
  const [obsTexts, setObsTexts] = useState({});
  const [mapaPedido, setMapaPedido] = useState(null);
  const audioRef = useRef(null);

  const cargar = async () => {
    const params = filtroEstado ? `?estado=${filtroEstado}` : '';
    const res = await api.get(`/api/pedidos${params}`);
    setPedidos(res.data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  useEffect(() => {
    socket.connect();
    
    socket.on('connect', () => {
      socket.emit('join:meseros', { nombre: user?.nombre });
    });
    // También emitir por si ya está conectado
    if (socket.connected) {
      socket.emit('join:meseros', { nombre: user?.nombre });
    }

    socket.on('nuevo:pedido', (pedido) => {
      setPedidos(prev => [pedido, ...prev]);
      // Beep de notificación
      try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EwHyZMidDnuWkxFyU7b6nWxJBqPikhOW+r2NS2kXtnSSYyZKbXz7mdh3VeRTBpqtzUxaeYh3JjU0Bnpd3SxqqbiYBzZVhMX4as3NXLs6WYi39vX1JJVYSm2tXPvK6gl4x/c2VaUFeMqdrWz8Ctop2Vi4F2amNbVWCJqNjVz8OzqaCWi4F2aF9bV2KKqNbUz8OzqZ+Xi4B3aWFcWWKIqdXTz8OzqJ+Wi4B3al9dWGSIqNTTz8K0qZ+Xi4B3al9dWWOIqdTTz8K0qZ+Wi4B3al9dWWOJqdTTz8K0qaCXi4B3al9dWWOJqdTTz8K0qaCXi4B3al9dWWOJqdTTz8K0qaCXjIB3al9dWWOJqdTTz8K0qaCXjIB3al9dWWOJqdTTz8K0qaCXjIB3al9dWWOJqdTTz8K0qaCXjIB3al9dWWOJqdTTz8K0qaCXjIB3al9dWWOJqdTT').play(); } catch {}
    });

    socket.on('pedido:actualizado', (pedido) => {
      setPedidos(prev => {
        const idx = prev.findIndex(p => p.id === pedido.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = pedido; return next; }
        return [pedido, ...prev];
      });
    });

    return () => {
      socket.off('connect');
      socket.off('nuevo:pedido');
      socket.off('pedido:actualizado');
      socket.disconnect();
    };
  }, []);

  const cambiarEstado = async (id, estado) => {
    await api.patch(`/api/pedidos/${id}/estado`, { estado });
    cargar();
  };

  const agregarObs = async (id) => {
    const msg = obsTexts[id]?.trim();
    if (!msg) return;
    await api.post(`/api/pedidos/${id}/observaciones`, { mensaje: msg });
    setObsTexts(p => ({ ...p, [id]: '' }));
    cargar();
  };

  const verTicket = async (id) => {
    const res = await api.get(`/api/pedidos/${id}`);
    setPedidoPrint(res.data);
  };

  const filtros = ['', 'pendiente', 'aprobado', 'rechazado', 'despachado'];

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {pedidoPrint && <PrintTicket pedido={pedidoPrint} onClose={() => setPedidoPrint(null)} />}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="section-title">Pedidos en Tiempo Real</h1>
            <p className="text-cafe/50 text-sm mt-0.5">Se actualiza automáticamente via WebSocket</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {filtros.map(f => (
              <button key={f} onClick={() => setFiltroEstado(f)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${filtroEstado === f ? 'bg-naranja text-white shadow-warm' : 'bg-white text-cafe/60 border border-cafe/15 hover:border-naranja/40'}`}>
                {f || 'Todos'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-cafe/40">Cargando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">📋</div>
            <p className="text-cafe/50 font-medium">No hay pedidos {filtroEstado && `en estado "${filtroEstado}"`}</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {pedidos.map(pedido => (
              <div key={pedido.id}
                className={`bg-white rounded-2xl border-l-4 shadow-card overflow-hidden ${ESTADO_COLORS[pedido.estado]}`}>
                {/* Header */}
                <div className="px-5 py-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-cafe">#{pedido.id}</span>
                      <span className={`badge-status ${ESTADO_BADGE[pedido.estado]}`}>
                        {pedido.estado}
                      </span>
                      <span className="text-xs text-cafe/40 bg-crema px-2 py-0.5 rounded-full">
                        {pedido.origen === 'local' ? '🏪 Local' : '🌐 Web'}
                      </span>
                      {pedido.whatsapp_estado === 'confirmado' && (
                        <span className="text-xs text-green-700 bg-green-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="text-[10px]">💬</span> Confirmado WP
                        </span>
                      )}
                      {pedido.whatsapp_estado === 'esperando_comprobante' && (
                        <span className="text-xs text-orange-700 bg-orange-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="text-[10px]">⏳</span> Esperando Foto
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-cafe">{pedido.cliente_nombre}</p>
                    <p className="text-sm text-cafe/50">{pedido.cliente_telefono}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-naranja text-xl">{fmt(pedido.total)}</p>
                    <p className="text-xs text-cafe/40">
                      {new Date(pedido.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs font-medium text-cafe/60 mt-0.5">
                      {pedido.metodo_pago === 'efectivo' ? '💵 Efectivo' : '📱 Transfer.'}
                    </p>
                  </div>
                </div>

                {/* Dirección */}
                {(pedido.direccion_entrega_texto || pedido.lat) && (
                  <div className="px-5 py-2 bg-crema/50 text-sm flex items-center justify-between gap-1.5 border-y border-crema-dark">
                    <div className="text-cafe/70 truncate flex-1">
                      <span>📍</span> {pedido.direccion_entrega_texto || 'Ubicación GPS'}
                    </div>
                    {pedido.lat && pedido.lng && (
                      <button onClick={() => setMapaPedido(pedido)}
                        className="flex-shrink-0 text-naranja font-semibold hover:text-naranja-dark hover:underline bg-white px-2 py-1 rounded-md shadow-sm border border-naranja/20 transition-all">
                        🗺️ Ver Mapa
                      </button>
                    )}
                  </div>
                )}

                {/* Acciones */}
                {pedido.comprobante_url && (
                  <div className="px-5 py-2 bg-blue-50 border-t border-crema-dark text-center">
                    <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${pedido.comprobante_url}`} target="_blank" rel="noreferrer" className="text-blue-600 font-bold text-sm hover:underline flex items-center justify-center gap-2">
                      🧾 Ver Comprobante de Pago
                    </a>
                  </div>
                )}
                {pedido.estado === 'pendiente' && (
                  <div className="px-5 py-3 flex gap-2 border-t border-crema-dark">
                    <button onClick={() => cambiarEstado(pedido.id, 'aprobado')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95">
                      ✅ Aprobar
                    </button>
                    <button onClick={() => cambiarEstado(pedido.id, 'rechazado')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95">
                      ❌ Rechazar
                    </button>
                  </div>
                )}

                {pedido.estado === 'aprobado' && (
                  <div className="px-5 py-3 border-t border-crema-dark">
                    <button onClick={() => cambiarEstado(pedido.id, 'despachado')}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95">
                      🛵 Marcar Despachado
                    </button>
                  </div>
                )}

                {/* Observaciones */}
                <div className="px-5 py-3 border-t border-crema-dark">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={obsTexts[pedido.id] || ''}
                      onChange={e => setObsTexts(p => ({ ...p, [pedido.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && agregarObs(pedido.id)}
                      placeholder="Agregar observación..."
                      className="input text-sm py-2"
                    />
                    <button onClick={() => agregarObs(pedido.id)}
                      className="bg-naranja text-white px-3 rounded-xl hover:bg-naranja-dark transition-colors">
                      💬
                    </button>
                    <button onClick={() => verTicket(pedido.id)}
                      className="bg-cafe text-white px-3 rounded-xl hover:bg-cafe-medium transition-colors text-sm">
                      🖨️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Mapa */}
        {mapaPedido && (
          <div className="fixed inset-0 bg-cafe/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-crema-dark flex justify-between items-center bg-crema">
                <div>
                  <h3 className="font-display font-bold text-cafe text-xl">Ubicación de Entrega</h3>
                  <p className="text-cafe/60 text-sm">Pedido #{mapaPedido.id} - {mapaPedido.cliente_nombre}</p>
                </div>
                <button onClick={() => setMapaPedido(null)} className="text-2xl text-cafe/50 hover:text-red-500 transition-colors">✕</button>
              </div>
              
              <div className="h-96 w-full relative z-0">
                <MapContainer 
                  center={[parseFloat(mapaPedido.lat), parseFloat(mapaPedido.lng)]} 
                  zoom={16} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[parseFloat(mapaPedido.lat), parseFloat(mapaPedido.lng)]} />
                </MapContainer>
              </div>

              <div className="px-6 py-4 bg-crema text-center text-sm text-cafe/70">
                Lat: {mapaPedido.lat} | Lng: {mapaPedido.lng}
                {mapaPedido.direccion_entrega_texto && (
                  <p className="mt-1 font-semibold text-cafe">{mapaPedido.direccion_entrega_texto}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
