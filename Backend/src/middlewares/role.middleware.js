import { ApiError } from "../utils/apiError.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "unauthorized"))
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ApiError(
                    403,
                    `Access denied. Required role: ${allowedRoles.join(", ")}`
                )
            )
        }
        next()
    }
} 