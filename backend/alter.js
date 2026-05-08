const db = require('./src/db');

async function alter() {
  try {
    await db.query('ALTER TABLE pedidos ADD COLUMN comprobante_url VARCHAR(255)');
    console.log('Added comprobante_url');
  } catch (e) {
    console.log('Error adding comprobante_url:', e.message);
  }

  try {
    await db.query("ALTER TABLE pedidos ADD COLUMN whatsapp_estado ENUM('none','esperando_confirmacion','esperando_comprobante','confirmado') DEFAULT 'none'");
    console.log('Added whatsapp_estado');
  } catch (e) {
    console.log('Error adding whatsapp_estado:', e.message);
  }

  process.exit();
}

alter();
