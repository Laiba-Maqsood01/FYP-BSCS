import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                message: "Token not found!"
            })
        }

        const token = authHeader.split(" ")[1];

        //1. Verify JWT
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // 2. Find user
        const user = await userModel.findById(decoded.id);

        if(!user){
            return res.status(401).json({
                message: "User not found!"
            })
        }

        // 3. Check account status
        if(user.accountStatus && user.accountStatus !== "ACTIVE"){
            return res.status(403).json({
                message: `Account is ${user.accountStatus}`
            })
        }

        // 4. session valid or not
        const session = await sessionModel.findById(decoded.sessionId)
        if(!session || session.revoked){
            return res.status(401).json({
                message: "Session expired or revoked"
            })
        }

        // user and session attached to req
        req.user = user;
        req.session = session;

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Unauthorized",
            error: error.message
        })
    }
}
