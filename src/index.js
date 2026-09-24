

import { loadTransactionApi } from './api/api-Transactions.js';
import express from "express";
const app=express()
const PORT=3000;

loadTransactionApi(app);

app.listen(PORT, ()=>{
    console.log("Backend Now Running");
});
