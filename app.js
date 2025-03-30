const express = require("express");
const path = require("path");

const app = express();

// Configuración para archivos estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuración de vistas
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs"); // Usaremos EJS para las vistas

// Rutas
const equipoRoutes = require("./routes/equipoRoutes");
const indexRoutes = require("./routes/indexRoutes");

app.use("/", indexRoutes);
app.use("/equipos", equipoRoutes);

module.exports = app;
