export function generateEmailOTPTemplate(otp) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center;">
            <h2 style="color: #333;">Email Verification</h2>
            <p style="color: #555;">Your One-Time Password (OTP) for verification is:</p>
            <div style="font-size: 24px; font-weight: bold; padding: 10px; background: #f4f4f4; border-radius: 5px; display: inline-block;">
                ${otp}
            </div>
            <p style="color: #555; margin-top: 20px;">This OTP is valid for <strong>15 minutes</strong>. Do not share it with anyone.</p>
            <p style="color: #555;">If you didn’t request this, please ignore this email.</p>
            <p style="margin-top: 20px; color: #777;">Thank you,<br><strong>Range Of Himalayas</strong></p>
        </div>
    </div>
    `;
}
export function generateForgotPasswordEmailTemplate(ResetPasswordUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center;">
              <h2 style="color: #333;">Reset Your Password</h2>
              <p style="color: #555;">We received a request to reset your password. Click the button below to reset it:</p>
              <a href="${ResetPasswordUrl}" 
                 style="display: inline-block; font-size: 16px; font-weight: bold; padding: 12px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">
                  Reset Password
              </a>
              <p style="color: #555; margin-top: 20px;">If you did not request this, please ignore this email. The link will expire in 30 minutes.</p>
              <p style="color: #555;">If you have any questions, contact our support team.</p>
              <p style="margin-top: 20px; color: #777;">Thank you,<br><strong>Range Of Himalayas</strong></p>
          </div>
      </div>
    `;
}

export const generateOrderEmailTemplate = (order, products = []) => {
  const { _id, cartItems, boxes = [], totalAmount, paymentMethod, orderDate } = order;

  // Create a map for quick product lookup by _id
  const productsMap = {};
  products.forEach((prod) => {
    productsMap[prod._id.toString()] = prod;
  });

  // Cart items HTML
  let itemsHtml = "<ul style='padding-left:20px;'>";
  cartItems.forEach((item) => {
    const product = productsMap[item.productId?.toString()] || {};
    const title = item.title || product.title || "Product";
    const price = item.price || product.price || "N/A";

    itemsHtml += `
      <li style="margin-bottom: 8px;">
        <strong>${title}</strong> - Qty: ${item.quantity} - Price: ₹${price}
      </li>`;
  });
  itemsHtml += "</ul>";

  // Boxes and box items HTML with size-based pricing
  let boxesHtml = "";
  if (boxes.length > 0) {
    boxesHtml += "<h4>Ordered Boxes:</h4><ul style='padding-left:20px;'>";
    boxes.forEach((box) => {
      boxesHtml += `
        <li style="margin-bottom: 12px;">
          <strong>${box.boxName || "Box"}</strong><br/>
          <ul style='padding-left:20px; margin-top: 4px;'>`;

      if (box.items && box.items.length > 0) {
        box.items.forEach((item) => {
          const product = productsMap[item.productId?.toString()] || {};
          const title = item.title || product.title || "Item";

          // Get price from the product's sizes array based on item.size
          let price = "N/A";
          if (product.sizes && Array.isArray(product.sizes)) {
            const sizeObj = product.sizes.find((s) => s.size === item.size);
            if (sizeObj) {
              price = sizeObj.salesPrice || sizeObj.price || "N/A";
            }
          }

          boxesHtml += `
            <li>
              - ${title} (Qty: ${item.quantity}) - Price: ₹${price}
            </li>`;
        });
      } else {
        boxesHtml += `<li>No items listed inside this box</li>`;
      }
      boxesHtml += `</ul></li>`;
    });
    boxesHtml += "</ul>";
  }

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #2c3e50;">Thank you for your order!</h2>
      <p>Your order ID is <strong>${_id}</strong>.</p>
      <p>Order Date: ${new Date(orderDate).toLocaleDateString()}</p>

      <h3>Order Details:</h3>
      ${itemsHtml}
      ${boxesHtml}

      <p style="font-size: 16px; font-weight: bold;">
        Total Amount: ₹${totalAmount}
      </p>

      <p>Payment Method: <strong>${paymentMethod.toUpperCase()}</strong></p>

      <p>If you have any questions, reply to this email. We're happy to help!</p>

      <hr style="margin: 30px 0;" />
      <p style="font-size: 12px; color: #999;">© ${new Date().getFullYear()} RANGE OF HIMALAYAS. All rights reserved.</p>
    </div>
  `;
};
