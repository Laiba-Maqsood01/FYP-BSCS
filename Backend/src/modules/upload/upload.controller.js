import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import * as uploadService from "./upload.service.js";

export const getUploadSignature = asyncHandler(async (req, res) => {
  const folder = req.body.folder || "listings";
  const count  = Math.min(parseInt(req.body.count) || 1, 10);
  const resourceType = req.body.resource_type || "image";

    const signatures = Array.from({ length: count }, () =>
        uploadService.generateSignature(folder, resourceType)
    );

    res.status(200).json(
        new ApiResponse(200, "Upload signatures generated", { signatures })
    );
});