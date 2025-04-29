const mongoose = require("mongoose");

const OrganizationSchema = mongoose.Schema(
  {
    orgName: {
      type: String,
      required: true,
    },
    orgAddress: {
      type: String,
      required: true,
    },
    orgPhone: {
      type: String,
      required: true,
    },
    orgEmail: {
      type: String,
      required: [true, "Please add the user email address"],
    },
    _admin: {
      type: mongoose.Schema.Types.ObjectId,
      res: "SuperAdmin",
      required: true,
    },
    custom_policy: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Organization", OrganizationSchema);
