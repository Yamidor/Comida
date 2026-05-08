const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/promociones
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pr.*, p.nombre AS producto_nombre, p.precio,
             ROUND(p.precio * (1 - pr.porcentaje_descuento/100), 0) AS precio_con_descuento
      FROM promociones pr
      JOIN productos p ON pr.producto_id = p.id
      ORDER BY pr.id DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/promociones
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { producto_id, porcentaje_descuento, activo, fecha_inicio, fecha_fin } = req.body;
    const [result] = await db.query(
      'INSERT INTO promociones (producto_id, porcentaje_descuento, activo, fecha_inicio, fecha_fin) VALUES (?,?,?,?,?)',
      [producto_id, porcentaje_descuento, activo ?? 1, fecha_inicio || null, fecha_fin || null]
    );
    const [rows] = await db.query(`
      SELECT pr.*, p.nombre AS producto_nombre, p.precio,
             ROUND(p.precio * (1 - pr.porcentaje_descuento/100), 0) AS precio_con_descuento
      FROM promociones pr JOIN productos p ON pr.producto_id = p.id WHERE pr.id=?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/promociones/:id
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { producto_id, porcentaje_descuento, activo, fecha_inicio, fecha_fin } = req.body;
    await db.query(
      'UPDATE promociones SET producto_id=?, porcentaje_descuento=?, activo=?, fecha_inicio=?, fecha_fin=? WHERE id=?',
      [producto_id, porcentaje_descuento, activo, fecha_inicio || null, fecha_fin || null, req.params.id]
    );
    const [rows] = await db.query(`
      SELECT pr.*, p.nombre AS producto_nombre, p.precio,
             ROUND(p.precio * (1 - pr.porcentaje_descuento/100), 0) AS precio_con_descuento
      FROM promociones pr JOIN productos p ON pr.producto_id = p.id WHERE pr.id=?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/promociones/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM promociones WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
