//------------------------------
const mongoose = require("mongoose");

const userInfoSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    _organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: String,
      anum: ["site", "dept", "user", "orgAdmin"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("UserInfo", userInfoSchema);
