//User info Controllers
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//modals
const User = require("../models/userModel");
const Organization = require("../models/organizationModal");
const UserInfo = require("../models/userInfoModal");
const Asset = require("../models/assetsModal");

//@List of All Assets in Organization
//@ Req GET
//@URL : /api/assets/allAssets
const allOrganizationAssets = async (req, res) => {
  try {
    const id = req.query.id;
    const o_id = new mongoose.Types.ObjectId(id);
    const Assets = await Asset.find({ _dept: o_id });
    
    return res.status(200).json(Assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@specific assest info
//@ Req GET
//@URL : /api/assets/assetsInfo
const specificAssetInfo = async (req, res) => {
  try {
    const assetId  = req.query.assetId;
    const Assets = await Asset.find({ assetId });
    // const { assetId } = req.body;
    // const Assets = await Asset.find({ assetId });

    return res.status(200).json(Assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@specific assest info
//@ Req GET
//@URL : /api/assets/assetdata
const specificAssetAllData = async (req, res) => {
  try {
    const assetId  = req.query.assetId;
    // const Assets = await Asset.find({ assetId });
    
    const pipeline = [
      {
        $match: {
          // Filter sites by ID
          assetId: assetId, // Convert string ID to ObjectId
        },
      },
      {
        $lookup: {
          // Join assets table with organization
          from: "organizations", // Collection containing userinfos data
          localField: "_organization", // Field in assets referencing org ID
          foreignField: "_id", // Field in userinfos referencing admin
          as: "orgInfo", // Name for the joined site data in the output
        },
      },
      {
        $unwind: {
          path: "$orgInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_dept", //  '_organization' is the field in Dept referencing Organization
          foreignField: "_id",
          as: "deptInfo",
        },
      },
      {
        $unwind: {
          path: "$deptInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "_site", //  '_site' is the field in asset table referencing Site
          foreignField: "_id",
          as: "siteInfo",
        },
      },
      {
        $unwind: {
          path: "$siteInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
     {
      $project: {
      "deptName": "$deptInfo.deptName",
      "siteName": "$siteInfo.siteName",
      "orgName": "$orgInfo.orgName" // Include organization's name
    }
     }
    ]
    
    const data = await Asset.aggregate(pipeline);

    if (data.length === 0) {
      res.status(404).json({ message: "Asset not found" });
    } else {
      res.json(data); // Return the data from the joined collections
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@Assets Registeration
//@ Req POST
//@URL : /api/org/register
const assetsRegisteration = async (req, res) => {
  try {
    const {
      _site,
      _dept,
      _organization,
      ipAddress,
      description,
      assetValue,
      assetName,
      _assetUser,
    } = req.body;

    // const cookie = req.cookies["token"];
    // const claims = jwt.verify(cookie, process.env.JWT_KEY);
    // if (!claims) {
    //   return res.status(400).send({
    //     message: "unauthenticated",
    //   });
    // }
    if (
      !_site ||
      !_dept ||
      !_organization ||
      !ipAddress ||
      !description ||
      !assetValue ||
      !assetName ||
      !_assetUser
    ) {
      res.status(400);
      throw new Error("All fields are required");
    }
    
    const departmentAssets = await Asset.find({ _dept: new mongoose.Types.ObjectId(_dept) });

    // Check for existing asset name within the department
    const isAssetExist = departmentAssets.some((asset) => asset.assetName === assetName);
    if (isAssetExist) {
      res.status(400);
      throw new Error("Asset name already exists within this department");
    }

    // const isAssetExist = await Asset.findOne({ assetName });
    // if (isAssetExist) {
    //   res.status(400);
    //   throw new Error("Asset name already exists");
    // }

    const departmentAssetsIP = await Asset.find({ _dept: new mongoose.Types.ObjectId(_dept) });

    // Check for existing asset name within the department
    const isAssetIp = departmentAssetsIP.some((asset) => asset.ipAddress === ipAddress);
    if (isAssetIp) {
      res.status(400);
      throw new Error("Asset Ip already exist with in this department");
    }

    // const isUserInfoExist = await UserInfo.findOne({ email: orgEmail });
    // if (isUserInfoExist) {
    //   res.status(400);
    //   throw new Error("User already exist");
    // }

    const assetId = new Date().getTime().toString();
    const token = new Date().getTime().toString(13);
    const token1 = new Date().getTime().toString(36);
    const assetToken = token + token1;
    const data = {
      _site: new mongoose.Types.ObjectId(_site),
      _dept: new mongoose.Types.ObjectId(_dept),
      _organization: new mongoose.Types.ObjectId(_organization),
      ipAddress,
      description,
      assetValue,
      assetToken,
      assetName,
      assetId,
      _assetUser
    };
    const assetData = await Asset.create(data);

    return res.status(200).json({ message: "Asset Register successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@Delete Assets
//@ Req POST
//@URL : /api/assets/delete
const deleteAssets = async (req, res) => {
  try {
    // const cookie = req.cookies["token"];
    // const claims = jwt.verify(cookie, process.env.JWT_KEY);
    // if (!claims) {
    //   return res.status(400).send({
    //     message: "unauthenticated",
    //   });
    // }

    const id = req.query.id;
    const o_id = new mongoose.Types.ObjectId(id);

    await Asset.deleteOne({ _id: o_id });
    return res.status(200).json({ message: "Assets delete successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  assetsRegisteration,
  allOrganizationAssets,
  specificAssetInfo,
  deleteAssets,
  specificAssetAllData
};
