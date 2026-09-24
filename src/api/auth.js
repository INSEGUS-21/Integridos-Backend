import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const JWT_SECRET = process.env.JWT_SECRET; //clave con la que se firman los tokens

export function auth(req, res, next){
    const header = req.headers.authorization || ''; //cabezera autorizacion de peticion cliente
    let token=null;
    if (header.startsWith('Bearer ')){
        token = header.slice(7); //sacar el token del header
    }
    if (!token){
        return res.status(401).send("unautorized");
    }
    try{
        req.user = jwt.verify(token, JWT_SECRET); //valida token
        next(); //
    }catch{
        return res.status(401).send("unautorized"); //unautorized
    }

}