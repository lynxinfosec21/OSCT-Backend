const mongoose = require("mongoose");

//modals
const Site = require("../models/sitesModal");
const Dept = require("../models/departmentModal");
const Asset = require("../models/assetsModal");
//@All Sites
//@ Req POST
//@URL : /api/site/allsites
const getAllSites = async (req, res) => {
  try {
    // const cookie = req.cookies["token"];
    // const claims = jwt.verify(cookie, process.env.JWT_KEY);
    // if (!claims) {
    //   return res.status(400).send({
    //     message: "unauthenticated",
    //   });
    // }

    const id = req.query.id;
    if (!id) {
      res.status(400).json({ message: "Required id" });
    }

    const o_id = new mongoose.Types.ObjectId(id);
    const AllSites = await Site.find({ _organization: o_id });
    
    return res.status(200).json(AllSites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@All Sites
//@ Req POST
//@URL : /api/site/allsites
const getSpecificSiteData = async (req, res) => {
  try {
    const siteId = req.query.id;
    
    const pipeline = [
      {
        $match: {
          // Filter sites by ID
          _id: new mongoose.Types.ObjectId(siteId), // Convert string ID to ObjectId
        },
      },
      {
        $lookup: {
          // Join sites table with userinfos
          from: "userinfos", // Collection containing userinfos data
          localField: "_siteAdmin", // Field in sites referencing admin ID
          foreignField: "_id", // Field in userinfos referencing admin
          as: "siteAdminInfo", // Name for the joined site data in the output
        },
      },
      {
        $unwind: "$siteAdminInfo" // Unwind siteAdminInfo array to get a single object
      },
      {
        $lookup: {
          // Join organizations with userinfos
          from: "organizations", // Collection containing user data
          localField: "siteAdminInfo._organization", // Field in organizations referencing organization ID
          foreignField: "_id", // Field in sites referencing organization
          as: "organizationInfo", // Name for the joined usrdata data in the output
        },
      },
      {
        $unwind: "$organizationInfo" // Unwind organizationInfo array to get a single object
      },
     {
      $project: {
      siteName: "$siteName",
      sitelocation: "$location",
      "adminName": "$siteAdminInfo.name", // Include admin's name
      "orgName": "$organizationInfo.orgName" // Include organization's name
    }
     }
    ]
    
    const data = await Site.aggregate(pipeline);

    if (data.length === 0) {
      res.status(404).json({ message: "Organization not found" });
    } else {
      res.json(data); // Return the data from the joined collections
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@All Sites
//@ Req POST
//@URL : /api/site/specific
const getSitesBasedOnRole = async (req, res) => {
  try {
   
    const id = req.query.id;
    let AllSites;
    let AllSiteDept;
    let AllSiteDeptAsset;
    if (!id) {
      res.status(400).json({ message: "Required id" });
    }

    const o_id = new mongoose.Types.ObjectId(id);
    const AllSitesBySiteAdmin = await Site.find({ siteAdmin: o_id });
    AllSites=AllSitesBySiteAdmin;

   if (!AllSites.length) {
      // If no sites found, perform aggregation
      AllSiteDept = await Dept.aggregate([
        { $match: { deptAdmin: o_id } }, // Match deptAdmin with the given ID
        {
          $lookup: {
            from: "sites", // The collection name to join with
            localField: "_site", // The field from the Department collection
            foreignField: "_id", // The field from the Site collection
            as: "siteDetails" // The output array field
          }
        },
        { $unwind: "$siteDetails" }, // Unwind the siteDetails array
        { $replaceRoot: { newRoot: "$siteDetails" } } // Replace the root with siteDetails
      ]);
      AllSites=AllSiteDept;
      if(!AllSites.length){
        AllSiteDeptAsset = await Asset.aggregate([
          { $match: { assetUser: o_id } }, // Match deptAdmin with the given ID
          {
            $lookup: {
              from: "sites", // The collection name to join with
              localField: "_site", // The field from the Department collection
              foreignField: "_id", // The field from the Site collection
              as: "siteDetails" // The output array field
            }
          },
          { $unwind: "$siteDetails" }, // Unwind the siteDetails array
          { $replaceRoot: { newRoot: "$siteDetails" } } // Replace the root with siteDetails
        ]);
        AllSites=AllSiteDeptAsset;
      }
    }

    return res.status(200).json(AllSites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@Site Registration
//@ Req POST
//@URL : /api/site/register
const siteRegistration = async (req, res) => {
  try {
    const { _organization, siteName, location,_siteAdmin } = req.body;

    if (!_organization || !siteName || !location || !_siteAdmin) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const isSiteExist = await Site.findOne({ siteName });
    if (isSiteExist) {
      if (isSiteExist._organization.toString() === _organization) {
        return res.status(400).json({ message: "Site Already Registered" });
      }
    }
    const siteData = {
      _organization,
      siteName,
      location,
      _siteAdmin,
    };
    const site = await Site.create(siteData);

    return res.status(200).json({ message: "Site Registerd successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Something went wrong", exactError: error.message });
  }
};

//@Site Deletion
//@ Req POST
//@URL : /api/site/delete
const siteDelete = async (req, res) => {
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

    await Site.deleteOne({ _id: o_id });

    return res.status(200).json({ message: "Site delete successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went Wrong" });
  }
};

module.exports = { siteRegistration, siteDelete, getAllSites, getSitesBasedOnRole , getSpecificSiteData};
