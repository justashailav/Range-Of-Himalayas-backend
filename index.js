import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import dbConnect from "./config/db.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productsRoute.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoute from "./routes/cartRoute.js";
import addressRoute from "./routes/addressRoute.js";
import wishListRoute from "./routes/wishListRoute.js";
import couponRoute from "./routes/couponRoute.js";
import customBoxRoute from "./routes/customBoxRoute.js";
import orderRoute from "./routes/orderRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import dashboardRoute from "./routes/dashboardRoute.js";
import searchRoute from "./routes/serachRoute.js";
import contactRoute from "./routes/contactRoute.js";
import galleryRoute from "./routes/galleryRoute.js";
import blogRoute from "./routes/blogRoutes.js";

const app = express();
dotenv.config();

// ---------- Middleware ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "https://rangeofhimalaya.netlify.app",
  ],
  credentials: true,
};
app.use(cors(corsOptions));

// ---------- Static Files ----------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- Database ----------
dbConnect();

// ---------- Routes ----------
app.use("/api/v1/user", userRoute);
app.use("/api/v1/admin", productRoute);
app.use("/api/v1/user", cartRoute);
app.use("/api/v1/user", productRoutes);
app.use("/api/v1/user", addressRoute);
app.use("/api/v1/user", wishListRoute);
app.use("/api/v1", couponRoute);
app.use("/api/v1/user/custom-box", customBoxRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/review", reviewRoute);
app.use("/api/v1/admin", dashboardRoute);
app.use("/api/v1/user", searchRoute);
app.use("/api/v1/user", contactRoute);
app.use("/api/v1/gallery", galleryRoute);
app.use("/api/v1/blog", blogRoute);

// ---------- Server & Socket.io ----------
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://rangeofhimalaya.netlify.app",
    ],
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

// Make io accessible to routes
app.set("io", io);

// ----- SOCKET.IO HANDLERS -----
const productViewers = {}; // Track live viewers per product

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  // ----- Order Tracking -----
  socket.on("joinOrderRoom", (orderId) => {
    socket.join(orderId);
    console.log(`🟢 Client ${socket.id} joined order room ${orderId}`);
  });

  // ----- Product View Tracking -----
  socket.on("joinProduct", (productId) => {
    if (!productId) return;
    socket.join(productId);
    productViewers[productId] = (productViewers[productId] || 0) + 1;

    // Notify everyone in that product room
    io.to(productId).emit("productViewers", productViewers[productId]);
    console.log(`👁️‍🗨️ ${productViewers[productId]} watching product ${productId}`);
  });

  socket.on("leaveProduct", (productId) => {
    if (!productId) return;
    socket.leave(productId);
    if (productViewers[productId] > 0) productViewers[productId]--;
    io.to(productId).emit("productViewers", productViewers[productId]);
    console.log(`🚪 Left product ${productId}, now ${productViewers[productId]} watching`);
  });

  // On disconnect — update counts for rooms user was in
  socket.on("disconnecting", () => {
    for (const room of socket.rooms) {
      if (productViewers[room]) {
        productViewers[room]--;
        io.to(room).emit("productViewers", productViewers[room]);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ---------- Start Server ----------
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
