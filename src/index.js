import express from 'express';
import cors from 'cors';
import { loadBackendApiUsers } from './api/api-Users.js'; 
import { loadTransactionApi } from './api/api-Transactions.js';
import Redis from 'ioredis';

const app=express()
const PORT= process.env.PORT ||3000;

//const redisClient=new Redis();


app.use(cors()); 
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf; // Buffer con los bytes originales
  }
}));


loadTransactionApi(app);

loadBackendApiUsers(app);

app.listen(PORT, () => {
    console.log(`Backend Now Running on the port ${PORT}`);
});