const fs = require('fs');
const crypto = require('crypto');

// Generate a random secret
const secret = crypto.randomBytes(32).toString('hex');

// Write the secret to a file
fs.writeFile('jwt-secret.txt', secret, (err) => {
    if (err) {
        console.error('Error writing JWT secret:', err);
        return;
    }
    console.log('JWT secret generated and saved to jwt-secret.txt');
});
