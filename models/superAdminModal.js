const mongoose = require("mongoose");

const SuperAdminSchema = mongoose.Schema(
  {
    name : {type: String, required: true},
    email: {
      type: String,
      required: [true, "Please add the admin email address"],
    },
    password: {
      type: String,
      required: [true, "Please add the admin password"],
    },
    role: {
      type: String,
      required: [true, "Please add the admin role"],
      anum: ["admin",],
    },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SuperAdmin", SuperAdminSchema);
