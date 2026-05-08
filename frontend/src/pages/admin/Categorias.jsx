import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

const emptyCategoria = { nombre: '', icono: '🍽️' };

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(emptyCategoria);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => api.get('/api/categorias').then(r => setCategorias(r.data));
  useEffect(() => { cargar(); }, []);

  const openModal = (c = null) => {
    if (c) { setEditId(c.id); setForm({ nombre: c.nombre, icono: c.icono || '🍽️' }); }
    else { setEditId(null); setForm(emptyCategoria); }
    setError(''); setShowModal(true);
  };

  const save = async () => {
    if (!form.nombre) return setError('El nombre es requerido');
    setLoading(true);
    try {
      if (editId) await api.put(`/api/categorias/${editId}`, form);
      else await api.post('/api/categorias', form);
      setShowModal(false); cargar();
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar'); }
    setLoading(false);
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta categoría? Esto podría afectar a los productos asociados.')) return;
    try {
      await api.delete(`/api/categorias/${id}`);
      cargar();
    } catch (e) {
      alert(e.response?.data?.error || 'Error al eliminar');
    }
  };

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title">Categorías</h1>
          <button onClick={() => openModal()} className="btn-primary">+ Nueva Categoría</button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-crema-dark">
              <tr>
                <th className="table-head">Icono</th>
                <th className="table-head">Nombre</th>
                <th className="table-head">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crema-dark">
              {categorias.map(c => (
                <tr key={c.id} className="hover:bg-crema/50 transition-colors">
                  <td className="table-cell text-2xl text-center">{c.icono}</td>
                  <td className="table-cell font-semibold text-cafe w-full">{c.nombre}</td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      <button onClick={() => openModal(c)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100">✏️ Editar</button>
                      <button onClick={() => eliminar(c.id)} className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {categorias.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-8 text-cafe/50">No hay categorías registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
                <h3 className="font-display font-bold text-cafe text-xl">{editId ? 'Editar' : 'Nueva'} Categoría</h3>
                <button onClick={() => setShowModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="label">Icono (Emoji) *</label>
                  <input className="input text-2xl" value={form.icono} onChange={e=>setForm(f=>({...f,icono:e.target.value}))} maxLength={5} placeholder="🍔" />
                </div>
                <div>
                  <label className="label">Nombre *</label>
                  <input className="input" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Platos Principales" />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
              <div className="px-6 py-4 border-t border-crema-dark flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={save} disabled={loading} className="btn-primary flex-1">{loading ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
