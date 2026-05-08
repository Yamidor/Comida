import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ClientHeader from '../../components/ClientHeader';
import Cart from '../../components/Cart';
import MapPicker from '../../components/MapPicker';
import { useCart } from '../../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const STEPS = ['📱 Teléfono', '📍 Dirección', '✅ Confirmar'];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — teléfono y cliente
  const [telefono, setTelefono] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [nombre, setNombre] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [valorBillete, setValorBillete] = useState('');

  // Step 2 — dirección
  const [tipoDir, setTipoDir] = useState('texto'); // 'texto' | 'gps'
  const [direccionTexto, setDireccionTexto] = useState('');
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  const buscarCliente = async () => {
    if (!telefono || telefono.length < 7) return;
    setBuscando(true);
    try {
      const res = await api.get(`/api/clientes?tel=${telefono}`);
      if (res.data) {
        setCliente(res.data);
        setNombre(res.data.nombre);
        setMetodoPago(res.data.metodo_pago || 'efectivo');
        setDireccionTexto(res.data.direccion_texto || '');
        if (res.data.direccion_lat) { 
          setLat(parseFloat(res.data.direccion_lat)); 
          setLng(parseFloat(res.data.direccion_lng)); 
          setTipoDir('gps');
        } else if (res.data.direccion_texto) {
          setTipoDir('texto');
        }
      } else {
        setCliente(null); // Resetear si no se encuentra (por si borró y cambió el número)
      }
    } catch { 
      setCliente(null);
    }
    setBuscando(false);
  };

  const goNext = () => {
    setError('');
    if (step === 0) {
      if (!nombre.trim()) return setError('Ingresa tu nombre');
      if (!telefono.trim()) return setError('Ingresa tu teléfono');
    }
    if (step === 1) {
      if (tipoDir === 'texto' && !direccionTexto.trim()) return setError('Ingresa la dirección de entrega');
      if (tipoDir === 'gps' && (!lat || !lng)) return setError('Selecciona tu ubicación en el mapa');
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Upsert cliente
      const clienteRes = await api.post('/api/clientes', {
        nombre, telefono,
        direccion_texto: tipoDir === 'texto' ? direccionTexto : `GPS: ${lat?.toFixed(5)}, ${lng?.toFixed(5)}`,
        direccion_lat: tipoDir === 'gps' ? lat : null,
        direccion_lng: tipoDir === 'gps' ? lng : null,
        metodo_pago: metodoPago,
        valor_billete: metodoPago === 'efectivo' ? valorBillete : null,
      });

      const items_payload = items.map(i => ({
        producto_id: i.id,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        precio_con_descuento: i.precio_con_descuento || i.precio,
      }));

      const pedidoRes = await api.post('/api/pedidos', {
        cliente_id: clienteRes.data.id,
        origen: 'web',
        metodo_pago: metodoPago,
        valor_billete: metodoPago === 'efectivo' ? valorBillete : null,
        direccion_entrega_texto: tipoDir === 'texto' ? direccionTexto : `${lat?.toFixed(5)}, ${lng?.toFixed(5)}`,
        lat: tipoDir === 'gps' ? lat : null,
        lng: tipoDir === 'gps' ? lng : null,
        items: items_payload,
      });

      clearCart();
      navigate(`/consultar-pedido?pedido=${pedidoRes.data.id}&tel=${telefono}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear el pedido');
    }
    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-crema">
        <ClientHeader />
        <div className="pt-20 flex flex-col items-center justify-center min-h-screen text-center px-4">
          <div className="text-7xl mb-4">🛒</div>
          <h2 className="font-display font-bold text-cafe text-2xl mb-2">Carrito vacío</h2>
          <p className="text-cafe/50 mb-6">Añade productos antes de continuar</p>
          <a href="/menu" className="btn-primary">Ver Menú</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crema">
      <ClientHeader />
      <Cart />

      <div className="max-w-lg mx-auto px-4 pt-20 pb-10">
        {/* Stepper */}
        <div className="flex items-center mb-8 pt-4">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-naranja' : 'text-cafe/30'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${i < step ? 'bg-naranja border-naranja text-white' :
                    i === step ? 'border-naranja text-naranja' :
                    'border-cafe/20 text-cafe/30'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-naranja' : 'text-cafe/40'}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded transition-all ${i < step ? 'bg-naranja' : 'bg-cafe/15'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4 animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        {/* Step 0: Teléfono */}
        {step === 0 && (
          <div className="card p-6 animate-fade-in space-y-4">
            <h2 className="font-display font-bold text-cafe text-2xl">¿Cuál es tu número?</h2>
            <p className="text-cafe/50 text-sm">Si ya pediste antes, recuperamos tus datos automáticamente.</p>

            <div>
              <label className="label">Teléfono *</label>
              <div className="flex gap-2">
                <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                  onBlur={buscarCliente}
                  placeholder="3001234567" className="input flex-1" />
                <button onClick={buscarCliente} disabled={buscando}
                  className="bg-naranja text-white px-4 rounded-xl font-semibold text-sm hover:bg-naranja-dark transition-colors">
                  {buscando ? '...' : '🔍'}
                </button>
              </div>
            </div>

            {cliente && (
              <div className="bg-verde/10 border border-verde/20 rounded-xl p-3 text-sm animate-fade-in">
                <p className="text-verde font-semibold">✓ Cliente encontrado</p>
                <p className="text-cafe/60">{cliente.nombre}</p>
              </div>
            )}

            <div>
              <label className="label">Nombre completo *</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre" className={`input ${cliente ? 'opacity-60 cursor-not-allowed bg-crema-dark' : ''}`}
                disabled={!!cliente} />
            </div>

            <div>
              <label className="label">Método de pago</label>
              <div className="grid grid-cols-2 gap-2">
                {['efectivo', 'transferencia'].map(m => (
                  <button key={m} type="button" onClick={() => setMetodoPago(m)}
                    className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all
                      ${metodoPago === m ? 'border-naranja bg-naranja/10 text-naranja' : 'border-cafe/15 text-cafe/60 hover:border-naranja/40'}`}>
                    {m === 'efectivo' ? '💵 Efectivo' : '📱 Transferencia'}
                  </button>
                ))}
              </div>
            </div>

            {metodoPago === 'efectivo' && (
              <div className="animate-fade-in">
                <label className="label">¿De cuánto es el billete?</label>
                <input type="number" value={valorBillete} onChange={e => setValorBillete(e.target.value)}
                  placeholder="Ej: 50000" className="input" />
              </div>
            )}

            <button onClick={goNext} className="btn-primary w-full py-4">
              Siguiente →
            </button>
          </div>
        )}

        {/* Step 1: Dirección */}
        {step === 1 && (
          <div className="card p-6 animate-fade-in space-y-4">
            <h2 className="font-display font-bold text-cafe text-2xl">¿Dónde te entregamos?</h2>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setTipoDir('texto')}
                className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all
                  ${tipoDir === 'texto' ? 'border-naranja bg-naranja/10 text-naranja' : 'border-cafe/15 text-cafe/60'}`}>
                📝 Dirección texto
              </button>
              <button type="button" onClick={() => setTipoDir('gps')}
                className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all
                  ${tipoDir === 'gps' ? 'border-naranja bg-naranja/10 text-naranja' : 'border-cafe/15 text-cafe/60'}`}>
                📍 GPS / Mapa
              </button>
            </div>

            {tipoDir === 'texto' ? (
              <div>
                <label className="label">Dirección de entrega</label>
                <input type="text" value={direccionTexto} onChange={e => setDireccionTexto(e.target.value)}
                  placeholder="Ej: Tienda donde Pacho, Calle 5 #10-20" className="input" />
              </div>
            ) : (
              <div>
                <p className="text-sm text-cafe/60 mb-2">Toca el mapa o arrastra el pin para marcar tu ubicación.</p>
                <MapPicker lat={lat} lng={lng} onLocationChange={(la, ln) => { setLat(la); setLng(ln); }} />
                {lat && <p className="text-xs text-verde mt-2">✓ Ubicación seleccionada: {lat.toFixed(5)}, {lng.toFixed(5)}</p>}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">← Atrás</button>
              <button onClick={goNext} className="btn-primary flex-1">Siguiente →</button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmar */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <div className="card p-6">
              <h2 className="font-display font-bold text-cafe text-2xl mb-4">Resumen del pedido</h2>

              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-crema-dark last:border-0">
                    <div>
                      <p className="font-medium text-cafe text-sm">{item.nombre}</p>
                      <p className="text-cafe/40 text-xs">{item.cantidad} × {fmt(item.precio_con_descuento || item.precio)}</p>
                    </div>
                    <span className="font-bold text-cafe">{fmt((item.precio_con_descuento || item.precio) * item.cantidad)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="font-semibold text-cafe">Total</span>
                <span className="font-display font-bold text-naranja text-2xl">{fmt(total)}</span>
              </div>
            </div>

            <div className="card p-4 space-y-2 text-sm">
              <div className="flex gap-2"><span className="text-cafe/50">👤 Cliente:</span><span className="font-medium">{nombre}</span></div>
              <div className="flex gap-2"><span className="text-cafe/50">📱 Tel:</span><span className="font-medium">{telefono}</span></div>
              <div className="flex gap-2"><span className="text-cafe/50">📍 Dirección:</span>
                <span className="font-medium">{tipoDir === 'texto' ? direccionTexto : `GPS: ${lat?.toFixed(4)}, ${lng?.toFixed(4)}`}</span>
              </div>
              <div className="flex gap-2"><span className="text-cafe/50">💳 Pago:</span>
                <span className="font-medium">{metodoPago === 'efectivo' ? `Efectivo${valorBillete ? ` (billete: ${fmt(valorBillete)})` : ''}` : 'Transferencia'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Atrás</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 py-4">
                {loading ? '⏳ Enviando...' : '🚀 Confirmar Pedido'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
