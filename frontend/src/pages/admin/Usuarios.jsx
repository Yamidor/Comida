import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

// ---- Usuarios ----
const emptyUser = { nombre: '', telefono: '', email: '', password: '', rol: 'mesero', activo: 1 };

export default function Usuarios() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = () => api.get('/api/usuarios').then(r => setUsers(r.data));
  useEffect(() => { cargar(); }, []);

  const openModal = (u = null) => {
    if (u) { setEditId(u.id); setForm({ nombre: u.nombre, telefono: u.telefono||'', email: u.email, password: '', rol: u.rol, activo: u.activo }); }
    else { setEditId(null); setForm(emptyUser); }
    setError(''); setShowModal(true);
  };

  const save = async () => {
    if (!form.nombre || !form.email) return setError('Nombre y email son requeridos');
    if (!editId && !form.password) return setError('La contraseña es requerida para nuevos usuarios');
    setLoading(true);
    try {
      if (editId) await api.put(`/api/usuarios/${editId}`, form);
      else await api.post('/api/usuarios', form);
      setShowModal(false); cargar();
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar'); }
    setLoading(false);
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este usuario?')) return;
    await api.delete(`/api/usuarios/${id}`);
    cargar();
  };

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title">Usuarios del Sistema</h1>
          <button onClick={() => openModal()} className="btn-primary">+ Nuevo Usuario</button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-crema-dark">
              <tr>
                <th className="table-head">Nombre</th>
                <th className="table-head">Email</th>
                <th className="table-head">Teléfono</th>
                <th className="table-head">Rol</th>
                <th className="table-head">Estado</th>
                <th className="table-head">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crema-dark">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-crema/50 transition-colors">
                  <td className="table-cell font-semibold text-cafe">{u.nombre}</td>
                  <td className="table-cell text-cafe/70">{u.email}</td>
                  <td className="table-cell text-cafe/60">{u.telefono || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge-status ${u.rol === 'admin' ? 'bg-naranja/10 text-naranja' : 'bg-blue-50 text-blue-600'}`}>
                      {u.rol === 'admin' ? '👑 Admin' : '👨‍🍳 Mesero'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge-status ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      <button onClick={() => openModal(u)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100">✏️ Editar</button>
                      <button onClick={() => eliminar(u.id)} className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
                <h3 className="font-display font-bold text-cafe text-xl">{editId ? 'Editar' : 'Nuevo'} Usuario</h3>
                <button onClick={() => setShowModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nombre *</label>
                    <input className="input" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input className="input" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
                </div>
                <div>
                  <label className="label">{editId ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
                  <input type="password" className="input" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Rol</label>
                    <select className="input" value={form.rol} onChange={e=>setForm(f=>({...f,rol:e.target.value}))}>
                      <option value="mesero">Mesero</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-0.5">
                    <div className="flex items-center gap-3">
                      <label className="label mb-0">Activo</label>
                      <button onClick={()=>setForm(f=>({...f,activo:f.activo?0:1}))}
                        className={`w-12 h-6 rounded-full transition-colors ${form.activo?'bg-verde':'bg-gray-300'} relative`}>
                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.activo?'left-6':'left-0.5'}`}/>
                      </button>
                    </div>
                  </div>
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
