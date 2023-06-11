const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach( f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function hash(data) {
    return crypto.createHash('sha256').update(data).digest().toString('hex').toUpperCase();
}

function buildManifests(){
    const currDir = path.join(__dirname, 'noita_mod')
    let paths = fs.readdirSync(currDir)
    console.log(paths)
    for (const modPath of paths) {
        buildManifest(path.join(currDir, modPath))
    }
}

function buildManifest(workingDirectory){
    const ignoreFiles = [
        'manifest.json',
        '.gitignore'
    ]

    const fileHashes = {
        files: {},
        buildDate: new Date().toISOString()
    }
    walkDir(workingDirectory, function(filePath) {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const relPath = filePath.slice(workingDirectory.length+1).replaceAll('\\', '/')
        if(ignoreFiles.includes(relPath)) return

        fileHashes.files[relPath] = hash(fileContents).toLowerCase()
    });
    console.log(fileHashes)
    fs.writeFileSync(path.join(workingDirectory, 'manifest.json'), JSON.stringify(fileHashes, undefined, 2), 'utf8')
}

buildManifests()
