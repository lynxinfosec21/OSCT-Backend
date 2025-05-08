const express = require("express");
const {
  assetsRegisteration,
  deleteAssets,
  allOrganizationAssets,
  specificAssetInfo,
  specificAssetAllData
} = require("../controllers/assetsController");

const assetsRouter = express.Router();

// const validateToken = require("../middleware/validateTokenHandler");

const validateToken = require("../middleware/validateTokenHandler");

assetsRouter.post("/register", assetsRegisteration);
assetsRouter.get("/", allOrganizationAssets);
assetsRouter.get("/info", specificAssetInfo);
assetsRouter.get("/assetdata", specificAssetAllData);
assetsRouter.delete("/delete", deleteAssets);

module.exports = assetsRouter;
