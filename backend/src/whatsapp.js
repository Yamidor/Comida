const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('./db');
const path = require('path');
const fs = require('fs');

let ioInstance = null;

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

let isReady = false;
const messageQueue = [];

// Mapa para rastrear chats: cuando enviamos un mensaje a 573042769597@c.us,
// almacenamos el teléfono del cliente para poder reconocerlo cuando responda
// desde un chat @lid (formato interno de WhatsApp con dispositivos vinculados)
const chatPhoneMap = new Map(); // chatId (@c.us) -> teléfono

client.on('qr', (qr) => {
    console.log('----------------------------------------------------');
    console.log('¡ATENCIÓN! ESCANEA ESTE CÓDIGO QR CON TU WHATSAPP');
    console.log('----------------------------------------------------');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('✅ Cliente de WhatsApp listo!');
    isReady = true;
    
    // Procesar mensajes encolados mientras arrancaba
    console.log(`[WhatsApp] Procesando ${messageQueue.length} mensajes encolados...`);
    while (messageQueue.length > 0) {
        const task = messageQueue.shift();
        try { await task(); } catch (e) { console.error('Error en cola WP:', e); }
    }
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp autenticado correctamente');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación WhatsApp:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️  WhatsApp desconectado:', reason);
    isReady = false;
    setTimeout(() => {
        console.log('🔄 Intentando reconectar WhatsApp...');
        client.initialize();
    }, 5000);
});

// Helper para obtener el pedido completo y emitir
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
  return { ...pedido, detalles };
}

// Función para resolver el teléfono del cliente a partir de un mensaje entrante
async function resolverTelefono(msg, chat) {
    const from = msg.from || '';
    const chatIdStr = chat.id._serialized || '';

    // 1. Si es chat @c.us, el número está directamente en el chat ID
    if (chatIdStr.includes('@c.us')) {
        return chat.id.user;
    }

    // 2. Intentar con contact.number (validar que sea un número real, no un LID)
    try {
        const contact = await msg.getContact();
        if (contact && contact.number && contact.number.length <= 13) {
            console.log(`[WhatsApp] 🔍 Número resuelto por contacto: ${contact.number}`);
            return contact.number;
        }
        if (contact && contact.number) {
            console.log(`[WhatsApp] 🔍 contact.number es LID (${contact.number}), ignorando...`);
        }
    } catch (e) { /* ignorar */ }

    // 3. SOLUCIÓN PARA LID: buscar todos los pedidos pendientes y para cada uno,
    //    abrir su chat @c.us y ver si el último mensaje del cliente coincide
    try {
        const [pendientes] = await db.query(`
            SELECT c.telefono FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE p.whatsapp_estado IN ('esperando_confirmacion', 'esperando_comprobante')
            ORDER BY p.created_at DESC
        `);
        console.log(`[WhatsApp] 🔍 Buscando en ${pendientes.length} pedido(s) pendiente(s)...`);

        for (const p of pendientes) {
            let numId = p.telefono;
            if (!numId.startsWith('57')) numId = `57${numId}`;
            const cusChatId = `${numId}@c.us`;
            console.log(`[WhatsApp] 🔍 Probando chat ${cusChatId}...`);
            try {
                const cusChat = await client.getChatById(cusChatId);
                const msgs = await cusChat.fetchMessages({ limit: 3 });
                console.log(`[WhatsApp] 🔍 Chat encontrado, ${msgs.length} msgs. Buscando coincidencia...`);
                // Buscar el último mensaje que NO sea nuestro
                const lastClientMsg = [...msgs].reverse().find(m => !m.fromMe);
                if (lastClientMsg) {
                    console.log(`[WhatsApp] 🔍 Último msg cliente: "${lastClientMsg.body}", ts=${lastClientMsg.timestamp}, incoming ts=${msg.timestamp}, diff=${Math.abs(lastClientMsg.timestamp - msg.timestamp)}`);
                    if (lastClientMsg.body === msg.body && Math.abs(lastClientMsg.timestamp - msg.timestamp) < 60) {
                        console.log(`[WhatsApp] ✅ Número resuelto via chat @c.us: ${numId}`);
                        return numId;
                    }
                } else {
                    console.log(`[WhatsApp] 🔍 No hay mensajes del cliente en este chat`);
                }
            } catch (e) {
                console.log(`[WhatsApp] 🔍 Error accediendo chat ${cusChatId}: ${e.message}`);
            }
        }
    } catch (e) {
        console.error('[WhatsApp] Error en resolución LID:', e.message);
    }

    return null;
}

