const Equipo = require("../models/equipo");
const Fabricante = require("../models/fabricante");
const TipoEquipo = require("../models/tipoEquipo");

exports.equipo_lista = async (req, res) => {
  try {
    const equipos = await Equipo.getAll();
    res.render("equipos/lista", { equipos });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener la lista de equipos");
  }
};

exports.equipo_crear_get = async (req, res) => {
  try {
    const fabricantes = await Fabricante.getAll();
    const tipos = await TipoEquipo.getAll();

    // Proporciona valores por defecto para todas las variables que la vista pueda necesitar
    res.render("equipos/crear", {
      fabricantes,
      tipos,
      error: null, // Asegura que error siempre esté definido
      formData: {
        // Proporciona un objeto vacío para formData
        modelo: "",
        numero_serie: "",
        fabricante_id: "",
        tipo_id: "",
        ubicacion: "",
        fecha_instalacion: "",
        estado: "Activo",
        capacidad: "",
        detalles: "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar el formulario");
  }
};

exports.equipo_crear_post = async (req, res) => {
  try {
    if (!req.body.numero_serie) {
      throw new Error("El número de serie es requerido");
    }

    const equipoData = {
      modelo: req.body.modelo,
      fabricante_id: req.body.fabricante_id,
      tipo_id: req.body.tipo_id,
      numero_serie: req.body.numero_serie,
      ubicacion: req.body.ubicacion || null,
      fecha_instalacion: req.body.fecha_instalacion || null,
      estado: req.body.estado || "Activo",
      capacidad: req.body.capacidad ? parseInt(req.body.capacidad) : null,
      detalles: req.body.detalles || null,
    };

    await Equipo.create(equipoData);
    res.redirect("/equipos");
  } catch (error) {
    console.error(error);

    // Recargar los datos necesarios para el formulario
    const fabricantes = await Fabricante.getAll();
    const tipos = await TipoEquipo.getAll();

    // Pasar todos los datos necesarios a la vista
    res.render("equipos/crear", {
      fabricantes,
      tipos,
      error: error.message,
      formData: req.body, // Pasar los datos del formulario para repoblar
    });
  }
};

exports.equipo_eliminar_post = async (req, res) => {
  try {
    const deleted = await Equipo.delete(req.params.id);
    if (!deleted) {
      return res.status(404).send("Equipo no encontrado");
    }
    res.redirect("/equipos");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al eliminar el equipo");
  }
};
