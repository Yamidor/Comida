const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/clientes?tel=xxx — buscar por teléfono (público)
router.get('/', async (req, res) => {
  try {
    const { tel, q } = req.query;
    if (tel) {
      const [rows] = await db.query('SELECT * FROM clientes WHERE telefono = ?', [tel]);
      return res.json(rows[0] || null);
    }
    
    // Para listar todos (admin) se requiere auth
    auth(req, res, async () => {
      const search = q ? `%${q}%` : '%';
      const [rows] = await db.query(
        'SELECT * FROM clientes WHERE nombre LIKE ? OR telefono LIKE ? ORDER BY created_at DESC',
        [search, search]
      );
      res.json(rows);
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/clientes
router.post('/', async (req, res) => {
  try {
    const { nombre, telefono, direccion_texto, direccion_lat, direccion_lng, metodo_pago, valor_billete } = req.body;
    // Upsert por teléfono
    const [exist] = await db.query('SELECT id FROM clientes WHERE telefono=?', [telefono]);
    if (exist.length) {
      await db.query(
        'UPDATE clientes SET nombre=?, direccion_texto=?, direccion_lat=?, direccion_lng=?, metodo_pago=?, valor_billete=? WHERE telefono=?',
        [nombre, direccion_texto, direccion_lat || null, direccion_lng || null, metodo_pago || 'efectivo', valor_billete || null, telefono]
      );
      const [rows] = await db.query('SELECT * FROM clientes WHERE telefono=?', [telefono]);
      return res.json(rows[0]);
    }
    const [result] = await db.query(
      'INSERT INTO clientes (nombre, telefono, direccion_texto, direccion_lat, direccion_lng, metodo_pago, valor_billete) VALUES (?,?,?,?,?,?,?)',
      [nombre, telefono, direccion_texto, direccion_lat || null, direccion_lng || null, metodo_pago || 'efectivo', valor_billete || null]
    );
    const [rows] = await db.query('SELECT * FROM clientes WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/clientes/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { nombre, telefono, direccion_texto, direccion_lat, direccion_lng, metodo_pago, valor_billete } = req.body;
    await db.query(
      'UPDATE clientes SET nombre=?, telefono=?, direccion_texto=?, direccion_lat=?, direccion_lng=?, metodo_pago=?, valor_billete=? WHERE id=?',
      [nombre, telefono, direccion_texto, direccion_lat || null, direccion_lng || null, metodo_pago, valor_billete || null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM clientes WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/clientes/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM clientes WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
