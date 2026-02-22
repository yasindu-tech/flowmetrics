const express = require('express');
const app = express();

// Azure App Service looks for the PORT environment variable (usually 80 or 8080)
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('Hello from Docker, GitHub Actions, and Azure!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
