
import { createNonce, validNonce } from '../services/serviceNonce.js';
import crypto from 'node:crypto';

const BASE_URL="/api/v1";
const SECRET_KEY = process.env.SECRET_KEY||"secret"

export const loadTransactionApi=async  (app, dbTransaction, dbNonce) =>{

    

    app.get(BASE_URL+"/transactions",async  (req,res)=>{
        console.log("GET transactions....")
        try {
            const data= await dbTransaction.find({});
            console.log("GET transactions....correct")
            return res.status(200).json(data);
        } catch (error) {
            console.log(error);
            return res.sendStatus(500, "Server Error")
        }
    });

    app.get(BASE_URL+"/transactions/:id", async (req,res)=>{
        const id= req.params.id; 
        console.log(`GET transaction ${id} ....`)
        try {
            const data=await dbTransaction.findOne({_id:id});
            if (data){
                console.log(`GET transaction ${id} ....correct`)
                return res.status(200).json(data); 
            }else{
                return res.sendStatus(404, "Transaction not found")
            }
        } catch (error) {
            console.log(error);
            return res.sendStatus(500, "Server Error")   
        }        
    })

    app.post(BASE_URL+"/transactions", async (req,res)=>{
        console.log(`POST transactions ....`)
        const nonce = req.headers.nonce;
        const timeStamp = req.headers.timestamp;
        const hmac=req.headers.hmac;

        const hmacBuffer = Buffer.from(hmac || '', 'hex');
        const hmacBackendBuffer = crypto.createHmac('sha256', SECRET_KEY)
            .update(`${timeStamp}.${nonce}.`).update(req.rawBody|| '').digest();

        if (!(req.body.origin_account && req.body.destination_account
             && req.body.amount && req.body.currency && nonce && timeStamp)) {
             return res.status(400).send("incomplete params");
        }

        if (hmacBuffer.length !== hmacBackendBuffer.length || !crypto.timingSafeEqual(hmacBuffer, hmacBackendBuffer)) {
            return res.status(403).send("HMAC is not the same, integrity problem");
        }
        
        try {
            const isNonceValid=await validNonce(nonce, timeStamp, dbNonce)
            
            if (isNonceValid){
                if (await createNonce(nonce,timeStamp, dbNonce)){
                    console.log(`POST transaction .... correct`)
                    await dbTransaction.create(req.body);
                    return res.sendStatus(200);
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

    app.delete(BASE_URL+"/transactions", async (req,res)=>{
        console.log(`DELETE Transactions ....`)
        try {
            await dbTransaction.deleteMany({});
            console.log(`DELETE Transactions .... correct`)
            return res.sendStatus(200);
        } catch (error) {
            console.log(error);
            return res.sendStatus(500, "Server Error");
        }
        
    });

    app.delete(BASE_URL+"/transactions/:id", async (req, res)=>{
        const id= req.params.id; 
        console.log(`DELETE Transaction ${id}....`)
        try {
            const iddb=await dbTransaction.findOne({_id:id});
            if (iddb){
                await dbTransaction.deleteOne({_id:id});
                console.log(`DELETE Transaction ....correct `)
                return res.sendStatus(200); 
            } else{
                return res.sendStatus(404, "Transaction not found")
            }
        } catch (error) {
            console.log(error);
            return res.sendStatus(500, "Server Error")   
        }    
    });


    app.post(BASE_URL+"/transactions/:id", (req,res)=>{
        return res.sendStatus(405);
    });


}



