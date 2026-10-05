import dns from 'dns';
dns.setServers(['1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
import express from 'express';
import cors from 'cors';
import { loadBackendApiUsers } from './api/api-Users.js'; 
import { loadTransactionApi } from './api/api-Transactions.js';
import mongoose from 'mongoose';


const app=express()
const PORT=process.env.PORT || 3000;

//const redisClient=new Redis();


app.use(cors()); 
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');; // Buffer con los bytes originales
  }
}));

const MONGO_URL= process.env.MONGO_URL || "mongodb+srv://danieldlrf2_db_user:XbeoINbtCRtaS35S@ssii.abhixzn.mongodb.net/?appName=SSII";

const conn = mongoose.createConnection(MONGO_URL);

conn.on('connected', () => console.log('Conectado a MongoDB'));
conn.on('error', (err) => console.error('Error conectando a MongoDB:', err));

const Transaction_scheme=new mongoose.Schema(
    {
        origin_account:String,
        destination_account:String,
        amount:Number,
        currency:String
    }
);

const UserSchema= new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    password_resume: String
});

const NonceSchema= new mongoose.Schema({
    nonce: {
        type: String,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 900
    }
});

const dbNonce = conn.model('Nonce', NonceSchema);
const dbTransaction = conn.model("Transaction", Transaction_scheme);
export const dbUsers = conn.model('User', UserSchema, 'users-data');

loadTransactionApi(app, dbTransaction, dbNonce);
loadBackendApiUsers(app, dbUsers, dbNonce);

app.get('/', (req, res) => {
  res.status(200).send('API Running');
});

app.listen(PORT, () => {
    console.log(`Backend Now Running on port ${PORT}`);
});   
