import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const JWT_SECRET = process.env.JWT_SECRET||"13f4f282942482598b186e6462ee1cdf7afe2184ccaf7c951c1917770b601032872472e481a0594878788b3955360f9bee3e08d8ce1b6d0fbf9cae5a9f881428"; //clave con la que se firman los tokens

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