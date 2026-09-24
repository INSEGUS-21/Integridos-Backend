
import mongoose from 'mongoose';
import { createNonce, validNonce } from '../services/serviceNonce.js';

const Schema=mongoose.Schema;
const BASE_URL="/api/v1";

const MONGO_URL="mongodb+srv://ceradudelfin_db_user:qJ9Auk0hXnawTLTI@cluster0.gdjcyc4.mongodb.net/";

try{
    await mongoose.connect(MONGO_URL).then(() => console.log('Connected!'));
}catch(error){
     console.log("El error es: ", error);
}

const Transaction_scheme=new Schema(
    {
        origin_account:String,
        destination_account:String,
        amount:Number,
        currency:String,
        timeStamp:Number,
        nonce:String
    }
);

const Transaction_model=mongoose.model("Transaction", Transaction_scheme);

export const loadTransactionApi=async  (app) =>{

    

    app.get(BASE_URL+"/transactions",async  (req,res)=>{
        try {
            const data= await Transaction_model.find({});
            return res.status(200).json(data);
        } catch (error) {
            return res.sendStatus(500)
        }
        
    });

    app.get(BASE_URL+"/transactions/:id", async (req,res)=>{
        const id= req.params.id; 
        try {
            const data=await Transaction_model.findOne({_id:id});
            if (data){
                return res.status(200).json(data); 
            }else{
                return res.sendStatus(404)
            }
        } catch (error) {
            return res.sendStatus(500)   
        }        
    })

    app.post(BASE_URL+"/transactions", async (req,res)=>{
        const nonce = req.headers.nonce;
        const timeStamp = req.headers.timestamp;
        try {
            if (validNonce(nonce, timeStamp)){
                if (createNonce(nonce,timeStamp)){
                    await Transaction_model.create(req.body);
                    return res.sendStatus(200);
                } else {
                    return res.sendStatus(400)
                }
            }else{
                return res.sendStatus(400)
            }
        } catch (error) {
            return res.sendStatus(500);
        }
        
    });

    app.delete(BASE_URL+"/transactions", async (req,res)=>{
        try {
            await Transaction_model.deleteMany({});
            return res.sendStatus(200);
        } catch (error) {
            return res.sendStatus(500);
        }
        
    });

    app.delete(BASE_URL+"/transactions/:id", async (req, res)=>{
        const id= req.params.id; 
        try {
            const iddb=await Transaction_model.findOne({_id:id});
            if (iddb){
                await Transaction_model.deleteOne({_id:id});
                return res.sendStatus(200); 
            } else{
                return res.sendStatus(404)
            }
        } catch (error) {
            return res.sendStatus(500)   
        }    
    });


    app.post(BASE_URL+"/transactions/:id", (req,res)=>{
        return res.sendStatus(405);
    });


}



