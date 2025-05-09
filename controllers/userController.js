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

const userRegisteration = async (req, res) => {
  try {
    const { email, password, name, role, _organization } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user already exists
    const isUserExist = await Users.findOne({ email });
    if (isUserExist) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new UserInfo document
    const userInfo = new UserInfo({
      name,
      _organization,  // Linking the organization to the UserInfo
      role,           // Assigning the role to the UserInfo
    });

    // Save the UserInfo document
    const savedUserInfo = await userInfo.save();

    // Create the new User document and associate it with the UserInfo
    const user = new Users({
      email,
      password: hashedPassword,
      isVerified: false, // Assuming users aren't verified by default
      _userInfo: savedUserInfo._id, // Linking the user with the UserInfo document
    });

    // Save the User document
    const savedUser = await user.save();

    if (savedUser) {
      return res.status(201).json({
        _id: savedUser._id,
        email: savedUser.email,
        name: userInfo.name,
        role: userInfo.role,
        _organization: userInfo._organization,
      });
    } else {
      return res.status(400).json({ message: "User data is not valid" });
    }
  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


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
   
    // Fetch user infoD
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

// Get all users (with optional population of userInfo)
const getAllUsers = async (req, res) => {
  try {
    const users = await Users.find().populate('_userInfo'); // Optional: add .select('-password') to exclude password
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users", error: error.message });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const userId = req.query.id;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required in query params" });
    }

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._userInfo) {
      await UserInfo.findByIdAndDelete(user._userInfo);
    }

    await Users.findByIdAndDelete(userId);

    res.status(200).json({ message: `User with ID ${userId} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

module.exports = {
  getUserInfo,
  loginUser,
  currentUser,
  logoutUser,
  verifyUserEmail,
  userRegisteration,
  getAllUsers,
  deleteUserById
};
