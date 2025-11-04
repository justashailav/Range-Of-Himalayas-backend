import { uploadMedia } from "../config/cloudinary.js";
import Blog from "../models/blogModel.js";
export const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      author,
      tags,
      metaTitle,
      metaDescription,
      category,
    } = req.body;

    if (!title || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Title and content are required" });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    let coverImageUrl = "";
    if (req.file) {
      const uploadCoverImage = await uploadMedia(req.file.path);
      coverImageUrl = uploadCoverImage.secure_url;
    }
    const blog = await Blog.create({
      title,
      slug,
      content,
      author: author || "Range of Himalayas Team",
      coverImage: coverImageUrl,
      category: category || "Other",
      tags,
      metaTitle: metaTitle || title,
      metaDescription:
        metaDescription || content.substring(0, 150) + "...",
      isPublished: true,
    });

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const userId = req.user?._id;
    const blogs = await Blog.find({ isPublished: true }).sort({ createdAt: -1 });
    const formattedBlogs = blogs.map((blog) => ({
      ...blog.toObject(),
      likesCount: blog.likes?.length || 0,
      isLiked: userId ? blog.likes.some((id) => id.equals(userId)) : false,
    }));

    res.status(200).json({
      success: true,
      count: formattedBlogs.length,
      data: formattedBlogs,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};


export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?._id;
    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const blogData = {
      ...blog.toObject(),
      likesCount: blog.likes?.length || 0,
      isLiked: userId ? blog.likes.some((id) => id.equals(userId)) : false,
    };

    res.status(200).json({
      success: true,
      data: blogData,
    });
  } catch (error) {
    console.error("Error fetching blog:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.title) {
      updates.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }
    if (req.file) {
      const uploadCoverImage = await uploadMedia(req.file.path);
      updates.coverImage = uploadCoverImage.secure_url;
    } else {
      updates.coverImage = existingBlog.coverImage;
    }

    const blog = await Blog.findByIdAndUpdate(id, updates, { new: true });

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    res.status(200).json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user._id;

    console.log("blogId",blogId)

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const isLiked = blog.likes.includes(userId);

    if (isLiked) {
      blog.likes.pull(userId);
    } else {
      blog.likes.push(userId);
    }

    await blog.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Blog unliked" : "Blog liked",
      likesCount: blog.likes.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;
    const username = req.user.name || "Anonymous";

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    const newComment = {
      user: userId,
      username,
      comment,
    };

    blog.comments.push(newComment);
    await blog.save();

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comments: blog.comments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};