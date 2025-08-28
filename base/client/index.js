import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = 5000;

const AUTH_URL = process.env.AUTH_URL || "http://localhost:90/auth/login";
const SALUDO_URL = process.env.SALUDO_URL || "http://localhost/saludo";
const TOKEN_EXP = process.env.TOKEN_EXP || '1h'

// Simple in-memory session cache: { username, token, expiresAt }
let session = { username: null, token: null, expiresAt: 0 }

function parseExpiryToMs(exp) {
  // support formats like '30s','10m','1h','1d' or plain number (seconds)
  if (!exp) return 0
  if (typeof exp === 'number') return exp * 1000
  const m = String(exp).match(/^(\d+)(s|m|h|d)?$/)
  if (!m) return 0
  const val = parseInt(m[1], 10)
  const unit = m[2] || 's'
  switch (unit) {
    case 's': return val * 1000
    case 'm': return val * 60 * 1000
    case 'h': return val * 60 * 60 * 1000
    case 'd': return val * 24 * 60 * 60 * 1000
    default: return val * 1000
  }
}

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
    // 1. Reusar token si ya hay una sesión válida para este nombre
    const now = Date.now()
    let access_token = null
    if (session.token && session.username === nombre && now < session.expiresAt - 5000) {
      // buffer 5s
      access_token = session.token
    } else {
      // requesting new token
      const loginResponse = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: nombre })
      });

      // Validate response before parsing JSON
      if (!loginResponse.ok) {
        const errBody = await loginResponse.text().catch(() => '')
        if (loginResponse.status === 400) {
          console.warn(`[client] Auth bad request: ${loginResponse.status} ${loginResponse.statusText} ${errBody}`)
          throw new Error(`BadRequest autenticando: ${errBody || loginResponse.statusText}`)
        }

        // Non-400: log short message and fail (no retry)
        console.warn(`[client] Auth request failed: ${loginResponse.status} ${loginResponse.statusText}`)
        throw new Error(`Error autenticando: ${loginResponse.status} ${loginResponse.statusText}`)
      }

      const loginData = await loginResponse.json();
      access_token = loginData && loginData.access_token
      if (!access_token) {
        throw new Error('Auth no devolvió access_token')
      }
      access_token = loginData && loginData.access_token
      if (!access_token) {
        throw new Error('Auth no devolvió access_token')
      }

  // Guardar sesión en memoria con fecha de expiración estimada
  const ttlMs = parseExpiryToMs(TOKEN_EXP) || (60 * 60 * 1000) // fallback 1h
  session = { username: nombre, token: access_token, expiresAt: Date.now() + ttlMs }
    }

    // 2. Invocar saludo
    const saludoResponse = await fetch(`${SALUDO_URL}?nombre=${nombre}`, {
      headers: { "Authorization": `JWT ${access_token}` }
    });

    if (!saludoResponse.ok) {
      const errBody = await saludoResponse.text().catch(() => '')
      throw new Error(`Saludo error: ${saludoResponse.status} ${saludoResponse.statusText} ${errBody}`)
    }

  const saludo = await saludoResponse.json();

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
