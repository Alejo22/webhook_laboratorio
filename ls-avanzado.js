const fs = require('node:fs/promises');
const path = require('node:path');

const folder = process.argv[2] ?? '.';

async function listfiles( folder ){

    try {
        const files = await fs.readdir(folder);

        const filePromises = files.map( async (file) => {
            const filePath = path.join(folder, file);
             try {
                let stats = await fs.stat(filePath );

                const isDirectory = stats.isDirectory();
                const fileType = isDirectory ? 'd' : 'f';
                const fileSize = stats.size;
                const lasModoficacion = stats.mtime.toLocaleString().padStart(20);


                return  `${fileType} ${file.padEnd(20, ' ')} ${fileSize.toString().padEnd(10, "?")} ${lasModoficacion.padStart(25, '*')} `

            } catch (error) {
                console.log( `Se ha presentado un error leyendo el archivo ${filePath}`);
                process.exit(1);
            }
        })

        Promise.all(filePromises).then( value => {
            value.map( (file) => console.log( file) );
        }, error => {
            console.log( 'Tengo un error muy raro');
        })
    } catch (error) {
        console.log( `Se ha presentado un error leyendo el path ${path}`);
        process.exit(1);
    }
}

listfiles(folder);