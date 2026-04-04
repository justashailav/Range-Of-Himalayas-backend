import { uploadMedia } from "../config/cloudinary.js";
import { Coupon } from "../models/AdminModel/couponModal.js";
import { Products } from "../models/AdminModel/productsModel.js";
import { Cart } from "../models/cartModel.js";
import { Order } from "../models/Order.js";
import { User } from "../models/userModel.js";
import { generateOrderEmailTemplate } from "../utils/emailTemplate.js";
import { generateInvoicePDFBuffer } from "../utils/generateInvoicePDF.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import razorpay from "../utils/razorpay.js";

import {
  createICCOrder,
  trackICCShipment,
} from "../utils/iccService.js";

const adjustStock = async (cartItems, type = "deduct") => {
  const factor = type === "deduct" ? -1 : 1;

  for (const item of cartItems) {
    try {
      const product = await Products.findById(item.productId);
      if (!product) {
        console.warn(`❌ Product not found: ${item.productId}`);
        continue;
      }

      const selectedSize = item.selectedSize || item.size;
      const selectedWeight = item.selectedWeight || item.weight;

      // 🔍 Match variant by both size & weight
      const variant = product.variants?.find(
        (v) =>
          v.size === selectedSize &&
          (v.weight === selectedWeight || v.weight == item.weight),
      );

      if (!variant) {
        console.warn(
          `⚠️ Variant not found for ${product.title} (${selectedSize}, ${selectedWeight}kg)`,
        );
        continue;
      }
      variant.stock = Math.max(
        (variant.stock || 0) + factor * item.quantity,
        0,
      );
      product.markModified("variants");
      await product.save();

      console.log(
        `✅ Stock updated: ${product.title} (${variant.size}, ${variant.weight}kg) = ${variant.stock}`,
      );
    } catch (err) {
      console.error(
        `💥 Error updating stock for ${item.productId}:`,
        err.message,
      );
    }
  }
};

const restoreStock = async (cartItems, boxes) => {
  for (const item of cartItems) {
    const product = await Products.findById(item.productId);
    if (!product) continue;

    const selectedSize = item.selectedSize || item.size;
    const variant = product.variants?.find((v) => v.size === selectedSize);
    if (variant) {
      variant.stock = (variant.stock || 0) + item.quantity;
      product.markModified("variants");
      await product.save();
    }
  }

  for (const box of boxes) {
    for (const item of box.items) {
      const product = await Products.findById(item.productId);
      if (!product) continue;
      const sizeObj = product.variants?.find((v) => v.size === item.size);
      if (sizeObj) {
        sizeObj.stock = (sizeObj.stock || 0) + item.quantity;
        product.markModified("variants");
        await product.save();
      }
    }
  }
};

