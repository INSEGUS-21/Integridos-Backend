import mongoose from 'mongoose';
import fs from 'fs'
import csv from 'csv-parser';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { rateLimit } from 'express-rate-limit'
import { auth, JWT_SECRET } from '../services/auth.js'; // ajusta la ruta
import { createNonce, validNonce } from '../services/serviceNonce.js';

let URL_BASE_API = "/api/v1";
const SECRET_KEY = process.env.SECRET_KEY||"secret"

//limitar numero de intentos de login por usuario 
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 5, // Limit each IP to 5 requests per `window` (here, per 10 minutes). (cambiar valores si hace falta luego y eso)
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

export function loadBackendApiUsers(app,dbUsers,dbNonce){

    //get load initial data
    app.get(URL_BASE_API+"/Users/loadInitialData", async (req, res)=> {
        try{
            const count = await dbUsers.countDocuments();
            if (count > 0) return res.sendStatus(409);
            const csvData = [];
            const rows = [];
            fs.createReadStream('./data/usersData.csv')
            .pipe(csv())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', async () => {
                try {
                    const hashedUsers = await Promise.all(
                        rows.map(async (user) => {
                            if (user.password_resume) {
                                let hashedPassword = user.password_resume
                                for(let i = 0; i<3;i++ ){
                                    hashedPassword = crypto.createHash('sha256').update(hashedPassword).digest('hex');
                                }
                                return { ...user, password_resume: hashedPassword };
                            }
                            return user;
                        })
                    );

                    await dbUsers.create(hashedUsers);
                    res.sendStatus(201);
                } catch (err) {
                    console.error(err);
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
        let users =  await dbUsers.find({});
        res.status(200).json(users);

    }catch(err){
        res.sendStatus(500);
    } 
    });
    
    //get de 1 user
    app.get(URL_BASE_API+"/Users/:id", auth, async (req, res) => {
        try{
            let user= await dbUsers.findById(req.params.id);
            if(!user){
                res.status(404).send("no existe usuario");
            }else{
                res.status(200).json(user);
            }
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
            const deleted = await dbUsers.findByIdAndDelete(req.params.id);
            if (!deleted) {
                return res.status(404).send("no existe usuario");
            }
            res.sendStatus(204);
        } catch (err) {
            console.error(err);
            res.sendStatus(500);
        }
    });

    //delete TODO ADMIN

    app.delete(URL_BASE_API + "/Admin/Users", async (req, res) => {
    try {
        await dbUsers.deleteMany({});
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
    });

    app.delete(URL_BASE_API + "/Users", auth, async (req, res) => {
    try {
        await dbUsers.deleteMany({});
        res.sendStatus(204);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
    });

    //login
    app.post(URL_BASE_API+"/login", limiter, async (req, res) => {
        const {username, password} = req.body;

        const timestamp=req.headers.timestamp;
        const nonce=req.headers.nonce;
        const hmac=req.headers.hmac;

        if (!(username && password && timestamp && nonce && hmac)) {
             return res.status(400).send("incomplete params");
        }

        const hmacBuffer = Buffer.from(hmac || '', 'hex');

        const hmacBackendBuffer = crypto.createHmac('sha256', SECRET_KEY)
                    .update(`${timestamp}.${nonce}.`).update(req.rawBody|| '').digest();

        if (hmacBuffer.length !== hmacBackendBuffer.length || !crypto.timingSafeEqual(hmacBuffer, hmacBackendBuffer)) {
                    return res.status(403).send("HMAC is not the same, integrity problem");
        }

        try {
                const isNonceValid=await validNonce(nonce, timestamp, dbNonce);
                    
                if (isNonceValid){
                    if (await createNonce(nonce,timestamp, dbNonce)){
                            try{
                                const user = await dbUsers.findOne({username}); //comprueba que existe usuario   
                                if(!user || user.password_resume !== password){
                                    return res.status(401).send("unautorized");
                                }else{
                                    const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '1h' }); //crea token
                                    return res.status(200).json({ token });
                                }
                                
                            }catch{
                                return res.sendStatus(500);
                            }

                    } else {
                            return res.status(400).send("Error creating the nonce in the db");
                        }
                }else{
                    return res.status(400).send("Nonce is not valid");
                    }
                } catch (error) {
                    console.log(error);
                    return res.sendStatus(500, "Server Error");
                }
    });


    //register
    app.post(URL_BASE_API+"/register", async (req, res) => {
        const {username, password} = req.body;

        const timestamp=req.headers.timestamp;
        const nonce=req.headers.nonce;
        const hmac=req.headers.hmac;

         if (!(username && password && timestamp && nonce && hmac)) {
             return res.status(400).send("incomplete params");
        }

        const hmacBuffer = Buffer.from(hmac || '', 'hex');

        const hmacBackendBuffer = crypto.createHmac('sha256', SECRET_KEY)
                    .update(`${timestamp}.${nonce}.`).update(req.rawBody|| '').digest();

        if (hmacBuffer.length !== hmacBackendBuffer.length || !crypto.timingSafeEqual(hmacBuffer, hmacBackendBuffer)) {
                    return res.status(403).send("HMAC is not the same, integrity problem");
        }

        try {
                const isNonceValid=await validNonce(nonce, timestamp, dbNonce);
                    
                if (isNonceValid){
                    if (await createNonce(nonce,timestamp, dbNonce)){
                            try {
                                if (await dbUsers.findOne({ username })) {
                                    return res.status(409).send("User already exists")
                                };
                                await dbUsers.create({ username, password_resume: password});
                                return res.status(201).send("user created");
                            } catch (err) {
                                return res.sendStatus(500);
                            }
                            
                    } else {
                            return res.status(400).send("Error creating the nonce in the db");
                    }
                }else{
                    return res.status(400).send("Nonce is not valid");
                }
        } catch (error) {
            console.log(error);
            return res.sendStatus(500, "Server Error");
        }
    });
    

    //Añadir auth como segundo argumento en las rutas que a proteger:
    //ejemplo: app.get(URL_BASE_API + "/Users", auth, async (req, res) => { ... });

     



}