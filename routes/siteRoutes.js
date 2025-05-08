const express = require("express");
const {
  siteRegistration,
  siteDelete,
  getAllSites,
  getSitesBasedOnRole,
  getSpecificSiteData
} = require("../controllers/sitesController");

const siteRouter = express.Router();
const validateToken = require("../middleware/validateTokenHandler");

siteRouter.get("/all", getAllSites);
siteRouter.get("/role", getSitesBasedOnRole);
siteRouter.get("/specific", getSpecificSiteData);
siteRouter.post("/register", siteRegistration);
siteRouter.delete("/delete", siteDelete);

module.exports = siteRouter;
