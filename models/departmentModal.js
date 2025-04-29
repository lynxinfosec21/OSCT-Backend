const mongoose = require("mongoose");

const departmentsSchema = mongoose.Schema(
  {
    _organization: {
      type: mongoose.Schema.Types.ObjectId,
      res: "Organization",
      required: true,
    },
    _site: {
      type: mongoose.Schema.Types.ObjectId,
      res: "Site",
      required: true,
    },
    deptName: {
      type: String,
      required: true,
    },
    _deptAdmin :{
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentsSchema);
