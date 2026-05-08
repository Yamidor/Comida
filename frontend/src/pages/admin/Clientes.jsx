import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position ? <Marker position={position} /> : null;
}

const emptyForm = { nombre: '', telefono: '', direccion_texto: '', direccion_lat: '', direccion_lng: '', metodo_pago: 'efectivo' };
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cargar = (q = '') => api.get(`/api/clientes${q ? `?q=${q}` : ''}`).then(r => setClientes(Array.isArray(r.data) ? r.data : []));
  useEffect(() => { cargar(); }, []);

  const openModal = (c = null) => {
    if (c) { 
      setEditId(c.id); 
      setForm({ 
        nombre: c.nombre, 
        telefono: c.telefono, 
        direccion_texto: c.direccion_texto||'', 
        direccion_lat: c.direccion_lat||'', 
        direccion_lng: c.direccion_lng||'', 
        metodo_pago: c.metodo_pago||'efectivo' 
      }); 
    }
    else { setEditId(null); setForm(emptyForm); }
    setError(''); setShowModal(true);
  };

  const save = async () => {
    if (!form.nombre || !form.telefono) return setError('Nombre y teléfono son requeridos');
    setLoading(true);
    try {
      if (editId) await api.put(`/api/clientes/${editId}`, form);
      else await api.post('/api/clientes', form);
      setShowModal(false); cargar();
    } catch (e) { setError(e.response?.data?.error || 'Error al guardar'); }
    setLoading(false);
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    await api.delete(`/api/clientes/${id}`);
    cargar();
  };

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="section-title">Clientes</h1>
          <button onClick={() => openModal()} className="btn-primary">+ Nuevo Cliente</button>
        </div>

        {/* Búsqueda */}
        <div className="flex gap-3 mb-6">
          <input type="text" value={busqueda} onChange={e=>setBusqueda(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&cargar(busqueda)}
            placeholder="Buscar por nombre o teléfono..." className="input max-w-sm" />
          <button onClick={() => cargar(busqueda)} className="btn-primary py-2 px-4">🔍</button>
          <button onClick={() => { setBusqueda(''); cargar(); }} className="btn-secondary py-2 px-4">Limpiar</button>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-crema-dark">
              <tr>
                <th className="table-head">Nombre</th>
                <th className="table-head">Teléfono</th>
                <th className="table-head">Dirección</th>
                <th className="table-head">Pago preferido</th>
                <th className="table-head">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-crema-dark">
              {clientes.map(c => (
                <tr key={c.id} className="hover:bg-crema/50 transition-colors">
                  <td className="table-cell font-semibold text-cafe">{c.nombre}</td>
                  <td className="table-cell text-cafe/70">{c.telefono}</td>
                  <td className="table-cell text-cafe/60 max-w-xs truncate">{c.direccion_texto || '—'}</td>
                  <td className="table-cell">
                    <span className={`badge-status ${c.metodo_pago==='efectivo'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>
                      {c.metodo_pago==='efectivo'?'💵 Efectivo':'📱 Transfer.'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      <button onClick={() => openModal(c)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-100">✏️</button>
                      <button onClick={() => eliminar(c.id)} className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {clientes.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-cafe/40">No hay clientes</td></tr>}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark shrink-0">
                <h3 className="font-display font-bold text-cafe text-xl">{editId ? 'Editar' : 'Nuevo'} Cliente</h3>
                <button onClick={() => setShowModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <div><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} /></div>
                <div><label className="label">Teléfono *</label><input type="tel" className="input" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} /></div>
                <div><label className="label">Dirección (Texto)</label><input className="input" value={form.direccion_texto} onChange={e=>setForm(f=>({...f,direccion_texto:e.target.value}))} /></div>
                
                <div>
                  <label className="label">Ubicación GPS (Click en el mapa para marcar)</label>
                  <div className="h-48 w-full relative z-0 border border-cafe/15 rounded-xl overflow-hidden mb-1">
                    <MapContainer 
                      center={form.direccion_lat ? [parseFloat(form.direccion_lat), parseFloat(form.direccion_lng)] : [4.5709, -74.2973]} 
                      zoom={form.direccion_lat ? 16 : 5} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationMarker 
                        position={form.direccion_lat ? { lat: parseFloat(form.direccion_lat), lng: parseFloat(form.direccion_lng) } : null} 
                        setPosition={(pos) => setForm(f => ({ ...f, direccion_lat: pos.lat.toString(), direccion_lng: pos.lng.toString() }))}
                      />
                    </MapContainer>
                  </div>
                  {form.direccion_lat && (
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-naranja font-medium">Coordenadas guardadas</p>
                      <button onClick={() => setForm(f => ({...f, direccion_lat: '', direccion_lng: ''}))} className="text-xs text-cafe/50 hover:text-red-500">Borrar</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Método de pago preferido</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['efectivo','transferencia'].map(m=>(
                      <button key={m} onClick={()=>setForm(f=>({...f,metodo_pago:m}))}
                        className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.metodo_pago===m?'border-naranja bg-naranja/10 text-naranja':'border-cafe/15 text-cafe/60'}`}>
                        {m==='efectivo'?'💵 Efectivo':'📱 Transferencia'}
                      </button>
                    ))}
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
