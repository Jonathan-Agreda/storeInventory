// migrations/initial-structure.js
const { Pool } = require("pg");
require("dotenv").config();

// Configuración segura para producción y desarrollo
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    }
  : {
      user: process.env.DB_USER || "postgres",
      host: process.env.DB_HOST || "localhost",
      database: process.env.DB_NAME || "inventario_telecom",
      password: process.env.DB_PASSWORD || "postgres",
      port: process.env.DB_PORT || 5432,
    };

const pool = new Pool(poolConfig);

// Script SQL completo para creación de tablas y relaciones
const schema = `
  -- Tabla de fabricantes
  CREATE TABLE IF NOT EXISTS fabricantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de tipos de equipo
  CREATE TABLE IF NOT EXISTS tipos_equipo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla principal de equipos
  CREATE TABLE IF NOT EXISTS equipos (
    id SERIAL PRIMARY KEY,
    modelo VARCHAR(100) NOT NULL,
    fabricante_id INTEGER NOT NULL REFERENCES fabricantes(id),
    tipo_id INTEGER NOT NULL REFERENCES tipos_equipo(id),
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    ubicacion VARCHAR(100),
    fecha_instalacion DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'Activo' 
      CHECK (estado IN ('Activo', 'Mantenimiento', 'Retirado', 'Almacen')),
    capacidad INTEGER,
    detalles TEXT,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de usuarios (para futura autenticación)
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    rol VARCHAR(20) NOT NULL DEFAULT 'tecnico'
      CHECK (rol IN ('admin', 'tecnico', 'consulta')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Índices para mejorar rendimiento
  CREATE INDEX IF NOT EXISTS idx_equipos_fabricante ON equipos(fabricante_id);
  CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos(tipo_id);
  CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado);
`;

// Datos iniciales esenciales
const seedData = `
  -- Fabricantes comunes
  INSERT INTO fabricantes (nombre, descripcion) VALUES
    ('Huawei', 'Equipos de telecomunicaciones chinos'),
    ('Alcatel-Lucent', 'Soluciones de red franco-americanas'),
    ('Nokia', 'Tecnología de redes finlandesa'),
    ('ZTE', 'Fabricante chino de equipos de red')
  ON CONFLICT (nombre) DO NOTHING;

  -- Tipos de equipo
  INSERT INTO tipos_equipo (nombre, descripcion) VALUES
    ('GPON', 'Tecnología de acceso por fibra óptica'),
    ('MSAN', 'Multiservice Access Node'),
    ('DSLAM', 'Digital Subscriber Line Access Multiplexer')
  ON CONFLICT (nombre) DO NOTHING;

  -- Usuario admin inicial (password: Admin123)
  INSERT INTO usuarios (username, password_hash, email, rol) VALUES
    ('admin', '$2a$10$XpAVbXIslD1QrLYeG3QnDeL5XZ5Lc7Lc6WzLbJXvRvJ6wVkQYHbW2', 'admin@inventario.com', 'admin')
  ON CONFLICT (username) DO NOTHING;
`;

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log("🏗️  Iniciando migración de base de datos...");

    await client.query("BEGIN");

    // Ejecutar creación de esquema
    await client.query(schema);
    console.log("✅ Esquema de base de datos creado");

    // Insertar datos iniciales
    await client.query(seedData);
    console.log("📊 Datos iniciales insertados");

    await client.query("COMMIT");
    console.log("🎉 Migración completada con éxito");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error durante la migración:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar migración solo si no estamos en un test
if (process.env.NODE_ENV !== "test") {
  runMigrations();
}

module.exports = { runMigrations }; // Para testing
