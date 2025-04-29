const express = require("express");
const {
  organizationRegisteration,
  UpdateOrganization,
  deleteOrganization,
  allOrganizations,
  allOrganizationData,
  organizationUserRole,
  allOrganizationsUsers,
  siteAdminBasedOnOrgId,
  deptAdminBasedOnOrgId,
  assetUserBasedOnOrgId,
  currentUserData,
  updateUserData,
  resendVerification,
  updateUserPassword,
  OrganizationData
} = require("../controllers/organizationController");
const organizationRouter = express.Router();

// const validateToken = require("../middleware/validateTokenHandler");

const validateToken = require("../middleware/validateTokenHandler");

organizationRouter.get("/", allOrganizations);
organizationRouter.get("/data", OrganizationData);
organizationRouter.post("/register", organizationRegisteration);
organizationRouter.put("/update", UpdateOrganization);
organizationRouter.post("/delete", deleteOrganization);
organizationRouter.get("/getalldata", allOrganizationData);
organizationRouter.post("/userrole", organizationUserRole);
organizationRouter.post("/resendverification", resendVerification);
organizationRouter.get("/users", allOrganizationsUsers);
organizationRouter.get("/siteadmin", siteAdminBasedOnOrgId);
organizationRouter.get("/deptadmin", deptAdminBasedOnOrgId);
organizationRouter.get("/assetuser", assetUserBasedOnOrgId);
organizationRouter.get("/currentuserdata", currentUserData);
organizationRouter.put("/userupdate",updateUserData);
organizationRouter.put("/userpasswordupdate",updateUserPassword)
// organizationRouter.get("/siteuser", allUsersUnderSpecificSiteAdmin);
// organizationRouter.get("/deptuser", allUsersUnderSpecificDeptAdmin);
// organizationRouter.post("/register", validateToken, organizationRegisteration);
// organizationRouter.post("/update",validateToken, UpdateOrganization);
// organizationRouter.post("/delete",validateToken, deleteOrganization);

module.exports = organizationRouter;
