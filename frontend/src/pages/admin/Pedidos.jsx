import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';
import PrintTicket from '../../components/PrintTicket';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const ESTADO_BADGE = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
  despachado: 'bg-gray-100 text-gray-600',
};

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', estado: '' });
  const [resumen, setResumen] = useState({ total: 0, cantidad: 0, efectivo: 0, transferencia: 0 });
  const [pedidoPrint, setPedidoPrint] = useState(null);

  const cargar = async () => {
    setLoading(true);
    const q = new URLSearchParams();
    if (filtros.desde) q.set('desde', filtros.desde);
    if (filtros.hasta) q.set('hasta', filtros.hasta);
    if (filtros.estado) q.set('estado', filtros.estado);
    const res = await api.get(`/api/pedidos?${q}`);
    setPedidos(res.data);
    // Resumen
    const aprobados = res.data.filter(p => ['aprobado','despachado'].includes(p.estado));
    setResumen({
      total: aprobados.reduce((a, p) => a + Number(p.total), 0),
      cantidad: aprobados.length,
      efectivo: aprobados.filter(p => p.metodo_pago === 'efectivo').reduce((a,p) => a+Number(p.total), 0),
      transferencia: aprobados.filter(p => p.metodo_pago === 'transferencia').reduce((a,p) => a+Number(p.total), 0),
    });
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [filtros]);

  const cambiarEstado = async (id, estado) => {
    await api.patch(`/api/pedidos/${id}/estado`, { estado });
    cargar();
  };

  const verTicket = async (id) => {
    const res = await api.get(`/api/pedidos/${id}`);
    setPedidoPrint(res.data);
  };

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        {pedidoPrint && <PrintTicket pedido={pedidoPrint} onClose={() => setPedidoPrint(null)} />}

        <div className="mb-6">
          <h1 className="section-title">Pedidos</h1>
        </div>

        {/* Filtros */}
        <div className="card p-4 mb-6 flex flex-wrap gap-3 items-end">
          <div>
            <label className="label">Desde</label>
            <input type="date" value={filtros.desde} onChange={e => setFiltros(f=>({...f,desde:e.target.value}))} className="input py-2" />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" value={filtros.hasta} onChange={e => setFiltros(f=>({...f,hasta:e.target.value}))} className="input py-2" />
          </div>
          <div>
            <label className="label">Estado</label>
            <select value={filtros.estado} onChange={e => setFiltros(f=>({...f,estado:e.target.value}))} className="input py-2">
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="despachado">Despachado</option>
            </select>
          </div>
          <button onClick={cargar} className="btn-primary py-2">🔍 Filtrar</button>
          <button onClick={() => setFiltros({desde:'',hasta:'',estado:''})} className="btn-secondary py-2">Limpiar</button>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Ingresos', value: fmt(resumen.total), icon: '💰' },
            { label: 'Pedidos aprobados', value: resumen.cantidad, icon: '✅' },
            { label: 'Efectivo', value: fmt(resumen.efectivo), icon: '💵' },
            { label: 'Transferencia', value: fmt(resumen.transferencia), icon: '📱' },
          ].map((m, i) => (
            <div key={i} className="card p-4">
              <p className="text-cafe/50 text-xs font-medium">{m.icon} {m.label}</p>
              <p className="font-display font-bold text-cafe text-xl mt-1">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-crema-dark">
              <tr>
                <th className="table-head">#</th>
                <th className="table-head">Cliente</th>
                <th className="table-head">Estado</th>
                <th className="table-head">Pago</th>
                <th className="table-head">Total</th>
                <th className="table-head">Fecha</th>
                <th className="table-head">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crema-dark">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-cafe/40">Cargando...</td></tr>
              ) : pedidos.map(p => (
                <tr key={p.id} className="hover:bg-crema/50 transition-colors">
                  <td className="table-cell font-bold text-cafe">#{p.id}</td>
                  <td className="table-cell">
                    <p className="font-medium text-cafe">{p.cliente_nombre}</p>
                    <p className="text-xs text-cafe/40">{p.cliente_telefono}</p>
                  </td>
                  <td className="table-cell">
                    <span className={`badge-status ${ESTADO_BADGE[p.estado]}`}>{p.estado}</span>
                    {p.whatsapp_estado === 'confirmado' && (
                      <span className="block mt-1 text-[10px] text-green-700 font-bold px-1 py-0.5 bg-green-100 rounded-md w-max">
                        💬 Confirmado WP
                      </span>
                    )}
                    {p.whatsapp_estado === 'esperando_comprobante' && (
                      <span className="block mt-1 text-[10px] text-orange-700 font-bold px-1 py-0.5 bg-orange-100 rounded-md w-max">
                        ⏳ Esperando Foto
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-cafe/70">{p.metodo_pago}</td>
                  <td className="table-cell font-bold text-naranja">{fmt(p.total)}</td>
                  <td className="table-cell text-cafe/50 text-xs">
                    {new Date(p.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      {p.estado === 'pendiente' && <>
                        <button onClick={() => cambiarEstado(p.id, 'aprobado')} className="bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold hover:bg-green-600">✅</button>
                        <button onClick={() => cambiarEstado(p.id, 'rechazado')} className="bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold hover:bg-red-600">❌</button>
                      </>}
                      {p.comprobante_url && (
                        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${p.comprobante_url}`} target="_blank" rel="noreferrer" className="bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-semibold hover:bg-blue-600">🧾</a>
                      )}
                      <button onClick={() => verTicket(p.id)} className="bg-cafe text-white px-2 py-1 rounded-lg text-xs font-semibold hover:bg-cafe-medium">🖨️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
