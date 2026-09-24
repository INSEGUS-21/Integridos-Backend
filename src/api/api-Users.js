import mongoose from 'mongoose';
import fs from 'fs'
import csv from 'csv-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { rateLimit } from 'express-rate-limit'
import { auth, JWT_SECRET } from './auth.js'; // ajusta la ruta

//tcmaria124_db_user
//EMGYUOoF7RUKgGWo (si no funciona, usar taitai por que la cambié y no se si se guardo xd)

let MONGO_URI= "mongodb+srv://tcmaria124_db_user:taitai@cluster0.0vjjqfl.mongodb.net/usersDB?appName=Cluster0";
let URL_BASE_API = "/api/v1";

//limitar numero de intentos de login por usuario 
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 5, // Limit each IP to 5 requests per `window` (here, per 10 minutes).
    skipSuccessfulRequests: true,
    skip: function (req, res) {
    // si no hay username, este intento no cuenta (error 400)
    if (!req.body.username) {
        return true;
    }
    return false;
    },
    keyGenerator: function (req, res) {
    // contador por nombre de usuario
    const username = req.body.username;
    return username;
    },
    message: "Has alcanzado el numero de intentos permitidos",
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
        
});






const conn = mongoose.createConnection(MONGO_URI);

conn.on('connected', () => console.log('Conectado a MongoDB (Users)'));
conn.on('error', (err) => console.error('Error conectando a MongoDB (Users):', err));

const UserSchema= new mongoose.Schema({
    username: String,
    password_resume: String 
});


const db = conn.model('User', UserSchema, 'users-data');


export function loadBackendApiUsers(app){

    //get load initial data
    app.get(URL_BASE_API+"/Users/loadInitialData", async (req, res)=> {
        try{
            const count = await  db.countDocuments();
            if (count > 0) return res.sendStatus(409);
            const csvData = [];
            fs.createReadStream('./data/usersData.csv')
            .pipe(csv())
            .on('data', (data) => {csvData.push(data)})
            .on('end', async () => {
                    try {
                        await db.create(csvData);
                        res.sendStatus(201);
                    } catch (err) {
                        res.sendStatus(500);
                    }
                })
            .on('error', () => res.sendStatus(500));

        }catch(err){
            res.sendStatus(500);
        }

    });

    //get de todos los users
    app.get(URL_BASE_API + "/Users", async (req, res) => {
    try{
        let users =  await db.find({});
        res.status(200).json(users);

    }catch(err){
        res.sendStatus(500);
    } 
    });
    
    //get de 1 user
    app.get(URL_BASE_API+"/Users/:id", auth, async (req, res) => {
        try{
            let user= await db.findById(req.params.id);
            if(!user){
                res.status(404).send("no existe usuario");
            }else{
                res.status(200).json(user);
            }
        }catch(err){
            res.sendStatus(500);
        }
    });


    //post 

    app.post(URL_BASE_API+"/Users/", auth, async (req, res) => {
        const {username, password_resume} = req.body;
        if(!username || !password_resume){
           return res.sendStatus(400);
        }
        try{ 
            const existing = await db.findOne({ username });
            if(existing){
                return res.sendStatus(409);
            }
            await db.create({username, password_resume});
            res.sendStatus(201);
        }catch(err){
            res.sendStatus(500);
        }

    });

    //post prohibido

    app.post(URL_BASE_API+"/Users/:id", auth, async (req, res) => {
        res.sendStatus(405);
    });

    //delete de 1 user
    app.delete(URL_BASE_API + "/Users/:id", auth, async (req, res) => {
        try {
            const deleted = await db.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).send("no existe usuario");
            }
            res.sendStatus(204);
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    });



    //delete TODO

    app.delete(URL_BASE_API + "/Users", auth, async (req, res) => {
    try {
        await db.deleteMany({});
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
    });



    //login
    app.post(URL_BASE_API+"/login", limiter, async (req, res) => {
        const {username, password} = req.body;
        if(!username || !password){
           return res.status(400).send("missing fields");
        }
        try{
        const user = await db.findOne({username}); //comprueba que existe usuario   
        if(!user || user.password_resume !== password){
            return res.status(401).send("unautorized");
        }
        const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '1h' }); //crea token
        res.status(200).json({ token });
        }catch{
            return res.sendStatus(500);
        }
    });


    //register
    app.post(URL_BASE_API+"/register", async (req, res) => {
        const {username, password} = req.body;
        if(!username || !password){
           return res.status(400).send("missing fields");
        }
        //implementar mas tarde validacion para contraseña
         try {
            if (await db.findOne({ username })) {
            return res.status(409).send("User already exists")};
            await db.create({ username, password_resume: password});
            res.status(201).send("user created");
        } catch (err) {
            res.sendStatus(500);
    }
    });

    //Añadir auth como segundo argumento en las rutas que a proteger:
    //ejemplo: app.get(URL_BASE_API + "/Users", auth, async (req, res) => { ... });

     



}