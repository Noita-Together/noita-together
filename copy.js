//why we have to create this is beyond me smh
const fs = require("fs")


if (process.argv.length !== 4) {
    console.error('Expected 2 arguments');
    process.exit(1);
}

console.log(`Copying ${process.argv[2]} to ${process.argv[3]}`)
fs.copyFileSync(process.argv[2], process.argv[3])