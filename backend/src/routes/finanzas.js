const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// ===== INSUMOS =====
router.get('/insumos', auth, requireRole('admin'), async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let where = '1=1';
    let params = [];
    if (desde) { where += ' AND fecha_compra >= ?'; params.push(desde); }
    if (hasta) { where += ' AND fecha_compra <= ?'; params.push(hasta); }
    const [rows] = await db.query(`SELECT * FROM insumos_compras WHERE ${where} ORDER BY fecha_compra DESC`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/insumos', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, cantidad, unidad, valor_unitario, fecha_compra } = req.body;
    const [result] = await db.query(
      'INSERT INTO insumos_compras (nombre, cantidad, unidad, valor_unitario, fecha_compra) VALUES (?,?,?,?,?)',
      [nombre, cantidad, unidad, valor_unitario, fecha_compra]
    );
    const [rows] = await db.query('SELECT * FROM insumos_compras WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/insumos/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, cantidad, unidad, valor_unitario, fecha_compra } = req.body;
    await db.query(
      'UPDATE insumos_compras SET nombre=?,cantidad=?,unidad=?,valor_unitario=?,fecha_compra=? WHERE id=?',
      [nombre, cantidad, unidad, valor_unitario, fecha_compra, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM insumos_compras WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/insumos/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM insumos_compras WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== SERVICIOS =====
router.get('/servicios', auth, requireRole('admin'), async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let where = '1=1'; let params = [];
    if (desde) { where += ' AND fecha >= ?'; params.push(desde); }
    if (hasta) { where += ' AND fecha <= ?'; params.push(hasta); }
    const [rows] = await db.query(`SELECT * FROM servicios WHERE ${where} ORDER BY fecha DESC`, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/servicios', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, valor, fecha, descripcion } = req.body;
    const [result] = await db.query('INSERT INTO servicios (nombre,valor,fecha,descripcion) VALUES (?,?,?,?)', [nombre, valor, fecha, descripcion]);
    const [rows] = await db.query('SELECT * FROM servicios WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/servicios/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, valor, fecha, descripcion } = req.body;
    await db.query('UPDATE servicios SET nombre=?,valor=?,fecha=?,descripcion=? WHERE id=?', [nombre, valor, fecha, descripcion, req.params.id]);
    const [rows] = await db.query('SELECT * FROM servicios WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/servicios/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM servicios WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== ARRIENDOS =====
router.get('/arriendos', auth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM arriendos ORDER BY fecha_pago DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/arriendos', auth, requireRole('admin'), async (req, res) => {
  try {
    const { descripcion, valor, fecha_pago } = req.body;
    const [result] = await db.query('INSERT INTO arriendos (descripcion,valor,fecha_pago) VALUES (?,?,?)', [descripcion, valor, fecha_pago]);
    const [rows] = await db.query('SELECT * FROM arriendos WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/arriendos/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { descripcion, valor, fecha_pago } = req.body;
    await db.query('UPDATE arriendos SET descripcion=?,valor=?,fecha_pago=? WHERE id=?', [descripcion, valor, fecha_pago, req.params.id]);
    const [rows] = await db.query('SELECT * FROM arriendos WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/arriendos/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM arriendos WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== EMPLEADOS =====
router.get('/empleados', auth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empleados WHERE activo=1 ORDER BY nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/empleados', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, cargo, salario_base } = req.body;
    const [result] = await db.query('INSERT INTO empleados (nombre,cargo,salario_base) VALUES (?,?,?)', [nombre, cargo, salario_base]);
    const [rows] = await db.query('SELECT * FROM empleados WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/empleados/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, cargo, salario_base, activo } = req.body;
    await db.query('UPDATE empleados SET nombre=?,cargo=?,salario_base=?,activo=? WHERE id=?', [nombre, cargo, salario_base, activo ?? 1, req.params.id]);
    const [rows] = await db.query('SELECT * FROM empleados WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/empleados/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE empleados SET activo=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== NOMINA =====
router.get('/nomina', auth, requireRole('admin'), async (req, res) => {
  try {
    const { empleado_id } = req.query;
    let q = `SELECT pn.*, e.nombre AS empleado_nombre, e.cargo
             FROM pagos_nomina pn JOIN empleados e ON pn.empleado_id = e.id`;
    let params = [];
    if (empleado_id) { q += ' WHERE pn.empleado_id=?'; params.push(empleado_id); }
    q += ' ORDER BY pn.fecha_pago DESC';
    const [rows] = await db.query(q, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/nomina', auth, requireRole('admin'), async (req, res) => {
  try {
    const { empleado_id, periodo_inicio, periodo_fin, valor_pagado, fecha_pago, observacion } = req.body;
    const [result] = await db.query(
      'INSERT INTO pagos_nomina (empleado_id,periodo_inicio,periodo_fin,valor_pagado,fecha_pago,observacion) VALUES (?,?,?,?,?,?)',
      [empleado_id, periodo_inicio, periodo_fin, valor_pagado, fecha_pago, observacion]
    );
    const [rows] = await db.query(`SELECT pn.*, e.nombre AS empleado_nombre FROM pagos_nomina pn JOIN empleados e ON pn.empleado_id=e.id WHERE pn.id=?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/nomina/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM pagos_nomina WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== BALANCE =====
router.get('/balance', auth, requireRole('admin'), async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const d = desde || '2000-01-01';
    const h = hasta || '2099-12-31';

    const [[{ ingresos }]] = await db.query(
      `SELECT COALESCE(SUM(total),0) AS ingresos FROM pedidos
       WHERE estado IN ('aprobado','despachado') AND DATE(created_at) BETWEEN ? AND ?`, [d, h]
    );
    const [[{ insumos }]] = await db.query(
      `SELECT COALESCE(SUM(total),0) AS insumos FROM insumos_compras WHERE fecha_compra BETWEEN ? AND ?`, [d, h]
    );
    const [[{ servicios_total }]] = await db.query(
      `SELECT COALESCE(SUM(valor),0) AS servicios_total FROM servicios WHERE fecha BETWEEN ? AND ?`, [d, h]
    );
    const [[{ arriendos_total }]] = await db.query(
      `SELECT COALESCE(SUM(valor),0) AS arriendos_total FROM arriendos WHERE fecha_pago BETWEEN ? AND ?`, [d, h]
    );
    const [[{ nomina_total }]] = await db.query(
      `SELECT COALESCE(SUM(valor_pagado),0) AS nomina_total FROM pagos_nomina WHERE fecha_pago BETWEEN ? AND ?`, [d, h]
    );

    const [pedidos_detalle] = await db.query(
      `SELECT p.id, p.created_at, p.total, p.metodo_pago, c.nombre AS cliente
       FROM pedidos p LEFT JOIN clientes c ON p.cliente_id=c.id
       WHERE p.estado IN ('aprobado','despachado') AND DATE(p.created_at) BETWEEN ? AND ?
       ORDER BY p.created_at DESC`, [d, h]
    );
    const [insumos_detalle] = await db.query(
      `SELECT * FROM insumos_compras WHERE fecha_compra BETWEEN ? AND ? ORDER BY fecha_compra DESC`, [d, h]
    );
    const [servicios_detalle] = await db.query(
      `SELECT * FROM servicios WHERE fecha BETWEEN ? AND ? ORDER BY fecha DESC`, [d, h]
    );
    const [arriendos_detalle] = await db.query(
      `SELECT * FROM arriendos WHERE fecha_pago BETWEEN ? AND ? ORDER BY fecha_pago DESC`, [d, h]
    );
    const [nomina_detalle] = await db.query(
      `SELECT pn.*, e.nombre AS empleado_nombre, e.cargo FROM pagos_nomina pn
       JOIN empleados e ON pn.empleado_id=e.id WHERE pn.fecha_pago BETWEEN ? AND ?
       ORDER BY pn.fecha_pago DESC`, [d, h]
    );

    const egresos = +insumos + +servicios_total + +arriendos_total + +nomina_total;
    const utilidad = +ingresos - egresos;

    res.json({
      periodo: { desde: d, hasta: h },
      ingresos: +ingresos,
      egresos: { insumos: +insumos, servicios: +servicios_total, arriendos: +arriendos_total, nomina: +nomina_total, total: egresos },
      utilidad,
      detalle: { pedidos: pedidos_detalle, insumos: insumos_detalle, servicios: servicios_detalle, arriendos: arriendos_detalle, nomina: nomina_detalle }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== DASHBOARD =====
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [[hoy]] = await db.query(`
      SELECT COUNT(*) AS pedidos_hoy,
             COALESCE(SUM(CASE WHEN estado IN ('aprobado','despachado') THEN total ELSE 0 END),0) AS ingresos_hoy,
             SUM(CASE WHEN estado='pendiente' THEN 1 ELSE 0 END) AS pendientes
      FROM pedidos WHERE DATE(created_at) = CURDATE()
    `);

    const [ultimos7] = await db.query(`
      SELECT DATE(created_at) AS fecha,
             COUNT(*) AS pedidos,
             COALESCE(SUM(CASE WHEN estado IN ('aprobado','despachado') THEN total ELSE 0 END),0) AS ingresos
      FROM pedidos
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY fecha ASC
    `);

    res.json({ hoy, ultimos7 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
