const fs = require('node:fs/promises');
const path = require('node:path');


const folder = process.argv[2] ?? '.';
/* 
fs.readdir( folder, (error, files) => {

    if( error ){
        console.log("No se puede leer el directorio");
        return;
    }

    files.forEach( (file) => {
        console.log(file);
    })
}); */

fs.readdir(folder)
    .then( (files) => {
        files.forEach( (file) => {
            const filePath = path.join(folder, file);

            console.log(filePath);

            fs.stat(filePath ).then( value => {
                console.log( value.isDirectory() )
            })
        })
    })
    .catch( error => console.log( 'No se ha podido leer el directorio', error) )