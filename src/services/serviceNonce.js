import mongoose from 'mongoose';

let MONGO_URI= "mongodb+srv://danieldlrf2_db_user:XbeoINbtCRtaS35S@ssii.abhixzn.mongodb.net/?appName=SSII";
//danieldlrf2_db_user
//XbeoINbtCRtaS35S
const conn = mongoose.createConnection(MONGO_URI);

conn.on('connected', () => console.log('Conectado a MongoDB (Users)'));
conn.on('error', (err) => console.error('Error conectando a MongoDB (Users):', err));

const UserSchema= new mongoose.Schema({
    nonce: String,
    timeStamp: String 
});


const db = conn.model('Nonce', UserSchema);


export async function validNonce(nonce_input, timeStamp_input){
    try{
        const timeStampNow = Date.now();
        if ((timeStampNow - timeStamp_input) <= 300000){
            const existing = await db.findOne({nonce:nonce_input});
            if(existing){
                return false;
            }else{
                return true;
            }
        } 
        else{
            return false;
        }
    }catch(err){
        console.error("Critic error consulting nonce on the db", err);
        return false;
    };
};

export async function createNonce(nonce_input, timeStamp_input){
    try{
        await db.create({nonce: nonce_input, timeStamp: timeStamp_input});
        return true
    }catch(err){
        console.error("Critic error creating nonce on the db", err);
        return false;
    };
};