const { Pool } = require("pg");
require("dotenv").config();

// Configuración de conexión segura
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/inventario_telecom",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Datos ficticios para pruebas
const sampleData = {
  fabricantes: [
    { nombre: "Huawei", descripcion: "Líder en equipos GPON y MSAN" },
    {
      nombre: "Alcatel-Lucent",
      descripcion: "Soluciones de acceso multiservicio",
    },
    { nombre: "Nokia", descripcion: "Tecnología de red avanzada" },
    { nombre: "ZTE", descripcion: "Equipos económicos para redes FTTH" },
  ],

  tiposEquipo: [
    { nombre: "GPON", descripcion: "Plataforma de fibra óptica" },
    { nombre: "MSAN", descripcion: "Nodo de acceso multiservicio" },
    { nombre: "DSLAM", descripcion: "Multiplexor de línea digital" },
    { nombre: "OLT", descripcion: "Terminal de línea óptica" },
  ],

  equipos: [
    {
      modelo: "MA5600T",
      fabricante: "Huawei",
      tipo: "GPON",
      numero_serie: "HUA-GPON-001",
      ubicacion: "Central Norte",
      estado: "Activo",
      capacidad: 128,
    },
    {
      modelo: "ISAM 7330",
      fabricante: "Alcatel-Lucent",
      tipo: "MSAN",
      numero_serie: "ALU-MSAN-001",
      ubicacion: "Central Sur",
      estado: "Activo",
      capacidad: 96,
    },
    {
      modelo: "FX-16",
      fabricante: "Nokia",
      tipo: "DSLAM",
      numero_serie: "NOK-DSL-001",
      ubicacion: "Nodo 5",
      estado: "Mantenimiento",
      capacidad: 64,
    },
    {
      modelo: "C320",
      fabricante: "ZTE",
      tipo: "OLT",
      numero_serie: "ZTE-OLT-001",
      ubicacion: "Nodo 12",
      estado: "Activo",
      capacidad: 80,
    },
  ],

  usuarios: [
    {
      username: "admin",
      password: "Admin123",
      email: "admin@telecom.com",
      rol: "admin",
    },
    {
      username: "tecnico1",
      password: "Tecnico123",
      email: "tecnico1@telecom.com",
      rol: "tecnico",
    },
    {
      username: "consulta1",
      password: "Consulta123",
      email: "consulta1@telecom.com",
      rol: "consulta",
    },
  ],
};

// Función para poblar la base de datos
async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("🗃️  Insertando fabricantes...");
    for (const fabricante of sampleData.fabricantes) {
      await client.query(
        "INSERT INTO fabricantes (nombre, descripcion) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING",
        [fabricante.nombre, fabricante.descripcion]
      );
    }

    console.log("🖥️  Insertando tipos de equipo...");
    for (const tipo of sampleData.tiposEquipo) {
      await client.query(
        "INSERT INTO tipos_equipo (nombre, descripcion) VALUES ($1, $2) ON CONFLICT (nombre) DO NOTHING",
        [tipo.nombre, tipo.descripcion]
      );
    }

    console.log("📡 Insertando equipos...");
    for (const equipo of sampleData.equipos) {
      // Obtener IDs de relaciones
      const fabricanteId = await client.query(
        "SELECT id FROM fabricantes WHERE nombre = $1",
        [equipo.fabricante]
      );
      const tipoId = await client.query(
        "SELECT id FROM tipos_equipo WHERE nombre = $1",
        [equipo.tipo]
      );

      await client.query(
        `INSERT INTO equipos (
          modelo, fabricante_id, tipo_id, numero_serie, 
          ubicacion, estado, capacidad
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (numero_serie) DO NOTHING`,
        [
          equipo.modelo,
          fabricanteId.rows[0].id,
          tipoId.rows[0].id,
          equipo.numero_serie,
          equipo.ubicacion,
          equipo.estado,
          equipo.capacidad,
        ]
      );
    }

    console.log("👤 Insertando usuarios...");
    for (const usuario of sampleData.usuarios) {
      // En producción real, usa bcrypt para hashear contraseñas
      await client.query(
        `INSERT INTO usuarios (
          username, password_hash, email, rol
        ) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
        [
          usuario.username,
          usuario.password, // En realidad debería ser un hash
          usuario.email,
          usuario.rol,
        ]
      );
    }

    await client.query("COMMIT");
    console.log("🎉 Datos de prueba insertados exitosamente!");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al insertar datos:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar solo si no es un test
if (process.env.NODE_ENV !== "test") {
  seedDatabase();
}

module.exports = { sampleData, seedDatabase }; // Para testing
