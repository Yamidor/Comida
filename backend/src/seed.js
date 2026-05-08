const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSeed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true,
  });

  console.log('🔌 Conectado a MySQL');
  
  const sqlPath = path.join(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Ejecutando schema.sql...');
  await connection.query(sql);
  
  console.log('✅ Base de datos "araquiu_db" creada y sembrada correctamente!');
  await connection.end();
}

runSeed().catch(console.error);
