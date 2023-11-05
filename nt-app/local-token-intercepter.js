const express = require('express');
const app = express();
const port = 25669; // Specify the port you want to listen on

app.get('/', (req, res) => {
    // Construct the custom app scheme URL with the provided token
    const token = req.query.token || 'null'; // You can replace 'default_token_value' with your token logic
    const refresh = req.query.refresh || 'null'; // You can replace 'default_token_value' with your token logic
    const e = req.query.e || 0; // You can replace 'default_token_value' with your token logic
    const appSchemeURL = `noitatogether://oauth/token/success?token=${token}&refresh=${refresh}&e=${e}`;

    // Redirect to the custom app scheme URL
    res.redirect(appSchemeURL);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
