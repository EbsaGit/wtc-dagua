const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');

// Inicialización
const app = express();
const localIP = getLocalIPAddress();
const domain = `https://${localIP}`;
//const domain = "https://192.168.100.26";
const port = process.env.PORT || 3000;

// Cargar los archivos de la clave privada y el certificado
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', 'server.cert'))
};

// Importación de rutas
const DahuaRoute = require("./src/routes/DahuaRoute");

// Configuraciones
app.use(bodyParser.json()); // Middleware para parsear JSON
app.use(cors());

// Middleware para permitir CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json()); // Parsear JSON

// Uso de rutas
app.use("/api", DahuaRoute);
app.get("/", (req, res) => {
  res.status(200).send({ mensaje: "Hello WTC" })
});

// Ruta para autenticarse en la API de Dahua
app.post('/dahua/login', async (req, res) => {
  console.log("Iniciando primer login...");
  const { userName, password, mac } = req.body;

  try {
    let firstLoginResponse;
    try {
      // Intentamos hacer el primer login
      firstLoginResponse = await axios.post(`${domain}:80/brms/api/v1.0/accounts/authorize`, {
        userName: userName,
        ipAddress: "",
        clientType: "WINPC_V2"
      });
    } catch (error) {
      // Aquí verificamos si el error es un 401
      if (error.response && error.response.status === 401) {
        firstLoginResponse = error.response;
      } else {
        // Si no es 401, enviamos el error
        return res.status(500).json({ error: 'Error en el primer login: ' + error.message });
      }
    }

    // Ahora que tenemos el 401, procesamos los datos necesarios para el segundo login
    if (firstLoginResponse.status === 401) {
      console.log("Iniciando segundo login...");
      const realm = firstLoginResponse.data.realm;
      const randomKey = firstLoginResponse.data.randomKey;
      const publicKey = firstLoginResponse.data.publicKey;

      // Realiza el segundo login
      const signature = generateSignature(userName, password, realm, randomKey);

      const secondLoginResponse = await axios.post(`${domain}:80/brms/api/v1.0/accounts/authorize`, {
        mac: mac,
        signature: signature,
        userName: userName,
        randomKey: randomKey,
        publicKey: publicKey,
        encryptType: "MD5",
        ipAddress: "",
        clientType: "WINPC_V2",
        userType: 0
      });
      
      // Respuesta del segundo login
      res.status(200).json(secondLoginResponse.data);
    } else {
      console.log("Error. Respuesta desconocida: Status ", firstLoginResponse.status);
      res.status(firstLoginResponse.status).json({ error: "Respuesta inesperada durante el primer login." });
    }
  } catch (error) {
    console.error('Error al conectar con la API de Dahua:', error);
    res.status(500).json({ error: 'Error al conectar con la API de Dahua' });
  }
});

// Función para generar el signature en el segundo login
function generateSignature(username, password, realm, randomKey) {
  const md5 = require('crypto-js/md5');
  const temp1 = md5(password).toString();
  const temp2 = md5(username + temp1).toString();
  const temp3 = md5(temp2).toString();
  const temp4 = md5(username + ":" + realm + ":" + temp3).toString();
  const signature = md5(temp4 + ":" + randomKey).toString();
  return signature;
}

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (let interfaceName in interfaces) {
    for (let i = 0; i < interfaces[interfaceName].length; i++) {
      const iface = interfaces[interfaceName][i];
      
      // Filtrar solo las direcciones IPv4 y evitar direcciones internas (como localhost)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Retorna localhost por defecto si no encuentra una IP externa
}

// Inicializar servidor HTTPS
const server = https.createServer(sslOptions, app);

server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor HTTPS corriendo en ${domain}:${port}`);
});
