import favoriteModel from "./favorite.model.js";
import listingModel from "../listing/listing.model.js";

import { ApiError } from "../../utils/apiError.js";


// Save Listing
export async function saveListing(listingId, userId) {
    const listing = await listingModel.findById(listingId);

    if (!listing) {
        throw new ApiError(
            404,
            "Listing not found"
        );
    }

    const existing = await favoriteModel.findOne({
        user: userId,
        listing: listingId
    });

    if (existing) {
        throw new ApiError(
            400,
            "Listing already saved"
        );
    }

    return await favoriteModel.create({
        user: userId,
        listing: listingId
    });
}

// Remove Favorite
export async function removeFavorite(listingId, userId) {
    const favorite = await favoriteModel.findOneAndDelete({
        user: userId,
        listing: listingId
    });

    if (!favorite) {
        throw new ApiError(
            404,
            "Favorite not found"
        );
    }

    return true;
}

// My Favorites
export async function getMyFavorites(userId) {
    return await favoriteModel.find(
        {
            user: userId
        })
        .populate(
            {
            path: "listing",
            populate: [
                {
                    path: "brand",
                    select: "name"
                },
                {
                    path: "carModel",
                    select: "name"
                },
                {
                    path: "city",
                    select: "name"
                }
            ]
        })
        .sort({
            createdAt: -1
        });
}

// Check Favorite Status, it checks that whether the list is already saved or not !
export async function getFavoriteStatus(listingId, userId) 
{
    const favorite = await favoriteModel.exists({
            user: userId,
            listing: listingId
        });

    return {
        isFavorite: !!favorite
    };
}