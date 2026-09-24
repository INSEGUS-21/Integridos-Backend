import express from 'express';
import { loadBackendApiUsers } from './api/api-Users.js'; 

const app = express();
const PORT = 3000;

app.use(express.json());
loadBackendApiUsers(app);

app.listen(PORT, () => {
    console.log("Backend Now Running");
});