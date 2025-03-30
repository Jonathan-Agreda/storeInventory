// scripts/validate-connection.js
const { Client } = require("pg");
require("dotenv").config();

// Configuración segura para diferentes entornos
const connectionConfig = {
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/inventario_telecom",
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: false,
        }
      : false,
  connectionTimeoutMillis: 5000,
  idle_in_transaction_session_timeout: 10000,
};

// Mensaje inicial con información segura
console.log("🔍 Iniciando validación de conexión a PostgreSQL...");
console.log(`- Entorno: ${process.env.NODE_ENV || "development"}`);
console.log(
  `- Base de datos: ${
    connectionConfig.connectionString.split("@")[1]?.split("/")[1] ||
    "inventario_telecom"
  }`
);

async function validateDatabase() {
  const client = new Client(connectionConfig);
  let connectionEstablished = false;

  try {
    // 1. Validar conexión básica
    console.log("\n1. Probando conexión básica...");
    await client.connect();
    connectionEstablished = true;
    console.log("✅ Conexión establecida con éxito");

    // 2. Verificar tablas esenciales
    console.log("\n2. Validando estructura de la base de datos...");
    const requiredTables = [
      "fabricantes",
      "tipos_equipo",
      "equipos",
      "usuarios",
    ];
    const { rows: existingTables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const missingTables = requiredTables.filter(
      (table) => !existingTables.some((t) => t.table_name === table)
    );

    if (missingTables.length > 0) {
      console.warn("⚠️  Tablas faltantes:", missingTables.join(", "));
    } else {
      console.log("✅ Todas las tablas esenciales existen");
    }

    // 3. Verificar relaciones y constraints
    console.log("\n3. Validando relaciones clave...");
    const { rows: foreignKeys } = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

    const expectedRelationships = [
      {
        table: "equipos",
        column: "fabricante_id",
        foreign_table: "fabricantes",
      },
      { table: "equipos", column: "tipo_id", foreign_table: "tipos_equipo" },
    ];

    expectedRelationships.forEach((rel) => {
      const exists = foreignKeys.some(
        (fk) =>
          fk.table_name === rel.table &&
          fk.foreign_table_name === rel.foreign_table
      );
      console.log(
        exists ? "✅" : "❌",
        `Relación: ${rel.table}.${rel.column} -> ${rel.foreign_table}`
      );
    });

    // 4. Verificar datos mínimos
    console.log("\n4. Validando datos esenciales...");
    const { rows: fabricantes } = await client.query(
      "SELECT COUNT(*) FROM fabricantes"
    );
    const { rows: tipos } = await client.query(
      "SELECT COUNT(*) FROM tipos_equipo"
    );

    console.log(`- Fabricantes registrados: ${fabricantes[0].count}`);
    console.log(`- Tipos de equipo registrados: ${tipos[0].count}`);

    // 5. Prueba de escritura
    console.log("\n5. Realizando prueba de escritura...");
    const testTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'connection_test'
      )
    `);

    if (!testTableExists.rows[0].exists) {
      await client.query(
        "CREATE TEMP TABLE connection_test (id SERIAL PRIMARY KEY, test_value TEXT)"
      );
    }

    await client.query(
      "INSERT INTO connection_test (test_value) VALUES ($1) RETURNING id",
      [`Test ${new Date().toISOString()}`]
    );
    console.log("✅ Prueba de escritura exitosa");

    return true;
  } catch (error) {
    console.error("\n❌ Error durante la validación:");
    console.error("- Código:", error.code);
    console.error("- Mensaje:", error.message);

    // Detección inteligente de errores comunes
    if (error.code === "ECONNREFUSED") {
      console.error(
        "\n🔧 Posible solución: Verifica que PostgreSQL esté corriendo y aceptando conexiones"
      );
    } else if (error.code === "28P01") {
      console.error("\n🔧 Posible solución: Usuario o contraseña incorrectos");
    } else if (error.code === "3D000") {
      console.error(
        "\n🔧 Posible solución: La base de datos no existe. Ejecuta las migraciones primero"
      );
    }

    return false;
  } finally {
    if (connectionEstablished) {
      await client.end();
      console.log("\n🔌 Conexión cerrada correctamente");
    }
  }
}

// Ejecutar validación si no estamos en modo test
if (process.env.NODE_ENV !== "test") {
  validateDatabase().then((success) => {
    console.log(
      `\n${success ? "🎉 Validación exitosa" : "⚠️  Se encontraron problemas"}`
    );
    process.exit(success ? 0 : 1);
  });
}

module.exports = { validateDatabase }; // Para testing
