import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

import * as paymentService from "./payment.service.js"

export const sandboxSuccess = asyncHandler(async (req, res) => {

    const { transactionId } = req.body;

    const payment =
        await paymentService.markSandboxSuccess(
            transactionId
        );

    res.status(200).json(
        new ApiResponse(
            200,
            "Payment successful",
            payment
        )
    );
});

export const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
        const event =
            paymentService.constructWebhookEvent(
                req.body,
                sig
            );

        await paymentService.handleStripeWebhook(event);

        res.status(200).json({ received: true });

    } catch (err) {

        console.log("Webhook Error:", err.message);

        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};