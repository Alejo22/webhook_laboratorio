const sendSMS = () => {
    client.messages.create({
        body: 'Hola Alejo soy Twilio desde locahost en un segundo mensaje',
        from: '+12675505257',
        to: '+573138388062'
    }).then( messages => console.log('Mensaje enviado correctamente, message_id: ', messages.sid))
    .catch( err => console.log('Se ha presentado un error no esperado: ', err));
}