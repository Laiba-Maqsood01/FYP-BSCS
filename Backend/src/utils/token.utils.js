import jwt from "jsonwebtoken";
import config from "../config/config.js"

export  function generateAccessToken(userId, sessionId){
     return jwt.sign({
        id: userId,
        sessionId
    }, config.JWT_SECRET,
        {
            expiresIn: "10m"
        })
}

export function generateRefreshToken(userId){
    return jwt.sign({
        id: userId
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        })
}
