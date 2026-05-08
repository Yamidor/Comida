import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import ClientHeader from '../../components/ClientHeader';
import Cart from '../../components/Cart';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente de aprobación', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⏳', pulse: true },
  aprobado: { label: '¡Pedido Aprobado!', color: 'bg-green-100 text-green-800 border-green-300', icon: '✅', pulse: false },
  rechazado: { label: 'Pedido Rechazado', color: 'bg-red-100 text-red-800 border-red-300', icon: '❌', pulse: false },
  despachado: { label: 'En camino 🚗', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '🛵', pulse: false },
};

export default function ConsultarPedido() {
  const [params] = useSearchParams();
  const [telefono, setTelefono] = useState(params.get('tel') || '');
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buscar = async () => {
    if (!telefono) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/pedidos/por-telefono/${telefono}`);
      setPedido(res.data);
      if (!res.data) setError('No se encontró pedido activo para este número');
    } catch { setError('Error al buscar el pedido'); }
    setLoading(false);
  };

  useEffect(() => {
    const pedidoParam = params.get('pedido');
    const telParam = params.get('tel');
    if (pedidoParam) {
      setLoading(true);
      api.get(`/api/pedidos/${pedidoParam}`)
        .then(r => setPedido(r.data))
        .catch(() => setError('No se encontró el pedido'))
        .finally(() => setLoading(false));
    } else if (telParam) {
      buscar();
    }
  }, []);

  // WebSocket: escuchar actualizaciones del pedido
  useEffect(() => {
    if (!pedido) return;
    socket.connect();
    socket.emit('join:pedido', { pedidoId: pedido.id });
    socket.emit('join:cliente', { telefono });

    const handler = (updated) => {
      if (updated.id === pedido.id) setPedido(updated);
    };
    socket.on('pedido:actualizado', handler);
    socket.on('pedido:despachado', handler);
    socket.on('nueva:observacion', (obs) => {
      if (obs.pedido_id == pedido.id) {
        setPedido(p => ({ ...p, observaciones: [...(p.observaciones || []), obs] }));
      }
    });

    return () => {
      socket.off('pedido:actualizado', handler);
      socket.off('pedido:despachado', handler);
      socket.disconnect();
    };
  }, [pedido?.id]);

  const status = pedido ? STATUS_CONFIG[pedido.estado] : null;

  return (
    <div className="min-h-screen bg-crema">
      <ClientHeader />
      <Cart />

      <div className="max-w-lg mx-auto px-4 pt-24 pb-10">
        <h1 className="font-display font-bold text-cafe text-3xl mb-2">Tu Pedido</h1>
        <p className="text-cafe/50 text-sm mb-6">Consulta el estado de tu pedido en tiempo real.</p>

        {/* Buscador */}
        {!pedido && (
          <div className="card p-6 mb-6 space-y-4 animate-fade-in">
            <div>
              <label className="label">Número de teléfono</label>
              <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="3001234567" className="input" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button onClick={buscar} disabled={loading} className="btn-primary w-full py-4">
              {loading ? '⏳ Buscando...' : '🔍 Consultar mi pedido'}
            </button>
          </div>
        )}

        {/* Pedido encontrado */}
        {pedido && status && (
          <div className="space-y-4 animate-fade-in">
            {/* Estado */}
            <div className={`card p-6 border-2 ${status.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-4xl ${status.pulse ? 'animate-pulse' : ''}`}>{status.icon}</span>
                <div>
                  <p className="font-display font-bold text-xl">{status.label}</p>
                  <p className="text-sm opacity-70">Pedido #{pedido.id}</p>
                </div>
              </div>
              {pedido.estado === 'pendiente' && (
                <p className="text-sm opacity-70 mt-2">
                  Estamos revisando tu pedido. Esta página se actualiza automáticamente.
                </p>
              )}
            </div>

            {/* Observaciones del mesero */}
            {pedido.observaciones?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold text-cafe mb-3 flex items-center gap-2">
                  💬 Mensajes del restaurante
                </h3>
                <div className="space-y-2">
                  {pedido.observaciones.map((obs, i) => (
                    <div key={i} className="bg-crema rounded-xl p-3 text-sm">
                      <p className="text-cafe">{obs.mensaje}</p>
                      <p className="text-cafe/40 text-xs mt-1">
                        {obs.creado_por} · {new Date(obs.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle del pedido */}
            <div className="card p-5">
              <h3 className="font-semibold text-cafe mb-3">🧾 Detalle</h3>
              <div className="space-y-2 mb-4">
                {(pedido.detalles || []).map((d, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-cafe/70">{d.producto_nombre} × {d.cantidad}</span>
                    <span className="font-semibold text-cafe">{fmt((d.precio_con_descuento || d.precio_unitario) * d.cantidad)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold border-t border-crema-dark pt-3">
                <span>Total</span>
                <span className="text-naranja font-display text-xl">{fmt(pedido.total)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <a href="/menu" className="btn-secondary flex-1 text-center">← Ver Menú</a>
              <button onClick={() => { setPedido(null); setError(''); }}
                className="btn-ghost flex-1">
                Consultar otro
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
