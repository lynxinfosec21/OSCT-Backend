//User info Controllers
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
// const { validate } = require("deep-email-validator");
const nodemailer = require("nodemailer");
const nodemailerConfig = require("../config/nodemailerConfig");

//modals
const User = require("../models/userModel");
const Organization = require("../models/organizationModal");
const UserInfo = require("../models/userInfoModal");
const Site = require("../models/sitesModal");
const Department = require("../models/departmentModal");
const Asset = require("../models/assetsModal");
const SuperAdmin = require("../models/superAdminModal");
const userInfoModal = require("../models/userInfoModal");
const transporter = nodemailer.createTransport(nodemailerConfig);
const cisStandard = require("../standards/cis_standard");
//@List of All Organization
//@ Req GET
//@URL : /api/org/
const allOrganizations = async (req, res) => {
  try {
    const id = req.query.id;
    const data = await Organization.find({ _admin: id });
    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@List of All Organization
//@ Req GET
//@URL : /api/org/data
const OrganizationData = async (req, res) => {
  try {
    const id = req.query.id;
    const data = await Organization.find({ _id: id });
    return res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@List of All Organization
//@ Req GET
//@URL : /api/org/getalldata
const allOrganizationData = async (req, res) => {
  try {
    const orgId = req.query.id; // Get organization ID from URL Query params

    const pipeline = [
      {
        $match: {
          // Filter organizations by ID
          _id: new mongoose.Types.ObjectId(orgId), // Convert string ID to ObjectId
        },
      },
      {
        $lookup: {
          // Join organizations with sites
          from: "sites", // Collection containing site data
          localField: "_id", // Field in organizations referencing organization ID
          foreignField: "_organization", // Field in sites referencing organization
          as: "sites", // Name for the joined site data in the output
        },
      },
      {
        $lookup: {
          // Join organizations with userinfos
          from: "userinfos", // Collection containing user data
          localField: "_id", // Field in organizations referencing organization ID
          foreignField: "_organization", // Field in sites referencing organization
          as: "userinfos", // Name for the joined usrdata data in the output
        },
      },
      {
        $lookup: {
          // Join organizations with sites
          from: "departments", // Collection containing site data
          localField: "sites._id", // Field in organizations referencing organization ID
          foreignField: "_site", // Field in sites referencing organization
          as: "sitedepartments", // Name for the joined site data in the output
        },
      },
      {
        $lookup: {
          // Join organizations with departments
          from: "assets", // Collection containing Dwepartment data
          localField: "sitedepartments._id", // Field in organizations referencing organization ID
          foreignField: "_dept", // Field in sites referencing organization
          as: "departmentassets", // Name for the joined department data in the output
        },
      },
      {
        $lookup: {
          // Join organizations with standards
          from: "standards", // Collection containing standard data
          localField: "departmentassets.assetId", // Field in organizations referencing asset ID
          foreignField: "_asset", // Field in standards referencing asset
          as: "assetcompliance", // Name for the joined standard data in the output
        },
      },

      {
        $project: {
          // Project desired fields from both collections
          organizationName: "$orgName", // Include organization name
          Sites: {
            $map: {
              input: "$sites",
              as: "site",
              in: {
                siteName: "$$site",
                departments: {
                  $map: {
                    input: {
                      $filter: {
                        // Use $filter to filter departments based on site ID
                        input: "$sitedepartments",
                        as: "department",
                        cond: { $eq: ["$$department._site", "$$site._id"] },
                      },
                    },
                    as: "department",
                    in: {
                      Departments: "$$department", // Include department name
                      Assets: {
                        $map: {
                          input: {
                            $filter: {
                              // Corrected filter for department assets
                              input: "$departmentassets",
                              as: "deptasset",
                              cond: {
                                $eq: ["$$deptasset._dept", "$$department._id"],
                              }, // Match on department ID
                            },
                          },
                          as: "depasset",

                          in: {
                            DepartmentAssets: "$$depasset",
                            ComplianceDate: {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$assetcompliance",
                                    as: "assetcomp",
                                    cond: {
                                      $eq: [
                                        "$$assetcomp.assetToken",
                                        "$$depasset.assetToken",
                                      ],
                                    },
                                  },
                                },
                                as: "compliance",
                                in: "$$compliance",
                                // {
                                //   totalComplainceScore:"$$compliance.totalComplainceScore",
                                //   totalScore:"$$compliance.totalScore"
                                // },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          user: {
            $map: {
              input: "$userinfos",
              as: "user",
              in: {
                name: "$$user.name",
                role: "$$user.role",
              },
            },
          },
        },
      },
    ];

    const data = await Organization.aggregate(pipeline);

    if (data.length === 0) {
      res.status(404).json({ message: "Organization not found" });
    } else {
      res.json(data); // Return the data from the joined collections
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@Organization Registeration
//@ Req POST
//@URL : /api/org/register
const organizationRegisteration = async (req, res) => {
  try {
    const {
      orgName,
      orgAddress,
      orgPhone,
      orgEmail,
      name,
      password,
      role,
      _admin,
    } = req.body;

    // const cookie = req.cookies["token"];
    // const claims = jwt.verify(cookie, process.env.JWT_KEY);
    // if (!claims) {
    //   return res.status(400).send({
    //     message: "unauthenticated",
    //   });
    // }

    if (
      !orgName ||
      !orgAddress ||
      !orgPhone ||
      !orgEmail ||
      !name ||
      !password ||
      !role
    ) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const isOrgExist = await Organization.findOne({ orgName });
    if (isOrgExist) {
      res.status(400);
      throw new Error("Organization name already exists");
    }

    const isOrgEmailExist = await Organization.findOne({ orgEmail });
    if (isOrgEmailExist) {
      res.status(400);
      throw new Error("Organization email already exists");
    }

    const isAdminExist = await User.findOne({ email: orgEmail });
    if (isAdminExist) {
      res.status(400);
      throw new Error("User already exist with this email");
    }

    // const isUserInfoExist = await UserInfo.findOne({ email: orgEmail });
    // if (isUserInfoExist) {
    //   res.status(400);
    //   throw new Error("User already exist");
    // }

    const OrganizationData = {
      orgName,
      orgAddress,
      orgPhone,
      orgEmail,
      _admin,
      custom_policy: cisStandard, // Store CIS standard policy in the custom_policy field
    };
    const org = await Organization.create(OrganizationData);

    const userInfoData = {
      name,
      _organization: org._id,
      role,
    };
    const userInfo = await UserInfo.create(userInfoData);
    //hash Passwrod
    const hashedPasswords = await bcrypt.hash(password, 10);

    const verificationToken = jwt.sign(
      { email: orgEmail, role: role },
      process.env.JWT_KEY,
      {
        expiresIn: "10m",
      }
    );

    const UserData = {
      email: orgEmail,
      _userinfo: userInfo._id,
      password: hashedPasswords,
    };
    const user = await User.create({
      email: orgEmail,
      _userInfo: userInfo._id,
      password: hashedPasswords,
    });

    const data = {
      ...OrganizationData,
      ...userInfoData,
      ...UserData,
    };

    const result = delete data.password;

    const verificationLink = `${process.env.BASE_URL}/verify/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: orgEmail,
      subject: "Email Verification",
      html: `
          <h1>Email Verification for Organization Admin</h1>
          <p>Thank you for registering. Please click the link below to verify your email:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 10 minutes.</p>
      `,
    });
    return res
      .status(200)
      .json({ data, message: "Organization created successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@Update Organization Information
//@ Req POST
//@URL : /api/org/update
const UpdateOrganization = async (req, res) => {
  try {
    // const cookie = req.cookies["token"];
    // const claims = jwt.verify(cookie, process.env.JWT_KEY);
    // if (!claims) {
    //   return res.status(400).send({
    //     message: "unauthenticated",
    //   });
    // }
  
    const { orgName, orgAddress, orgPhone,custom_policy } = req.body;
  
    const id = req.query.id;
    const o_id = new mongoose.Types.ObjectId(id);

    if (!orgName || !orgAddress || !orgPhone || !custom_policy) {
      res.status(400);
      throw new Error("All fields are required");
    }

    // Fetch the existing organization details
    const existingOrg = await Organization.findOne({ orgName });

    if (!existingOrg) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Merge the existing custom_policy with the new updates
    const updatedPolicy = {
      ...existingOrg.custom_policy,
      ...custom_policy,
    };

    const org = await Organization.findOneAndUpdate(
      { orgName: orgName },
      {
        $set: {
          orgName,
          orgAddress,
          orgPhone,
          custom_policy: updatedPolicy, // Update custom_policy field
        },
      },
      { new: true } // Return updated document
    );
    return res
      .status(200)
      .json({ message: "Organization updated successfully", data: org });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@Delete Organization Information
//@ Req POST
//@URL : /api/org/delete
const deleteOrganization = async (req, res) => {
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

    await Organization.deleteOne({ _id: o_id });

    return res
      .status(200)
      .json({ message: "Organization delete successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//@User Registeration for User
//@ Req POST
//@URL : /api/org/userrole
const organizationUserRole = async (req, res) => {
  try {
    const { name, email, password, role, _organization } = req.body;

    if (!name || !email || !password || !role || !_organization) {
      res.status(400);
      throw new Error("All fields are required");
    }
    // //deep email validation
    // const { valid, reason } = await validateEmail(email);
    // if (!valid) {
    //   return res
    //     .status(400)
    //     .json({ error: `Invalid email address: ${reason}` });
    // }

    // user existance in our database
    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      res.status(400);
      throw new Error("User already exists");
    }

    const userInfoData = {
      name,
      role,
      _organization,
    };
    const userInfo = await UserInfo.create(userInfoData);

    //hash Passwrod
    const hashedPasswords = await bcrypt.hash(password, 10);

    const verificationToken = jwt.sign(
      { email: email, role: role },
      process.env.JWT_KEY,
      {
        expiresIn: "10m",
      }
    );

    const UserData = {
      email,
      _userInfo: userInfo._id,
      password: hashedPasswords,
    };
    const user = await User.create(UserData);

    const data = {
      ...userInfoData,
      ...UserData,
    };

    const result = delete data.password;
    // Send verification email
    const verificationLink = `${process.env.BASE_URL}/verify/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Email Verification",
      html: `
          <h1>Email Verification</h1>
          <p>Thank you for registering. Please click the link below to verify your email:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 10 minutes.</p>
      `,
    });

    return res.status(200).json({
      message:
        "User created successfully.Verification email sent.please verify your email",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@User verification for User
//@ Req POST
//@URL : /api/org/resendverification
const resendVerification = async (req, res) => {
  try {
    const { email, role } = req.body;
    // Find user
    let user;
    if (role === "superAdmin") {
      user = await SuperAdmin.findOne({ email });
    } else {
      user = await User.findOne({ email });
      if (user) {
        // Find the user's role from the userinfos table
        const userInfo = await UserInfo.findOne({ _id: user._userInfo });

        if (userInfo) {
          // Add the role to the user object
          user.role = userInfo.role;
        } else {
          return res
            .status(400)
            .json({ message: "User information not found." });
        }
      }
    }

    if (!user) {
      return res
        .status(400)
        .json({ message: "User with this email does not exist." });
    }

    if (user.isVerified) {
      return res
        .status(400)
        .json({ message: "Email is already verified. You can log in now." });
    }

    // // Generate new verification token
    const verificationToken = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "10m" }
    );

    // // Send verification email
    const verificationLink = `${process.env.BASE_URL}/verify/${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: user.email,
      subject: "Email Verification - New Link",
      html: `
            <h1>Resend Email Verification</h1>
            <p>You requested a new email verification link. Please click the link below to verify your email:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>This link will expire in 10 minutes.</p>
        `,
    });

    res
      .status(200)
      .json({ message: "Verification email resent successfully." });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//@User Data updating api
//@ Req PUT
//@URL : /api/org/userupdate
const updateUserData = async (req, res) => {
  try {
    const { id, name, email, role } = req.body;

    // Validate that required fields are provided
    if (!id || (!name && !email)) {
      return res
        .status(400)
        .json({ message: "ID and at least one of name or email are required" });
    }

    if (role === "superAdmin") {
      // Fetch the user info from userinfos table using the provided id
      const admin_exist = await SuperAdmin.findById(id);
      if (!admin_exist) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // If email is being updated, check if it is already taken by another Admin
      if (email) {
        const isEmailTaken = await SuperAdmin.findOne({ email });
        if (isEmailTaken && isEmailTaken._id.toString() !== id) {
          return res
            .status(400)
            .json({ message: "Admin with this email already exists" });
        }

        // Update the email in the User table
        const admin = await SuperAdmin.findOne({ _id: id });
        if (admin) {
          admin.email = email;
          admin.name = name;
          await admin.save();
        } else {
          return res
            .status(404)
            .json({ message: "Admin associated with this info not found" });
        }
      }
    } else {
      // Fetch the user info from userinfos table using the provided id
      const userInfo = await UserInfo.findById(id);
      if (!userInfo) {
        return res.status(404).json({ message: "User not found" });
      }

      // If email is being updated, check if it is already taken by another user
      if (email) {
        const isEmailTaken = await User.findOne({ email });
        if (isEmailTaken && isEmailTaken._userInfo.toString() !== id) {
          return res
            .status(400)
            .json({ message: "User with this email already exists" });
        }

        // Update the email in the User table
        const user = await User.findOne({ _userInfo: id });
        if (user) {
          user.email = email;
          await user.save();
        } else {
          return res
            .status(404)
            .json({ message: "User associated with this info not found" });
        }
      }

      // Update the name in the UserInfo table
      if (name) {
        userInfo.name = name;
        await userInfo.save();
      }
    }

    return res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//@User password updating api
//@ Req PUT
//@URL : /api/org/userpasswordupdate
const updateUserPassword = async (req, res) => {
  try {
    const { id, currentPassword, newPassword, role } = req.body;

    // Validate that required fields are provided
    if (!id || (!currentPassword && !newPassword)) {
      return res.status(400).json({ message: "ID and password are required" });
    }
    if (role === "superAdmin") {
      // Fetch the user info from userinfos table using the provided id
      const admin = await SuperAdmin.findOne({ _id: id });
      if (!admin) {
        return res.status(404).json({ message: "admin not found" });
      }

      // Compare the provided current password with the stored hashed password
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        admin.password
      );
      if (!isPasswordCorrect) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password with the new hashed password
      admin.password = hashedNewPassword;
      await admin.save();
    } else {
      // Fetch the user info from userinfos table using the provided id
      const user = await User.findOne({ _userInfo: id });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Compare the provided current password with the stored hashed password
      const isPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordCorrect) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      // Hash the new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password with the new hashed password
      user.password = hashedNewPassword;
      await user.save();
    }

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//@Get Register users for Organization
//@ Req GET
//@URL : /api/org/users
const allOrganizationsUsers = async (req, res) => {
  try {
    // const role = req.query.role;
    const id = req.query.id;
    const o_id = new mongoose.Types.ObjectId(id);
    const Users = await UserInfo.aggregate([
      {
        $match: { _organization: o_id }, // Match users with the given organization ID
      },
      {
        $lookup: {
          from: "users", // Name of the User collection
          localField: "_id", // Field from UserInfo collection
          foreignField: "_userInfo", // Field from User collection to match
          as: "userDetails", // Name of the field to store the matched User document
        },
      },
      {
        $unwind: "$userDetails", // Unwind the array to flatten the user details
      },
      {
        $addFields: {
          isVerified: "$userDetails.isVerified", // Add the isVerified field from the User collection
        },
      },
      {
        $project: {
          userDetails: 0, // Exclude the entire `userDetails` field after extracting isVerified
        },
      },
    ]);
    return res.status(200).json(Users);
    // if (role === "orgAdmin") {
    //   const id = req.query.id;
    //   const o_id = new mongoose.Types.ObjectId(id);
    //   const Users = await UserInfo.find({ _organization: o_id });
    //   return res.status(200).json(Users);
    // }
    // else if (role === "siteAdmin") {
    //   const siteAdminId = req.query.id;
    //   const pipeline = [
    //     // Stage 1: Match the siteAdmin in the sites collection and get the site ID
    //     {
    //       $match: {
    //         siteAdmin: new mongoose.Types.ObjectId(siteAdminId),
    //       },
    //     },
    //     // Stage 2: Join with the departments collection
    //     {
    //       $lookup: {
    //         from: "departments",
    //         localField: "_id",
    //         foreignField: "_site",
    //         as: "departments",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$departments",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     // Stage 3: Join with the userinfos collection for deptAdmins
    //     {
    //       $lookup: {
    //         from: "userinfos",
    //         localField: "departments.deptAdmin",
    //         foreignField: "_id",
    //         as: "deptAdmins",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$deptAdmins",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     // Stage 4: Join with the assets collection using the department ID
    //     {
    //       $lookup: {
    //         from: "assets",
    //         localField: "departments._id",
    //         foreignField: "_dept",
    //         as: "assets",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$assets",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     // Stage 5: Join with the userinfos collection for assetUsers
    //     {
    //       $lookup: {
    //         from: "userinfos",
    //         localField: "assets.assetUser",
    //         foreignField: "_id",
    //         as: "assetUsers",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$assetUsers",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     // Stage 6: Group the results by siteAdmin and combine deptAdmins and assetUsers
    //     {
    //       $group: {
    //         _id: "$siteAdmin",
    //         deptAdmins: { $addToSet: "$deptAdmins" },
    //         assetUsers: { $addToSet: "$assetUsers" },
    //       },
    //     },
    //     {
    //       $project: {
    //         _id: 0,
    //         users: { $setUnion: ["$deptAdmins", "$assetUsers"] },
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$users",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //   ];

    //   const Users = await Site.aggregate(pipeline);

    //   return res.status(200).json(Users);
    // }
    // else if (role === "deptAdmin") {
    //   const deptAdminId = req.query.id;
    //   const pipeline = [
    //     // Stage 1: Match the deptAdmin in the departments collection and get the department ID
    //     {
    //       $match: {
    //         deptAdmin: new mongoose.Types.ObjectId(deptAdminId),
    //       },
    //     },
    //     // Stage 2: Join with the assets collection using the department ID
    //     {
    //       $lookup: {
    //         from: "assets",
    //         localField: "_id",
    //         foreignField: "_dept",
    //         as: "assets",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$assets",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     // Stage 3: Join with the userinfos collection for assetUsers
    //     {
    //       $lookup: {
    //         from: "userinfos",
    //         localField: "assets.assetUser",
    //         foreignField: "_id",
    //         as: "assetUsers",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$assetUsers",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //     // Stage 4: Group the results by deptAdmin and combine assetUsers
    //     {
    //       $group: {
    //         _id: "$deptAdmin",
    //         assetUsers: { $addToSet: "$assetUsers" },
    //       },
    //     },
    //     {
    //       $project: {
    //         _id: 0,
    //         users: "$assetUsers",
    //       },
    //     },
    //     {
    //       $unwind: {
    //         path: "$users",
    //         preserveNullAndEmptyArrays: true,
    //       },
    //     },
    //   ];

    //   const Users = await Department.aggregate(pipeline);

    //   return res.status(200).json(Users);
    // }
    // else {
    //   return res.status(200).json({ message: "No User under your role" });
    // }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@Get Register users based on for Organization
//@ Req GET
//@URL : /api/org/siteadmin
const siteAdminBasedOnOrgId = async (req, res) => {
  try {
    const orgId = req.query.id;
    const o_id = new mongoose.Types.ObjectId(orgId);
    const userRole = "siteAdmin";

    // Fetch the siteAdmin IDs from the sites collection
    const siteAdminsInSites = await Site.find({}, "_siteAdmin").exec();
    const siteAdminIds = siteAdminsInSites.map((site) => site._siteAdmin);

    // Find Users with the role 'siteAdmin' whose IDs are not in siteAdminIds
    const Users = await UserInfo.find({
      _organization: o_id,
      role: userRole,
      _id: { $nin: siteAdminIds },
    });

    return res.status(200).json(Users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@Get Register users based on for Organization
//@ Req GET
//@URL : /api/org/deptadmin
const deptAdminBasedOnOrgId = async (req, res) => {
  try {
    const orgId = req.query.id;
    const o_id = new mongoose.Types.ObjectId(orgId);
    const userRole = "deptAdmin";

    // Fetch the deptAdmin IDs from the departments collection
    const deptAdminsInDepartments = await Department.find(
      {},
      "_deptAdmin"
    ).exec();
    const deptAdminIds = deptAdminsInDepartments.map((dept) => dept._deptAdmin);

    // Find Users with the role 'siteAdmin' whose IDs are not in siteAdminIds
    const Users = await UserInfo.find({
      _organization: o_id,
      role: userRole,
      _id: { $nin: deptAdminIds },
    });

    return res.status(200).json(Users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//@Get Register users based on for Organization
//@ Req GET
//@URL : /api/org/assetuser
const assetUserBasedOnOrgId = async (req, res) => {
  try {
    const orgId = req.query.id;

    const o_id = new mongoose.Types.ObjectId(orgId);
    const userRole = "assetUser";

    // Fetch the assetuser IDs from the assets collection unde the attribute assetUser
    const assetUserInAssets = await Asset.find({}, "_assetUser").exec();
    const assetUserIds = assetUserInAssets
      .map((asset) => asset._assetUser)
      .filter((id) => id !== undefined)
      .map((id) => new mongoose.Types.ObjectId(id)); // Ensure all IDs are ObjectIds

    // Find Users with the role 'siteAdmin' whose IDs are not in siteAdminIds
    const Users = await UserInfo.find({
      _organization: o_id,
      role: userRole,
      _id: { $nin: assetUserIds },
    });

    return res.status(200).json(Users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//This APi is now working i join with allOrganizationUser API
//@Get Register users for Organization
//@ Req GET
//@URL : /api/org/siteuser
// const allUsersUnderSpecificSiteAdmin = async (req, res) => {
//   const siteAdminId = req.query.id;

//   try {
//     const pipeline = [
//       // Stage 1: Match the siteAdmin in the sites collection and get the site ID
//       {
//         $match: {
//           siteAdmin: new mongoose.Types.ObjectId(siteAdminId),
//         },
//       },
//       // Stage 2: Join with the departments collection
//       {
//         $lookup: {
//           from: "departments",
//           localField: "_id",
//           foreignField: "_site",
//           as: "departments",
//         },
//       },
//       {
//         $unwind: {
//           path: "$departments",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Stage 3: Join with the userinfos collection for deptAdmins
//       {
//         $lookup: {
//           from: "userinfos",
//           localField: "departments.deptAdmin",
//           foreignField: "_id",
//           as: "deptAdmins",
//         },
//       },
//       {
//         $unwind: {
//           path: "$deptAdmins",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Stage 4: Join with the assets collection using the department ID
//       {
//         $lookup: {
//           from: "assets",
//           localField: "departments._id",
//           foreignField: "_dept",
//           as: "assets",
//         },
//       },
//       {
//         $unwind: {
//           path: "$assets",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Stage 5: Join with the userinfos collection for assetUsers
//       {
//         $lookup: {
//           from: "userinfos",
//           localField: "assets.assetUser",
//           foreignField: "_id",
//           as: "assetUsers",
//         },
//       },
//       {
//         $unwind: {
//           path: "$assetUsers",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Stage 6: Group the results by siteAdmin and combine deptAdmins and assetUsers
//       {
//         $group: {
//           _id: "$siteAdmin",
//           deptAdmins: { $addToSet: "$deptAdmins" },
//           assetUsers: { $addToSet: "$assetUsers" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           users: { $setUnion: ["$deptAdmins", "$assetUsers"] },
//         },
//       },
//       {
//         $unwind: {
//           path: "$users",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//     ];

//     const Users = await Site.aggregate(pipeline);

//     return res.status(200).json(Users);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

//This APi is now working i join with allOrganizationUser API
//@Get Register users for Organization
//@ Req GET
//@URL : /api/org/siteuser
// const allUsersUnderSpecificDeptAdmin = async (req, res) => {
//   const deptAdminId = req.query.id;

//   try {
//     const pipeline = [
//       // Stage 1: Match the deptAdmin in the departments collection and get the department ID
//       {
//         $match: {
//           deptAdmin: new mongoose.Types.ObjectId(deptAdminId),
//         },
//       },
//       // Stage 2: Join with the assets collection using the department ID
//       {
//         $lookup: {
//           from: "assets",
//           localField: "_id",
//           foreignField: "_dept",
//           as: "assets",
//         },
//       },
//       {
//         $unwind: {
//           path: "$assets",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Stage 3: Join with the userinfos collection for assetUsers
//       {
//         $lookup: {
//           from: "userinfos",
//           localField: "assets.assetUser",
//           foreignField: "_id",
//           as: "assetUsers",
//         },
//       },
//       {
//         $unwind: {
//           path: "$assetUsers",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//       // Stage 4: Group the results by deptAdmin and combine assetUsers
//       {
//         $group: {
//           _id: "$deptAdmin",
//           assetUsers: { $addToSet: "$assetUsers" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           users: "$assetUsers",
//         },
//       },
//       {
//         $unwind: {
//           path: "$users",
//           preserveNullAndEmptyArrays: true,
//         },
//       },
//     ];

//     const Users = await Department.aggregate(pipeline);

//     return res.status(200).json(Users);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// @Get Register users for Organization
// @ Req GET
// @URL : /api/org/currentuserdata
const currentUserData = async (req, res) => {
  const Role = req.query.role;

  const userId = req.query.id;

  try {
    if (Role === "superAdmin") {
      // Query for superAdmin
      const superAdmin = await SuperAdmin.findById(userId).select(
        "name email role"
      );

      if (!superAdmin) {
        return res.status(404).json({ message: "SuperAdmin not found" });
      }

      return res.status(200).json([superAdmin]);
    } else {
      const pipeline = [
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userId),
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_userInfo",
            as: "userdata",
          },
        },
        {
          $unwind: {
            path: "$userdata",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "organizations",
            localField: "_organization",
            foreignField: "_id",
            as: "orgdata",
          },
        },
        {
          $unwind: {
            path: "$orgdata",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            name: 1,
            role: 1,
            email: "$userdata.email",
            orgName: "$orgdata.orgName",
          },
        },
        {
          $unwind: {
            path: "$users",
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      const Users = await UserInfo.aggregate(pipeline);

      return res.status(200).json(Users);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// //Delete Admin
// const deleteAdmin = async (req, res) => {
//   try {
//     const id = req.query.id;
//     const o_id = mongoose.Types.ObjectId(id);
//     await SuperAdmin.deleteOne({ _id: o_id });
//     return res.status(200).json({ message: "Admin delete successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
module.exports = {
  organizationRegisteration,
  UpdateOrganization,
  deleteOrganization,
  allOrganizations,
  allOrganizationData,
  organizationUserRole,
  allOrganizationsUsers,
  siteAdminBasedOnOrgId,
  deptAdminBasedOnOrgId,
  assetUserBasedOnOrgId,
  currentUserData,
  updateUserData,
  resendVerification,
  updateUserPassword,
  OrganizationData
};
