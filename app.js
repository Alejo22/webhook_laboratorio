const config = require('./config.js');
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const client = require('twilio')(config.ACCOUNT_SID, config.AUTH_TOKEN);

const app = express();
app.use(bodyParser.json());

const sendWhatsapp = (message, phoneNumber) => {
    client.messages.create({
        from: 'whatsapp:+14155238886',
        body: message,
        to: `whatsapp:${phoneNumber}`
    }).then( messages => console.log('Mensaje enviado correctamente, message_id: ', messages.sid))
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
            const response = await axios.post('https://api.bogota.gov.co:8246/gaboideca/format',  JSON.stringify( { dir }) ,{ headers,  httpsAgent: agent });
            resolve(response.data.response.data);
        } catch (error) {
            reject(error);
        }
    })
}

app.post('/webhook', async (req, res) => {

    try{
        const message = req.body.Body;
        const phoneNumber = req.body.From;
    
        const data = await validateIDECAService(message);
        const messageResponse = `Tu direcciòn aprox es ${ data. diraprox} en el barrio: ${ data.nomseccat} de la localidad: ${data.localidad} ` ;
        sendWhatsapp(messageResponse, phoneNumber);
    
        res.sendStatus(200)
    }catch( err){
        console.log('Se ha presentado un error ', err);
        res.sendStatus(500);
    }
})

app.listen(3000, () => {
    console.log("Server is running");
})