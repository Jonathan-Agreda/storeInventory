const pool = require("./db");

const Equipo = {
  async getAll() {
    const { rows } = await pool.query(`
          SELECT e.*, f.nombre as fabricante, t.nombre as tipo 
          FROM equipos e
          JOIN fabricantes f ON e.fabricante_id = f.id
          JOIN tipos_equipo t ON e.tipo_id = t.id
          ORDER BY e.fecha_instalacion DESC
        `);
    return rows;
  },

  async create(equipoData) {
    const { rows } = await pool.query(
      `INSERT INTO equipos(
        modelo, fabricante_id, tipo_id, numero_serie, 
        ubicacion, fecha_instalacion, estado, capacidad, detalles
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        equipoData.modelo,
        equipoData.fabricante_id,
        equipoData.tipo_id,
        equipoData.numero_serie,
        equipoData.ubicacion,
        equipoData.fecha_instalacion,
        equipoData.estado,
        equipoData.capacidad,
        equipoData.detalles,
      ]
    );
    return rows[0];
  },

  async delete(id) {
    const { rowCount } = await pool.query("DELETE FROM equipos WHERE id = $1", [
      id,
    ]);
    return rowCount > 0;
  },
  // Más métodos según necesites
};

module.exports = Equipo;
