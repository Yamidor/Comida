import { useCart } from '../context/CartContext';

export default function ClientHeader({ title = 'ARAQUIU' }) {
  const { count, setOpen, open } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-cafe shadow-warm-lg">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/menu" className="flex items-center gap-2 group">
          <span className="text-dorado text-2xl">🍴</span>
          <div>
            <span className="font-display font-bold text-white text-xl tracking-widest leading-none">
              {title}
            </span>
            <p className="text-white/40 text-[9px] tracking-widest uppercase leading-none">
              Comidas & Bebidas
            </p>
          </div>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <a href="/consultar-pedido" 
             className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2 transition-all active:scale-95 flex items-center justify-center"
             title="Consultar mi pedido">
            <span className="text-lg">🧾</span>
          </a>

          {/* Cart button */}
          <button
            onClick={() => setOpen(!open)}
            className="relative bg-naranja hover:bg-naranja-dark text-white rounded-xl px-3 py-2 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🛒</span>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-naranja font-bold text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce-in shadow-md">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
