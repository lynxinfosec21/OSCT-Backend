const mongoose = require("mongoose");

const standardSchema = mongoose.Schema(
  {
    totalComplainceScore: {
      type: String,
      required: true,
    },
    totalScore: {
      type: String,
      required: true,
    },
    _asset: {
      type: String,
      required: true, 
    },
    benchmark: {
      type: Object,
      required: true,
    },
    standard: { type: String, required: true },
    _asset: { type: String, required: true },
    assetToken: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Standard", standardSchema);
