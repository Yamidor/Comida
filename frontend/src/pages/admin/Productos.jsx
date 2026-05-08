import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

const emptyForm = { nombre: '', descripcion: '', precio: '', categoria_id: '', activo: 1 };

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = () =>
    Promise.all([api.get('/api/productos/admin'), api.get('/api/categorias')])
      .then(([p, c]) => { setProductos(p.data); setCategorias(c.data); });

  useEffect(() => { cargar(); }, []);

  const openModal = (p = null) => {
    if (p) {
      setEditId(p.id);
      setForm({ nombre: p.nombre, descripcion: p.descripcion || '', precio: p.precio, categoria_id: p.categoria_id || '', activo: p.activo });
      setImgPreview(p.imagen_url ? `${API_URL}${p.imagen_url}` : '');
    } else {
      setEditId(null);
      setForm(emptyForm);
      setImgPreview('');
    }
    setImgFile(null);
    setError('');
    setShowModal(true);
  };

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    if (!form.nombre || !form.precio) return setError('Nombre y precio son requeridos');
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (imgFile) data.append('imagen', imgFile);
      if (editId) await api.put(`/api/productos/${editId}`, data);
      else await api.post('/api/productos', data);
      setShowModal(false);
      cargar();
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar'); }
    setLoading(false);
  };

  const toggleActivo = async (p) => {
    await api.put(`/api/productos/${p.id}`, new FormData(Object.assign(new FormData(), { activo: p.activo ? 0 : 1 })));
    // Simpler: use JSON endpoint workaround
    await api.patch ? null : null;
    cargar();
  };

  const eliminar = async (id) => {
    if (!confirm('¿Desactivar este producto?')) return;
    await api.delete(`/api/productos/${id}`);
    cargar();
  };

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title">Productos</h1>
          <button onClick={() => openModal()} className="btn-primary">+ Nuevo Producto</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {productos.map(p => (
            <div key={p.id} className={`card overflow-hidden ${!p.activo ? 'opacity-60' : ''}`}>
              <div className="relative h-40 bg-crema-dark">
                {p.imagen_url ? (
                  <img 
                    src={`${API_URL}${p.imagen_url}`} 
                    alt={p.nombre} 
                    className="w-full h-full object-cover" 
                    onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect fill="%23FFF8F0" width="300" height="180"/><text x="50%" y="50%" font-size="48" text-anchor="middle" dy=".3em">🍽️</text></svg>'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {p.porcentaje_descuento && (
                  <span className="absolute top-2 left-2 badge-off">{Math.round(p.porcentaje_descuento)}% OFF</span>
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-cafe">{p.nombre}</p>
                <p className="text-cafe/50 text-xs line-clamp-1 mb-2">{p.descripcion}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold text-naranja text-lg">{fmt(p.precio)}</span>
                  <span className="text-xs text-cafe/40">{p.categoria_nombre}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openModal(p)} className="btn-secondary flex-1 py-2 text-sm">✏️ Editar</button>
                  <button onClick={() => eliminar(p.id)} className="bg-red-50 text-red-500 border border-red-200 px-3 py-2 rounded-xl text-sm hover:bg-red-100 transition-colors">🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
                <h3 className="font-display font-bold text-cafe text-xl">{editId ? 'Editar' : 'Nuevo'} Producto</h3>
                <button onClick={() => setShowModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Imagen */}
                <div>
                  <label className="label">Imagen del producto</label>
                  {imgPreview && <img src={imgPreview} alt="preview" className="w-full h-40 object-cover rounded-xl mb-2" />}
                  <input type="file" accept="image/*" onChange={handleImg}
                    className="text-sm text-cafe/60 file:btn-secondary file:mr-2 file:border-0 file:cursor-pointer" />
                </div>
                <div>
                  <label className="label">Nombre *</label>
                  <input className="input" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} />
                </div>
                <div>
                  <label className="label">Descripción</label>
                  <textarea className="input" rows={2} value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Precio *</label>
                    <input type="number" className="input" value={form.precio} onChange={e=>setForm(f=>({...f,precio:e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">Categoría</label>
                    <select className="input" value={form.categoria_id} onChange={e=>setForm(f=>({...f,categoria_id:e.target.value}))}>
                      <option value="">Sin categoría</option>
                      {categorias.map(c=><option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="label mb-0">Activo</label>
                  <button onClick={()=>setForm(f=>({...f,activo:f.activo?0:1}))}
                    className={`w-12 h-6 rounded-full transition-colors ${form.activo ? 'bg-verde' : 'bg-gray-300'} relative`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'left-6' : 'left-0.5'}`}/>
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
