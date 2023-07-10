const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

function run(){
    // Load environment variables from .env file
    dotenv.config();

// Check if secrets already exist in the .env file
    if (process.env.SECRET_JWT_ACCESS || process.env.SECRET_JWT_REFRESH) {
        console.error('Error: Secrets already exist in the .env file.');
        return;
    }

// Generate random secrets
    const secretAccess = crypto.randomBytes(32).toString('hex');
    const secretRefresh = crypto.randomBytes(32).toString('hex');

// Update the .env file
    fs.appendFileSync(path.join(__dirname, '.env'), `SECRET_JWT_ACCESS=${secretAccess}\n`);
    fs.appendFileSync(path.join(__dirname, '.env'), `SECRET_JWT_REFRESH=${secretRefresh}\n`);

    console.log('JWT secrets generated and saved to the .env file.');
}

run()
