import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import Sidebar from '../../components/Sidebar';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);

function MetricCard({ icon, label, value, sub, color = 'naranja' }) {
  const colors = {
    naranja: 'from-naranja to-naranja-dark',
    verde: 'from-verde to-verde-light',
    dorado: 'from-dorado to-yellow-400',
    cafe: 'from-cafe to-cafe-medium',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 text-white shadow-warm`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        {sub && <span className="text-white/60 text-xs bg-white/10 px-2 py-1 rounded-full">{sub}</span>}
      </div>
      <p className="text-white/70 text-sm font-medium">{label}</p>
      <p className="font-display font-bold text-2xl mt-1">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/finanzas/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Llenar días vacíos en los últimos 7 días
  const chartData = (() => {
    if (!data?.ultimos7) return [];
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const found = data.ultimos7.find(r => r.fecha === key);
      days.push({
        dia: d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        pedidos: found?.pedidos || 0,
        ingresos: found?.ingresos || 0,
      });
    }
    return days;
  })();

  return (
    <div className="flex min-h-screen bg-crema">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="mb-8">
          <h1 className="section-title">Dashboard</h1>
          <p className="text-cafe/50 text-sm mt-0.5">
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-crema-dark animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <MetricCard icon="📋" label="Pedidos hoy" value={data?.hoy?.pedidos_hoy || 0} color="naranja" />
            <MetricCard icon="💰" label="Ingresos hoy" value={fmt(data?.hoy?.ingresos_hoy)} color="verde" />
            <MetricCard icon="⏳" label="Pendientes" value={data?.hoy?.pendientes || 0} color="dorado" />
          </div>
        )}

        {/* Gráfica */}
        <div className="card p-6">
          <h2 className="font-display font-semibold text-cafe text-lg mb-6">
            📈 Ingresos — Últimos 7 días
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5E8D8" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#6B4226' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B4226' }} axisLine={false} tickLine={false}
                  tickFormatter={v => fmt(v).replace('$', '$')} />
                <Tooltip
                  contentStyle={{ background: '#2D1B0E', border: 'none', borderRadius: '12px', color: '#FFF8F0' }}
                  formatter={(v, n) => [n === 'ingresos' ? fmt(v) : v, n === 'ingresos' ? 'Ingresos' : 'Pedidos']}
                />
                <Bar dataKey="ingresos" fill="#E8661A" radius={[8, 8, 0, 0]} name="ingresos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-cafe/40">No hay datos de los últimos 7 días</div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          {[
            { href: '/admin/pedidos', icon: '📋', label: 'Ver Pedidos' },
            { href: '/admin/productos', icon: '🍽️', label: 'Productos' },
            { href: '/admin/balance', icon: '📊', label: 'Balance' },
            { href: '/menu', icon: '🌐', label: 'Ver Menú', target: '_blank' },
          ].map(a => (
            <a key={a.href} href={a.href} target={a.target}
              className="card p-4 text-center hover:shadow-warm hover:-translate-y-0.5 transition-all cursor-pointer">
              <div className="text-3xl mb-2">{a.icon}</div>
              <p className="text-cafe font-semibold text-sm">{a.label}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
