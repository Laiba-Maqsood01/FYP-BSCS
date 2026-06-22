import * as masterService from "./master.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import carYearModel from "./models/carYear.mode.js";

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

export const getYears = asyncHandler(async (req, res) => {
  const years = await carYearModel.find({
    model: req.query.model
  });

  res.json({
    success: true,
    data: years
  });
});

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

export const getCitiesWithCount = asyncHandler(
  async (req, res) => {
    const cities = await masterService.getCitiesWithCount();
    res.status(200).json(new ApiResponse(200, "Cities with counts fetched", cities));
  }
);

export const getModels = asyncHandler(
  async (req, res) => {
    const models = await masterService.getModels(req.query.brand);
    res.status(200).json(new ApiResponse(200, "Models fetched successfully", models));
  }
);

export const getManagedCities = asyncHandler(
  async (req, res) => {
    const cities = await masterService.getManagedCities();
    res.status(200).json(new ApiResponse(200, "Managed sale cities fetched", cities));
  }
);