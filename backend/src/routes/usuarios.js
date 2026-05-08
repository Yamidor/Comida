const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/usuarios
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id,nombre,telefono,email,rol,activo,created_at FROM usuarios ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/usuarios
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, telefono, email, password, rol, activo } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nombre,telefono,email,password_hash,rol,activo) VALUES (?,?,?,?,?,?)',
      [nombre, telefono || null, email, hash, rol || 'mesero', activo ?? 1]
    );
    const [rows] = await db.query('SELECT id,nombre,telefono,email,rol,activo,created_at FROM usuarios WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/usuarios/:id
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, telefono, email, password, rol, activo } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE usuarios SET nombre=?,telefono=?,email=?,password_hash=?,rol=?,activo=? WHERE id=?',
        [nombre, telefono, email, hash, rol, activo, req.params.id]
      );
    } else {
      await db.query(
        'UPDATE usuarios SET nombre=?,telefono=?,email=?,rol=?,activo=? WHERE id=?',
        [nombre, telefono, email, rol, activo, req.params.id]
      );
    }
    const [rows] = await db.query('SELECT id,nombre,telefono,email,rol,activo,created_at FROM usuarios WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/usuarios/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE usuarios SET activo=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