// Listener de mensajes entrantes
client.on('message', async (msg) => {
    try {
        // Filtros rápidos
        if (msg.isStatus) return;
        const from = msg.from || '';
        if (from.includes('status') || from.includes('@broadcast') || from.includes('@newsletter')) return;

        const chat = await msg.getChat();
        if (chat.isGroup) return;

        const chatIdStr = chat.id._serialized || '';
        if (chatIdStr.includes('@newsletter') || chatIdStr.includes('@channel') || chatIdStr.includes('@g.us')) return;

        // Resolver el número de teléfono del remitente
        const phoneNumber = await resolverTelefono(msg, chat);

        if (!phoneNumber) {
            // Solo loguear si parece un chat real (no canal)
            if (!chatIdStr.includes('@lid') || msg.body.trim().toLowerCase() === 'si' || msg.body.trim().toLowerCase() === 'sí') {
                console.log(`[WhatsApp] ⚠️ No se pudo resolver número. from: ${from}, chatId: ${chatIdStr}, body: ${msg.body.substring(0, 30)}`);
            }
            return;
        }

        const tenDigits = phoneNumber.substring(phoneNumber.length - 10);
        console.log(`[WhatsApp] 📩 Mensaje de ${phoneNumber} (tel: ${tenDigits}): ${msg.body}`);

        const [pedidos] = await db.query(`
            SELECT p.id, p.metodo_pago, p.whatsapp_estado
            FROM pedidos p
            JOIN clientes c ON p.cliente_id = c.id
            WHERE c.telefono LIKE ? AND p.whatsapp_estado IN ('esperando_confirmacion', 'esperando_comprobante')
            ORDER BY p.created_at DESC LIMIT 1
        `, [`%${tenDigits}`]);

        if (!pedidos.length) {
            console.log(`[WhatsApp] No hay pedido activo para ${tenDigits}`);
            return;
        }

        const pedido = pedidos[0];
        const body = msg.body.trim().toLowerCase();
        console.log(`[WhatsApp] ✅ Pedido #${pedido.id} encontrado: estado=${pedido.whatsapp_estado}, pago=${pedido.metodo_pago}`);

        // Flujo: Esperando Confirmacion
        if (pedido.whatsapp_estado === 'esperando_confirmacion') {
            if (body === 'si' || body === 'sí') {
                if (pedido.metodo_pago === 'efectivo') {
                    await db.query('UPDATE pedidos SET whatsapp_estado = ? WHERE id = ?', ['confirmado', pedido.id]);
                    await msg.reply('✅ ¡Excelente! Tu pedido ha sido confirmado. En breve el restaurante autorizará tu pedido y te avisaremos cuando vaya en camino. ¡Gracias por elegir Araquiu!');
                    
                    if (ioInstance) {
                        const pedidoCompleto = await getPedidoCompleto(pedido.id);
                        ioInstance.to('meseros').emit('pedido:actualizado', pedidoCompleto);
                        ioInstance.to(`pedido-${pedido.id}`).emit('pedido:actualizado', pedidoCompleto);
                    }
                } else if (pedido.metodo_pago === 'transferencia') {
                    await db.query('UPDATE pedidos SET whatsapp_estado = ? WHERE id = ?', ['esperando_comprobante', pedido.id]);
                    await msg.reply('¡Perfecto! Al ser pago por transferencia, por favor envíanos la foto o captura del comprobante por este medio.');

                    if (ioInstance) {
                        const pedidoCompleto = await getPedidoCompleto(pedido.id);
                        ioInstance.to('meseros').emit('pedido:actualizado', pedidoCompleto);
                    }
                }
            }
        }
        // Flujo: Esperando Comprobante
        else if (pedido.whatsapp_estado === 'esperando_comprobante') {
            if (msg.hasMedia) {
                const media = await msg.downloadMedia();
                if (media) {
                    const ext = media.mimetype.split('/')[1] || 'jpeg';
                    const filename = `comprobante_${pedido.id}_${Date.now()}.${ext}`;
                    const uploadPath = path.join(__dirname, '..', 'uploads', filename);
                    
                    if (!fs.existsSync(path.join(__dirname, '..', 'uploads'))) {
                        fs.mkdirSync(path.join(__dirname, '..', 'uploads'), { recursive: true });
                    }

                    fs.writeFileSync(uploadPath, media.data, 'base64');
                    
                    await db.query('UPDATE pedidos SET comprobante_url = ?, whatsapp_estado = ? WHERE id = ?', [`/uploads/${filename}`, 'confirmado', pedido.id]);
                    
                    await msg.reply('✅ ¡Comprobante recibido! En breve verificaremos y autorizaremos tu pedido. Te avisaremos cuando vaya en camino.');

                    if (ioInstance) {
                        const pedidoCompleto = await getPedidoCompleto(pedido.id);
                        ioInstance.to('meseros').emit('pedido:actualizado', pedidoCompleto);
                    }
                }
            } else {
                await msg.reply('Por favor envíanos una *imagen* o documento con el comprobante de transferencia.');
            }
        }
        
    } catch (err) {
        console.error('Error procesando msj WP:', err);
    }
});