export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems = [],
      boxes = [],
      addressInfo,
      paymentMethod, // "razorpay" | "cod"
      totalAmount,
      cartId,
      code,
    } = req.body;

    if (!userId || (!cartItems.length && !boxes.length)) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    if (!["razorpay", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ✅ STOCK VALIDATION
    for (const item of cartItems) {
      const product = await Products.findById(item.productId);
      if (!product || product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product?.title || "product"}`,
        });
      }
    }

    // ✅ COUPON VALIDATION
    let coupon = null;
    const formattedCode =
      typeof code === "string" && code.trim()
        ? code.toUpperCase().trim()
        : null;

    if (formattedCode) {
      coupon = await Coupon.findOne({ code: formattedCode });

      if (!coupon || !coupon.isActive || new Date() > coupon.expiresAt) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired coupon.",
        });
      }
    }

    const COD_ADVANCE = 200;

    // 🔥 If COD → pay only ₹200 now
    const payableAmount = paymentMethod === "cod" ? COD_ADVANCE : totalAmount;

    // ✅ CREATE ORDER FIRST (status pending)
    const newOrder = await new Order({
      userId,
      cartItems,
      boxes,
      addressInfo,
      paymentMethod,
      totalAmount,
      cartId,
      code: coupon ? coupon._id : null,
      orderStatus: "pending",
      paymentStatus: "pending",

      ...(paymentMethod === "cod" && {
        codAdvanceAmount: COD_ADVANCE,
        codRemainingAmount: totalAmount - COD_ADVANCE,
        codAdvancePaid: false,
      }),
    }).save();

    // ==============================
    // 💳 CREATE RAZORPAY ORDER
    // ==============================
    const razorpayOrder = await razorpay.orders.create({
      amount: payableAmount * 100, // paise
      currency: "INR",
      receipt: `receipt_${newOrder._id}`,
    });

    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();

    return res.status(201).json({
      success: true,
      message:
        paymentMethod === "cod"
          ? "Pay ₹200 advance to confirm COD order"
          : "Complete payment to place order",
      orderId: newOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("🔥 Order creation error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
async function updateCouponUsage(code, userId) {
  try {
    const normalizedCode = code.toUpperCase().trim();
    console.log("🧾 updateCouponUsage() called with:", {
      normalizedCode,
      userId,
    });

    const coupon = await Coupon.findOne({ code: normalizedCode });
    if (!coupon) {
      console.warn("⚠️ Coupon not found while updating usage:", normalizedCode);
      return;
    }

    const existingUser = coupon.usedBy.find(
      (entry) => entry.user.toString() === userId.toString(),
    );

    if (existingUser) {
      await Coupon.updateOne(
        { code: normalizedCode, "usedBy.user": userId },
        { $inc: { "usedBy.$.count": 1, usedCount: 1 } },
      );
      console.log("✅ Incremented coupon usage for existing user.");
    } else {
      await Coupon.updateOne(
        { code: normalizedCode },
        {
          $push: { usedBy: { user: userId, count: 1 } },
          $inc: { usedCount: 1 },
        },
      );
      console.log("✅ Added new user usage record for coupon.");
    }

    const updatedCoupon = await Coupon.findOne({ code: normalizedCode });
    console.log("📊 Updated coupon usage data:", {
      usedCount: updatedCoupon.usedCount,
      usedBy: updatedCoupon.usedBy,
    });
  } catch (err) {
    console.error("❌ Error updating coupon usage:", err);
  }
}

async function sendOrderEmail(user, order, boxes) {
  const boxProductIds = boxes.flatMap((b) => b.items.map((i) => i.productId));

  const cartProductIds = order.cartItems.map((i) => i.productId);

  const allProductIds = [...boxProductIds, ...cartProductIds];

  const allProducts = await Products.find({
    _id: { $in: allProductIds },
  }).lean();

  const emailMessage = generateOrderEmailTemplate(order, allProducts);

  // ✅ PASS USER HERE
  const pdfBuffer = await generateInvoicePDFBuffer(order, allProducts, user);

  await sendEmail({
    email: user.email,
    subject: "Order Confirmation",
    message: emailMessage,
    attachments: [
      {
        filename: `invoice_${order._id}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  console.log("📧 Confirmation email sent to:", user.email);
}
export const capturePayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      console.log("❌ Order not found");
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // 1. Double Payment Protection
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Already paid" });
    }

    // 2. ID Validation
    if (order.razorpayOrderId !== razorpay_order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Order ID mismatch" });
    }

    // 3. Signature Verification
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.log("❌ Signature mismatch");
      order.paymentStatus = "failed";
      await order.save();
      return res
        .status(400)
        .json({ success: false, message: "Verification failed" });
    }

    console.log("✅ Signature verified successfully");

    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;

    if (order.paymentMethod === "razorpay") {
      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";
    } else if (order.paymentMethod === "cod") {
      order.paymentStatus = "partial_paid";
      order.codAdvancePaid = true;
      order.orderStatus = "confirmed";
    }

    order.statusHistory.push({ status: "confirmed", updatedAt: new Date() });
    order.orderUpdateDate = new Date();

    // Deduct stock, handle coupons, and clear cart
    await adjustStock(order.cartItems, "deduct");

    if (order.code) {
      const couponDoc = await Coupon.findById(order.code);
      if (couponDoc) await updateCouponUsage(couponDoc.code, order.userId);
    }

    await Cart.findOneAndUpdate(
      { userId: order.userId },
      { items: [], boxes: [] },
    );
    await order.save();
    console.log("✅ Database record finalized");

    // ===============================
    // 🚀 CREATE COURIER ORDER (ICC)
    // ===============================
    const triggerCourier = async (orderId) => {
  try {
    console.log("🚀 TriggerCourier START");

    const order = await Order.findById(orderId);

    if (!order) {
      console.log("❌ Order not found");
      return;
    }

    if (order.courierOrderId) {
      console.log("⚠️ Courier already created");
      return;
    }

    if (order.orderStatus !== "shipped") {
      console.log("⏸ Not shipped yet, skipping ICC");
      return;
    }

    console.log("📦 Creating ICC order...");

    const courierRes = await createICCOrder(order);

    console.log("📦 ICC CREATE RESPONSE:", courierRes);

    const iccOrderId = courierRes?.userOrderId;

    if (!iccOrderId) {
      throw new Error("❌ ICC orderId missing");
    }

    console.log("🧾 ICC Order ID:", iccOrderId);

    await Order.findByIdAndUpdate(order._id, {
      courier: "ICC",
      courierOrderId: iccOrderId,
      shippingStatus: "created",
    });

    console.log("✅ ICC order created successfully");
  } catch (err) {
    console.error("❌ TriggerCourier ERROR:", err);

    await Order.findByIdAndUpdate(orderId, {
      shippingStatus: "failed",
    });
  }
};

