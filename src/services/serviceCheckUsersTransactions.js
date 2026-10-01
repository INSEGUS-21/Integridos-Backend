import { ObjectId } from 'mongodb'; // Importante si usas el driver nativo de MongoDB
import { dbUsers } from '../index.js'; // Ajusta la ruta a tu importación de BD

export async function checkUserExists(req, res, next) {
    try {
        // 1. Extraer el ID probando las claves habituales del payload del JWT
        const userId = req.user?.id || req.user?._id || req.user?.userId || req.user?.sub;

        if (!userId) {
            return res.status(401).send("Unauthorized");
        }

        let user = null;

        // 2. Búsqueda adaptativa según el ORM/Driver utilizado
        if (typeof dbUsers?.findById === 'function') {
            // Mongoose
            user = await dbUsers.findById(userId);
        } else if (typeof dbUsers?.findOne === 'function') {
            // Driver nativo de MongoDB (convierte string a ObjectId si procede)
            const queryId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
            user = await dbUsers.findOne({ _id: queryId });
        } else if (Array.isArray(dbUsers)) {
            // Array en memoria
            user = dbUsers.find(u => String(u._id || u.id) === String(userId));
        }

        if (!user) {
            return res.status(401).send("Unauthorized");
        }

        next(); // Usuario existe, continua el flujo
    } catch (error) {
        console.error("Error en checkUserExists:", error.message);
        return res.status(401).send("Unauthorized");
    }
}