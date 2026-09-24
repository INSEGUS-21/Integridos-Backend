
import mongoose from 'mongoose';
import { createNonce } from '../services/serviceNonce';
import { validNonce } from '../services/serviceNonce';

const Schema=mongoose.Schema;
const ObjectId = Schema.ObjectId;
const BASE_URL="/api/v1";

const MONGO_URL="mongodb+srv://ceradudelfin_db_user:qJ9Auk0hXnawTLTI@cluster0.gdjcyc4.mongodb.net/";

try{
    await mongoose.connect(MONGO_URL).then(() => console.log('Connected!'));
}catch(error){
     console.log("El error es: ", error);
}

const Transaction_scheme=new Schema(
    {
        tx_id:ObjectId,
        origin_account:String,
        destination_account:String,
        amount:Number,
        currency:String,
        timeStamp:Number,
        nonce:String
    }
);

const Transaction_model=mongoose.model("Transaction", Transaction_scheme);

await Transaction_model.createCollection();

export const loadTransactionApi=async  (app) =>{

    

    app.get(BASE_URL+"/transactions",async  (req,res)=>{
        try {
            const data= await Transaction_model.find({}).select("-_id");

            const json=await data.json();

            return res.status(200).send(json);
        } catch (error) {
            return res.sendStatus(500)
        }
        
    });

    app.get(BASE_URL+"/transactions/:id", async (req,res)=>{
        const id=new ObjectId(req.params.id); 
        try {
            const data=await Transaction_model.findOne({tx_id:id}).select("-_id");
            if (data){
                const json=await data.json();
                return res.status(200).send(json); 
            }else{
                return res.sendStatus(404)
            }
        } catch (error) {
            return res.sendStatus(500)   
        }        
    })

    app.post(BASE_URL+"/transactions", async (req,res)=>{
        const nonce = req.body.nonce;
        const timeStamp = req.body.timeStamp;
        try {
            if (validNonce(nonce, timeStamp)){
                if (createNonce(nonce,timeStamp)){
                    await Transaction_model.insertOne(req.body);
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
        const id=new ObjectId(req.params.id); 
        try {
            await Transaction_model.deleteOne({tx_id:id});
            return res.sendStatus(200); 
        } catch (error) {
            return res.sendStatus(500)   
        }    
    });


    app.post(BASE_URL+"/transactions:id", (req,res)=>{
        return res.sendStatus(405);
    });


}



