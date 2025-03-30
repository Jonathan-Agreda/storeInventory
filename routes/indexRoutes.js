const express = require("express");
const indexRouter = express.Router();
const indexController = require("../controllers/indexController");

// Ruta principal
indexRouter.get("/", indexController.index);

module.exports = indexRouter;