// ✅ correct call
triggerCourier(order._id);

    const triggerEmail = async () => {
      try {
        const user = await User.findById(order.userId);
        if (user) {
          console.log("📧 Attempting to send confirmation email...");
          await sendOrderEmail(user, order, order.boxes);
          console.log("✅ Email sent successfully");
        }
      } catch (emailError) {
        // This logs the timeout but doesn't crash the payment process
        console.error(
          "Critical Email Error (Non-blocking):",
          emailError.message,
        );
      }
    };

    // Execute email as a background task
    triggerEmail();

    console.log("========== RAZORPAY VERIFY END ==========");

    // RETURN SUCCESS IMMEDIATELY
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("❌ capturePayment error:", error);
    // This only triggers if the DB operations or Signature check fail
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this user.",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error occurred while fetching orders.",
    });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error occurred while fetching the order.",
    });
  }
};

export const getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const {
      filter,
      orderDate, // Destructure the date object sent from frontend
      status,
      orderId,
      customer,
      paymentStatus,
      minAmount,
      maxAmount,
    } = req.query;

    const query = {};

    // 1. Check if Frontend sent a direct $gte/$lte object
    if (orderDate && typeof orderDate === "object") {
      query.createdAt = {}; // Still use createdAt for backend consistency
      if (orderDate.$gte) query.createdAt.$gte = new Date(orderDate.$gte);
      if (orderDate.$lte) query.createdAt.$lte = new Date(orderDate.$lte);
    }
    // 2. Fallback to the 'filter' string logic (today, week, etc.)
    else if (filter) {
      const now = new Date();
      if (filter === "today") {
        query.createdAt = {
          $gte: new Date(now.setHours(0, 0, 0, 0)),
          $lte: new Date(now.setHours(23, 59, 59, 999)),
        };
      } else if (filter === "yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        query.createdAt = {
          $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
          $lte: new Date(yesterday.setHours(23, 59, 59, 999)),
        };
      } else if (filter === "week") {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        query.createdAt = { $gte: weekAgo.setHours(0, 0, 0, 0) };
      } else if (filter === "month") {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        query.createdAt = { $gte: monthAgo.setHours(0, 0, 0, 0) };
      }
    }

    // --- OTHER FILTERS ---
    if (orderId) query._id = orderId.trim();

    if (customer) {
      query.$or = [
        { "userInfo.name": { $regex: customer, $options: "i" } },
        { "userInfo.email": { $regex: customer, $options: "i" } },
      ];
    }

    if (status && status !== "all") query.orderStatus = status;

    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = Number(minAmount);
      if (maxAmount) query.totalAmount.$lte = Number(maxAmount);
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Logistics Sync Error" });
  }
};

