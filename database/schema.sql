-- ============================================================
--  ARAQUIU COMIDAS Y BEBIDAS — Schema + Seed
-- ============================================================
CREATE DATABASE IF NOT EXISTS araquiu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE araquiu_db;

-- ------------------------------------------------------------
-- CATEGORIAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  icono VARCHAR(10) DEFAULT '🍽️'
);

-- ------------------------------------------------------------
-- USUARIOS (admin y mesero)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('admin','mesero') NOT NULL DEFAULT 'mesero',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- CLIENTES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(20) NOT NULL UNIQUE,
  direccion_texto TEXT,
  direccion_lat DECIMAL(10,8),
  direccion_lng DECIMAL(11,8),
  metodo_pago ENUM('efectivo','transferencia') DEFAULT 'efectivo',
  valor_billete DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- PRODUCTOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  imagen_url VARCHAR(255),
  categoria_id INT,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- PROMOCIONES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promociones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  porcentaje_descuento DECIMAL(5,2) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_inicio DATE,
  fecha_fin DATE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- PEDIDOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT,
  usuario_id_mesero INT,
  origen ENUM('web','local') NOT NULL DEFAULT 'web',
  estado ENUM('pendiente','aprobado','rechazado','despachado') NOT NULL DEFAULT 'pendiente',
  metodo_pago ENUM('efectivo','transferencia') DEFAULT 'efectivo',
  valor_billete DECIMAL(10,2),
  direccion_entrega_texto TEXT,
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  comprobante_url VARCHAR(255),
  whatsapp_estado ENUM('none','esperando_confirmacion','esperando_comprobante','confirmado') DEFAULT 'none',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id_mesero) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- DETALLE PEDIDOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  precio_con_descuento DECIMAL(10,2),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- OBSERVACIONES PEDIDO
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS observaciones_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  mensaje TEXT NOT NULL,
  creado_por VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- INSUMOS / COMPRAS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS insumos_compras (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  cantidad DECIMAL(10,3) NOT NULL,
  unidad VARCHAR(50),
  valor_unitario DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * valor_unitario) STORED,
  fecha_compra DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- SERVICIOS (agua, luz, internet, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- ARRIENDOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS arriendos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  descripcion TEXT,
  valor DECIMAL(10,2) NOT NULL,
  fecha_pago DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- EMPLEADOS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  cargo VARCHAR(100),
  salario_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- PAGOS NOMINA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos_nomina (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  valor_pagado DECIMAL(10,2) NOT NULL,
  fecha_pago DATE NOT NULL,
  observacion TEXT,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);

-- ============================================================
--  SEED DATA
-- ============================================================

-- Categorías
INSERT INTO categorias (nombre, icono) VALUES
  ('Platos Principales', '🍛'),
  ('Bebidas', '🥤'),
  ('Entradas', '🥗'),
  ('Postres', '🍮'),
  ('Combos', '🎁');

-- Usuarios (passwords: admin123 y mesero123 — bcrypt hash incluido)
INSERT INTO usuarios (nombre, telefono, email, password_hash, rol) VALUES
  ('Administrador Araquiu', '3001234567', 'admin@araquiu.com',
   '$2b$10$.yhK3LCUMcVe4vPJd.61GeNV3Gs85z1MXHB8psboFpM7fT/uobEDW', 'admin'),
  ('Carlos Mesero', '3109876543', 'mesero@araquiu.com',
   '$2b$10$T7sErGUmLo4Nw9lg2Nk6F.EqgFYJ/wAsvQ0452yQvo0GGdnuibdf.', 'mesero');

-- Clientes de prueba
INSERT INTO clientes (nombre, telefono, direccion_texto, metodo_pago) VALUES
  ('María García', '3201111111', 'Calle 10 #5-23, Barrio Centro', 'efectivo'),
  ('Juan Rodríguez', '3202222222', 'Carrera 8 #12-45, Barrio Norte', 'transferencia'),
  ('Ana Martínez', '3203333333', 'Diagonal 15 #8-90, Barrio Sur', 'efectivo');

-- Productos (imagen_url será actualizada vía upload)
INSERT INTO productos (nombre, descripcion, precio, imagen_url, categoria_id) VALUES
  ('Bandeja Paisa', 'Frijoles, chicharrón, chorizo, arepa, huevo, arroz, aguacate', 22000, '/uploads/bandeja-paisa.jpg', 1),
  ('Sancocho de Gallina', 'Caldo tradicional con gallina criolla, yuca y papa', 18000, '/uploads/sancocho.jpg', 1),
  ('Ajiaco Santafereño', 'Sopa bogotana con tres clases de papa, pollo y guascas', 17000, '/uploads/ajiaco.jpg', 1),
  ('Arroz con Pollo', 'Arroz con pollo dorado, vegetales salteados y ensalada', 15000, '/uploads/arroz-pollo.jpg', 1),
  ('Limonada Natural', 'Limonada fresca con hierbabuena y hielo', 5000, '/uploads/limonada.jpg', 2),
  ('Jugo de Mango', 'Jugo natural de mango maduro, sin azúcar añadida', 5500, '/uploads/mango.jpg', 2),
  ('Mazorca Desgranada', 'Mazorca tierna desgranada con mantequilla y queso', 8000, '/uploads/mazorca.jpg', 3),
  ('Empanadas x3', 'Tres empanadas criollas con ají y limón', 7000, '/uploads/empanadas.jpg', 3),
  ('Arroz con Leche', 'Postre tradicional colombiano con canela y leche condensada', 6000, '/uploads/arroz-leche.jpg', 4),
  ('Combo Familiar', 'Bandeja Paisa + 2 bebidas + empanadas x3', 38000, '/uploads/combo.jpg', 5);

-- Promociones activas
INSERT INTO promociones (producto_id, porcentaje_descuento, activo, fecha_inicio, fecha_fin) VALUES
  (1, 15.00, 1, '2026-05-01', '2026-05-31'),   -- Bandeja Paisa 15% OFF
  (10, 10.00, 1, '2026-05-01', '2026-05-31');   -- Combo Familiar 10% OFF

-- Empleados de prueba
INSERT INTO empleados (nombre, cargo, salario_base) VALUES
  ('Pedro Ramírez', 'Cocinero Principal', 1500000),
  ('Lucía Díaz', 'Auxiliar de Cocina', 1160000),
  ('Carlos Mesero', 'Mesero', 1200000);

-- Insumos de prueba
INSERT INTO insumos_compras (nombre, cantidad, unidad, valor_unitario, fecha_compra) VALUES
  ('Pollo', 5.000, 'kg', 12000, '2026-05-01'),
  ('Frijoles', 3.000, 'kg', 5000, '2026-05-01'),
  ('Arroz', 10.000, 'kg', 3500, '2026-05-02'),
  ('Aceite vegetal', 2.000, 'litro', 8000, '2026-05-02'),
  ('Verduras mixtas', 4.000, 'kg', 4000, '2026-05-03');

-- Servicios de prueba
INSERT INTO servicios (nombre, valor, fecha, descripcion) VALUES
  ('Agua', 85000, '2026-05-01', 'Factura servicio de acueducto'),
  ('Energía eléctrica', 250000, '2026-05-01', 'Factura Codensa mayo'),
  ('Internet', 95000, '2026-05-01', 'Plan empresarial 200MB');

-- Arriendos de prueba
INSERT INTO arriendos (descripcion, valor, fecha_pago) VALUES
  ('Arriendo local Araquiu — Mayo 2026', 1800000, '2026-05-05');

-- Pedidos de prueba
INSERT INTO pedidos (cliente_id, usuario_id_mesero, origen, estado, metodo_pago, direccion_entrega_texto, total) VALUES
  (1, 2, 'web', 'despachado', 'efectivo', 'Calle 10 #5-23', 27000),
  (2, 2, 'local', 'aprobado', 'transferencia', 'Local', 23000),
  (3, 2, 'web', 'pendiente', 'efectivo', 'Diagonal 15 #8-90', 15000);

INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, precio_con_descuento) VALUES
  (1, 1, 1, 22000, 18700),   -- Bandeja Paisa con 15% desc
  (1, 5, 1, 5000, 5000),
  (1, 8, 1, 7000, 7000),     -- empanadas
  (2, 3, 1, 17000, 17000),
  (2, 6, 1, 5500, 5500),
  (3, 4, 1, 15000, 15000);

INSERT INTO pagos_nomina (empleado_id, periodo_inicio, periodo_fin, valor_pagado, fecha_pago) VALUES
  (1, '2026-04-01', '2026-04-30', 1500000, '2026-05-01'),
  (2, '2026-04-01', '2026-04-30', 1160000, '2026-05-01');
