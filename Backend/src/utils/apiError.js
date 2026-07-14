export class ApiError extends Error{
    // data: optional structured payload for the client (e.g. which
    // verification step is missing) — included in the error response.
    constructor(statusCode, message, data = null){
        super(message);
        this.statusCode = statusCode;
        this.data = data;
    }
}