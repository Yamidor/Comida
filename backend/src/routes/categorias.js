const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// GET /api/categorias — público
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM categorias ORDER BY nombre');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/categorias
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, icono } = req.body;
    const [result] = await db.query('INSERT INTO categorias (nombre, icono) VALUES (?, ?)', [nombre, icono || '🍽️']);
    const [rows] = await db.query('SELECT * FROM categorias WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/categorias/:id
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, icono } = req.body;
    await db.query('UPDATE categorias SET nombre=?, icono=? WHERE id=?', [nombre, icono, req.params.id]);
    const [rows] = await db.query('SELECT * FROM categorias WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/categorias/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('DELETE FROM categorias WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
