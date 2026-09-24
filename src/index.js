import express from 'express';
import cors from 'cors';
import { loadBackendApiUsers } from './api/api-Users.js'; 
import { loadTransactionApi } from './api/api-Transactions.js';


const express=require('express');

const app=express()
const PORT = process.env.PORT || 3000;

app.use(cors()); 
app.use(express.json());


loadTransactionApi(app);

loadBackendApiUsers(app);

app.listen(PORT, () => {
    console.log(`Backend Now Running on port ${PORT}`);
});