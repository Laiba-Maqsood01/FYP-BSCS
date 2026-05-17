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