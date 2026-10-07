import fs from 'fs'
import csv from 'csv-parser';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { rateLimit } from 'express-rate-limit'
import { auth, JWT_SECRET } from '../services/auth.js'; // ajusta la ruta
import { createNonce, validNonce } from '../services/serviceNonce.js';
import argon2 from 'argon2';

let URL_BASE_API = "/api/v1";
const SECRET_KEY = process.env.SECRET_KEY||"6570c68f92088ef05cff0196036dd3cff6e9c17ad0e2628ba05c1071ba74135b"

const ARGON_OPTS = {
    type: argon2.argon2id,
    memoryCost: 19456, // ~19 MiB
    timeCost: 2,
    parallelism: 1
};

const DUMMY_HASH = await argon2.hash('dummy-password', ARGON_OPTS);

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
            const rows = [];
            fs.createReadStream('./data/usersData.csv')
            .pipe(csv())
            .on('data', (row) => {
                rows.push(row);
            })
            .on('end', async () => {
                try {
                    const hashedUsers = await Promise.all(
                        rows.map( async (user) => {
                            const salt = crypto.randomBytes(16).toString('hex')
                            if (user.password_resume) {
                                let hashedPassword = user.password_resume + salt
                                for(let i = 0; i<3;i++ ){
                                    hashedPassword = crypto.createHash('sha256').update(hashedPassword).digest('hex');
                                }
                                const finalHash = await argon2.hash(hashedPassword, ARGON_OPTS);
                                return { ...user, password_resume: finalHash, salt: salt };
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
            .on('error', () =>{ 
                res.sendStatus(500)});

        }catch(err){
            res.sendStatus(500);
        }

    });

    //SOLO PARA PRUEBAS Y PARA CORREGIR
    app.get(URL_BASE_API + "/Users", async (req, res) => {
    try{
        let users =  await dbUsers.find({});
        res.status(200).json(users);

    }catch(err){
        res.sendStatus(500);
    } 
    });
    
    //post prohibido

    app.post(URL_BASE_API+"/Users/:id", auth, async (req, res) => {
        res.sendStatus(405);
    });

    //login
    app.post(URL_BASE_API + "/login", limiter, async (req, res) => {
        const { username, password } = req.body;
        const timestamp = req.headers.timestamp;
        const nonce = req.headers.nonce;
        const hmac = req.headers.hmac;

        if (!(username && password && timestamp && nonce && hmac)) {
            return res.status(400).send("incomplete params");
        }

        const hmacBuffer = Buffer.from(hmac || '', 'hex');
        const hmacBackendBuffer = crypto.createHmac('sha256', SECRET_KEY)
            .update(`${timestamp}.${nonce}.`).update(req.rawBody || '').digest();

        console.time("Login-HMAC-Check");
        const isHmacLengthEqual = hmacBuffer.length === hmacBackendBuffer.length;
        const isHmacValid = isHmacLengthEqual && crypto.timingSafeEqual(hmacBuffer, hmacBackendBuffer);
        console.timeEnd("Login-HMAC-Check");

        if (!isHmacValid) {
            return res.status(403).send("HMAC is not the same, integrity problem");
        }

        try {
            const isNonceValid = await validNonce(nonce, timestamp, dbNonce);
            if (!isNonceValid) return res.status(400).send("Nonce is not valid");

            if (!(await createNonce(nonce, timestamp, dbNonce))) {
                return res.status(400).send("Error creating the nonce in the db");
            }

            const user = await dbUsers.findOne({ username });

            console.time("Login-Password-Check");
            let isPasswordCorrect = false;
            try {
                const hashToCheck = user?.password_resume || DUMMY_HASH;
                const ok = await argon2.verify(hashToCheck, password);
                isPasswordCorrect = ok && !!user;
            } catch (e) {
                isPasswordCorrect = false;
            }
            console.timeEnd("Login-Password-Check");

            if (!isPasswordCorrect) {
                return res.status(401).send("unautorized");
            }

            const token = jwt.sign({ sub: user._id, tv: user.tokenVersion ?? 0 }, JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ token });

        } catch (error) {
            console.log(error);
            return res.sendStatus(500);
        }
    });

    //logout
    app.post(URL_BASE_API + "/logout", auth, async (req, res) => {
        const timestamp = req.headers.timestamp;
        const nonce = req.headers.nonce;
        const hmac = req.headers.hmac;

        if (!(timestamp && nonce && hmac)) {
            return res.status(400).send("incomplete params");
        }

        const hmacBuffer = Buffer.from(hmac, 'hex');

        const hmacBackendBuffer = crypto.createHmac('sha256', SECRET_KEY)
                    .update(`${timestamp}.${nonce}.`).update(req.rawBody || '').digest();

        if (hmacBuffer.length !== hmacBackendBuffer.length || !crypto.timingSafeEqual(hmacBuffer, hmacBackendBuffer)) {
            return res.status(403).send("HMAC is not the same, integrity problem");
        }

        try {
            const isNonceValid = await validNonce(nonce, timestamp, dbNonce);
            if (!isNonceValid) {
                return res.status(400).send("Nonce is not valid");
            }
            if (!(await createNonce(nonce, timestamp, dbNonce))) {
                return res.status(400).send("Error creating the nonce in the db");
            }

            await dbUsers.updateOne({ _id: req.user.sub }, { $inc: { tokenVersion: 1 } }); //al incrementa la version del token a 1, el token se invalida aun que no halla caducado
            return res.status(200).send("session closed");
        } catch (error) {
            console.log(error);
            return res.sendStatus(500);
        }
    });




    //register
    app.post(URL_BASE_API+"/register", async (req, res) => {
        const {username, password} = req.body;

        const timestamp=req.headers.timestamp;
        const nonce=req.headers.nonce;
        const hmac=req.headers.hmac;
        const salt=req.headers.salt;

         if (!(username && password && timestamp && nonce && hmac && salt)) {
             return res.status(400).send("incomplete params");
        }

        const hmacBuffer = Buffer.from(hmac || '', 'hex');

        const hmacBackendBuffer = crypto.createHmac('sha256', SECRET_KEY)
                    .update(`${timestamp}.${nonce}.${salt}.`).update(req.rawBody|| '').digest();

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
                                const storedHash = await argon2.hash(password, ARGON_OPTS);
                                await dbUsers.create({ username, password_resume: storedHash, salt: salt });
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
    
    app.get(URL_BASE_API+"/getUserSalt/:username", async (req, res) => {
        const timestamp = req.headers.timestamp;
        const nonce = req.headers.nonce;
        const hmac = req.headers.hmac;
        const username_param = req.params.username;

        if (!(timestamp && nonce && hmac && username_param)) {
            return res.status(400).send("incomplete params");
        }

        const hmacBuffer = Buffer.from(hmac, 'hex');

        const hmacBackendBuffer = crypto.createHmac('sha256', SECRET_KEY)
                    .update(`${timestamp}.${nonce}.`).digest();

        if (hmacBuffer.length !== hmacBackendBuffer.length || !crypto.timingSafeEqual(hmacBuffer, hmacBackendBuffer)) {
            return res.status(403).send("HMAC is not the same, integrity problem");
        }
        
        try{
            const isNonceValid = await validNonce(nonce, timestamp, dbNonce);
            if (!isNonceValid) {
                return res.status(400).send("Nonce is not valid");
            }
            if (!(await createNonce(nonce, timestamp, dbNonce))) {
                return res.status(400).send("Error creating the nonce in the db");
            }

            let user = await dbUsers.findOne({ username: username_param });
            if(!user){
                res.status(404).send("no existe usuario");
            }else{
                return res.status(200).json({ salt: user.salt });
            }
        }catch(err){
            res.sendStatus(500);
        }
    });

    //Añadir auth como segundo argumento en las rutas que a proteger:
    //ejemplo: app.get(URL_BASE_API + "/Users", auth, async (req, res) => { ... });

     



}