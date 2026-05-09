const express = require('express');
const router = express.Router();
const whatsapp = require('../whatsapp');

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
    try {
        const status = whatsapp.getStatus();
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/whatsapp/logout
router.post('/logout', async (req, res) => {
    try {
        await whatsapp.logout();
        res.json({ message: 'Sesión desvinculada exitosamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
