const express = require("express");
const userRouter = express.Router();
const {
  getUserInfo,
  loginUser,
  currentUser,
  logoutUser,
  verifyUserEmail,
} = require("../controllers/userController");

const validateToken = require("../middleware/validateTokenHandler");


userRouter.post("/login", loginUser);
// userRouter.get("/currentUser", validateToken, currentUser);
userRouter.get("/currentUser", currentUser);
userRouter.get("/verify/:token", verifyUserEmail);
userRouter.post("/logout", logoutUser);

module.exports = userRouter;
