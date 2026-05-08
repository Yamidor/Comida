import { useState, useEffect } from 'react';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const dHoy = new Date().toISOString().slice(0, 10);
const dMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

export default function Balance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ desde: dMes, hasta: dHoy });

  const cargar = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filtros.desde) q.set('desde', filtros.desde);
      if (filtros.hasta) q.set('hasta', filtros.hasta);
      const res = await api.get(`/api/finanzas/balance?${q}`);
      setData(res.data);
    } catch (e) {
      alert('Error al cargar balance');
    }
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [filtros]);

  const descargarPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('ARAQUIU — Balance Financiero', 14, 22);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${data.periodo.desde} hasta ${data.periodo.hasta}`, 14, 30);
    doc.text(`Fecha de generación: ${new Date().toLocaleString('es-CO')}`, 14, 36);

    let y = 45;

    // Resumen
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Ingresos: ${fmt(data.ingresos)}`, 14, y); y += 6;
    doc.text(`Total Egresos: ${fmt(data.egresos.total)}`, 14, y); y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Utilidad Neta: ${fmt(data.utilidad)}`, 14, y);
    y += 15;

    // Ingresos
    doc.text('DETALLE DE INGRESOS (Pedidos Aprobados/Despachados)', 14, y);
    y += 4;
    const ingresosData = data.detalle.pedidos.map(p => [
      `#${p.id}`, p.created_at.slice(0,10), p.cliente || 'Anónimo', p.metodo_pago, fmt(p.total)
    ]);
    doc.autoTable({
      startY: y,
      head: [['Pedido', 'Fecha', 'Cliente', 'Pago', 'Total']],
      body: ingresosData,
      theme: 'grid',
      headStyles: { fillColor: [232, 102, 26] }, // naranja
      margin: { left: 14 }
    });
    
    y = doc.lastAutoTable.finalY + 15;

    // Egresos (consolidado)
    doc.text('DETALLE DE EGRESOS POR CATEGORÍA', 14, y);
    y += 4;
    const egresosData = [
      ['Insumos y Compras', fmt(data.egresos.insumos)],
      ['Servicios', fmt(data.egresos.servicios)],
      ['Arriendos', fmt(data.egresos.arriendos)],
      ['Nómina', fmt(data.egresos.nomina)],
      ['TOTAL EGRESOS', fmt(data.egresos.total)]
    ];
    doc.autoTable({
      startY: y,
      head: [['Categoría', 'Total']],
      body: egresosData,
      theme: 'grid',
      headStyles: { fillColor: [45, 27, 14] }, // cafe
      margin: { left: 14 }
    });

    doc.save(`Balance_Araquiu_${data.periodo.desde}_al_${data.periodo.hasta}.pdf`);
  };

  if (!data) return null;

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title">Balance Financiero</h1>
            <p className="text-cafe/50 text-sm mt-0.5">Estado de resultados, ingresos y egresos</p>
          </div>
          <button onClick={descargarPDF} className="btn-primary flex items-center gap-2">
            <span>📄</span> Descargar PDF
          </button>
        </div>

        {/* Filtros */}
        <div className="card p-4 flex gap-3 items-end">
          <div>
            <label className="label">Desde</label>
            <input type="date" value={filtros.desde} onChange={e=>setFiltros(f=>({...f,desde:e.target.value}))} className="input py-2" />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" value={filtros.hasta} onChange={e=>setFiltros(f=>({...f,hasta:e.target.value}))} className="input py-2" />
          </div>
          <button onClick={cargar} disabled={loading} className="btn-primary py-2 px-6">
            {loading ? '...' : 'Filtrar'}
          </button>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-warm">
            <p className="text-white/80 font-medium text-sm mb-1">Ingresos</p>
            <p className="font-display font-bold text-3xl">{fmt(data.ingresos)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-warm">
            <p className="text-white/80 font-medium text-sm mb-1">Egresos</p>
            <p className="font-display font-bold text-3xl">{fmt(data.egresos.total)}</p>
          </div>
          <div className={`bg-gradient-to-br rounded-2xl p-6 text-white shadow-warm ${data.utilidad >= 0 ? 'from-dorado to-yellow-500' : 'from-gray-600 to-gray-700'}`}>
            <p className="text-white/80 font-medium text-sm mb-1">Utilidad Neta</p>
            <p className="font-display font-bold text-3xl">{fmt(data.utilidad)}</p>
          </div>
        </div>

        {/* Detalle de Egresos */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-cafe text-lg mb-4 border-b border-crema-dark pb-3">Desglose de Egresos</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-cafe/50 text-xs font-medium uppercase tracking-wider mb-1">Insumos</p>
              <p className="font-bold text-cafe text-xl">{fmt(data.egresos.insumos)}</p>
            </div>
            <div>
              <p className="text-cafe/50 text-xs font-medium uppercase tracking-wider mb-1">Servicios</p>
              <p className="font-bold text-cafe text-xl">{fmt(data.egresos.servicios)}</p>
            </div>
            <div>
              <p className="text-cafe/50 text-xs font-medium uppercase tracking-wider mb-1">Arriendos</p>
              <p className="font-bold text-cafe text-xl">{fmt(data.egresos.arriendos)}</p>
            </div>
            <div>
              <p className="text-cafe/50 text-xs font-medium uppercase tracking-wider mb-1">Nómina</p>
              <p className="font-bold text-cafe text-xl">{fmt(data.egresos.nomina)}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
