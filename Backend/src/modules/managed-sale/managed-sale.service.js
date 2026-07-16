import crypto from "crypto";
import listingDeletionRequestModel from "./listing-deletion-request.model.js";
import commissionModel from "./commission.model.js";
import agreementBreakChargeModel from "./agreementBreakCharge.model.js";
import listingModel from "../listing/listing.model.js";
import featuredPlanModel from "../featured/featured-plan.model.js";
import InspectionReport from "../inspection-report/inspectionReport.model.js";
import paymentModel from "../payment/payment.model.js";
import userModel from "../../models/user.model.js";
import { createStripeCheckoutSession, voidPendingPayments } from "../payment/payment.service.js";
import { cleanupListingForDeletion } from "../../helpers/listing.cleanup.helper.js";
import { sendEmail } from "../../services/email.service.js";
import config from "../../config/config.js";
import { ApiError } from "../../utils/apiError.js";

// DELETION REQUESTS

export async function submitDeletionRequest(listingId, userId, reason) {
    const listing = await listingModel.findById(listingId);

    if (!listing) throw new ApiError(404, "Listing not found");

    // Only managed listings need deletion requests
    if (listing.saleMode !== "MANAGED") {
        throw new ApiError(
            400,
            "Deletion requests are only for managed listings. You can delete general listings directly."
        );
    }

    // Only owner can submit
    if (listing.seller.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not the owner of this listing");
    }

    // PENDING (owner changed their mind before activation) and ACTIVE
    // managed listings can request deletion; other statuses can't
    if (!["PENDING", "ACTIVE"].includes(listing.status)) {
        throw new ApiError(
            400,
            `Cannot submit deletion request for a listing with status ${listing.status}`
        );
    }

    // Check if an open request already exists (pending review, or accepted
    // and awaiting the agreement-break payment)
    const existingRequest = await listingDeletionRequestModel.findOne({
        listing: listingId,
        status: { $in: ["PENDING", "ACCEPTED"] },
    });

    if (existingRequest) {
        throw new ApiError(
            400,
            "A deletion request for this listing is already in progress."
        );
    }

    const request = await listingDeletionRequestModel.create({
        listing: listingId,
        requestedBy: userId,
        reason,
    });

    return request;
}

export async function getMyDeletionRequests(userId) {
    const requests = await listingDeletionRequestModel
        .find({ requestedBy: userId })
        .populate("listing", "title saleMode status")
        .sort({ createdAt: -1 })
        .lean();

    // Attach the agreement-break charge (if the admin accepted the request)
    // so the dashboard can show the fee and, for ONLINE mode, the Pay button.
    const charges = await agreementBreakChargeModel.find({
        deletionRequest: { $in: requests.map(r => r._id) },
    }).lean();

    const chargeByRequest = new Map(charges.map(c => [c.deletionRequest.toString(), c]));
    for (const r of requests) {
        r.breakCharge = chargeByRequest.get(r._id.toString()) ?? null;
    }

    return requests;
}

// ── Agreement break fee ──────────────────────────────────────────────────────

// Fee brackets follow the featured-plan prices: the smallest plan that covers
// the days held sets the price; beyond the largest plan, full blocks of the
// largest plan stack and the remainder rounds into the brackets again.
// A listing that never went live (still PENDING) pays the minimum bracket.
export async function computeAgreementBreakFee(listingId) {
    const plans = await featuredPlanModel
        .find({ isActive: true })
        .sort({ durationDays: 1 });

    if (plans.length === 0) {
        throw new ApiError(400, "No active featured plans configured — cannot compute the agreement break fee.");
    }

    // Day counting starts when the listing went live (report published)
    const report = await InspectionReport
        .findOne({ listing: listingId, status: "PUBLISHED" })
        .select("publishedAt");

    const daysHeld = report?.publishedAt
        ? Math.max(1, Math.ceil((Date.now() - new Date(report.publishedAt).getTime()) / 86400000))
        : 0;

    const largest = plans[plans.length - 1];
    let remaining = Math.max(daysHeld, 1); // 0 days → minimum bracket
    let amount = 0;

    while (remaining > 0) {
        const bracket = plans.find(p => remaining <= p.durationDays);
        if (bracket) {
            amount += bracket.amount;
            break;
        }
        amount += largest.amount;
        remaining -= largest.durationDays;
    }

    return { daysHeld, amount };
}

// ── Online payment for an accepted agreement-break charge ────────────────────

export async function getMyBreakCharge(chargeId, userId) {
    const charge = await agreementBreakChargeModel.findById(chargeId);
    if (!charge) throw new ApiError(404, "Charge not found");
    if (charge.seller.toString() !== userId.toString()) {
        throw new ApiError(403, "Not your charge");
    }
    return charge;
}

