
import mongoose from 'mongoose';

const Schema=mongoose.Schema;
const ObjectId = Schema.ObjectId;
const BASE_URL="/api/v1";

const MONGO_URL="mongodb://localhost:27017/";

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
        timestamp:Number


    }
);

const Transaction_model=mongoose.model("Transaction", Transaction_scheme);

await Transaction_model.createCollection();

export const loadTransactionApi=async  (app) =>{

    

    app.get(BASE_URL+"/transactions",async  (req,res)=>{
        const data= await Transaction_model.find({}).select("-_id");

        const json=await data.json();

        res.status(200).send(json);
    });

    app.get(BASE_URL+"/transactions/:id", async (req,res)=>{
        const id=new ObjectId(req.params.id);
        const data=await Transaction_model.findOne({tx_id:id}).select("-_id");
        const json=await data.json();
       res.status(200).send(json);
    })

    app.post(BASE_URL+"/transactions", async (req,res)=>{
        //Aquí han de implementarse mecanismos de seguridad

        Transaction_model.insertOne(req.body);
        res.sendStatus(200);
    });

    app.delete(BASE_URL+"/transactions", async (req,res)=>{
        await Transaction_model.deleteMany({});
        res.sendStatus(200);
    });

    app.delete(BASE_URL+"/transactions/:id", async (req, res)=>{
        const id=new ObjectId(req.params.id);
        await Transaction_model.deleteOne({tx_id:id});
        res.sendStatus(200);
    });


    app.post(BASE_URL+"/transactions:id", (req,res)=>{
        res.sendStatus(405);
    });


}



