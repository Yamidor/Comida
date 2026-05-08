const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const whatsapp = require('../whatsapp');

// Función helper para obtener pedido completo
async function getPedidoCompleto(id) {
  const [pedidos] = await db.query(`
    SELECT p.*,
           c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           u.nombre AS mesero_nombre
    FROM pedidos p
    LEFT JOIN clientes c ON p.cliente_id = c.id
    LEFT JOIN usuarios u ON p.usuario_id_mesero = u.id
    WHERE p.id = ?
  `, [id]);

  if (!pedidos.length) return null;
  const pedido = pedidos[0];

  const [detalles] = await db.query(`
    SELECT dp.*, pr.nombre AS producto_nombre, pr.imagen_url
    FROM detalle_pedidos dp
    LEFT JOIN productos pr ON dp.producto_id = pr.id
    WHERE dp.pedido_id = ?
  `, [id]);

  const [obs] = await db.query(
    'SELECT * FROM observaciones_pedido WHERE pedido_id = ? ORDER BY created_at ASC',
    [id]
  );

  return { ...pedido, detalles, observaciones: obs };
}

// GET /api/pedidos — listado filtrable
router.get('/', auth, async (req, res) => {
  try {
    const { desde, hasta, estado, telefono } = req.query;
    let where = ['1=1'];
    let params = [];

    if (estado) { where.push('p.estado = ?'); params.push(estado); }
    if (desde) { where.push('DATE(p.created_at) >= ?'); params.push(desde); }
    if (hasta) { where.push('DATE(p.created_at) <= ?'); params.push(hasta); }
    if (telefono) { where.push('c.telefono LIKE ?'); params.push(`%${telefono}%`); }

    const [rows] = await db.query(`
      SELECT p.id, p.estado, p.total, p.metodo_pago, p.origen, p.created_at,
             p.direccion_entrega_texto, p.lat, p.lng, p.valor_billete, p.comprobante_url, p.whatsapp_estado,
             c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
             u.nombre AS mesero_nombre
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      LEFT JOIN usuarios u ON p.usuario_id_mesero = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT 200
    `, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/pedidos/por-telefono/:telefono — último pedido activo del cliente
router.get('/por-telefono/:telefono', async (req, res) => {
  try {
    const [clientes] = await db.query('SELECT id FROM clientes WHERE telefono=?', [req.params.telefono]);
    if (!clientes.length) return res.json(null);

    const [rows] = await db.query(`
      SELECT id FROM pedidos
      WHERE cliente_id = ? AND estado IN ('pendiente','aprobado')
      ORDER BY created_at DESC LIMIT 1
    `, [clientes[0].id]);

    if (!rows.length) return res.json(null);
    const pedido = await getPedidoCompleto(rows[0].id);
    res.json(pedido);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/pedidos/:id
router.get('/:id', async (req, res) => {
  try {
    const pedido = await getPedidoCompleto(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/pedidos — crear pedido (público, clientes sin login)
router.post('/', async (req, res) => {
  try {
    const {
      cliente_id, usuario_id_mesero, origen, metodo_pago, valor_billete,
      direccion_entrega_texto, lat, lng, items
    } = req.body;

    if (!items || !items.length) return res.status(400).json({ error: 'El pedido no tiene productos' });

    // Validar que el cliente no tenga un pedido activo pendiente o aprobado
    if (cliente_id) {
      const [activos] = await db.query(
        `SELECT id FROM pedidos WHERE cliente_id = ? AND estado IN ('pendiente', 'aprobado') LIMIT 1`,
        [cliente_id]
      );
      if (activos.length) {
        return res.status(400).json({ error: 'Ya tienes un pedido activo. Debes esperar a que sea despachado o finalizado antes de hacer otro.' });
      }
    }

    // Calcular total
    let total = 0;
    for (const item of items) {
      total += (item.precio_con_descuento || item.precio_unitario) * item.cantidad;
    }

    const estado = origen === 'local' ? 'aprobado' : 'pendiente';
    const whatsapp_estado = origen === 'web' ? 'esperando_confirmacion' : 'none';

    const [result] = await db.query(`
      INSERT INTO pedidos (cliente_id, usuario_id_mesero, origen, estado, metodo_pago, valor_billete,
                           direccion_entrega_texto, lat, lng, total, whatsapp_estado)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `, [cliente_id || null, usuario_id_mesero || null, origen || 'web', estado,
        metodo_pago || 'efectivo', valor_billete || null, direccion_entrega_texto || null,
        lat || null, lng || null, total, whatsapp_estado]);

    const pedidoId = result.insertId;

    // Insertar detalles
    for (const item of items) {
      await db.query(
        'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, precio_con_descuento) VALUES (?,?,?,?,?)',
        [pedidoId, item.producto_id, item.cantidad, item.precio_unitario, item.precio_con_descuento || item.precio_unitario]
      );
    }

    const pedido = await getPedidoCompleto(pedidoId);

    // Emitir WebSocket — se maneja en server.js vía req.io
    if (req.io) {
      if (origen === 'web') {
        req.io.to('meseros').emit('nuevo:pedido', pedido);
      } else {
        req.io.to('meseros').emit('pedido:actualizado', pedido);
      }
    }

    if (origen === 'web' && pedido.cliente_telefono) {
      let resumen = '';
      pedido.detalles.forEach(d => {
        resumen += `- ${d.cantidad}x ${d.producto_nombre}\n`;
      });
      whatsapp.enviarMensajeConfirmacion(pedido.cliente_telefono, pedido.cliente_nombre, resumen, new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(total), pedido.metodo_pago);
    }

    res.status(201).json(pedido);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/pedidos/:id/estado
router.patch('/:id/estado', auth, async (req, res) => {
  try {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'aprobado', 'rechazado', 'despachado'];
    if (!estadosValidos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    await db.query('UPDATE pedidos SET estado=? WHERE id=?', [estado, req.params.id]);
    const pedido = await getPedidoCompleto(req.params.id);

    if (req.io) {
      req.io.to('meseros').emit('pedido:actualizado', pedido);
      req.io.to(`pedido-${req.params.id}`).emit('pedido:actualizado', pedido);
      if (estado === 'despachado') {
        req.io.emit('pedido:despachado', pedido);
      }
    }
    
    if (estado === 'despachado' && pedido.cliente_telefono) {
      whatsapp.enviarMensajeDespachado(pedido.cliente_telefono);
    }

    if (estado === 'aprobado' && pedido.cliente_telefono) {
      whatsapp.enviarMensajeAprobado(pedido.cliente_telefono);
    }

    res.json(pedido);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/pedidos/:id/observaciones
router.post('/:id/observaciones', auth, async (req, res) => {
  try {
    const { mensaje } = req.body;
    await db.query(
      'INSERT INTO observaciones_pedido (pedido_id, mensaje, creado_por) VALUES (?,?,?)',
      [req.params.id, mensaje, req.user.nombre]
    );
    const [obs] = await db.query(
      'SELECT * FROM observaciones_pedido WHERE pedido_id=? ORDER BY created_at',
      [req.params.id]
    );
    if (req.io) {
      req.io.to(`pedido-${req.params.id}`).emit('nueva:observacion', obs[obs.length - 1]);
      req.io.to('meseros').emit('nueva:observacion', { pedido_id: req.params.id, obs: obs[obs.length - 1] });
    }
    res.status(201).json(obs[obs.length - 1]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
