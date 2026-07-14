export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log full error server-side so 500s are debuggable (client only gets the message)
    if (statusCode >= 500) {
        console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
        console.error(err);
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(err.data ? { data: err.data } : {})
    })
}