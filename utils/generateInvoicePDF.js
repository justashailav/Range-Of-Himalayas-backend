// import PDFDocument from "pdfkit";

// export const generateInvoicePDFBuffer = (order, products = []) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument();
//     const buffers = [];

//     doc.on("data", buffers.push.bind(buffers));
//     doc.on("end", () => {
//       const pdfData = Buffer.concat(buffers);
//       resolve(pdfData);
//     });

//     // Create product lookup map
//     const productsMap = {};
//     products.forEach((prod) => {
//       productsMap[prod._id.toString()] = prod;
//     });

//     // Header
//     doc.fontSize(20).text("Invoice", { align: "center" });
//     doc.moveDown();

//     // Order details
//     doc.fontSize(12).text(`Order ID: ${order._id}`);
//     doc.text(`Order Date: ${new Date(order.orderDate).toDateString()}`);
//     doc.text(`Payment Method: ${order.paymentMethod}`);
//     doc.moveDown();

//     // Cart Items
//     doc.fontSize(14).text("Cart Items:", { underline: true });
//     order.cartItems.forEach((item, idx) => {
//       const product = productsMap[item.productId?.toString()] || {};
//       const title = item.title || product.title || "Product";
//       const price = item.price || product.price || "N/A";

//       doc.fontSize(12).text(
//         `${idx + 1}. ${title} - Qty: ${item.quantity} - Price: ₹${price}`
//       );
//     });

//     // Boxes
//     if (order.boxes && order.boxes.length > 0) {
//       doc.moveDown();
//       doc.fontSize(14).text("Boxes:", { underline: true });

//       order.boxes.forEach((box, index) => {
//         doc.moveDown(0.5);
//         doc.fontSize(12).text(`${index + 1}. Box: ${box.boxName || "Box"} (Qty: ${box.quantity || 1})`);

//         if (box.items && box.items.length > 0) {
//           box.items.forEach((item) => {
//             const product = productsMap[item.productId?.toString()] || {};
//             const title = item.title || product.title || "Item";

//             // Find price from sizes based on size
//             let price = "N/A";
//             if (product.sizes && Array.isArray(product.sizes)) {
//               const sizeObj = product.sizes.find((s) => s.size === item.size);
//               if (sizeObj) {
//                 price = sizeObj.salesPrice ?? sizeObj.price ?? "N/A";
//               }
//             }

//             doc.fontSize(11).text(
//               `   - ${title} (Qty: ${item.quantity}) - Price: ₹${price}`
//             );
//           });
//         } else {
//           doc.fontSize(11).text("   - No items listed in this box.");
//         }
//       });
//     }

//     // Total
//     doc.moveDown();
//     doc.fontSize(12).text(`Total Amount: ₹${order.totalAmount}`, { bold: true });

//     doc.end();
//   });
// };


// import PDFDocument from "pdfkit";

// export const generateInvoicePDFBuffer = (order, products = []) => {
//   return new Promise((resolve, reject) => {
//     const doc = new PDFDocument({ size: "A4", margin: 50 });
//     const buffers = [];

//     doc.on("data", buffers.push.bind(buffers));
//     doc.on("end", () => {
//       const pdfData = Buffer.concat(buffers);
//       resolve(pdfData);
//     });

//     // Create product lookup map
//     const productsMap = {};
//     products.forEach((prod) => {
//       productsMap[prod._id.toString()] = prod;
//     });

//     // Header - Title
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(24)
//       .fillColor("#333333")
//       .text("INVOICE", { align: "center" });

//     doc.moveDown(1);

//     // Order Info Box
//     doc
//       .fontSize(12)
//       .fillColor("#555555")
//       .text(`Order ID: `, { continued: true })
//       .font("Helvetica")
//       .fillColor("#000000")
//       .text(order._id);

//     doc
//       .font("Helvetica-Bold")
//       .fillColor("#555555")
//       .text(`Order Date: `, { continued: true })
//       .font("Helvetica")
//       .fillColor("#000000")
//       .text(new Date(order.orderDate).toLocaleDateString());

//     doc
//       .font("Helvetica-Bold")
//       .fillColor("#555555")
//       .text(`Payment Method: `, { continued: true })
//       .font("Helvetica")
//       .fillColor("#000000")
//       .text(order.paymentMethod);

//     doc.moveDown(1);

//     // Horizontal line separator
//     doc
//       .strokeColor("#cccccc")
//       .lineWidth(1)
//       .moveTo(doc.page.margins.left, doc.y)
//       .lineTo(doc.page.width - doc.page.margins.right, doc.y)
//       .stroke();

//     doc.moveDown(0.5);

//     // Cart Items Header
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(16)
//       .fillColor("#333333")
//       .text("Cart Items", doc.page.margins.left, doc.y, { underline: true });

//     doc.moveDown(0.7);

//     // Table header for cart items
//     const cartX = doc.page.margins.left + 10;
//     const cartTitleX = cartX;
//     const cartQtyX = cartTitleX + 280;
//     const cartPriceX = cartQtyX + 70;

