import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import userModel from "../models/user.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { ACCOUNT_STATUS } from "../utils/constants.js";

import { checkAndAutoUnblock } from "../helpers/user.helper.js";


export async function authMiddleware(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Token not found!"
            })
        }

        const token = authHeader.split(" ")[1];

        //1. Verify JWT
        const decoded = jwt.verify(token, config.JWT_SECRET);

        // 2. Find user
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User not found!"
            })
        }

        // 3. Check account status
        // User already has a valid token, block expires mid-session
        await checkAndAutoUnblock(user);

        if (user.accountStatus !== ACCOUNT_STATUS.ACTIVE) {
            const message =
                user.accountStatus === ACCOUNT_STATUS.BLOCKED && user.blockedUntil
                    ? `Your account is blocked until ${user.blockedUntil.toDateString()}`
                    : `Your account is ${user.accountStatus}`;
            return res.status(403).json({ message });
        }

        // 4. session valid or not
        const session = await sessionModel.findById(decoded.sessionId)
        if (!session || session.revoked) {
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
