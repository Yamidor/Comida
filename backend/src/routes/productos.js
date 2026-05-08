const express = require('express');
const router = express.Router();
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');

// GET /api/productos — público, incluye promociones activas vigentes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*,
             c.nombre AS categoria_nombre,
             c.icono AS categoria_icono,
             pr.id AS promo_id,
             pr.porcentaje_descuento,
             ROUND(p.precio * (1 - pr.porcentaje_descuento/100), 0) AS precio_con_descuento
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN promociones pr ON pr.producto_id = p.id
        AND pr.activo = 1
        AND (pr.fecha_inicio IS NULL OR pr.fecha_inicio <= CURDATE())
        AND (pr.fecha_fin IS NULL OR pr.fecha_fin >= CURDATE())
      WHERE p.activo = 1
      ORDER BY c.nombre, p.nombre
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/productos/admin — todos (incluyendo inactivos)
router.get('/admin', auth, requireRole('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, c.nombre AS categoria_nombre,
             pr.porcentaje_descuento, pr.activo AS promo_activa
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN promociones pr ON pr.producto_id = p.id AND pr.activo = 1
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/productos/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/productos
router.post('/', auth, requireRole('admin'), upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria_id, activo } = req.body;
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;
    const [result] = await db.query(
      'INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria_id, activo) VALUES (?,?,?,?,?,?)',
      [nombre, descripcion, precio, imagen_url, categoria_id || null, activo !== undefined ? activo : 1]
    );
    const [rows] = await db.query('SELECT * FROM productos WHERE id=?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/productos/:id
router.put('/:id', auth, requireRole('admin'), upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria_id, activo } = req.body;
    const imagen_url = req.file ? `/uploads/${req.file.filename}` : undefined;
    
    // Si se subió una nueva imagen, eliminar la vieja
    if (imagen_url) {
      const [old] = await db.query('SELECT imagen_url FROM productos WHERE id=?', [req.params.id]);
      if (old.length && old[0].imagen_url) {
        const filePath = path.join(process.env.UPLOAD_PATH || './uploads', path.basename(old[0].imagen_url));
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    let q = 'UPDATE productos SET nombre=?, descripcion=?, precio=?, categoria_id=?, activo=?';
    let params = [nombre, descripcion, precio, categoria_id || null, activo];
    if (imagen_url) { q += ', imagen_url=?'; params.push(imagen_url); }
    q += ' WHERE id=?';
    params.push(req.params.id);
    await db.query(q, params);
    const [rows] = await db.query('SELECT * FROM productos WHERE id=?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/productos/:id
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await db.query('UPDATE productos SET activo=0 WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