export const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params; // orderId
    const { orderStatus } = req.body; // new status

    console.log("🔄 Updating order status:", id, "→", orderStatus);

    // 1️⃣ Find order
    const order = await Order.findById(id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // 2️⃣ Find user
    const user = await User.findById(order.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 3️⃣ Update order details
    order.orderStatus = orderStatus;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: orderStatus,
      updatedAt: new Date(),
    });
    order.orderUpdateDate = new Date();

    await order.save({ validateBeforeSave: false });

    if (orderStatus === "shipped") {
  try {
    console.log("🚚 Triggering ICC shipment...");

    if (!order.courierOrderId) {
      const courierRes = await createICCOrder(order);

      console.log("📦 ICC RESPONSE:", courierRes);

      const iccOrderId = courierRes?.userOrderId;

      if (!iccOrderId) {
        throw new Error("❌ ICC orderId missing");
      }

      console.log("🧾 ICC Order ID:", iccOrderId);

      // ✅ SAVE (NO BOOKING)
      order.courier = "ICC";
      order.courierOrderId = iccOrderId;

      order.awb = null; // will come later from tracking
      order.shipmentId = null;

      order.shippingStatus = "created"; // 🔥 important

      await order.save({ validateBeforeSave: false });

      console.log("✅ ICC order created successfully");
    }
  } catch (err) {
    console.error("❌ Shipment error FULL:", err);

    order.shippingStatus = "failed";
    await order.save({ validateBeforeSave: false });
  }
}

    // 4️⃣ Emit real-time update via socket.io
    const io = req.app.get("io");
    if (io) {
      io.to(id).emit("orderStatusUpdated", {
        orderId: id,
        status: orderStatus,
        updatedAt: order.orderUpdateDate,
      });
      console.log("📡 orderStatusUpdated event emitted via socket.io");
    }

    // 5️⃣ Send Email Notification
    if (user.email) {
      console.log("📧 Preparing to send email to:", user.email);

      let statusColor = "#333";
      let subjectLine = "";
      let messageBody = "";

      switch (orderStatus.toLowerCase()) {
        case "packed":
          statusColor = "#f0ad4e";
          subjectLine = `Your Order Has Been Packed 🎁`;
          messageBody = `Your order has been carefully packed with care and freshness. It’s almost ready to ship!`;
          break;

        case "shipped":
          statusColor = "#0275d8";
          subjectLine = `Your Order  is On Its Way 🚚`;
          messageBody = `Good news! Your package has been shipped and is making its way to you. You’ll taste the Himalayas soon!`;
          break;

        case "out_for_delivery":
          statusColor = "#00bcd4";
          subjectLine = `Your Order is Out for Delivery 🚀`;
          messageBody = `Get ready! Your order is out for delivery and will reach you shortly. Please keep your phone handy.`;
          break;

        case "delivered":
          statusColor = "#5cb85c";
          subjectLine = `Your Order Has Been Delivered 🏡`;
          messageBody = `We’re delighted to inform you that your order has been successfully delivered. Enjoy your fresh fruits straight from the Himalayas! 🍎`;
          break;

        case "cancelled":
          statusColor = "#d9534f";
          subjectLine = `Your Order Has Been Cancelled ❌`;
          messageBody = `Your order has been cancelled as per your request or due to an issue with delivery. Any applicable refunds will be processed shortly.`;
          break;

        case "rejected":
          statusColor = "#e53935";
          subjectLine = `Your Order Has Been Rejected 🚫`;
          messageBody = `We’re sorry to inform you that your order has been rejected due to unforeseen issues. If you’ve made any payment, it will be refunded soon.`;
          break;

        default:
          subjectLine = `Update on Your Order `;
          messageBody = `Your order status has been updated to <b>${orderStatus}</b>.`;
      }

      const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #fffaf8; padding: 20px; border-radius: 10px;">
          <h2 style="color:${statusColor};">${subjectLine}</h2>
          <p>Hi ${user.name || "there"},</p>
          <p>${messageBody}</p>
          <p><b>Order ID:</b> #${order._id}</p>
          <p><b>Updated On:</b> ${new Date(
            order.orderUpdateDate,
          ).toLocaleString()}</p>
          <hr style="border:none; border-top:1px solid #eee; margin: 20px 0;">
          <p>Thank you for choosing <b>Range of Himalayas</b> 🌄🍏<br/>
          Fresh from the mountains, delivered with care.</p>
          <p style="font-size:12px; color:#999;">This is an automated message — please do not reply.</p>
        </div>
      `;

      try {
        await sendEmail({
          email: user.email,
          subject: subjectLine,
          message,
        });
        console.log("✅ Email sent successfully to:", user.email);
      } catch (err) {
        console.error("🚨 Error sending email:", err.message);
      }
    } else {
      console.warn("⚠️ User email not found, skipping email notification");
    }

    // 6️⃣ Final Response
    return res.status(200).json({
      success: true,
      message: "Order status updated successfully and email sent!",
      data: order,
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating order status",
      error: error.message,
    });
  }
};

export const cancelFullOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ⏳ 24 hour cancellation window
    const now = new Date();
    const diffHours = (now - new Date(order.createdAt)) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return res.status(400).json({
        success: false,
        message: "Cancellation window expired",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled",
      });
    }

    // 🔄 Restore stock
    await restoreStock(order.cartItems, order.boxes);

    order.orderStatus = "cancelled";
    order.cancelStatus = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      updatedAt: new Date(),
    });

    order.orderUpdateDate = new Date();

    let refundAmount = 0;

    // ==================================
    // 💰 RAZORPAY REFUND LOGIC
    // ==================================

    // ✅ FULL ONLINE PAYMENT REFUND
    if (
      order.paymentMethod === "razorpay" &&
      order.paymentStatus === "paid" &&
      order.razorpayPaymentId
    ) {
      refundAmount = order.totalAmount;

      try {
        await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: refundAmount * 100, // paise
        });

        order.refundAmount = refundAmount;
        order.refundStatus = "refunded";
      } catch (refundError) {
        console.error("Refund failed:", refundError);

        order.refundAmount = refundAmount;
        order.refundStatus = "processing";
      }
    }

    // ✅ COD ₹200 ADVANCE REFUND
    if (
      order.paymentMethod === "cod" &&
      order.codAdvancePaid &&
      order.razorpayPaymentId
    ) {
      refundAmount = order.codAdvanceAmount;

      try {
        await razorpay.payments.refund(order.razorpayPaymentId, {
          amount: refundAmount * 100,
        });

        order.refundAmount = refundAmount;
        order.refundStatus = "refunded";
      } catch (refundError) {
        console.error("COD advance refund failed:", refundError);

        order.refundAmount = refundAmount;
        order.refundStatus = "processing";
      }
    }

    // ✅ If unpaid
    if (order.paymentStatus === "pending") {
      order.refundStatus = "none";
    }

    await order.save();

    // ==================================
    // 📧 EMAIL
    // ==================================

    await sendEmail({
      email: user.email,
      subject: `Your Order #${order._id} Has Been Cancelled`,
      message: `
        <h2>Order Cancelled</h2>
        <p>Dear ${user.name || "Customer"},</p>
        <p>Your order #${order._id} has been cancelled successfully.</p>
        ${
          refundAmount > 0
            ? `<p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
               <p><strong>Status:</strong> ${
                 order.refundStatus === "refunded"
                   ? "Refunded Successfully"
                   : "Processing (5–7 business days)"
               }</p>`
            : ""
        }
        <p>Thank you for shopping with Range of Himalayas 🍎</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel full order error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const requestReturnItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "`items` must be a non-empty array",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const user = await User.findById(order.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Logic Gate: Only allow returns for delivered items
    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Return can only be requested after delivery",
      });
    }

    let totalReturnAmount = 0;

    // ✅ Map items and calculate refund amount
    const returnItems = items
      .map((item) => {
        const cartItem = order.cartItems.find(
          (ci) => ci.productId.toString() === item.productId,
        );
        if (!cartItem) return null;

        const returnQty = Math.min(item.quantity, cartItem.quantity);
        const perUnitPrice = Number(cartItem.price || 0);

        totalReturnAmount += perUnitPrice * returnQty;

        return {
          productId: item.productId,
          productName: cartItem.title,
          size: cartItem.size || "-",
          weight: cartItem.weight || "-",
          quantity: returnQty,
          reason: item.reason || "No reason provided",
        };
      })
      .filter(Boolean);

    if (returnItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items found for return",
      });
    }

    // ✅ Full refund logic
    const totalItemsOrdered = order.cartItems.reduce(
      (sum, i) => sum + i.quantity,
      0,
    );
    const totalItemsReturned = returnItems.reduce(
      (sum, i) => sum + i.quantity,
      0,
    );

    if (totalItemsReturned >= totalItemsOrdered) {
      totalReturnAmount = Number(order.totalAmount);
    } else {
      totalReturnAmount = Math.min(
        Number(totalReturnAmount.toFixed(2)),
        Number(order.totalAmount),
      );
    }

    // ✅ Handle media uploads (Cloudinary/S3)
    const photoUrls = [];
    const videoUrls = [];

    if (req.files) {
      if (req.files.photos) {
        for (const file of req.files.photos) {
          const result = await uploadMedia(file.path);
          photoUrls.push(result.secure_url);
        }
      }
      if (req.files.videos) {
        for (const file of req.files.videos) {
          const result = await uploadMedia(file.path);
          videoUrls.push(result.secure_url);
        }
      }
    }

    const newReturnRequest = {
      reason: returnItems.map((i) => i.reason).join(", "),
      items: returnItems,
      refundAmount: totalReturnAmount,
      photos: photoUrls,
      videos: videoUrls,
      status: "requested",
      requestedAt: new Date(),
    };

    // ✅ Update Order Document
    order.returnRequests.push(newReturnRequest);
    order.returnStatus = "requested";
    order.refundAmount = totalReturnAmount;
    order.orderUpdateDate = new Date();

    await order.save({ validateBeforeSave: false });

    // ✅ SEND EMAIL (FIXED: NO AWAIT)
    // We do NOT await this. If the connection times out, the user still gets a success response.
    sendEmail({
      email: user.email,
      subject: `Return Request Received – Order #${order._id}`,
      message: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 32px; border-radius: 12px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 3px 12px rgba(0,0,0,0.05);">
          <h2 style="color:#f0ad4e; margin-bottom: 8px;">Return Request Submitted</h2>
          <p style="font-size: 16px; color: #555;">Dear ${user.name || "Customer"},</p>
          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            We’ve received your return request for <b>Order #${order._id}</b>.  
            Our team is currently reviewing it and will notify you once it’s processed.
          </p>
          <h3 style="color:#333; margin-top: 24px;">Items for Return</h3>
          <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color:#f7f7f7; text-align:left;">
                <th style="padding: 8px; border-bottom: 1px solid #eee;">Product</th>
                <th style="padding: 8px; border-bottom: 1px solid #eee;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${returnItems
                .map(
                  (item) => `
                <tr>
                  <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${item.productName}</td>
                  <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${item.quantity}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <div style="background-color: #fffaf0; padding: 16px 20px; border-left: 4px solid #f0ad4e; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0; font-size: 15px; color: #444;">
              Estimated Refund: <b>₹${totalReturnAmount}</b>
            </p>
          </div>
          <p style="font-size: 14px; color: #666;">Team <b>Range of Himalayas 🍎</b></p>
        </div>
      </div>
      `,
    }).catch((emailError) => {
      // This catch handles the Connection Timeout without breaking the API response
      console.error(
        "📧 Non-critical Email Error (Timeout):",
        emailError.message,
      );
    });

    // ✅ SUCCESS RESPONSE
    return res.status(200).json({
      success: true,
      message: "Return request submitted successfully.",
      returnRequest: newReturnRequest,
      returnStatus: order.returnStatus,
    });
  } catch (error) {
    // This catches critical errors (DB failure, file upload failure, etc.)
    console.error("❌ Request return error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const approveAdminReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { requestIndex, approve } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (!order.returnRequests || order.returnRequests.length === 0)
      return res.status(400).json({
        success: false,
        message: "No return request found",
      });

    const request = order.returnRequests[requestIndex];
    if (!request)
      return res
        .status(400)
        .json({ success: false, message: "Invalid return request index" });

    const returnItems = request.items || [];

    // ✅ Approve or reject return
    request.status = approve ? "approved" : "rejected";
    request.reviewedAt = new Date();

    if (approve) {
      // Ensure refund amount matches order total
      request.refundAmount = order.totalAmount;
      order.refundStatus = "processing";
      order.refundAmount = Number(request.refundAmount);
    }

    // ✅ Update overall return and order status
    order.returnStatus = approve ? "approved" : "rejected";
    order.orderUpdateDate = new Date();

    await order.save({ validateBeforeSave: false });

    // ✅ Send email notification (NON-BLOCKING)
    const user = await User.findById(order.userId);
    if (user && user.email) {
      // We do NOT await this. This prevents the admin UI from hanging.
      sendEmail({
        email: user.email,
        subject: `Your Return Request has been ${approve ? "Approved" : "Rejected"} – Order #${order._id}`,
        message: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 32px; border-radius: 12px; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 3px 12px rgba(0,0,0,0.05);">
            <h2 style="color:${approve ? "#28a745" : "#dc3545"}; margin-bottom: 12px;">
              Return Request ${approve ? "Approved" : "Rejected"}
            </h2>
            <p style="font-size: 16px; color: #555;">Dear ${user.name || "Customer"},</p>
            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Your return request for <b>Order #${order._id}</b> has been 
              <b style="color:${approve ? "#28a745" : "#dc3545"};">${approve ? "approved" : "rejected"}</b>.
            </p>
            ${
              approve
                ? `
                <div style="background-color:#f6fff9; padding: 16px 20px; border-left: 4px solid #28a745; border-radius: 8px; margin: 24px 0;">
                  <h3 style="margin: 0 0 8px; color: #28a745; font-size: 16px;">Refund Details</h3>
                  <p style="margin: 0; font-size: 15px; color: #444;">
                    Refund Amount: <b>₹${request.refundAmount}</b><br/>
                    Status: <b>Processing</b>
                  </p>
                </div>
            `
                : `
                <div style="background-color:#fff6f6; padding: 16px 20px; border-left: 4px solid #dc3545; border-radius: 8px; margin: 24px 0;">
                  <p style="margin: 0; font-size: 15px; color: #444;">
                    Unfortunately, your return request could not be approved. Please contact support for more details.
                  </p>
                </div>
            `
            }
            <hr style="border:none; border-top:1px solid #eee; margin: 28px 0;">
            <p style="font-size: 14px; color: #666;">Team <b>Range of Himalayas 🍎</b></p>
          </div>
        </div>
        `,
      }).catch((err) =>
        console.error("📧 Approval Email failed to send:", err.message),
      );
    }

    return res.status(200).json({
      success: true,
      message: `Return request ${approve ? "approved" : "rejected"} successfully.`,
      order,
    });
  } catch (error) {
    console.error("Approve admin return error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const approveReturnRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { items } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!items || !items.length) {
      return res
        .status(400)
        .json({ success: false, message: "No items provided" });
    }

    let refundAmount = 0;
    const stockToRestore = [];

    // ✅ Identify items and calculate total refund
    for (const item of items) {
      const cancelledItem = order.cancelledItems.find(
        (ci) => ci.productId.toString() === item.productId && !ci.refunded,
      );

      if (!cancelledItem) continue;

      const approveQty = Math.min(item.quantity, cancelledItem.quantity);
      refundAmount += approveQty * Number(cancelledItem.price || 0);

      cancelledItem.refundAvailableDate = new Date();
      cancelledItem.refunded = true; // Mark as refunded so it can't be refunded twice

      stockToRestore.push({
        productId: item.productId,
        quantity: approveQty,
        size: cancelledItem.size || "Medium",
        weight: cancelledItem.weight,
      });
    }

    // ✅ Restore stock in bulk
    if (stockToRestore.length > 0) {
      await restoreStock(stockToRestore, []);
    }

    // ✅ Razorpay Refund Logic
    if (refundAmount > 0) {
      if (order.paymentStatus === "pending") {
        order.refundStatus = "none";
      }

      // Handle Online Payment Refund
      const isOnlinePayment =
        order.paymentMethod === "razorpay" && order.paymentStatus === "paid";
      const isCODAdvance =
        order.paymentMethod === "cod" && order.codAdvancePaid;

      if ((isOnlinePayment || isCODAdvance) && order.razorpayPaymentId) {
        let finalRefundValue = refundAmount;

        // For COD, limit refund to the advance amount paid
        if (isCODAdvance) {
          finalRefundValue = Math.min(refundAmount, order.codAdvanceAmount);
        }

        try {
          await razorpay.payments.refund(order.razorpayPaymentId, {
            amount: Math.round(finalRefundValue * 100), // convert to paise
          });
          order.refundStatus = "refunded";
        } catch (error) {
          console.error("Razorpay Refund Error:", error);
          order.refundStatus = "processing"; // Manual intervention needed
        }

        order.refundAmount = (order.refundAmount || 0) + finalRefundValue;
      }
    }

    order.orderUpdateDate = new Date();
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return approved and refund initiated.",
      data: order,
    });
  } catch (error) {
    console.error("Approve return error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
export const getTrackingByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1️⃣ Get order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // 🔥 BEFORE SHIPMENT → return DB status
    if (!order.courierOrderId) {
      return res.status(200).json({
        success: true,
        type: "manual", // 🔥 important
        data: {
          status: order.orderStatus,
          awb: null,
          activities: order.statusHistory || [],
        },
      });
    }

    // 2️⃣ Call ICC tracking
    const trackingData = await trackICCShipment(order);

    // 🔥 ICC not started yet
    if (!trackingData.success) {
      return res.status(200).json({
        success: true,
        type: "manual",
        data: {
          status: order.orderStatus,
          awb: null,
          activities: order.statusHistory || [],
        },
      });
    }

    // 3️⃣ Return ICC tracking
    return res.status(200).json({
      success: true,
      type: "icc", // 🔥 important
      data: trackingData.formatted,
    });

  } catch (error) {
    console.error("❌ Tracking API Error:", error);

    return res.status(500).json({
      success: false,
      message: "Tracking failed",
      error: error.message,
    });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find({ paymentStatus: "paid" })
      .sort({ createdAt: -1 })
      .select("cartItems addressInfo createdAt");

    const formatted = orders
      .filter((order) => order.cartItems?.length > 0)
      .map((order) => {
        const firstItem = order.cartItems[0];
        return {
          city: order.addressInfo?.city || "India",
          productName: firstItem?.title || "Product",
          productImage: firstItem?.image || null,
          quantity: firstItem?.quantity || 1,
          timeAgo: order.createdAt,
        };
      });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
