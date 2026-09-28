
export async function validNonce(nonce_input, timeStamp_input, dbNonce){
    try{

        const timeStampNow = Date.now();
        const diff=timeStampNow - (timeStamp_input * 1000);

        console.log(diff);


        if (Math.abs(diff) <= 300000){
            const existing = await dbNonce.findOne({nonce:nonce_input});
            console.log(existing);
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

export async function createNonce(nonce_input, timeStamp_input, dbNonce){
    try{
        await dbNonce.create({nonce: nonce_input, timeStamp: timeStamp_input});
        return true
    }catch(err){
        console.error("Critic error creating nonce on the db", err);
        return false;
    };
};