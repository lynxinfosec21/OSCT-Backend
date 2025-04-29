//User info Controllers
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

//modals
const Users = require("../models/userModel");
const SuperAdmin = require("../models/superAdminModal");
const nodemailer = require("nodemailer");
const nodemailerConfig = require("../config/nodemailerConfig")
const transporter = nodemailer.createTransport(nodemailerConfig);
//admin registration
const superAdminRegisteration = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const isAdminExist = await SuperAdmin.findOne({ email });
    if (isAdminExist) {
      return res.status(400).json({ message: "Admin already exist" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = jwt.sign({ email: email, role: role }, process.env.JWT_KEY, {
      expiresIn: "10m",
    });

    const adminData = await SuperAdmin.create({
      name,
      email,
      password: hashedPassword,
      role,
    });
    const verificationLink = `${process.env.BASE_URL}/verify/${verificationToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Email Verification for Admin",
      html: `
          <h1>Email Verification</h1>
          <p>Thank you for registering. Please click the link below to verify your email:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 10 minutes.</p>
      `,
    });

    return res.status(200).json({ message: "Admin created successfully.Verification email sent.please verify your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get all Admins
const allSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.find();
    const result = delete superAdmins.password;
    return res.status(200).json(superAdmins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Delete Admin
const deleteAdmin = async (req, res) => {
  try {
    const id = req.query.id;
    const o_id = new mongoose.Types.ObjectId(id);

    await SuperAdmin.deleteOne({ _id: o_id });

    return res.status(200).json({ message: "Admin delete successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Admin login
const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("All fields are required");
    }

    const admin = await SuperAdmin.find({ email });
    if (admin.length === 0) {
      res.status(400);
      throw new Error("Invalid email or password");
    }
    const role = admin[0].role;
    if (admin && (await bcrypt.compare(password, admin[0].password))) {
      const accessToken = jwt.sign(
        {
          admin: {
            _id: admin[0]._id,
          },
        },
        process.env.JWT_KEY,
        { expiresIn: "1d" }
      );

      console.log("accessToken", role);

      res.status(200).json({ message: "login successful" ,accessToken, role});
    } else {
      res.status(400);
      throw new Error("email or password is not valid");
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//Current Admin information
const currentAdmin = async (req, res) => {
  try {
    
    // const cookie = req.cookies["OsctToken"];
    //headers token
    const token = req.headers["authorization"]?.split(" ")[1];
   
    const claims = jwt.verify(token, process.env.JWT_KEY);

    if (!claims) {
      return res.status(400).send({
        message: "unauthenticated",
      });
    }

    const admin = await SuperAdmin.findOne({ _id: claims.admin._id });
    if (!admin) {
      return res.status(404).send({
        message: "admin not found",
      });
    }
    
    const { password, ...data } = await admin.toJSON();
    
    res.status(200).json({ data, message: "Authorized admin Information" });
  } catch (error) {
    res.status(400).json("current admin not found");
  }
};

//Admin Logout
const superAdminLogout = async (req, res) => {
  try {
    res.cookie("OsctToken", "", { maxAge: 0 });
    res.cookie("role", "", { maxAge: 0 });
    res.cookie("id", "", { maxAge: 0 });
    res.status(200).json({ message: "Admin logged out" });
  } catch (error) {
    res.status(400).json({ Message: error.message });
  }
};

module.exports = {
  superAdminRegisteration,
  superAdminLogin,
  currentAdmin,
  superAdminLogout,
  allSuperAdmins,
  deleteAdmin,
};
