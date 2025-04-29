//User info Controllers
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//modals
const Users = require("../models/userModel");
const UserInfo = require("../models/userInfoModal");
const Sites = require("../models/sitesModal");
const Dept = require("../models/departmentModal");
const Assets = require("../models/assetsModal");
const SuperAdmin = require("../models/superAdminModal");
const getUserInfo = async (req, res) => {
  try {
    const users = await Users.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// const userRegisteration = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       res.status(400);
//       throw new Error("All fields are required");
//     }

//     const isUserExist = await Users.findOne({ email });
//     if (isUserExist) {
//       res.status(400);
//       throw new Error("User already exists");
//     }

//     //hash Passwrod
//     const hashedPasswords = await bcrypt.hash(password, 10);

//     const user = await Users.create({ email, password: hashedPasswords });

//     if (user) {
//       res.status(201).json({ _id: user.id, email: user.email });
//     } else {
//       res.status(400);
//       throw new Error("User data is not valid");
//     }
//   } catch (error) {
//     res.status(500).json({ message: "Something went wrong" });
//   }
// };

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const user = await Users.find({ email });
    if(!user[0]){
     return res.status(400).json({ message: "Email does not exist" });
    }
    
    const isVerified = user[0].isVerified;
    const userEmail = user[0].email;
    const userInfo = await UserInfo.find({ _id: user[0]._userInfo });
    const role = userInfo[0].role;
    if (user.length === 0) {
      res.status(400);
      throw new Error("Invalid email or password");
    }
   
    
    let RedirectDynamicData;  
    if (role === "siteAdmin") {
      RedirectDynamicData = await Sites.find({
        _siteAdmin: userInfo[0]._id,
      });
      if(RedirectDynamicData.length === 0){ 
        return res.status(400).json({ message: "This user is not assigned to any site" });
      }
      console.log("RedirectDynamicData", RedirectDynamicData);
   
    }
    if (role === "deptAdmin") {
        RedirectDynamicData = await Dept.find({
        _deptAdmin: userInfo[0]._id,
      });
      if(RedirectDynamicData.length === 0){ 
        return res.status(400).json({ message: "This user is not assigned to any department" });
      }
     
    }
    if (role === "assetUser") {
        RedirectDynamicData = await Assets.find({
        _assetUser: userInfo[0]._id,
      });
      if(RedirectDynamicData.length === 0){ 
        return res.status(400).json({ message: "This user is not assigned to any asset" });
      }
    }

    if (user && (await bcrypt.compare(password, user[0].password))) {
      const accessToken = jwt.sign(
        {
          user: {
            _userInfo: user[0]._userInfo,
          },
        },
        process.env.JWT_KEY,
        { expiresIn: "1d" }
      );
      
  
      res.status(200).json({ message: "login successful", accessToken, role, id: RedirectDynamicData ? RedirectDynamicData[0]._id : null });
    } else {
      res.status(400);
      throw new Error("email or password is not valid");
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
    throw new Error("something went wrong");
  }
};

//current user
const currentUser = async (req, res) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    console.log("🚀 ~ currentUser ~ token:", token)
    
    const claims = jwt.verify(token, process.env.JWT_KEY);

    if (!claims) {
      return res.status(400).send({
        message: "unauthenticated",
      });
    }
   
    // Fetch user info
    const userInfo = await UserInfo.findOne({ _id: claims.user._userInfo });
    if (!userInfo) {
      return res.status(404).send({
        message: "User information not found",
      });
    }

    // Fetch user from User table
    const users = await UserInfo.findById(claims.user._userInfo).populate('_organization');
    const user = await Users.findOne({ _userInfo: claims.user._userInfo });
    if (!user) {
      return res.status(404).send({
        message: "User not found",
      });
    }

    // Combine data from both tables
    const { password, ...userInfoData } = userInfo.toJSON();
    const data = {
      ...userInfoData,
      isVerified: user.isVerified,
      email:user.email
    };

    res.status(200).json({ 
      data, 
      custom_policy: users._organization.custom_policy, // Include custom_policy in response
      message: "Authorized user Information" 
    });
  } catch (error) {
    res.status(400).json("User is not authorized");
  }
};

// user email verification
const verifyUserEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_KEY);
  let user;
    // Find user  
   
    if(decoded.role === "superAdmin"){
      user = await SuperAdmin.findOne({ email: decoded.email });
    }
    else{
       user = await Users.findOne({ email: decoded.email });
    }
  
    if (!user) {
      return res.status(400).json({ error: "Invalid verification link." });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ message: "Email already verified. You can log in now." });
    }

    // Update user verification status
    user.isVerified = true;
    await user.save();
   
    res
      .status(200)
      .json({ message: "Email verified successfully. Go back and refresh the page." });
  } catch (error) {
    
    res.status(400).json({ error: "Invalid or expired verification link." });
  }
};

//logout user 
const logoutUser = (req, res) => {
  
  try {
    res.cookie("OsctToken", "", { maxAge: 0 });
    res.cookie("role", "", { maxAge: 0 });
    res.cookie("id", "", { maxAge: 0 });
    res.status(200).json({ message: "User logged out" });
  } catch (error) {
    res.status(400).json({ Message: error.message });
  }
};

module.exports = {
  getUserInfo,
  loginUser,
  currentUser,
  logoutUser,
  verifyUserEmail,
};
