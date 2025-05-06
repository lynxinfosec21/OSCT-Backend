const express = require("express");
const userRouter = express.Router();
const {
  getUserInfo,
  loginUser,
  currentUser,
  logoutUser,
  verifyUserEmail,
  userRegisteration
} = require("../controllers/userController");

const validateToken = require("../middleware/validateTokenHandler");

userRouter.post("/login", loginUser);
userRouter.post("/register", userRegisteration);

// userRouter.get("/currentUser", validateToken, currentUser);
userRouter.get("/currentUser", currentUser);
userRouter.get("/verify/:token", verifyUserEmail);
userRouter.post("/logout", logoutUser);

module.exports = userRouter;
