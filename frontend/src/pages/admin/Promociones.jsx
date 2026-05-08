import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const emptyPromo = { producto_id: '', porcentaje_descuento: '', activo: 1, fecha_inicio: '', fecha_fin: '' };

export default function Promociones() {
  const [promos, setPromos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState(emptyPromo);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = () =>
    Promise.all([api.get('/api/promociones'), api.get('/api/productos/admin')])
      .then(([pr, pd]) => { setPromos(pr.data); setProductos(pd.data); });

  useEffect(() => { cargar(); }, []);

  const openModal = (p = null) => {
    if (p) {
      setEditId(p.id);
      setForm({ producto_id: p.producto_id, porcentaje_descuento: p.porcentaje_descuento, activo: p.activo, fecha_inicio: p.fecha_inicio?.slice(0,10)||'', fecha_fin: p.fecha_fin?.slice(0,10)||'' });
    } else { setEditId(null); setForm(emptyPromo); }
    setError(''); setShowModal(true);
  };

  const save = async () => {
    if (!form.producto_id || !form.porcentaje_descuento) return setError('Producto y descuento son requeridos');
    setLoading(true);
    try {
      if (editId) await api.put(`/api/promociones/${editId}`, form);
      else await api.post('/api/promociones', form);
      setShowModal(false); cargar();
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar'); }
    setLoading(false);
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    await api.delete(`/api/promociones/${id}`);
    cargar();
  };

  const prodSeleccionado = productos.find(p => p.id == form.producto_id);
  const precioDesc = prodSeleccionado && form.porcentaje_descuento
    ? prodSeleccionado.precio * (1 - form.porcentaje_descuento / 100)
    : null;

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title">Promociones</h1>
          <button onClick={() => openModal()} className="btn-primary">+ Nueva Promoción</button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-crema-dark">
              <tr>
                <th className="table-head">Producto</th>
                <th className="table-head">Descuento</th>
                <th className="table-head">Precio Original</th>
                <th className="table-head">Precio c/Desc.</th>
                <th className="table-head">Vigencia</th>
                <th className="table-head">Estado</th>
                <th className="table-head">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crema-dark">
              {promos.map(p => (
                <tr key={p.id} className="hover:bg-crema/50 transition-colors">
                  <td className="table-cell font-semibold text-cafe">{p.producto_nombre}</td>
                  <td className="table-cell">
                    <span className="badge-off">{p.porcentaje_descuento}%</span>
                  </td>
                  <td className="table-cell text-cafe/50 line-through">{fmt(p.precio)}</td>
                  <td className="table-cell font-bold text-verde">{fmt(p.precio_con_descuento)}</td>
                  <td className="table-cell text-xs text-cafe/50">
                    {p.fecha_inicio ? `${p.fecha_inicio.slice(0,10)} → ${p.fecha_fin?.slice(0,10)||'∞'}` : 'Siempre'}
                  </td>
                  <td className="table-cell">
                    <span className={`badge-status ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      <button onClick={() => openModal(p)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100">✏️</button>
                      <button onClick={() => eliminar(p.id)} className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
                <h3 className="font-display font-bold text-cafe text-xl">{editId ? 'Editar' : 'Nueva'} Promoción</h3>
                <button onClick={() => setShowModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="label">Producto *</label>
                  <select className="input" value={form.producto_id} onChange={e=>setForm(f=>({...f,producto_id:e.target.value}))}>
                    <option value="">Seleccionar producto</option>
                    {productos.map(p=><option key={p.id} value={p.id}>{p.nombre} — {fmt(p.precio)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Porcentaje de descuento (%) *</label>
                  <input type="number" min="1" max="99" className="input" value={form.porcentaje_descuento}
                    onChange={e=>setForm(f=>({...f,porcentaje_descuento:e.target.value}))} />
                  {precioDesc && (
                    <p className="text-verde text-sm mt-1 font-semibold">
                      💡 Precio con descuento: {fmt(precioDesc)}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Fecha inicio</label>
                    <input type="date" className="input" value={form.fecha_inicio} onChange={e=>setForm(f=>({...f,fecha_inicio:e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">Fecha fin</label>
                    <input type="date" className="input" value={form.fecha_fin} onChange={e=>setForm(f=>({...f,fecha_fin:e.target.value}))} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="label mb-0">Activa</label>
                  <button onClick={()=>setForm(f=>({...f,activo:f.activo?0:1}))}
                    className={`w-12 h-6 rounded-full transition-colors ${form.activo?'bg-verde':'bg-gray-300'} relative`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.activo?'left-6':'left-0.5'}`}/>
                  </button>
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
              <div className="px-6 py-4 border-t border-crema-dark flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={save} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
