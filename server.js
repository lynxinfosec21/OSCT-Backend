const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const connectDb = require("./config/dbConnection");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("dotenv").config();

//Routes
const userRouter = require("./routes/userRoutes");
const organizationRouter = require("./routes/organizationRoutes");
const adminRouter = require("./routes/superAdminRoutes");
const standardRouter = require("./routes/standardRoutes");
const assetsRouter = require("./routes/assetsRoutes");
const siteRouter = require("./routes/siteRoutes");
const deptRouter = require("./routes/deptRoutes");

const PORT = process.env.PORT || 9001;

// Database connection   
connectDb();

// App
const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:3001",
  "https://osct-admin.vercel.app",
  "https://osct-frontend.vercel.app",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Optional CORS preflight middleware for specific route
app.options("/api/admin/login", cors(corsOptions), (req, res) => {
  res.sendStatus(204); // No Content
});

// Custom header middleware
app.use(function (req, res, next) {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to OSCT API");
});
app.use("/api", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/org", organizationRouter);
app.use("/api/standard", standardRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/site", siteRouter);
app.use("/api/dept", deptRouter);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("------------------------------------------------");
  console.log(`Project name: ${process.env.PROJECT}`);
  console.log(`Hosted by: ${process.env.COMPANY}`);
  console.log(`${process.env.PROJECT} backend server started`);
  console.log(`Status: Running`);
  console.log(`Listening to Port: ${PORT}`);
  console.log("------------------------------------------------");
});
