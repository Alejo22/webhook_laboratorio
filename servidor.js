const http = require('node:http')
const { findAvaliablePort } = require('./findPort.js')

const server = http.createServer( (req, resp) => {
    console.log('Request recibed');
    resp.end('Hola mundo');
})

findAvaliablePort(3000).then( port => {
    server.listen(  port , () => {
        console.log( `Server lister on port ${server.address().port}` )
    })
})

