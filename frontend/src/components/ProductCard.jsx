import { useState } from 'react';
import { useCart } from '../context/CartContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const hasDiscount = product.porcentaje_descuento && product.precio_con_descuento;
  const displayPrice = hasDiscount ? product.precio_con_descuento : product.precio;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 600);
  };

  return (
    <div className="relative flex flex-col items-center justify-center group w-full pt-8">
      {/* Sombra de la Mesa (Base) */}
      <div className="absolute top-[180px] w-48 h-12 bg-black/15 rounded-[100%] blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-black/20" />

      {/* Imagen del Plato y Badges Exteriores */}
      <div className="relative w-56 h-56 z-10 transition-transform duration-500 group-hover:-translate-y-4">
        <div className="w-full h-full rounded-full shadow-2xl overflow-hidden border-[6px] border-white bg-crema-dark">
          <img
            src={product.imagen_url ? `${API_URL}${product.imagen_url}` : '/placeholder-food.jpg'}
            alt={product.nombre}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110"
            onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect fill="%23FFF8F0" width="300" height="300"/><text x="50%" y="50%" font-size="72" text-anchor="middle" dy=".3em">🍽️</text></svg>'; }}
          />
        </div>
        
        {/* Badges Flotantes sobre la imagen (por fuera del overflow) */}
        {hasDiscount && (
          <div className="absolute top-2 -left-2 bg-red-500 text-white text-sm font-black px-3 py-1.5 rounded-full transform -rotate-12 shadow-xl border-2 border-white animate-pulse-badge z-20">
            -{Math.round(product.porcentaje_descuento)}%
          </div>
        )}
      </div>

      {/* Tarjeta de Información Inferior */}
      <div className="bg-white rounded-3xl w-full pt-20 pb-6 px-6 -mt-16 shadow-warm flex flex-col items-center text-center relative z-0 transition-all duration-500 group-hover:shadow-warm-lg">
        
        {product.categoria_icono && (
          <div className="absolute -top-4 right-6 bg-white rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-md border border-crema-dark">
            {product.categoria_icono}
          </div>
        )}

        <h3 className="font-display font-bold text-cafe text-xl leading-tight mb-2 line-clamp-2">
          {product.nombre}
        </h3>
        
        {product.descripcion && (
          <p className="text-cafe/50 text-xs line-clamp-3 mb-4 leading-relaxed">
            {product.descripcion}
          </p>
        )}

        {/* Precio */}
        <div className="mb-5 flex flex-col items-center">
          {hasDiscount ? (
            <>
              <span className="text-cafe/40 text-sm line-through">{fmt(product.precio)}</span>
              <span className="font-display font-bold text-naranja text-2xl">{fmt(displayPrice)}</span>
            </>
          ) : (
            <span className="font-display font-bold text-cafe text-2xl">{fmt(displayPrice)}</span>
          )}
        </div>

        {/* Botón */}
        <button
          onClick={handleAdd}
          className={`w-full max-w-[200px] py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-md
            ${added
              ? 'bg-verde text-white scale-95 animate-bounce-in'
              : 'bg-naranja text-white hover:bg-naranja-dark hover:shadow-lg active:scale-95 hover:-translate-y-0.5'
            }`}
        >
          {added ? '✓ ¡Añadido!' : '+ Añadir al Carrito'}
        </button>
      </div>
    </div>
  );
}
