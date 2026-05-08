import { useState, useEffect } from 'react';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import ClientHeader from '../../components/ClientHeader';
import Cart from '../../components/Cart';

export default function Menu() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [catActiva, setCatActiva] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/api/productos'), api.get('/api/categorias')])
      .then(([prodRes, catRes]) => {
        setProductos(prodRes.data);
        setCategorias(catRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtrados = catActiva
    ? productos.filter(p => p.categoria_id === catActiva)
    : productos;

  return (
    <div className="min-h-screen bg-crema bg-texture">
      <ClientHeader />
      <Cart />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cafe to-cafe-light pt-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-8 text-8xl">🌶️</div>
          <div className="absolute bottom-4 left-8 text-6xl">🍋</div>
          <div className="absolute top-12 left-1/2 text-5xl">✨</div>
        </div>
        <div className="max-w-lg mx-auto px-4 py-12 text-center relative z-10">
          <p className="text-dorado text-sm font-semibold tracking-[0.3em] uppercase mb-2">
            Bienvenido a
          </p>
          <h1 className="font-display font-bold text-white text-5xl mb-2 tracking-wide">
            ARAQUIU
          </h1>
          <p className="text-white/60 text-sm mb-6">
            Sabor auténtico colombiano 🇨🇴
          </p>
          <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
            <span>🕐 Lun–Sáb: 11am–9pm</span>
            <span>·</span>
            <span>📍 Delivery disponible</span>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <div className="sticky top-16 z-20 bg-white/80 backdrop-blur-md border-b border-crema-dark shadow-sm">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex gap-2 py-3 overflow-x-auto sheet-scroll">
            <button
              onClick={() => setCatActiva(null)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all
                ${!catActiva ? 'bg-naranja text-white shadow-warm' : 'bg-crema-dark text-cafe hover:bg-crema'}`}
            >
              <span>🍽️</span> Todo
            </button>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCatActiva(cat.id === catActiva ? null : cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap
                  ${catActiva === cat.id ? 'bg-naranja text-white shadow-warm' : 'bg-crema-dark text-cafe hover:bg-crema'}`}
              >
                <span>{cat.icono}</span> {cat.nombre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Productos */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="bg-crema-dark h-44 w-full" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-crema-dark rounded w-3/4" />
                  <div className="h-3 bg-crema-dark rounded w-1/2" />
                  <div className="h-8 bg-crema-dark rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">😔</div>
            <p className="text-cafe/50 font-medium">No hay productos en esta categoría</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-6 pb-12 pt-4 px-4 items-center">
            {filtrados.map((p, index) => (
              <div key={p.id} className="w-[80vw] max-w-[300px] flex-shrink-0 snap-center">
                <ProductCard product={p} index={index} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="h-24" />
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-crema to-transparent h-16 pointer-events-none" />
    </div>
  );
}
