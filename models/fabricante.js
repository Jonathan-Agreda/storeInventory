const pool = require("./db");

const Fabricante = {
  async getAll() {
    const { rows } = await pool.query(
      "SELECT * FROM fabricantes ORDER BY nombre"
    );
    return rows;
  },

  async create(nombre, descripcion) {
    const { rows } = await pool.query(
      "INSERT INTO fabricantes(nombre, descripcion) VALUES($1, $2) RETURNING *",
      [nombre, descripcion]
    );
    return rows[0];
  },

  // Más métodos según necesites
};

module.exports = Fabricante;
