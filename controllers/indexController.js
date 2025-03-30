const Equipo = require("../models/equipo");

exports.index = async (req, res) => {
  try {
    // Podemos obtener algunos datos para mostrar en el dashboard
    const equipos = await Equipo.getAll();
    const totalEquipos = equipos.length;
    const equiposActivos = equipos.filter((e) => e.estado === "Activo").length;

    res.render("index", {
      title: "Dashboard de Inventario",
      totalEquipos,
      equiposActivos,
      ultimosEquipos: equipos.slice(0, 5), // Mostrar los 5 últimos equipos
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar la página de inicio");
  }
};
