const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const Blog = require("../models/blog");
const Comment = require("../models/comment");
const router = Router();

// Configure Cloudinary
cloudinary.config({ 
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
 api_key: process.env.CLOUDINARY_API_KEY, 
 api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
   return res.render("addBlog", {
       user: req.user,
   });
});

router.get("/:id", async (req, res) => {
   const blog = await Blog.findById(req.params.id).populate('createdBy');
   const comments = await Comment.find({blogId: req.params.id}).populate(`createdBy`);
   return res.render("blog", {
       user: req.user,
       blog,
       comments,
   });
});

router.post("/", upload.single("coverImage"), async (req, res) => {
   try {
       const {title, body} = req.body;
       
       // Convert buffer to base64
       const b64 = Buffer.from(req.file.buffer).toString("base64");
       let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
       
       // Upload to Cloudinary
       const uploadResponse = await cloudinary.uploader.upload(dataURI, {
           resource_type: 'auto',
           folder: 'blogify'
       });

       // Create blog with Cloudinary URL
       const blog = await Blog.create({
           body,
           title,
           createdBy: req.user._id,
           coverImageURL: uploadResponse.secure_url, // Use Cloudinary URL
       });

       return res.redirect(`/blog/${blog._id}`);
   } catch (error) {
       console.error('Error uploading to Cloudinary:', error);
       return res.status(500).render("error", { 
           error: "Error creating blog post",
           user: req.user 
       });
   }
});

router.post(`/comment/:blogId`, async (req, res) => {
   await Comment.create({
       content: req.body.content,
       blogId: req.params.blogId,
       createdBy: req.user._id,
   });
   return res.redirect(`/blog/${req.params.blogId}`);
});

module.exports = router;