const config = require('./config.js');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const client = require('twilio')(config.ACCOUNT_SID, config.AUTH_TOKEN);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let conversations = {};

const sendWhatsapp = (body, to) => {
    client.messages.create({
        from: 'whatsapp:+14155238886',
        body,
        to}).then( messages => console.log('Mensaje enviado correctamente, message_id: ', messages.sid))
            .catch( err => console.log('Se ha presentado un error no esperado: ', err));
}

const validateIDECAService = (dir) => {

    return new Promise( async (resolve, reject ) => {

        const agent = new (require('https').Agent)({  
            rejectUnauthorized: false
        });
    
        const headers = {
            'Content-Type': 'application/json',
        };

        try {
            const { data } = await axios.post('https://api.bogota.gov.co:8246/gaboideca/format',  JSON.stringify( { dir }) ,{ headers,  httpsAgent: agent });
            const { response } = data;

            if( response.success ){
                resolve( response.data )
            }else{
                reject("No se ha podido validar la dirección")
            }
        } catch (error) {
            reject(error);
        }
    })
}

const validateAcuaTurno = (address) => {
    return new Promise( async (resolve, reject ) => {

        const agent = new (require('https').Agent)({  
            rejectUnauthorized: false
        });
    
        const headers = {
            'Content-Type': 'application/json',
        };

        try {
            const { data } = await axios.get( `https://services1.arcgis.com/J5ltM0ovtzXUbp7B/arcgis/rest/services/EsquemaRestriccion/FeatureServer/0/query?where=1%3D1&geometry=%7B%22x%22:${address.xinput},%22y%22:${address.yinput},%22spatialReference%22:%7B%22wkid%22:4326%7D%7D&geometryType=esriGeometryPoint&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&returnIdsOnly=false&returnCountOnly=false&featureEncoding=esriDefault&returnField=false&f=json`, { headers,  httpsAgent: agent });
            resolve(data.features[0].attributes);
        } catch (error) {
            reject(error);
        }
    })
}

const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() returns month from 0 to 11
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

app.post('/webhook', async (req, res) => {

    const message = req.body.Body;
    const phoneNumber = req.body.From;

    if (!conversations[phoneNumber]) {
        conversations[phoneNumber] = { step: 0 };
    }

    let responseMessage;
    
    switch (conversations[phoneNumber].step) {
        case 0:
            responseMessage = 'Hola! ¿En qué puedo ayudarte hoy?\n\n1. Consultar tu acuaturno A\n2. Radicar petición';
            conversations[phoneNumber].step = 1;
            break;
        case 1:
            if (message === '1') {
                responseMessage = 'Por favor ingresa tu dirección:';
                conversations[phoneNumber].step = 2;
                conversations[phoneNumber].service = 1;
                conversations[phoneNumber].serviceStep = 1;
            } else if (message === '2') {
                responseMessage = 'Por favor ingrese su número de identificación';
                conversations[phoneNumber].step = 2;
                conversations[phoneNumber].service = 2;
                conversations[phoneNumber].serviceStep = 1;
            } else if (message === '3') {
                responseMessage = 'Gracias por usar nuestros servicios';
                conversations[phoneNumber].step = 0;
            }else {
                responseMessage = 'Por favor, elige una opción válida: \n\n1. Consultar tu acuaturno \n2. Radicar petición \n3. Volver al menú principal';
            }
            break;
        case 2:
            if (conversations[phoneNumber].service == 1) {

                console.log("Valor dentro del servicio: ", conversations[phoneNumber].serviceStep );

                if( conversations[phoneNumber].serviceStep === 1){
                    try{
                        const data = await validateIDECAService(message);
                        responseMessage = `Tu direcciòn aprox es ${ data. diraprox} en el barrio: ${ data.nomseccat} de la localidad: ${data.localidad}   \n\n1. Si \n2. No`;
                        conversations[phoneNumber].data = data;
                        conversations[phoneNumber].serviceStep = 2;
                    }catch( err){
                        console.error('Se ha presentado un error ', err);
                        responseMessage = 'Lo sentimos no hemos podido validar la dirección, por favor valide el formato he intenta nuevamente.'
                    }
                }else if(conversations[phoneNumber].serviceStep === 2){
                    if( message === '1'){
                        const data = await validateAcuaTurno(conversations[phoneNumber].data);
                        responseMessage = `Estás en el ${data.TURNO}, este turno comienza el ${ formatDate(data.FECHA_INI) } y termina el ${ formatDate(data.FECHA_FIN) }, este turno cubre a las localidades de ${data.LOCALIDADE}. \n\nSector en turno: ${data.SECTOR}.   \n\nMuchas gracias por usar nuestros servicios.`;
                        conversations[phoneNumber].step = 0;
                    }else if(message  === '2'){
                        responseMessage = 'Por favor ingresa tu dirección nuevamente:';
                        conversations[phoneNumber].step = 2;
                        conversations[phoneNumber].service = 1;
                        conversations[phoneNumber].serviceStep = 1;
                    }
                }
            }else{
                responseMessage = 'Lo sentimos, el servicio no se encuentra habilitado por el día de hoy';
                conversations[phoneNumber].step = 0; // Resetear el estado
                delete conversations[phoneNumber].service;
            }
            break;
        default:
            responseMessage = 'Lo siento, no entendí eso.';
            conversations[phoneNumber].step = 0;
            break;
    }

    try{
        sendWhatsapp(messageResponse, phoneNumber);
    }catch(err){
        console.error(`No se ha podido enviar el mensaje de Whatsapp para ${phoneNumber}`)
        res.sendStatus(500);
    }

    res.send(responseMessage);    
})

app.listen(3000, () => {
    console.log("Server is running");
})