import * as masterService from "./master.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export const getBrands = asyncHandler(
  async (req, res) => {

    const brands =
      await masterService.getBrands();

    res.status(200).json(
      new ApiResponse(
        200,
        "Brands fetched successfully",
        brands
      )
    );
  }
);

export const getBodyTypes = asyncHandler(
  async (req, res) => {

    const bodyTypes =
      await masterService.getBodyTypes();

    res.status(200).json(
      new ApiResponse(
        200,
        "Body types fetched successfully",
        bodyTypes
      )
    );
  }
);

export const getProvinces = asyncHandler(
  async (req, res) => {

    const provinces =
      await masterService.getProvinces();

    res.status(200).json(
      new ApiResponse(
        200,
        "Provinces fetched successfully",
        provinces
      )
    );
  }
);

export const getCities = asyncHandler(
  async (req, res) => {

    const cities =
      await masterService.getCities(
        req.query.province
      );

    res.status(200).json(
      new ApiResponse(
        200,
        "Cities fetched successfully",
        cities
      )
    );
  }
);