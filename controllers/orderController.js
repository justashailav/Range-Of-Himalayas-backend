import { uploadMedia } from "../config/cloudinary.js";
import { Coupon } from "../models/AdminModel/couponModal.js";
import { Products } from "../models/AdminModel/productsModel.js";
import { Cart } from "../models/cartModel.js";
import { Order } from "../models/Order.js";
import { User } from "../models/userModel.js";
import { generateOrderEmailTemplate } from "../utils/emailTemplate.js";
import { generateInvoicePDFBuffer } from "../utils/generateInvoicePDF.js";
import { phonePePay, phonePeStatus } from "../utils/phonepe.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

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
          (v.weight === selectedWeight || v.weight == item.weight)
      );

      if (!variant) {
        console.warn(
          `⚠️ Variant not found for ${product.title} (${selectedSize}, ${selectedWeight}kg)`
        );
        continue;
      }
      variant.stock = Math.max(
        (variant.stock || 0) + factor * item.quantity,
        0
      );
      product.markModified("variants");
      await product.save();

      console.log(
        `✅ Stock updated: ${product.title} (${variant.size}, ${variant.weight}kg) = ${variant.stock}`
      );
    } catch (err) {
      console.error(
        `💥 Error updating stock for ${item.productId}:`,
        err.message
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
      paymentMethod, // "phonepe" | "cod"
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

    if (!["phonepe", "cod"].includes(paymentMethod)) {
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

    // ✅ COUPON VALIDATION (same as yours)
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

    const payableAmount =
      paymentMethod === "cod" ? COD_ADVANCE : totalAmount;

    // 🔥 CREATE MERCHANT TRANSACTION ID
    const merchantTransactionId = "TXN" + Date.now();

    // 🔥 PHONEPE PAYLOAD
    const payload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
  merchantTransactionId,
  merchantUserId: userId.toString(),
  amount: payableAmount * 100,
  redirectUrl: `${process.env.FRONTEND_URL}/payment-success`,
  redirectMode: "POST",
  callbackUrl:
    "https://range-of-himalayas-backend.onrender.com/api/orders/phonepe-callback",
  mobileNumber: addressInfo?.phone || "9999999999",
  paymentInstrument: {
    type: "PAY_PAGE",
  },
};
    console.log("===== PHONEPE DEBUG START =====");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Merchant ID (env):", process.env.PHONEPE_MERCHANT_ID);
console.log("Salt Index:", process.env.PHONEPE_SALT_INDEX);
console.log("Salt Key exists?:", !!process.env.PHONEPE_SALT_KEY);
console.log("Merchant ID (payload):", payload.merchantId);
console.log("Amount (paise):", payload.amount);
console.log("Callback URL:", payload.callbackUrl);
console.log("===== PHONEPE DEBUG END =====");

    const phonepeResponse = await phonePePay(payload);

    if (!phonepeResponse.success) {
      return res.status(400).json({
        success: false,
        message: "PhonePe payment initialization failed",
      });
    }

    // ✅ SAVE ORDER
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
      merchantTransactionId,

      ...(paymentMethod === "cod" && {
        codAdvanceAmount: COD_ADVANCE,
        codRemainingAmount: totalAmount - COD_ADVANCE,
        codAdvancePaid: false,
      }),

      orderDate: new Date(),
      orderUpdateDate: new Date(),
    }).save();

    return res.status(201).json({
      success: true,
      message: "Redirecting to PhonePe...",
      orderId: newOrder._id,
      redirectUrl:
        phonepeResponse.data.instrumentResponse.redirectInfo.url,
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
      (entry) => entry.user.toString() === userId.toString()
    );

    if (existingUser) {
      await Coupon.updateOne(
        { code: normalizedCode, "usedBy.user": userId },
        { $inc: { "usedBy.$.count": 1, usedCount: 1 } }
      );
      console.log("✅ Incremented coupon usage for existing user.");
    } else {
      await Coupon.updateOne(
        { code: normalizedCode },
        {
          $push: { usedBy: { user: userId, count: 1 } },
          $inc: { usedCount: 1 },
        }
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
  const boxProducts = await Products.find({
    _id: { $in: boxProductIds },
  }).lean();
  const emailMessage = generateOrderEmailTemplate(order, boxProducts);
  const pdfBuffer = await generateInvoicePDFBuffer(order, boxProducts);

  await sendEmail({
    email: user.email,
    subject: "Order Confirmation",
    message: emailMessage,
    attachments: [{ filename: `invoice_${order._id}.pdf`, content: pdfBuffer }],
  });

  console.log("📧 Confirmation email sent to:", user.email);
}

export const capturePayment = async (req, res) => {
  try {
    const { orderId, merchantTransactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });

    if (
      order.phonepeMerchantTransactionId !== merchantTransactionId
    ) {
      return res.status(400).json({
        success: false,
        message: "Transaction mismatch",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Already paid",
      });
    }

    // 🔐 VERIFY WITH PHONEPE
    const statusResponse = await phonePeStatus(
      merchantTransactionId
    );

    if (
      !statusResponse.success ||
      statusResponse.data.state !== "COMPLETED"
    ) {
      order.paymentStatus = "failed";
      order.phonepeState = "FAILED";
      await order.save();

      return res.status(400).json({
        success: false,
        message: "Payment not completed",
      });
    }

    // ✅ PAYMENT SUCCESS

    order.phonepeTransactionId =
      statusResponse.data.transactionId;

    order.phonepeState = "COMPLETED";

    if (order.paymentMethod === "phonepe") {
      order.paymentStatus = "paid";
      order.orderStatus = "confirmed";
    }

    if (order.paymentMethod === "cod") {
      order.paymentStatus = "partial_paid";
      order.codAdvancePaid = true;
      order.orderStatus = "confirmed";
    }

    order.statusHistory.push({
      status: "confirmed",
      updatedAt: new Date(),
    });

    order.orderUpdateDate = new Date();

    // 🔥 NOW CONNECT MISSING FUNCTIONS

    // 1️⃣ Deduct stock
    await adjustStock(order.cartItems, "deduct");

    // 2️⃣ Update coupon usage
    if (order.code) {
      const couponDoc = await Coupon.findById(order.code);
      if (couponDoc) {
        await updateCouponUsage(couponDoc.code, order.userId);
      }
    }

    // 3️⃣ Delete cart
    if (order.cartId) {
      await Cart.findByIdAndDelete(order.cartId);
    }

    await order.save();

    // 4️⃣ Send confirmation email
    const user = await User.findById(order.userId);
    if (user) {
      await sendOrderEmail(user, order, order.boxes);
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
    });

  } catch (error) {
    console.error("❌ capturePayment error:", error);
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
      title,
      status,
      orderId,
      customer,
      paymentStatus,
      minAmount,
      maxAmount,
    } = req.query;

    const query = {};

    // 🕒 Date filter
    if (filter === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      query.orderDate = { $gte: start, $lte: end };
    } else if (filter === "yesterday") {
      const start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      query.orderDate = { $gte: start, $lte: end };
    } else if (filter === "week") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      query.orderDate = { $gte: start };
    } else if (filter === "month") {
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      query.orderDate = { $gte: start };
    }

    // 🧾 Order ID search
    if (orderId && orderId.trim() !== "") {
      query._id = orderId.trim();
    }

    // 👤 Customer filter (name or email)
    if (customer && customer.trim() !== "") {
      query.$or = [
        { "userInfo.name": { $regex: customer, $options: "i" } },
        { "userInfo.email": { $regex: customer, $options: "i" } },
      ];
    }

    // 🍎 Product title filter (within cartItems array)
    if (title && title.trim() !== "") {
      query.cartItems = {
        $elemMatch: {
          title: { $regex: title, $options: "i" },
        },
      };
    }

    // 🚚 Order status filter
    if (status && status !== "all") {
      query.orderStatus = status;
    }

    // 💰 Payment status filter
    if (paymentStatus && paymentStatus.trim() !== "") {
      query.paymentStatus = { $regex: paymentStatus, $options: "i" };
    }

    // 💸 Order amount range filter
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = Number(minAmount);
      if (maxAmount) query.totalAmount.$lte = Number(maxAmount);
    }

    console.log("🧾 Final query:", JSON.stringify(query, null, 2));

    const orders = await Order.find(query).sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found for the selected filter!",
      });
    }

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.error("❌ Error fetching orders:", e);
    res.status(500).json({
      success: false,
      message: "Some error occurred while fetching orders.",
    });
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
            order.orderUpdateDate
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
    const diffHours =
      (now - new Date(order.createdAt)) / (1000 * 60 * 60);

    if (diffHours > 24) {
      return res.status(400).json({
        success: false,
        message: "Cancellation window expired",
      });
    }

    // ❌ Prevent double cancel
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

    // =========================
    // PAYMENT REFUND LOGIC
    // =========================

    // ✅ FULL ONLINE PAYMENT
    if (
      order.paymentMethod === "phonepe" &&
      order.paymentStatus === "paid"
    ) {
      refundAmount = order.totalAmount;

      order.refundAmount = refundAmount;
      order.refundStatus = "processing";

      // 🔥 Here you can later integrate PhonePe Refund API
      // For now: manual processing
    }

    // ✅ COD ADVANCE REFUND
    if (
      order.paymentMethod === "cod" &&
      order.codAdvancePaid
    ) {
      refundAmount = order.codAdvanceAmount;

      order.refundAmount = refundAmount;
      order.refundStatus = "processing";
    }

    // ✅ If unpaid
    if (order.paymentStatus === "pending") {
      order.refundStatus = "none";
    }

    await order.save();

    // =========================
    // EMAIL
    // =========================

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
               <p><strong>Status:</strong> Processing (5–7 business days)</p>`
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

    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Return can only be requested after delivery",
      });
    }

    let totalReturnAmount = 0;

    // ✅ Calculate return amount safely
    const returnItems = items
      .map((item) => {
        const cartItem = order.cartItems.find(
          (ci) => ci.productId.toString() === item.productId
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

    // ✅ Full refund logic (if all items returned)
    const totalItemsOrdered = order.cartItems.reduce(
      (sum, i) => sum + i.quantity,
      0
    );
    const totalItemsReturned = returnItems.reduce(
      (sum, i) => sum + i.quantity,
      0
    );

    if (totalItemsReturned >= totalItemsOrdered) {
      totalReturnAmount = Number(order.totalAmount);
    } else {
      totalReturnAmount = Math.min(
        Number(totalReturnAmount.toFixed(2)),
        Number(order.totalAmount)
      );
    }

    // ✅ Handle media uploads
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

    order.returnRequests.push(newReturnRequest);
    order.returnStatus = "requested";
    order.refundAmount = totalReturnAmount;
    order.orderUpdateDate = new Date();

    await order.save({ validateBeforeSave: false });

    // ✅ Send professional user email notification
    await sendEmail({
      email: user.email,
      subject: `Return Request Received – Order #${order._id}`,
      message: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 32px; border-radius: 12px; color: #333;">
        <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 3px 12px rgba(0,0,0,0.05);">
          
          <h2 style="color:#f0ad4e; margin-bottom: 8px;">Return Request Submitted</h2>
          <p style="font-size: 16px; color: #555;">Dear ${
            user.name || "Customer"
          },</p>

          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            We’ve received your return request for <b>Order #${order._id}</b>.  
            Our team is currently reviewing it and will notify you once it’s <b>approved</b> or <b>rejected</b>.
          </p>

          <h3 style="color:#333; margin-top: 24px;">Returned Items</h3>
          <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color:#f7f7f7; text-align:left;">
                <th style="padding: 8px; border-bottom: 1px solid #eee;">Product</th>
                <th style="padding: 8px; border-bottom: 1px solid #eee;">Size</th>
                <th style="padding: 8px; border-bottom: 1px solid #eee;">Weight</th>
                <th style="padding: 8px; border-bottom: 1px solid #eee;">Qty</th>
              </tr>
            </thead>
            <tbody>
              ${returnItems
                .map(
                  (item) => `
                    <tr>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${item.productName}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${item.size}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${item.weight}</td>
                      <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${item.quantity}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>

          <div style="background-color: #fffaf0; padding: 16px 20px; border-left: 4px solid #f0ad4e; border-radius: 8px; margin: 24px 0;">
            <h3 style="margin: 0 0 8px; color: #f0ad4e; font-size: 16px;">Refund Summary</h3>
            <p style="margin: 0; font-size: 15px; color: #444;">
              Estimated Refund: <b>₹${totalReturnAmount}</b><br/>
              Refund Status: <b>${order.refundStatus || "Pending Review"}</b>
            </p>
            <p style="margin-top: 8px; font-size: 14px; color: #777;">
              Refunds are processed once your return is approved (typically within 5–7 business days).
            </p>
          </div>

          <p style="font-size: 15px; color: #555; line-height: 1.6;">
            Thank you for your patience and for shopping with <b>Range of Himalayas</b>.  
            We’ll notify you once your return request is reviewed.
          </p>

          <hr style="border:none; border-top:1px solid #eee; margin: 28px 0;">

          <p style="font-size: 14px; color: #666;">
            Team <b>Range of Himalayas 🍎</b><br/>
            Fresh from the mountains, delivered with care.
          </p>

          <p style="font-size: 12px; color: #999; margin-top: 16px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "Return request submitted successfully. Awaiting admin approval.",
      returnRequest: newReturnRequest,
      returnStatus: order.returnStatus,
    });
  } catch (error) {
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

    // ✅ Send email notification to user
    const user = await User.findById(order.userId);
    if (user && user.email) {
      await sendEmail({
        email: user.email,
        subject: `Your Return Request has been ${
          approve ? "Approved" : "Rejected"
        } – Order #${order._id}`,
        message: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; padding: 32px; border-radius: 12px; color: #333;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 3px 12px rgba(0,0,0,0.05);">
            
            <h2 style="color:${
              approve ? "#28a745" : "#dc3545"
            }; margin-bottom: 12px;">
              Return Request ${approve ? "Approved" : "Rejected"}
            </h2>

            <p style="font-size: 16px; color: #555;">Dear ${
              user.name || "Customer"
            },</p>

            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Your return request for <b>Order #${order._id}</b> has been 
              <b style="color:${approve ? "#28a745" : "#dc3545"};">${
          approve ? "approved" : "rejected"
        }</b>.
            </p>

            ${
              approve
                ? `
                <h3 style="color:#333; margin-top: 24px;">Returned Items</h3>
                <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
                  <thead>
                    <tr style="background-color:#f7f7f7; text-align:left;">
                      <th style="padding: 8px; border-bottom: 1px solid #eee;">Product</th>
                      <th style="padding: 8px; border-bottom: 1px solid #eee;">Size</th>
                      <th style="padding: 8px; border-bottom: 1px solid #eee;">Weight</th>
                      <th style="padding: 8px; border-bottom: 1px solid #eee;">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${returnItems
                      .map(
                        (item) => `
                          <tr>
                            <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${
                              item.productName
                            }</td>
                            <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${
                              item.size || "-"
                            }</td>
                            <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${
                              item.weight || "-"
                            }</td>
                            <td style="padding:8px; border-bottom:1px solid #f0f0f0;">${
                              item.quantity
                            }</td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                </table>

                <div style="background-color:#f6fff9; padding: 16px 20px; border-left: 4px solid #28a745; border-radius: 8px; margin: 24px 0;">
                  <h3 style="margin: 0 0 8px; color: #28a745; font-size: 16px;">Refund Details</h3>
                  <p style="margin: 0; font-size: 15px; color: #444;">
                    Refund Amount: <b>₹${request.refundAmount}</b><br/>
                    Refund Status: <b>Processing</b>
                  </p>
                  <p style="margin-top: 8px; font-size: 14px; color: #777;">
                    Your refund will be credited to your original payment method within <b>5–7 business days</b>.
                  </p>
                </div>
                `
                : `
                <div style="background-color:#fff6f6; padding: 16px 20px; border-left: 4px solid #dc3545; border-radius: 8px; margin: 24px 0;">
                  <h3 style="margin: 0 0 8px; color: #dc3545; font-size: 16px;">Return Request Rejected</h3>
                  <p style="margin: 0; font-size: 15px; color: #444;">
                    Unfortunately, your return request could not be approved after review.  
                    If you believe this was a mistake or wish to discuss further, please contact our support team.
                  </p>
                </div>
                `
            }

            <p style="font-size: 15px; color: #555; line-height: 1.6;">
              Thank you for your understanding and continued trust in <b>Range of Himalayas</b>.  
              Our goal is to ensure every customer enjoys a fresh and delightful experience.
            </p>

            <hr style="border:none; border-top:1px solid #eee; margin: 28px 0;">

            <p style="font-size: 14px; color: #666;">
              Team <b>Range of Himalayas 🍎</b><br/>
              Fresh from the mountains, delivered with care.
            </p>

            <p style="font-size: 12px; color: #999; margin-top: 16px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
        `,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Return request ${
        approve ? "approved" : "rejected"
      } successfully.`,
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
    const { items } = req.body; // [{ productId, quantity }]

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "No items provided",
      });
    }

    let refundAmount = 0;

    for (const item of items) {
      const cancelledItem = order.cancelledItems.find(
        (ci) =>
          ci.productId.toString() === item.productId &&
          !ci.refunded
      );

      if (!cancelledItem) continue;

      const approveQty = Math.min(
        item.quantity,
        cancelledItem.quantity
      );

      // Mark as approved for refund
      cancelledItem.refundAvailableDate = new Date();
      cancelledItem.refunded = false;

      refundAmount += approveQty * Number(cancelledItem.price || 0);

      // 🔄 Restore stock
      await restoreStock(
        [
          {
            productId: item.productId,
            quantity: approveQty,
            size: cancelledItem.size || "Medium",
            weight: cancelledItem.weight,
          },
        ],
        []
      );
    }

    // ==========================
    // REFUND LOGIC
    // ==========================

    if (refundAmount > 0) {
      order.refundAmount = (order.refundAmount || 0) + refundAmount;

      // ✅ Online Payment (PhonePe)
      if (
        order.paymentMethod === "phonepe" &&
        order.paymentStatus === "paid"
      ) {
        order.refundStatus = "processing";
        // 🔥 You can integrate PhonePe Refund API here later
      }

      // ✅ COD Advance Case
      if (
        order.paymentMethod === "cod" &&
        order.codAdvancePaid
      ) {
        order.refundStatus = "processing";
      }

      // ✅ If unpaid order
      if (order.paymentStatus === "pending") {
        order.refundStatus = "none";
      }
    }

    order.orderUpdateDate = new Date();

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Return approved successfully. Refund processing.",
      data: order,
    });

  } catch (error) {
    console.error("Approve return error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const trackOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).select(
      "orderStatus statusHistory orderUpdateDate"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }
    res.status(200).json({
      success: true,
      data: {
        currentStatus: order.orderStatus,
        statusHistory: order.statusHistory,
        lastUpdated: order.orderUpdateDate,
      },
    });
  } catch (error) {
    console.error("Track order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while tracking order",
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
