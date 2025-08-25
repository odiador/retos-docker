const fetch = require('node-fetch');
const fs = require('fs');

const LOGIN_URL = 'http://localhost/login'; // Cambia la URL y credenciales según tu API
const loginData = {
  username: 'usuario'
};

async function getTokenAndSave() {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    });
    const result = await response.json();
    const token = result.token;
    if (token) {
      fs.writeFileSync('jwt.token', token);
      console.log('Token guardado en jwt.token:', token);
    } else {
      console.error('No se recibió token:', result);
    }
  } catch (err) {
    console.error('Error al obtener el token:', err);
  }
}

getTokenAndSave();