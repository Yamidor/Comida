import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

function Section({ title, icon, items, emptyForm, formFields, onSave, onDelete, total }) {
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModal = (item = null) => {
    setEditId(item?.id || null);
    setForm(item ? { ...emptyForm, ...Object.fromEntries(Object.keys(emptyForm).map(k => [k, item[k] ?? ''])) } : emptyForm);
    setShowModal(true);
  };

  const save = async () => {
    setLoading(true);
    try { await onSave(editId, form); setShowModal(false); }
    catch (e) { alert(e.response?.data?.error || 'Error'); }
    setLoading(false);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h2 className="font-display font-bold text-cafe text-lg">{title}</h2>
          <span className="text-cafe/50 text-sm">— {fmt(total)}</span>
        </div>
        <button onClick={() => openModal()} className="btn-primary py-1.5 text-sm">+ Agregar</button>
      </div>
      <div className="divide-y divide-crema-dark">
        {items.length === 0 && <p className="text-center py-6 text-cafe/40">Sin registros</p>}
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-crema/50 transition-colors">
            <div>
              <p className="font-medium text-cafe text-sm">{item.nombre || item.descripcion}</p>
              {item.descripcion && item.nombre && <p className="text-cafe/50 text-xs">{item.descripcion}</p>}
              <p className="text-cafe/40 text-xs">{(item.fecha || item.fecha_pago)?.slice(0,10)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-naranja">{fmt(item.valor)}</span>
              <button onClick={() => openModal(item)} className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-lg text-xs hover:bg-blue-100">✏️</button>
              <button onClick={() => onDelete(item.id)} className="bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-lg text-xs hover:bg-red-100">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
              <h3 className="font-display font-bold text-cafe text-lg">{editId ? 'Editar' : 'Nuevo'} {title}</h3>
              <button onClick={() => setShowModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
            </div>
            <div className="p-6 space-y-3">
              {formFields.map(f => (
                <div key={f.key}>
                  <label className="label">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea className="input" rows={2} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  ) : (
                    <input type={f.type || 'text'} className="input" value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  )}
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-crema-dark flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={save} disabled={loading} className="btn-primary flex-1">{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Gastos() {
  const [servicios, setServicios] = useState([]);
  const [arriendos, setArriendos] = useState([]);

  const cargar = () => {
    api.get('/api/finanzas/servicios').then(r => setServicios(r.data));
    api.get('/api/finanzas/arriendos').then(r => setArriendos(r.data));
  };
  useEffect(() => { cargar(); }, []);

  // Servicios
  const saveServicio = async (id, form) => {
    if (id) await api.put(`/api/finanzas/servicios/${id}`, form);
    else await api.post('/api/finanzas/servicios', form);
    cargar();
  };
  const delServicio = async (id) => { if (confirm('¿Eliminar?')) { await api.delete(`/api/finanzas/servicios/${id}`); cargar(); } };

  // Arriendos
  const saveArriendo = async (id, form) => {
    if (id) await api.put(`/api/finanzas/arriendos/${id}`, form);
    else await api.post('/api/finanzas/arriendos', form);
    cargar();
  };
  const delArriendo = async (id) => { if (confirm('¿Eliminar?')) { await api.delete(`/api/finanzas/arriendos/${id}`); cargar(); } };

  const totalServicios = servicios.reduce((a, s) => a + Number(s.valor), 0);
  const totalArriendos = arriendos.reduce((a, s) => a + Number(s.valor), 0);

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 space-y-6">
        <div>
          <h1 className="section-title">Servicios y Arriendos</h1>
          <p className="text-cafe/50 text-sm mt-0.5">Registro de gastos fijos del negocio</p>
        </div>

        <Section
          title="Servicios"
          icon="💡"
          items={servicios}
          total={totalServicios}
          emptyForm={{ nombre: '', valor: '', fecha: new Date().toISOString().slice(0,10), descripcion: '' }}
          formFields={[
            { key: 'nombre', label: 'Nombre del servicio (Agua, Luz...)' },
            { key: 'valor', label: 'Valor', type: 'number' },
            { key: 'fecha', label: 'Fecha', type: 'date' },
            { key: 'descripcion', label: 'Descripción', type: 'textarea' },
          ]}
          onSave={saveServicio}
          onDelete={delServicio}
        />

        <Section
          title="Arriendos"
          icon="🏠"
          items={arriendos}
          total={totalArriendos}
          emptyForm={{ descripcion: '', valor: '', fecha_pago: new Date().toISOString().slice(0,10) }}
          formFields={[
            { key: 'descripcion', label: 'Descripción', type: 'textarea' },
            { key: 'valor', label: 'Valor', type: 'number' },
            { key: 'fecha_pago', label: 'Fecha de pago', type: 'date' },
          ]}
          onSave={saveArriendo}
          onDelete={delArriendo}
        />
      </main>
    </div>
  );
}
