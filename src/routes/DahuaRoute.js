const express = require("express");
const path = require("path");
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
//Inicializa la ruta
const DahuaRoute = express.Router();

//const apiUrl = "http://192.168.1.10:443";
const apiUrl = "http://localhost:3000";

//First Login
DahuaRoute.post('/login/first', async (req, res) => {
  try {
    const { userName } = req.body;
    // Aquí se usa la configuración para el primer login
    const firstLoginResponse = await axios.post(`${apiUrl}/brms/api/v1.0/accounts/authorize`, {
      userName: userName,
      ipAddress: "",
      clientType: "WINPC_V2"
    });

    // Si la respuesta es 401 (como en la colección Postman)
    if (firstLoginResponse.status === 401) {
      const realm = firstLoginResponse.data.realm;
      const randomKey = firstLoginResponse.data.randomKey;
      // Realiza el segundo login
      const signature = generateSignature(req.body.userName, req.body.password, realm, randomKey);
      const secondLoginResponse = await axios.post(`http://${process.env.DAHUA_HOST}/brms/api/v1.0/accounts/authorize`, {
        mac: req.body.mac,
        signature: signature,
        userName: req.body.userName,
        randomKey: randomKey,
        publicKey: process.env.PUBLIC_KEY, // Generada previamente
        encryptType: "MD5",
        clientType: "WINPC_V2"
      });
      res.json(secondLoginResponse.data);
    }
    console.log("firstLoginResponse", firstLoginResponse);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la autenticación');
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

//Test GET
DahuaRoute.get("/dahua/test", async (req, res) => {
  res.status(200).send("Hola Dahua!");
});

//Test POST
DahuaRoute.post("/dahua/test", async (req, res) => {
  const { userName } = req.body;
  res.status(200).send("Hola " + userName + "!");
});


module.exports = DahuaRoute;