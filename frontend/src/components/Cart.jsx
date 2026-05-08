import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function Cart() {
  const { items, removeItem, updateQty, clearCart, total, count, open, setOpen } = useCart();

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-cafe/40 backdrop-blur-sm z-40 animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up
                      bg-white rounded-t-3xl shadow-warm-lg max-h-[85vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 bg-cafe/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-crema-dark">
          <h2 className="font-display font-bold text-xl text-cafe">
            Tu Pedido 🛒
          </h2>
          <div className="flex items-center gap-3">
            {items.length > 0 && (
              <button onClick={clearCart} className="text-xs text-cafe/50 hover:text-red-500 transition-colors">
                Vaciar
              </button>
            )}
            <button onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-crema-dark flex items-center justify-center text-cafe/60 hover:text-cafe">
              ✕
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto sheet-scroll px-5 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-cafe/50 font-medium">Tu carrito está vacío</p>
              <p className="text-cafe/30 text-sm mt-1">¡Añade algo delicioso!</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-crema rounded-xl p-3">
                {item.imagen_url && (
                  <img
                    src={`${API_URL}${item.imagen_url}`}
                    alt={item.nombre}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-cafe text-sm truncate">{item.nombre}</p>
                  <p className="text-naranja font-bold text-sm">
                    {fmt(item.precio_con_descuento || item.precio)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, item.cantidad - 1)}
                    className="w-7 h-7 rounded-full bg-white border border-cafe/15 flex items-center justify-center text-cafe font-bold text-sm hover:bg-naranja hover:text-white hover:border-naranja transition-colors">
                    −
                  </button>
                  <span className="w-6 text-center font-bold text-cafe text-sm">{item.cantidad}</span>
                  <button onClick={() => updateQty(item.id, item.cantidad + 1)}
                    className="w-7 h-7 rounded-full bg-naranja text-white flex items-center justify-center font-bold text-sm hover:bg-naranja-dark transition-colors">
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-crema-dark space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-cafe/60 font-medium">{count} producto{count !== 1 ? 's' : ''}</span>
              <span className="font-display font-bold text-2xl text-cafe">{fmt(total)}</span>
            </div>
            <Link to="/checkout"
              className="btn-primary w-full text-center block text-center py-4 text-base"
              onClick={() => setOpen(false)}>
              Solicitar Pedido →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
