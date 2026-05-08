import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const emptyEmp = { nombre: '', cargo: '', salario_base: '' };
const emptyNomina = { empleado_id: '', periodo_inicio: '', periodo_fin: '', valor_pagado: '', fecha_pago: new Date().toISOString().slice(0,10), observacion: '' };

export default function Nomina() {
  const [empleados, setEmpleados] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [formEmp, setFormEmp] = useState(emptyEmp);
  const [editEmpId, setEditEmpId] = useState(null);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [formNomina, setFormNomina] = useState(emptyNomina);
  const [showNominaModal, setShowNominaModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const cargar = () => {
    api.get('/api/finanzas/empleados').then(r => setEmpleados(r.data));
    api.get('/api/finanzas/nomina').then(r => setPagos(r.data));
  };
  useEffect(() => { cargar(); }, []);

  const saveEmp = async () => {
    setLoading(true);
    try {
      if (editEmpId) await api.put(`/api/finanzas/empleados/${editEmpId}`, formEmp);
      else await api.post('/api/finanzas/empleados', formEmp);
      setShowEmpModal(false); cargar();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setLoading(false);
  };

  const saveNomina = async () => {
    setLoading(true);
    try {
      await api.post('/api/finanzas/nomina', formNomina);
      setShowNominaModal(false); setFormNomina(emptyNomina); cargar();
    } catch (e) { alert(e.response?.data?.error || 'Error'); }
    setLoading(false);
  };

  const delEmp = async (id) => { if (confirm('¿Desactivar empleado?')) { await api.delete(`/api/finanzas/empleados/${id}`); cargar(); } };
  const delNomina = async (id) => { if (confirm('¿Eliminar pago?')) { await api.delete(`/api/finanzas/nomina/${id}`); cargar(); } };

  const openEmpModal = (e = null) => {
    setEditEmpId(e?.id || null);
    setFormEmp(e ? { nombre: e.nombre, cargo: e.cargo, salario_base: e.salario_base } : emptyEmp);
    setShowEmpModal(true);
  };

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 space-y-6">
        <div>
          <h1 className="section-title">Nómina</h1>
          <p className="text-cafe/50 text-sm mt-0.5">Gestión de empleados y pagos</p>
        </div>

        {/* Empleados */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
            <div className="flex items-center gap-2"><span className="text-2xl">👷</span><h2 className="font-display font-bold text-cafe text-lg">Empleados</h2></div>
            <button onClick={() => openEmpModal()} className="btn-primary py-1.5 text-sm">+ Nuevo</button>
          </div>
          <table className="w-full">
            <thead className="bg-crema-dark">
              <tr><th className="table-head">Nombre</th><th className="table-head">Cargo</th><th className="table-head">Salario base</th><th className="table-head">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-crema-dark">
              {empleados.map(e => (
                <tr key={e.id} className="hover:bg-crema/50 transition-colors">
                  <td className="table-cell font-semibold text-cafe">{e.nombre}</td>
                  <td className="table-cell text-cafe/70">{e.cargo}</td>
                  <td className="table-cell font-bold text-naranja">{fmt(e.salario_base)}</td>
                  <td className="table-cell">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEmpModal(e)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded-lg text-xs hover:bg-blue-100">✏️</button>
                      <button onClick={() => delEmp(e.id)} className="bg-red-50 text-red-500 border border-red-200 px-3 py-1 rounded-lg text-xs hover:bg-red-100">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagos nómina */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
            <div className="flex items-center gap-2"><span className="text-2xl">💸</span><h2 className="font-display font-bold text-cafe text-lg">Historial de Pagos</h2></div>
            <button onClick={() => setShowNominaModal(true)} className="btn-primary py-1.5 text-sm">+ Registrar Pago</button>
          </div>
          <table className="w-full">
            <thead className="bg-crema-dark">
              <tr><th className="table-head">Empleado</th><th className="table-head">Período</th><th className="table-head">Valor</th><th className="table-head">Fecha pago</th><th className="table-head">Obs.</th><th className="table-head">Acc.</th></tr>
            </thead>
            <tbody className="divide-y divide-crema-dark">
              {pagos.map(p => (
                <tr key={p.id} className="hover:bg-crema/50 transition-colors">
                  <td className="table-cell font-semibold text-cafe">{p.empleado_nombre}<br/><span className="text-xs text-cafe/40">{p.cargo}</span></td>
                  <td className="table-cell text-xs text-cafe/70">{p.periodo_inicio?.slice(0,10)} → {p.periodo_fin?.slice(0,10)}</td>
                  <td className="table-cell font-bold text-naranja">{fmt(p.valor_pagado)}</td>
                  <td className="table-cell text-cafe/60 text-xs">{p.fecha_pago?.slice(0,10)}</td>
                  <td className="table-cell text-cafe/50 text-xs max-w-xs truncate">{p.observacion || '—'}</td>
                  <td className="table-cell"><button onClick={() => delNomina(p.id)} className="bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-lg text-xs hover:bg-red-100">🗑️</button></td>
                </tr>
              ))}
              {pagos.length===0&&<tr><td colSpan={6} className="text-center py-6 text-cafe/40">Sin pagos registrados</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Modal Empleado */}
        {showEmpModal && (
          <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
                <h3 className="font-display font-bold text-cafe">{editEmpId ? 'Editar' : 'Nuevo'} Empleado</h3>
                <button onClick={() => setShowEmpModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
              </div>
              <div className="p-6 space-y-3">
                <div><label className="label">Nombre</label><input className="input" value={formEmp.nombre} onChange={e=>setFormEmp(f=>({...f,nombre:e.target.value}))} /></div>
                <div><label className="label">Cargo</label><input className="input" value={formEmp.cargo} onChange={e=>setFormEmp(f=>({...f,cargo:e.target.value}))} /></div>
                <div><label className="label">Salario base</label><input type="number" className="input" value={formEmp.salario_base} onChange={e=>setFormEmp(f=>({...f,salario_base:e.target.value}))} /></div>
              </div>
              <div className="px-6 py-4 border-t border-crema-dark flex gap-3">
                <button onClick={() => setShowEmpModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveEmp} disabled={loading} className="btn-primary flex-1">{loading?'...':'Guardar'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nómina */}
        {showNominaModal && (
          <div className="fixed inset-0 bg-cafe/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-crema-dark">
                <h3 className="font-display font-bold text-cafe">Registrar Pago</h3>
                <button onClick={() => setShowNominaModal(false)} className="text-cafe/40 hover:text-cafe">✕</button>
              </div>
              <div className="p-6 space-y-3">
                <div>
                  <label className="label">Empleado</label>
                  <select className="input" value={formNomina.empleado_id} onChange={e=>setFormNomina(f=>({...f,empleado_id:e.target.value}))}>
                    <option value="">Seleccionar...</option>
                    {empleados.map(e=><option key={e.id} value={e.id}>{e.nombre} ({fmt(e.salario_base)})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="label">Período inicio</label><input type="date" className="input" value={formNomina.periodo_inicio} onChange={e=>setFormNomina(f=>({...f,periodo_inicio:e.target.value}))} /></div>
                  <div><label className="label">Período fin</label><input type="date" className="input" value={formNomina.periodo_fin} onChange={e=>setFormNomina(f=>({...f,periodo_fin:e.target.value}))} /></div>
                </div>
                <div><label className="label">Valor pagado</label><input type="number" className="input" value={formNomina.valor_pagado} onChange={e=>setFormNomina(f=>({...f,valor_pagado:e.target.value}))} /></div>
                <div><label className="label">Fecha pago</label><input type="date" className="input" value={formNomina.fecha_pago} onChange={e=>setFormNomina(f=>({...f,fecha_pago:e.target.value}))} /></div>
                <div><label className="label">Observación</label><textarea className="input" rows={2} value={formNomina.observacion} onChange={e=>setFormNomina(f=>({...f,observacion:e.target.value}))} /></div>
              </div>
              <div className="px-6 py-4 border-t border-crema-dark flex gap-3">
                <button onClick={() => setShowNominaModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button onClick={saveNomina} disabled={loading} className="btn-primary flex-1">{loading?'...':'Registrar'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