const enviarMensajeConfirmacion = async (clienteTelefono, clienteNombre, resumenPedido, totalPedido, metodoPago) => {
    console.log(`[WhatsApp] Intentando enviar confirmación a ${clienteTelefono}. isReady: ${isReady}`);
    const task = async () => {
        try {
            let numberId = clienteTelefono;
            if (!numberId.startsWith('57')) numberId = `57${clienteTelefono}`;
            const chatId = `${numberId}@c.us`;
            
            const firstName = clienteNombre ? clienteNombre.split(' ')[0] : 'Cliente';
            const mensaje = `¡Hola ${firstName}! Gracias por elegir Araquiu 🍽️.\n\nHemos recibido tu pedido:\n${resumenPedido}\n\n*Total:* ${totalPedido}\n\n¿Deseas confirmar tu pedido? Responde *SI* para continuar.`;
            
            await client.sendMessage(chatId, mensaje);
            // Registrar este chat para poder reconocer respuestas
            chatPhoneMap.set(chatId, clienteTelefono);
            console.log(`[WhatsApp] 📤 Mensaje enviado a ${chatId}, registrado en mapa`);
        } catch (err) {
            console.error('Error enviando WP confirmación:', err);
        }
    };
    if (!isReady) {
        console.log(`[WhatsApp] ⏳ Cliente no listo, encolando mensaje para ${clienteTelefono}`);
        messageQueue.push(task);
    } else {
        await task();
    }
};

const enviarMensajeAprobado = async (clienteTelefono) => {
    const task = async () => {
        try {
            let numberId = clienteTelefono;
            if (!numberId.startsWith('57')) numberId = `57${clienteTelefono}`;
            const chatId = `${numberId}@c.us`;
            
            await client.sendMessage(chatId, '✅ ¡Tu pedido ha sido confirmado por el restaurante y ya se está preparando! Te avisaremos cuando sea despachado.');
        } catch (err) {
            console.error('Error enviando WP aprobado:', err);
        }
    };
    if (!isReady) messageQueue.push(task);
    else await task();
};

const enviarMensajeDespachado = async (clienteTelefono) => {
    const task = async () => {
        try {
            let numberId = clienteTelefono;
            if (!numberId.startsWith('57')) numberId = `57${clienteTelefono}`;
            const chatId = `${numberId}@c.us`;
            
            await client.sendMessage(chatId, '🛵 ¡Tu pedido ha sido despachado y va en camino! Muchas gracias por tu compra. ¡Que lo disfrutes! 🍽️');
        } catch (err) {
            console.error('Error enviando WP despachado:', err);
        }
    };
    if (!isReady) messageQueue.push(task);
    else await task();
};

module.exports = {
    init: (io) => {
        ioInstance = io;
        client.initialize();
    },
    enviarMensajeConfirmacion,
    enviarMensajeAprobado,
    enviarMensajeDespachado,
    client
};
