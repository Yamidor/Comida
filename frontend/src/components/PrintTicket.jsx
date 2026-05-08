// PrintTicket.jsx — Factura térmica para impresión @media print
const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

export default function PrintTicket({ pedido, onClose }) {
  if (!pedido) return null;

  const handlePrint = () => window.print();

  return (
    <>
      {/* Vista previa — oculta en print */}
      <div className="no-print fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-display font-bold text-cafe text-lg">Vista previa factura</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="p-5 bg-gray-50 font-mono text-sm max-h-96 overflow-y-auto">
            <div className="bg-white border border-dashed border-gray-300 p-4 rounded">
              <TicketContent pedido={pedido} />
            </div>
          </div>
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
            <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handlePrint} className="btn-primary flex-1">🖨️ Imprimir</button>
          </div>
        </div>
      </div>

      {/* Contenido real que se imprime */}
      <div className="print-only hidden">
        <div className="ticket">
          <TicketContent pedido={pedido} />
        </div>
      </div>
    </>
  );
}

function TicketContent({ pedido }) {
  const subtotal = (pedido.detalles || []).reduce((acc, d) => {
    return acc + (d.precio_con_descuento || d.precio_unitario) * d.cantidad;
  }, 0);

  return (
    <>
      <div className="ticket-logo">ARAQUIU</div>
      <div className="ticket-info">
        <div>Comidas &amp; Bebidas</div>
        <div>Tel: 3001234567</div>
        <hr className="ticket-divider" />
        <div>Pedido #{pedido.id}</div>
        <div>{fmtDate(pedido.created_at)}</div>
        {pedido.cliente_nombre && <div>Cliente: {pedido.cliente_nombre}</div>}
      </div>

      <hr className="ticket-divider" />

      <table className="ticket-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th style={{ textAlign: 'center' }}>Cant</th>
            <th style={{ textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {(pedido.detalles || []).map((d, i) => (
            <tr key={i}>
              <td>{d.producto_nombre || `Producto #${d.producto_id}`}</td>
              <td style={{ textAlign: 'center' }}>{d.cantidad}</td>
              <td style={{ textAlign: 'right' }}>
                {fmt((d.precio_con_descuento || d.precio_unitario) * d.cantidad)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr className="ticket-divider" />

      <div className="ticket-total">TOTAL: {fmt(pedido.total || subtotal)}</div>

      <div className="ticket-info" style={{ marginTop: '4px' }}>
        <div>Pago: {pedido.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</div>
        {pedido.metodo_pago === 'efectivo' && pedido.valor_billete && (
          <>
            <div>Billete: {fmt(pedido.valor_billete)}</div>
            <div>Cambio: {fmt(pedido.valor_billete - (pedido.total || subtotal))}</div>
          </>
        )}
      </div>

      <div className="ticket-footer">
        ¡Gracias por su pedido!<br />
        Vuelva pronto 😊
      </div>
    </>
  );
}
