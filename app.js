const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const axios = require('axios');

//inicializacion
const app = express();
const domain = "http://192.168.1.10";
const port = process.env.PORT || 3000;

//importacion de rutas
const DahuaRoute = require("./src/routes/DahuaRoute");

//configuraciones
app.use(bodyParser.json()); //Middleware para parsear JSON
app.use(cors());

// Middleware para permitir CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.json()); // Parsear JSON

//uso de rutas
app.use("/api", DahuaRoute);
app.get("/", (req, res) => {
  res.status(200).send({ mensaje: "Hello WTC" })
});

//Ruta para autenticarse en la API de Dahua
app.post('/dahua/login/first', async (req, res) => {
  const { userName, password, mac,  } = req.body;

  try {
    // Aquí se usa la configuración para el primer login
    const firstLoginResponse = await axios.post(`${domain}:443/brms/api/v1.0/accounts/authorize`, {
      userName: userName,
      ipAddress: "",
      clientType: "WINPC_V2"
    });

    console.log("firstLoginResponse: ", firstLoginResponse);
    // Si la respuesta es 401 (como en la colección Postman)
    if (firstLoginResponse.status === 401) {
      const realm = firstLoginResponse.data.realm;
      const randomKey = firstLoginResponse.data.randomKey;
      // Realiza el segundo login
      const signature = generateSignature(userName, password, realm, randomKey);
      const secondLoginResponse = await axios.post(`${domain}:443/brms/api/v1.0/accounts/authorize`, {
        mac: mac,
        signature: signature,
        userName: userName,
        randomKey: randomKey,
        publicKey: process.env.PUBLIC_KEY,
        encryptType: "MD5",
        clientType: "WINPC_V2"
      });
      res.json(secondLoginResponse.data);
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

//inicializar server
app.listen(port, () => {
  console.log(`Servidor Corriendo en ${domain}:${port}`)
})
