import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';
import PrintTicket from '../../components/PrintTicket';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export default function PedidoLocal() {
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=telefono, 1=productos, 2=confirmar
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [valorBillete, setValorBillete] = useState('');
  const [clienteId, setClienteId] = useState(null);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catActiva, setCatActiva] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [pedidoPrint, setPedidoPrint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/api/productos'), api.get('/api/categorias')]).then(([p, c]) => {
      setProductos(p.data);
      setCategorias(c.data);
    });
  }, []);

  const buscarCliente = async () => {
    if (!telefono) return;
    try {
      const res = await api.get(`/api/clientes?tel=${telefono}`);
      if (res.data) {
        setNombre(res.data.nombre);
        setClienteId(res.data.id);
        setMetodoPago(res.data.metodo_pago || 'efectivo');
      }
    } catch {}
  };

  const addCarrito = (p) => {
    setCarrito(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...p, cantidad: 1 }];
    });
  };

  const removeCarrito = (id) => setCarrito(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, q) => q <= 0 ? removeCarrito(id) : setCarrito(prev => prev.map(i => i.id === id ? { ...i, cantidad: q } : i));

  const total = carrito.reduce((acc, i) => acc + (i.precio_con_descuento || i.precio) * i.cantidad, 0);

  const confirmar = async () => {
    setLoading(true);
    setError('');
    try {
      // Upsert cliente
      const clienteRes = await api.post('/api/clientes', { nombre, telefono, metodo_pago: metodoPago, valor_billete: metodoPago === 'efectivo' ? valorBillete : null });
      const items = carrito.map(i => ({
        producto_id: i.id, cantidad: i.cantidad,
        precio_unitario: i.precio,
        precio_con_descuento: i.precio_con_descuento || i.precio,
      }));
      const res = await api.post('/api/pedidos', {
        cliente_id: clienteRes.data.id,
        usuario_id_mesero: user?.id,
        origen: 'local',
        metodo_pago: metodoPago,
        valor_billete: metodoPago === 'efectivo' ? valorBillete : null,
        direccion_entrega_texto: 'Local',
        items,
      });
      setPedidoPrint(res.data);
      setCarrito([]);
      setStep(0);
      setTelefono('');
      setNombre('');
    } catch (e) {
      setError(e.response?.data?.error || 'Error al crear el pedido');
    }
    setLoading(false);
  };

  const filtrados = catActiva ? productos.filter(p => p.categoria_id === catActiva) : productos;

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {pedidoPrint && <PrintTicket pedido={pedidoPrint} onClose={() => setPedidoPrint(null)} />}

        <div className="mb-6">
          <h1 className="section-title">Atención en el Local</h1>
          <p className="text-cafe/50 text-sm">Crea un pedido presencial, se aprueba automáticamente y genera factura.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">{error}</div>}

        <div className="grid grid-cols-3 gap-6">
          {/* Productos */}
          <div className="col-span-2">
            {/* Filtro categorías */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => setCatActiva(null)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${!catActiva ? 'bg-naranja text-white' : 'bg-white text-cafe/60 border border-cafe/15'}`}>
                Todo
              </button>
              {categorias.map(c => (
                <button key={c.id} onClick={() => setCatActiva(c.id === catActiva ? null : c.id)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 ${catActiva === c.id ? 'bg-naranja text-white' : 'bg-white text-cafe/60 border border-cafe/15'}`}>
                  {c.icono} {c.nombre}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
              {filtrados.map(p => (
                <div key={p.id} className="card p-3 cursor-pointer hover:shadow-warm hover:-translate-y-0.5 transition-all"
                  onClick={() => addCarrito(p)}>
                  {p.imagen_url && (
                    <img src={`${API_URL}${p.imagen_url}`} alt={p.nombre}
                      className="w-full h-24 object-cover rounded-xl mb-2"
                      onError={e => { e.target.style.display='none'; }} />
                  )}
                  <p className="font-semibold text-cafe text-sm line-clamp-1">{p.nombre}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-naranja font-bold text-sm">{fmt(p.precio_con_descuento || p.precio)}</span>
                    {p.porcentaje_descuento && <span className="badge-off text-[10px]">{Math.round(p.porcentaje_descuento)}%</span>}
                  </div>
                  <button className="mt-2 w-full bg-naranja/10 text-naranja text-xs font-semibold py-1.5 rounded-lg hover:bg-naranja hover:text-white transition-colors">
                    + Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Panel derecho: cliente + carrito */}
          <div className="space-y-4">
            {/* Cliente */}
            <div className="card p-4">
              <h3 className="font-semibold text-cafe mb-3">👤 Cliente</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
                    onBlur={buscarCliente} placeholder="Teléfono" className="input text-sm py-2" />
                  <button onClick={buscarCliente} className="bg-naranja text-white px-3 rounded-xl text-sm hover:bg-naranja-dark">🔍</button>
                </div>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Nombre" className="input text-sm py-2" />
                <div className="grid grid-cols-2 gap-2">
                  {['efectivo','transferencia'].map(m => (
                    <button key={m} onClick={() => setMetodoPago(m)}
                      className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${metodoPago === m ? 'border-naranja bg-naranja/10 text-naranja' : 'border-cafe/15 text-cafe/60'}`}>
                      {m === 'efectivo' ? '💵' : '📱'} {m}
                    </button>
                  ))}
                </div>
                {metodoPago === 'efectivo' && (
                  <input type="number" value={valorBillete} onChange={e => setValorBillete(e.target.value)}
                    placeholder="Valor billete" className="input text-sm py-2" />
                )}
              </div>
            </div>

            {/* Carrito */}
            <div className="card p-4">
              <h3 className="font-semibold text-cafe mb-3">🛒 Pedido ({carrito.reduce((a,i)=>a+i.cantidad,0)} items)</h3>
              {carrito.length === 0 ? (
                <p className="text-cafe/40 text-sm text-center py-4">Toca un producto para añadir</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto sheet-scroll">
                  {carrito.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="text-cafe font-medium truncate text-xs">{item.nombre}</p>
                        <p className="text-naranja text-xs">{fmt((item.precio_con_descuento||item.precio)*item.cantidad)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.id, item.cantidad-1)} className="w-6 h-6 rounded-full bg-crema-dark flex items-center justify-center text-cafe text-xs font-bold">−</button>
                        <span className="w-4 text-center text-xs font-bold">{item.cantidad}</span>
                        <button onClick={() => updateQty(item.id, item.cantidad+1)} className="w-6 h-6 rounded-full bg-naranja text-white flex items-center justify-center text-xs font-bold">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {carrito.length > 0 && (
                <>
                  <div className="flex justify-between font-bold mt-3 pt-3 border-t border-crema-dark">
                    <span className="text-cafe text-sm">Total</span>
                    <span className="text-naranja font-display">{fmt(total)}</span>
                  </div>
                  <button onClick={confirmar} disabled={loading || !nombre || !telefono}
                    className="btn-primary w-full mt-3 py-3 text-sm disabled:opacity-50">
                    {loading ? '⏳ Procesando...' : '🖨️ Confirmar e Imprimir'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
