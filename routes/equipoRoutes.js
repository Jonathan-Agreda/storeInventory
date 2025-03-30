const express = require("express");
const equipoRouter = express.Router();
const equipoController = require("../controllers/equipoController");

equipoRouter.get("/", equipoController.equipo_lista);
equipoRouter.get("/crear", equipoController.equipo_crear_get);
equipoRouter.post("/crear", equipoController.equipo_crear_post);
equipoRouter.post("/:id/eliminar", equipoController.equipo_eliminar_post);

module.exports = equipoRouter;
