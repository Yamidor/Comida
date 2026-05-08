const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
    database: 'araquiu_db'
  });

  const adminHash = '$2b$10$.yhK3LCUMcVe4vPJd.61GeNV3Gs85z1MXHB8psboFpM7fT/uobEDW';
  const meseroHash = '$2b$10$T7sErGUmLo4Nw9lg2Nk6F.EqgFYJ/wAsvQ0452yQvo0GGdnuibdf.';

  await connection.query('UPDATE usuarios SET password_hash=? WHERE email=?', [adminHash, 'admin@araquiu.com']);
  await connection.query('UPDATE usuarios SET password_hash=? WHERE email=?', [meseroHash, 'mesero@araquiu.com']);

  console.log('✅ Hashes corregidos!');
  process.exit(0);
}

run().catch(console.error);
