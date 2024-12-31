require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookiePaser = require("cookie-parser")

const Blog = require("./models/blog");

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");


const { checkForAuthenticationCookie } = require("./middlewares/authentication");

const app = express();
const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("MongoDB connection error:", err));

  
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(cookiePaser());
app.use(checkForAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));


app.get("/", async (req, res) => {
    // console.log("req.user:", req.user);
    const allBlogs = await Blog.find({});
    res.render("home", {
        user: req.user,
        blogs: allBlogs,
    });
});

app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.listen(PORT, () => console.log(`Server Started at port: ${PORT}`));
