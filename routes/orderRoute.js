import express from "express";
import {
  approveAdminReturnRequest,
  approveReturnRequest,
  cancelFullOrder,
  capturePayment,
  createOrder,
  getAllOrdersByUserId,
  getAllOrdersOfAllUsers,
  getOrderDetails,
  getOrderDetailsForAdmin,
  getRecentOrders,
  requestReturnItems,
  trackOrder,
  updateOrderStatus
} from "../controllers/orderController.js";
import upload from "../utils/multer.js";
import { isAuthenticated } from "../middleware/authmiddleware.js";

const router = express.Router();
router.get("/recent", getRecentOrders);
router.post("/create", isAuthenticated, createOrder);
router.post("/capture-payment", capturePayment);
router.get("/getallorders", getAllOrdersOfAllUsers);
router.get("/get/:userId", getAllOrdersByUserId);
router.get("/details/:id", getOrderDetailsForAdmin);
router.put("/update/:id", updateOrderStatus);
router.post("/cancel/full/:id", cancelFullOrder);

router.post(
  "/return/:orderId",
  upload.fields([
    { name: "photos", maxCount: 5 },
    { name: "videos", maxCount: 3 },
  ]),
  requestReturnItems
);

router.post("/return/approve/:orderId", approveAdminReturnRequest);
router.post("/return/approve/:orderId", approveReturnRequest);
router.get("/track/:id", trackOrder);
router.get("/:id", getOrderDetails);

export default router;
