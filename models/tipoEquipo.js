const pool = require("./db");

const TipoEquipo = {
  async getAll() {
    const { rows } = await pool.query(
      "SELECT * FROM tipos_equipo ORDER BY nombre"
    );
    return rows;
  },

  async create(nombre, descripcion) {
    const { rows } = await pool.query(
      "INSERT INTO tipos_equipo(nombre, descripcion) VALUES($1, $2) RETURNING *",
      [nombre, descripcion]
    );
    return rows[0];
  },

  async getById(id) {
    const { rows } = await pool.query(
      "SELECT * FROM tipos_equipo WHERE id = $1",
      [id]
    );
    return rows[0];
  },
};

module.exports = TipoEquipo;