// Settle a break charge: mark it paid, approve the deletion request, remove
// the listing (with full inspection/featured cleanup) and confirm by email.
// Used by both the Stripe webhook (ONLINE) and the admin mark-paid (OFFLINE).
export async function settleBreakCharge(charge, { paymentId = null } = {}) {
    if (charge.status === "PAID") return charge;

    charge.status = "PAID";
    charge.paidAt = new Date();
    if (paymentId) charge.payment = paymentId;
    await charge.save();

    // Settled at the office after an online slot was opened: kill any unpaid
    // checkout attempt so the owner can't be charged twice for the same fee.
    if (!paymentId) {
        await voidPendingPayments(charge._id);
    }

    await listingDeletionRequestModel.findByIdAndUpdate(charge.deletionRequest, {
        status: "APPROVED",
    });

    // Withdraw the car: force-cancel any open inspection, close featured
    // records, then soft-remove the listing (owner asked for this).
    await cleanupListingForDeletion(
        charge.listing,
        true,
        "Agreement broken — listing withdrawn by owner"
    );
    await listingModel.findByIdAndUpdate(charge.listing, {
        status: "REMOVED",
        removedBy: "OWNER",
        removedAt: new Date(),
    });

    // Confirmation email
    const seller = await userModel.findById(charge.seller).select("username email");
    if (seller?.email) {
        await sendEmail(
            seller.email,
            "Agreement Break Settled — GearTrade",
            `Hi ${seller.username}, your agreement break fee of PKR ${charge.amount.toLocaleString()} has been received. Your listing has been removed from GearTrade and you can collect your car from our office.`,
            `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0">
              <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 8px">Agreement Break Settled</h2>
              <p style="font-size:14px;color:#64748b;margin:0 0 16px">Hi ${seller.username},</p>
              <p style="font-size:14px;color:#334155;margin:0 0 16px">We have received your agreement break fee of <strong>PKR ${charge.amount.toLocaleString()}</strong>. Your listing has been removed from GearTrade and the sale agreement is now closed.</p>
              <p style="font-size:14px;color:#334155;margin:0 0 24px">Please contact our team to arrange collecting your car from our office.</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
              <p style="font-size:12px;color:#94a3b8;margin:0">GearTrade.app — Pakistan's trusted car marketplace</p>
            </div>
            `
        );
    }

    return charge;
}

export async function createBreakChargePayment(chargeId, userId) {
    const charge = await getMyBreakCharge(chargeId, userId);

    if (charge.status === "PAID") {
        throw new ApiError(400, "This charge has already been paid.");
    }
    if (charge.paymentMode !== "ONLINE") {
        throw new ApiError(400, "This charge is payable at the GearTrade office, not online.");
    }

    const successUrl = `${config.CLIENT_URL}/payment/success?purpose=AGREEMENT_BREAK&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${config.CLIENT_URL}/payment/failed?purpose=AGREEMENT_BREAK`;

    // Reuse a pending payment if the owner abandoned a previous attempt
    const existingPayment = await paymentModel.findOne({
        referenceId: chargeId,
        status: "PENDING",
    });

    if (existingPayment) {
        const session = await createStripeCheckoutSession(existingPayment, { successUrl, cancelUrl });
        return { payment: existingPayment, checkoutUrl: session.url };
    }

    const user = await userModel.findById(userId).select("username email");
    if (!user) throw new ApiError(404, "User not found");

    const payment = await paymentModel.create({
        user: userId,
        listing: charge.listing,
        purpose: "AGREEMENT_BREAK",
        referenceId: charge._id,
        amount: charge.amount,
        transactionId: crypto.randomUUID(),
        status: "PENDING",
        payerSnapshot: {
            userId: user._id,
            username: user.username,
            email: user.email,
        },
    });

    charge.payment = payment._id;
    await charge.save();

    const session = await createStripeCheckoutSession(payment, { successUrl, cancelUrl });

    return { payment, checkoutUrl: session.url };
}

// COMMISSION

export async function getCommissionDetails(listingId, userId) {
    const listing = await listingModel.findById(listingId);

    if (!listing) throw new ApiError(404, "Listing not found");

    // Only owner can view commission
    if (listing.seller.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not the owner of this listing");
    }

    if (listing.saleMode !== "MANAGED") {
        throw new ApiError(400, "Commission only applies to managed listings");
    }

    // Commissions are settled records now (deducted from the sale proceeds by
    // the GearTrade team) — return the latest one for display.
    const commission = await commissionModel
        .findOne({ listing: listingId })
        .sort({ createdAt: -1 })
        .populate({
            path: "listing",
            select: "year images",
            populate: [
                { path: "brand", select: "name" },
                { path: "carModel", select: "name" },
            ],
        });

    if (!commission) {
        throw new ApiError(404, "No commission record found for this listing");
    }

    return commission;
}

