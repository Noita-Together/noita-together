const fse = require('fs-extra');
const path = require('path');
const fs = require("fs");

const arg1 = process.argv[2];
const arg2 = process.argv[3].replaceAll('"', '');

console.log(`Copy files from ${arg1} to ${arg2}`)

if(!fse.existsSync(arg2)){
    fs.mkdirSync(arg2)
}

fse.copySync(
    path.join(__dirname, '../../', arg1),
    arg2,
    {
        recursive: true,
        errorOnExist: false,
        overwrite: true
    }
);
