const express = require("express");
const {
  superAdminRegisteration,
  superAdminLogin,
  currentAdmin,
  superAdminLogout,
  allSuperAdmins,
  deleteAdmin,
} = require("../controllers/superAdminController");
const adminRouter = express.Router();

adminRouter.post("/register", superAdminRegisteration);
adminRouter.post("/alladmins", allSuperAdmins);
adminRouter.post("/delete", deleteAdmin);
adminRouter.post("/login", superAdminLogin);
adminRouter.get("/currentAdmin", currentAdmin);
adminRouter.post("/logout", superAdminLogout);

module.exports = adminRouter;
