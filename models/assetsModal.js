const mongoose = require("mongoose");

const AssetSchema = mongoose.Schema(
  {
    _site: {
      type: mongoose.Schema.Types.ObjectId,
      res: "Site",
      required: true,
    },
    _dept: {
      type: mongoose.Schema.Types.ObjectId,
      res: "dept",
      required: true,
    },
    _organization: {
      type: mongoose.Schema.Types.ObjectId,
      res: "Organization",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    assetName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: [true, "Please add the user email address"],
    },
    assetValue: {
      type: String,
      required: [true, "Please add the user email address"],
    },
    assetToken: {
      type: String,
      required: true,
    },
    assetId: {
      type: String,
      required: true,
    },
    _assetUser :{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    }
    // _assetOwner: {
    //   type: String,
    //   required: [true, "Please add the user email address"],
    // },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Asset", AssetSchema);
