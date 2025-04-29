const mongoose = require("mongoose");

const sitesSchema = mongoose.Schema(
  {
    _organization: {
      type: mongoose.Schema.Types.ObjectId,
      res: "Organization",
      required: true,
    },
    siteName: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    _siteAdmin :{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Site", sitesSchema);
