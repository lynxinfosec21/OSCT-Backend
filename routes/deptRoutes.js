const express = require("express");

const deptRouter = express.Router();
const validateToken = require("../middleware/validateTokenHandler");
const {
  deptRegistration,
  getAllDept,
  deptDelete,
  getSpecificDeptData,
  getSiteIdByDeptId
} = require("../controllers/deptController");

deptRouter.get("/alldept", getAllDept);
deptRouter.get("/specific", getSpecificDeptData);
deptRouter.get("/getsite", getSiteIdByDeptId);
deptRouter.post("/register", deptRegistration);
deptRouter.post("/delete", deptDelete);

module.exports = deptRouter;