//     const headerY = doc.y; // fixed y-position for all headers

//     doc
//       .font("Helvetica-Bold")
//       .fontSize(12)
//       .fillColor("#555555")
//       .text("Item", cartTitleX, headerY)
//       .text("Qty", cartQtyX, headerY, { width: 50, align: "center" })
//       .text("Price", cartPriceX, headerY, { width: 90, align: "right" });

//     doc.moveDown(0.4);

//     doc
//       .strokeColor("#dddddd")
//       .lineWidth(0.7)
//       .moveTo(cartTitleX, doc.y)
//       .lineTo(cartPriceX + 90, doc.y)
//       .stroke();

//     doc.moveDown(0.4);

//     // Cart Items List with columns
//     order.cartItems.forEach((item, idx) => {
//       const product = productsMap[item.productId?.toString()] || {};
//       const title = item.title || product.title || "Product";
//       const price = item.price || product.price || "N/A";

//       const rowY = doc.y;
//       doc
//         .font("Helvetica")
//         .fontSize(12)
//         .fillColor("#000000")
//         .text(title, cartTitleX, rowY, { width: 280 })
//         .text(item.quantity.toString(), cartQtyX, rowY, { width: 50, align: "center" })
//         .text(`₹${price}`, cartPriceX, rowY, { width: 90, align: "right" });

//       doc.moveDown(0.6);
//     });

//     // Boxes Section
//     if (order.boxes && order.boxes.length > 0) {
//       doc.moveDown(2);

//       // "Boxes" header aligned left margin
//       doc
//         .font("Helvetica-Bold")
//         .fontSize(16)
//         .fillColor("#333333")
//         .text("Boxes", doc.page.margins.left, doc.y, { underline: true });

//       order.boxes.forEach((box, index) => {
//         doc.moveDown(1);

//         // Box name aligned left margin (no extra indent)
//         doc
//           .font("Helvetica-Bold")
//           .fontSize(14)
//           .fillColor("#222222")
//           .text(`${index + 1}. Box: ${box.boxName || "Box"}`, doc.page.margins.left);

//         if (box.items && box.items.length > 0) {
//           const boxTableTop = doc.y + 5;
//           const itemX = doc.page.margins.left + 20; // indent for box items
//           const sizeX = itemX + 250;
//           const qtyX = sizeX + 70;
//           const priceX = qtyX + 70;

//           // Table header for box items
//           doc
//             .font("Helvetica-Bold")
//             .fontSize(12)
//             .fillColor("#555555")
//             .text("Item", itemX, boxTableTop)
//             .text("Size", sizeX, boxTableTop, { width: 60, align: "center" })
//             .text("Qty", qtyX, boxTableTop, { width: 60, align: "center" })
//             .text("Price", priceX, boxTableTop, { width: 80, align: "right" });

//           doc.moveDown(0.5);
//           doc
//             .strokeColor("#dddddd")
//             .lineWidth(0.7)
//             .moveTo(itemX, doc.y)
//             .lineTo(priceX + 80, doc.y)
//             .stroke();

//           doc.moveDown(0.2);

//           // Box items rows
//           box.items.forEach((item) => {
//             const product = productsMap[item.productId?.toString()] || {};
//             const title = item.title || product.title || "Item";

//             let price = "N/A";
//             if (product.sizes && Array.isArray(product.sizes)) {
//               const sizeObj = product.sizes.find((s) => s.size === item.size);
//               if (sizeObj) price = sizeObj.salesPrice ?? sizeObj.price ?? "N/A";
//             }

//             const rowY = doc.y;
//             doc
//               .font("Helvetica")
//               .fontSize(11)
//               .fillColor("#000000")
//               .text(title, itemX, rowY, { width: 240 })
//               .text(item.size || "-", sizeX, rowY, { width: 60, align: "center" })
//               .text(item.quantity.toString(), qtyX, rowY, { width: 60, align: "center" })
//               .text(`₹${price}`, priceX, rowY, { width: 80, align: "right" });

//             doc.moveDown(0.5);
//           });
//         } else {
//           doc
//             .font("Helvetica-Oblique")
//             .fontSize(11)
//             .fillColor("#888888")
//             .text("- No items listed in this box.", { indent: 20 });
//         }
//       });
//     }

//     // Total Amount
//     doc.moveDown(2);
//     doc
//       .font("Helvetica-Bold")
//       .fontSize(16) // increased font size
//       .fillColor("#000000")
//       .text(`Total Amount: ₹${order.totalAmount}`, { align: "right" });
//     doc.end();
//   });
// };

import PDFDocument from "pdfkit";

