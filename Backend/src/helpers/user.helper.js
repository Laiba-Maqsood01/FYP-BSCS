import { ACCOUNT_STATUS } from "../utils/constants.js";

export async function checkAndAutoUnblock(user) {
    if (
        user.accountStatus === ACCOUNT_STATUS.BLOCKED &&
        user.blockedUntil &&
        new Date() > user.blockedUntil
    ) {
        user.accountStatus = ACCOUNT_STATUS.ACTIVE;
        user.blockedUntil = null;
        await user.save();
    }
}