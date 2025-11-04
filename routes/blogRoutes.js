import express from "express";
import { isAuthenticated } from "../middleware/authmiddleware.js";
import { addComment, createBlog, deleteBlog, getAllBlogs, getBlogBySlug, toggleLike, updateBlog } from "../controllers/blogController.js";
import upload from "../utils/multer.js";


const router = express.Router();
router.post("/create", upload.single("coverImage"), createBlog);
router.get("/get-blogs",isAuthenticated, getAllBlogs);
router.get("/:slug",isAuthenticated, getBlogBySlug);
router.put("/update/:id", isAuthenticated, upload.single("coverImage"), updateBlog);
router.delete("/delete/:id", isAuthenticated, deleteBlog);
router.post("/:blogId/like", isAuthenticated, toggleLike);
router.post("/:blogId/comment", isAuthenticated, addComment);



export default router;