export const generateInvoicePDFBuffer = (
  order,
  products = [],
  user = {}
) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // --- COLORS ---
    const primary = "#B23A2E";
    const dark = "#1a1a1a";
    const gray = "#777";
    const light = "#f5f5f5";

    const left = 50;
    const width = doc.page.width - 100;

    const orderId = order?._id?.toString() || "N/A";

    const date = new Date(order.createdAt || order.orderDate);
    const formattedDate = !isNaN(date)
      ? date.toLocaleDateString("en-IN")
      : "N/A";

    // ================= HEADER =================
    doc
      .fillColor(primary)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("RANGE OF HIMALAYAS", left, 40);

    doc
      .fillColor(gray)
      .fontSize(9)
      .font("Helvetica")
      .text("Premium Himalayan Wellness Products", left, 65)
      .text("www.rangeofhimalayas.co.in", left, 78);

    doc
      .fillColor(dark)
      .fontSize(26)
      .font("Helvetica-Bold")
      .text("INVOICE", 0, 40, { align: "right" });

    // ================= CUSTOMER =================
    doc
      .moveDown(2)
      .fillColor(gray)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("BILL TO");

    doc
      .fillColor(dark)
      .font("Helvetica")
      .fontSize(11)
      .text(user?.name || order.userName || "Customer")
      .text(order.addressInfo?.phone || "")
      .fontSize(9)
      .fillColor(gray)
      .text(
        `${order.addressInfo?.address || ""}, ${order.addressInfo?.city || ""} - ${order.addressInfo?.pincode || ""}`
      );

    // ================= ORDER DETAILS =================
    doc
      .fillColor(gray)
      .font("Helvetica-Bold")
      .text("ORDER ID:", 350, 120)
      .text("DATE:", 350, 135)
      .text("PAYMENT:", 350, 150);

    doc
      .fillColor(dark)
      .font("Helvetica")
      .text(orderId, 430, 120)
      .text(formattedDate, 430, 135)
      .text(order.paymentMethod?.toUpperCase() || "COD", 430, 150);

    // ================= TABLE =================
    let y = 200;

    const drawHeader = () => {
      doc.rect(left, y, width, 20).fill(dark);
      doc.fillColor("#fff").fontSize(9).font("Helvetica-Bold");

      doc.text("PRODUCT", left + 10, y + 5);
      doc.text("PRICE", 320, y + 5, { width: 80, align: "right" });
      doc.text("QTY", 410, y + 5, { width: 40, align: "center" });
      doc.text("TOTAL", 460, y + 5, { width: 80, align: "right" });

      y += 25;
    };

    drawHeader();

    const productsMap = {};
    products.forEach((p) => (productsMap[p._id] = p));

    (order.cartItems || []).forEach((item, i) => {
      const base = item.title || "Product";
      const variant = item.weight || item.size || "";
      const title = variant ? `${base} (${variant})` : base;

      const price = Number(item.price) || 0;

      if (i % 2 === 0) {
        doc.rect(left, y - 2, width, 18).fill(light);
      }

      doc.fillColor(dark).font("Helvetica").fontSize(10);

      doc.text(title, left + 10, y, { width: 250 });
      doc.text(`₹${price}`, 320, y, { width: 80, align: "right" });
      doc.text(item.quantity, 410, y, { width: 40, align: "center" });
      doc.text(`₹${price * item.quantity}`, 460, y, {
        width: 80,
        align: "right",
      });

      y += 20;
    });

    // ================= SUMMARY =================
    y += 20;

    const drawRow = (label, value, bold = false) => {
      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(bold ? 13 : 10)
        .fillColor(bold ? primary : dark)
        .text(label, 350, y)
        .text(value, 450, y, { width: 95, align: "right" });

      y += bold ? 20 : 15;
    };

    const discount =
      Number(order.discountAmount || 0) +
      Number(order.couponDiscount || 0);

    drawRow("Subtotal:", `₹${order.subTotal || order.totalAmount}`);

    if (discount > 0) {
      drawRow("Discount:", `- ₹${discount}`);
    }

    if (order.coupon) {
      drawRow("Coupon:", order.coupon.code || "Applied");
    }

    // COD logic
    if (order.paymentMethod === "cod") {
      drawRow("Paid (Advance):", `₹${order.codAdvanceAmount || 0}`);
      drawRow("Pay on Delivery:", `₹${order.codRemainingAmount || 0}`);
    } else {
      drawRow("Shipping:", "FREE");
    }

    doc.rect(350, y, 195, 30).fill(light);

    drawRow("TOTAL:", `₹${order.totalAmount}`, true);

    // ================= SAVINGS =================
    if (discount > 0) {
      doc
        .fillColor(primary)
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`🎉 You saved ₹${discount}!`, left, y + 10);
    }

    // ================= FOOTER =================
    doc
      .moveTo(left, 750)
      .lineTo(doc.page.width - 50, 750)
      .strokeColor(light)
      .stroke();

    doc
      .fillColor(gray)
      .fontSize(8)
      .font("Helvetica-Oblique")
      .text(
        "Thank you for choosing authentic Himalayan wellness.",
        left,
        760,
        { align: "center", width: width }
      )
      .text("This is a computer-generated invoice.", left, 772, {
        align: "center",
        width: width,
      });

    doc.end();
  });
};