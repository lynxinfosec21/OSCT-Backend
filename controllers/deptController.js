const mongoose = require("mongoose");

//modals
const Dept = require("../models/departmentModal");

//@Site Registration
//@ Req POST
//@URL : /api/dept/alldept
const getAllDept = async (req, res) => {
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
    const AllDepart = await Dept.find({ _site: o_id });

    return res.status(200).json(AllDepart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@Site Registration
//@ Req POST
//@URL : /api/dept/getsite
const getSiteIdByDeptId = async (req, res) => {
  try {

    const deptId = req.query.id;

    if (!deptId) {
      return res.status(400).json({ message: "Required id" });
    }

    const o_id = new mongoose.Types.ObjectId(deptId);
    const department = await Dept.findById(o_id).select('_site');

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res.status(200).json({ siteId: department._site });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@Site Registration
//@ Req POST
//@URL : /api/dept/specific
const getSpecificDeptData = async (req, res) => {
  try {
    const deptId = req.query.id;

    const pipeline = [
      {
        $match: {
          // Filter sites by ID
          _id: new mongoose.Types.ObjectId(deptId), // Convert string ID to ObjectId
        },
      },
      {
        $lookup: {
          // Join deppartment table with userinfos
          from: "userinfos", // Collection containing userinfos data
          localField: "_deptAdmin", // Field in departments referencing admin ID
          foreignField: "_id", // Field in userinfos referencing admin
          as: "deptAdminInfo", // Name for the joined site data in the output
        },
      },
      {
        $unwind: {
          path: "$deptAdminInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "organizations",
          localField: "_organization", //  '_organization' is the field in Dept referencing Organization
          foreignField: "_id",
          as: "organizationInfo",
        },
      },
      {
        $unwind: {
          path: "$organizationInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "sites",
          localField: "_site", //  '_site' is the field in Dept referencing Site
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
      deptName: 1,
      "adminName": "$deptAdminInfo.name", // Include admin's name
      "siteName": "$siteInfo.siteName",
      "orgName": "$organizationInfo.orgName" // Include organization's name
    }
     }
    ]
    
    const data = await Dept.aggregate(pipeline);
    
    if (data.length === 0) {
      res.status(404).json({ message: "Department not found" });
    } else {
      res.json(data); // Return the data from the joined collections
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@Dept Registration
//@ Req POST
//@URL : /api/dept/register
const deptRegistration = async (req, res) => {
  try {
    
    const { _organization, _site, deptName,_deptAdmin } = req.body;
    if (!_organization || !_site || !deptName || !_deptAdmin) {
      res.status(400);
      throw new Error("All fields are required");
    }
    const siteDepartments = await Dept.find({ _site: new mongoose.Types.ObjectId(_site) });
    
    const isDeptExist =  siteDepartments.some((dept) => dept.deptName === deptName);
    if (isDeptExist) {
      return res
        .status(400)
        .json({ message: "Department Already Registered with in this site" });
    }
    
    const deptData = {
      _organization,
      _site,
      deptName,
      _deptAdmin,
    };
    
   const depts = await Dept.create(deptData);

  
    return res.status(200).json({ message: "Dept Registerd successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong"});
  }
};

//@Dept deletion
//@ Req POST
//@URL : /api/dept/delete
const deptDelete = async (req, res) => {
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
      res.status(400).json({ message: "requird id" });
    }
    const o_id = new mongoose.Types.ObjectId(id);
    await Dept.deleteOne({ _id: o_id });

    return res.status(200).json({ message: "Department delete successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went Wrong" });
  }
};

module.exports = { deptRegistration, deptDelete, getAllDept,getSpecificDeptData,getSiteIdByDeptId };
