import { dbUsers } from '../index.js';

export async function checkUserExists(req, res, next) {
    try {
        const userId = req.user?.sub || req.user?._id;

        if (userId && await dbUsers.exists({ _id: userId })) {
            return next();
        }
        return res.status(401).send("Unauthorized");
    } catch {
        return res.status(401).send("Unauthorized");
    }
}