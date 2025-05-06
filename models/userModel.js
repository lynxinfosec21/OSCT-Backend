const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    _userInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserInfo",
      required: false,
    },
    email: {
      type: String,
      required: [true, "Please add the user email address"],
      unique: [true, "Email address already taken"],
    },
    password: {
      type: String,
      required: [true, "Please add the user password"],
    },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
