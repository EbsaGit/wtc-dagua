const express = require("express");
const axios = require('axios');
require('dotenv').config();
//Inicializa la ruta
const DahuaRoute = express.Router();

const domain = "http://192.168.1.10";

//Get Groups
DahuaRoute.post('/Person/Groups', async (req, res) => {
  try {
    const { userName, password, mac } = req.body;
    const generateToken = await getToken(userName, password, mac);
    //Valida que exista el token
    if (generateToken != "") {
      console.log("token: ", generateToken);
      //Llamada a la API con Axios
      const response = await axios.get(`${domain}:80/obms/api/v1.1/acs/person-group/list`, {
        headers: {
          'X-Subject-Token': generateToken
        }
      });
      //Envia la respuesta de la API al frontend
      res.status(200).json(response.data);
    }
    else {
      res.status(500).json({ error: 'Error al obtener token' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la autenticación');
  }
});

//Get Person Details
DahuaRoute.post('/Person/:personId', async (req, res) => {
  try {
    const { personId } = req.params;
    const { userName, password, mac } = req.body;
    const generateToken = await getToken(userName, password, mac);
    //Valida que exista el token
    if (generateToken != "") {
      //Llamada a la API con Axios
      const response = await axios.get(`${domain}:80/obms/api/v1.1/acs/person/${personId}`, {
        headers: {
          'X-Subject-Token': generateToken
        }
      });
      //Envia la respuesta de la API al frontend
      res.status(200).json(response.data);
    }
    else {
      res.status(500).json({ error: 'Error al obtener token' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la autenticación');
  }
});

//Add Person
DahuaRoute.post('/Person/Add', async (req, res) => {
  try {
    const { userName, password, mac, userData } = req.body;
    const generateToken = await getToken(userName, password, mac);
    //Valida que exista el token
    if (generateToken != "") {
      //Obtiene el listado de todos los Groups para filtrar por Nombre de Empresa
      const orgCode = await getOrgCode(userData.orgName, userData.torre, userData.piso, generateToken);
      //Si retorna un orgCode sigue
      if (orgCode != "") {
        //Map new Person
        const newPersonData = {
          "baseInfo": {
            "personId": "00009988",
            "lastName": userData.lastName,
            "firstName": userData.firstName,
            "gender": userData.gender,
            "orgCode": orgCode,
            "orgCodes": [orgCode],
            "email": userData.email,
            "tel": userData.tel,
            "sourceType": userData.sourceType,
            "associateId": userData.idCRM
          },
          "extensionInfo": {
            "nickName": "",
            "address": "",
            "idType": "4",//ID type, 0 = ID card, 1 = Officer ID card, 2 = Student ID card, 3 = Driver's license, 4 = Passport, 5 = Tax ID, 6 = Others; 6 by default
            "idNo": "123456",
            "nationalityId": "9999",
            "birthday": "",
            "companyName": "CONSORCIO WTC ASUNCION",
            "position": "",
            "department": ""
          },
          "residentInfo": {
            "houseHolder": "0",//Video intercom householder or not, 0 = No, 1 = Yes; 0 by default
            "sipId": "",
            "vdpUser": "0",
            "isVdpUser": "0"
          },
          "authenticationInfo": {
            "startTime": "1727064000",//Start time of the validity period, timestamp, in seconds
            "endTime": "2042683199",//End time of the validity period, timestamp, in seconds
            "expired": "1",
            "haveCombinationPassword": "0",
            "combinationPassword": null,
            "cards": [],
            "fingerprints": []
          },
          "accessInfo": {
            "accessType": "0",//Access control person type, 0 = Normal, 1 = Blocklist, 2 = Visitor, 3= Patrol, 4 = VIP, 5 = Others; 0 by default
            "guestUseTimes": "200",
            "passageRules": null
          },
          "faceComparisonInfo": {
            "enableFaceComparisonGroup": "0",
            "faceComparisonGroupId": null,
            "faceComparisonGroupName": null
          },
          "entranceInfo": {
            "enableParkingSpace": "0",
            "parkingSpaceNum": "0",
            "enableEntranceGroup": "0",
            "vehicles": []
          }
        };
        //Crea el registro en Person
        const response = await axios.post(`${domain}:80/obms/api/v1.1/acs/person`, newPersonData, {
          headers: {
            'X-Subject-Token': generateToken
          }
        });
        //Envia la respuesta de la API al frontend
        res.status(200).json(response.data); 
      }
      else
      {
        res.status(500).json({ error: 'No se encontró orgCode' }); 
      }
    }
    else {
      res.status(500).json({ error: 'Error al obtener token' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la autenticación');
  }
});

//Add Person - Test
DahuaRoute.post('/Person/Add/Test', async (req, res) => {
  try {
    const { userName, password, mac, userData } = req.body;
    console.log("userData.orgName:", userData.orgName);
    res.status(200).json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en la autenticación');
  }
});

//Funcion que obtiene el token temporal a través del 1er login y el 2do
async function getToken(userName, password, mac) {
  let token;
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
      console.log("error: ", error);
      if (error.response && error.response.status === 401) {
        firstLoginResponse = error.response;
      } else {
        token = "";
      }
    }

    // Ahora que tenemos el 401, procesamos los datos necesarios para el segundo login
    if (firstLoginResponse.status === 401) {
      console.log("Iniciando segundo login...");
      const realm = firstLoginResponse.data.realm;
      const randomKey = firstLoginResponse.data.randomKey;
      const publicKey = firstLoginResponse.data.publicKey;

      //Realiza el segundo login
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
      token = secondLoginResponse.data.token;
      return token;
    } else {
      token = "";
      return token;
    }
  } catch (error) {
    console.error('Error al conectar con la API de Dahua:', error);
    token = "";
    return token;
  }
}

//Función que busca el orgCode
async function getOrgCode(empresa, torre, piso, token) {
  let orgCode = "";
  let torreCode;
  let pisoCode;

  try {
    //Llamada a la API con Axios
    const response = await axios.get(`${domain}:80/obms/api/v1.1/acs/person-group/list`, {
      headers: {
        'X-Subject-Token': token
      }
    });

    //Si la API retorna código 1000 (éxito)
    if (response.data.code === 1000) {
      const allGroups = response.data.data.results;

      //Encontrar el torreCode donde orgName coincide con torre
      const torreMatch = allGroups.find(group => group.orgName === torre);
      if (torreMatch) {
        torreCode = torreMatch.orgCode;
      } else {
        console.log(`No se encontró la torre: ${torre}`);
        return "";
      }

      //Encontrar el pisoCode donde parentOrgCode coincide con torreCode y orgName coincide con piso
      const pisoMatch = allGroups.find(group => group.parentOrgCode === torreCode && group.orgName === piso);
      if (pisoMatch) {
        pisoCode = pisoMatch.orgCode;
      } else {
        console.log(`No se encontró el piso: ${piso}`);
        return "";
      }

      //Encontrar el orgCode donde parentOrgCode coincide con pisoCode y orgName coincide con empresa
      const empresaMatch = allGroups.find(group => group.parentOrgCode === pisoCode && group.orgName === empresa);
      if (empresaMatch) {
        orgCode = empresaMatch.orgCode;
      } else {
        console.log(`No se encontró la empresa: ${empresa}`);
        orgCode = "";
      }

      return orgCode;
    } else {
      console.log(`Error en la respuesta de la API: ${response.data.code}`);
      return "";
    }
  } catch (error) {
    console.error('Error al conectar con la API de Dahua:', error);
    return "";
  }
}

//Función para generar el signature en el segundo login
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