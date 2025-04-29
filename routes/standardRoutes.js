const express = require("express");
const standardRouter = express.Router();

const { cisStandard, getAssetBenchmark } = require("../controllers/standardController");

const validateToken = require("../middleware/validateTokenHandler");

//Routes
standardRouter.post("/cis", cisStandard);
standardRouter.get("/assets", getAssetBenchmark);


module.exports = standardRouter;
