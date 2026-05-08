import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

function CRUDTable({ title, icon, endpoint, columns, emptyForm, formFields, dateField = 'fecha_compra' }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });

  const cargar = () => {
    const q = new URLSearchParams();
    if (filtros.desde) q.set('desde', filtros.desde);
    if (filtros.hasta) q.set('hasta', filtros.hasta);
    api.get(`${endpoint}?${q}`).then(r => setItems(r.data));
  };

  useEffect(() => { cargar(); }, [filtros]);

  const openModal = (item = null) => {
    setEditId(item ? item.id : null);
    setForm(item ? { ...emptyForm, ...Object.fromEntries(Object.keys(emptyForm).map(k => [k, item[k] ?? ''])) } : emptyForm);
    setShowModal(true);
  };

  const save = async () => {
    setLoading(true);
    try {
      if (editId) await api.put(`${endpoint}/${editId}`, form);
      else await api.post(endpoint, form);
      setShowModal(false); cargar();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setLoading(false);
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar registro?')) return;
    await api.delete(`${endpoint}/${id}`); cargar();
  };

  const total = items.reduce((a, i) => a + Number(i.total || i.valor || 0), 0);

  return (
    <div className="card overflow-hidden mb-8">
      <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="font-display font-bold text-cafe text-xl">{title}</h2>
          <span className="text-cafe/50 text-sm">— Total: <span className="text-naranja font-bold">{fmt(total)}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={filtros.desde} onChange={e=>setFiltros(f=>({...f,desde:e.target.value}))} className="input py-1.5 text-sm w-36" />
          <input type="date" value={filtros.hasta} onChange={e=>setFiltros(f=>({...f,hasta:e.target.value}))} className="input py-1.5 text-sm w-36" />
          <button onClick={() => openModal()} className="btn-primary py-1.5 text-sm">+ Nuevo</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-crema-dark">
            <tr>{columns.map(c=><th key={c.key} className="table-head">{c.label}</th>)}<th className="table-head">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-crema-dark">
            {items.map(item=>(
              <tr key={item.id} className="hover:bg-crema/50 transition-colors">
                {columns.map(c=>(
                  <td key={c.key} className="table-cell">
                    {c.format ? c.format(item[c.key]) : (item[c.key] ?? '—')}
                  </td>
                ))}
                <td className="table-cell">
                  <div className="flex gap-1.5">
                    <button onClick={()=>openModal(item)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-lg text-xs hover:bg-blue-100">✏️</button>
                    <button onClick={()=>eliminar(item.id)} className="bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-lg text-xs hover:bg-red-100">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length===0&&<tr><td colSpan={columns.length+1} className="text-center py-6 text-cafe/40">Sin registros</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
              <h3 className="font-display font-bold text-cafe text-lg">{editId?'Editar':'Nuevo'} {title.replace(/^(Registro de |Historial )/,'')}</h3>
              <button onClick={()=>setShowModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {formFields.map(f=>(
                <div key={f.key}>
                  <label className="label">{f.label}{f.required?' *':''}</label>
                  {f.type==='textarea'?(
                    <textarea className="input" rows={2} value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                  ):(
                    <input type={f.type||'text'} className="input" placeholder={f.placeholder} value={form[f.key]||''} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-crema-dark flex gap-3">
              <button onClick={()=>setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={loading} className="btn-primary flex-1">{loading?'Guardando...':'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Insumos() {
  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-6">
          <h1 className="section-title">Registro de Insumos</h1>
          <p className="text-cafe/50 text-sm mt-0.5">Compras e insumos del restaurante</p>
        </div>

        <CRUDTable
          title="Insumos / Compras"
          icon="📦"
          endpoint="/api/finanzas/insumos"
          emptyForm={{ nombre: '', cantidad: '', unidad: '', valor_unitario: '', fecha_compra: new Date().toISOString().slice(0,10) }}
          formFields={[
            { key: 'nombre', label: 'Nombre del insumo', required: true },
            { key: 'cantidad', label: 'Cantidad', type: 'number', required: true },
            { key: 'unidad', label: 'Unidad (kg, litro, und...)', placeholder: 'kg' },
            { key: 'valor_unitario', label: 'Valor unitario', type: 'number', required: true },
            { key: 'fecha_compra', label: 'Fecha de compra', type: 'date', required: true },
          ]}
          columns={[
            { key: 'nombre', label: 'Insumo' },
            { key: 'cantidad', label: 'Cantidad', format: v => `${v}` },
            { key: 'unidad', label: 'Unidad' },
            { key: 'valor_unitario', label: 'Valor unitario', format: fmt },
            { key: 'total', label: 'Total', format: v => <span className="font-bold text-naranja">{fmt(v)}</span> },
            { key: 'fecha_compra', label: 'Fecha', format: v => v?.slice(0,10) || '—' },
          ]}
          dateField="fecha_compra"
        />
      </main>
    </div>
  );
}
