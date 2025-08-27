import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 5000;

const AUTH_URL = process.env.AUTH_URL || "http://localhost:90/auth/login";
const SALUDO_URL = process.env.SALUDO_URL || "http://localhost/saludo";

app.use(express.urlencoded({ extended: true }));

// Página con formulario
app.get("/", (req, res) => {
  res.send(`
    <h1>Cliente de Saludo</h1>
    <form method="POST" action="/saludar">
      <label>Nombre:</label>
      <input type="text" name="nombre" required />
      <button type="submit">Enviar</button>
    </form>
  `);
});

// Ruta que procesa el nombre
app.post("/saludar", async (req, res) => {
  const nombre = req.body.nombre;

  try {
    // 1. Pedir token
    const loginResponse = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: nombre })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(`Error autenticando: ${loginResponse.statusText}`);
    }

    const { access_token } = loginData;

    // 2. Invocar saludo
    const saludoResponse = await fetch(`${SALUDO_URL}?nombre=${nombre}`, {
      headers: { "Authorization": `JWT ${access_token}` }
    });

    const saludo = await saludoResponse.json();

    console.log(saludo);

    // 3. Mostrar en la web
    res.send(`
      <h1>Respuesta del servidor</h1>
      <pre>${JSON.stringify(saludo, null, 2)}</pre>
      <a href="/">Volver</a>
    `);

  } catch (err) {
    res.send(`<p>Error en el cliente: ${err.message}</p><a href="/">Volver</a>`);
  }
});

app.listen(PORT, () => {
  console.log(`Cliente web corriendo en http://localhost:${PORT}`);
});
