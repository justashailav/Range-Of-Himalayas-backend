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

export const generateInvoicePDFBuffer = (order, products = []) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", (err) => reject(err));

    // --- CONFIG ---
    const primaryColor = "#B23A2E";
    const secondaryColor = "#2d3a2d";
    const lightGray = "#f9f9f9";
    const textGray = "#555555";
    const leftMargin = 50;
    const rightPadding = 50;
    const contentWidth = doc.page.width - leftMargin - rightPadding;

    // --- ORDER ID ---
    const orderId = order?._id ? order._id.toString() : "N/A";

    // --- DATE ---
    const dateSource = order.orderDate || order.createdAt;
    let formattedDate = "N/A";

    if (dateSource) {
      const d = new Date(dateSource);
      if (!isNaN(d)) {
        formattedDate = d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }

    // --- HEADER ---
    doc
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("RANGE OF HIMALAYAS", leftMargin, 45);

    doc
      .fillColor(textGray)
      .font("Helvetica")
      .fontSize(9)
      .text("Artisan Harvests & Curated Himalayan Goods", leftMargin, 70)
      .text("www.rangeofhimalayas.com", leftMargin, 82);

    doc
      .fillColor("#000000")
      .font("Helvetica-Bold")
      .fontSize(28)
      .text("INVOICE", 0, 45, {
        align: "right",
        width: doc.page.width - rightPadding,
      });

    // --- DETAILS ---
    const detailsTop = 130;

    doc
      .fillColor(textGray)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("BILL TO:", leftMargin, detailsTop)
      .fillColor("#000000")
      .font("Helvetica")
      .fontSize(11)
      .text(
        order.user?.name || order.userName || "Customer",
        leftMargin,
        detailsTop + 15
      )
      .text(order.addressInfo?.phone || "", leftMargin, detailsTop + 30)
      .fontSize(9)
      .fillColor(textGray)
      .text(
        `${order.addressInfo?.address || ""}, ${order.addressInfo?.city || ""} - ${order.addressInfo?.pincode || ""}`,
        leftMargin,
        detailsTop + 45,
        { width: 220 }
      );

    const rightColX = 350;

    doc
      .fillColor(textGray)
      .font("Helvetica-Bold")
      .text("ORDER ID:", rightColX, detailsTop)
      .text("DATE:", rightColX, detailsTop + 20)
      .text("PAYMENT:", rightColX, detailsTop + 40);

    doc
      .fillColor("#000000")
      .font("Helvetica")
      .text(`#${orderId.toUpperCase()}`, rightColX + 80, detailsTop)
      .text(formattedDate, rightColX + 80, detailsTop + 20)
      .text(
        order.paymentMethod?.toUpperCase() || "COD",
        rightColX + 80,
        detailsTop + 40
      );

    doc.moveDown(4);

    // --- TABLE HEADER ---
    const drawTableHeader = (y, cols) => {
      doc.rect(leftMargin, y, contentWidth, 20).fill(secondaryColor);

      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);

      cols.forEach((c) => {
        doc.text(c.label, c.x, y + 6, {
          width: c.w,
          align: c.align,
        });
      });

      return y + 25;
    };

    // --- ITEMS ---
    doc
      .fillColor(primaryColor)
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Items", leftMargin);

    doc.moveDown(0.5);

    let currentY = doc.y;

    const cols = [
      { label: "PRODUCT", x: leftMargin + 10, w: 250, align: "left" },
      { label: "PRICE", x: 320, w: 80, align: "right" },
      { label: "QTY", x: 410, w: 40, align: "center" },
      { label: "TOTAL", x: 460, w: 80, align: "right" },
    ];

    currentY = drawTableHeader(currentY, cols);

    const productsMap = {};
    products.forEach((p) => {
      productsMap[p._id.toString()] = p;
    });

    (order.cartItems || []).forEach((item, i) => {
      const product = productsMap[item.productId?.toString()] || {};

      const baseTitle = item.title || product.title || "Product";
      const variantText =
        item.weight || item.size
          ? ` (${item.weight || item.size})`
          : "";

      const title = baseTitle + variantText;
      const price = Number(item.price) || 0;

      if (i % 2 === 0) {
        doc.rect(leftMargin, currentY - 2, contentWidth, 18).fill("#fbfbfb");
      }

      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(10)
        .text(title, cols[0].x, currentY, { width: cols[0].w })
        .text(`₹${price}`, cols[1].x, currentY, {
          width: cols[1].w,
          align: "right",
        })
        .text(item.quantity.toString(), cols[2].x, currentY, {
          width: cols[2].w,
          align: "center",
        })
        .text(`₹${price * item.quantity}`, cols[3].x, currentY, {
          width: cols[3].w,
          align: "right",
        });

      currentY += 20;
    });

    // --- SUMMARY ---
    const summaryTop = doc.y + 30;

    doc
      .strokeColor(lightGray)
      .moveTo(350, summaryTop)
      .lineTo(545, summaryTop)
      .stroke();

    const drawRow = (label, value, y, isTotal = false) => {
      doc
        .font(isTotal ? "Helvetica-Bold" : "Helvetica")
        .fontSize(isTotal ? 14 : 10)
        .fillColor(isTotal ? primaryColor : "#000000")
        .text(label, 350, y)
        .text(value, 450, y, { width: 95, align: "right" });
    };

    const discountAmount =
      Number(order.discountAmount || 0) +
      Number(order.couponDiscount || 0);

    drawRow("Subtotal:", `₹${order.subTotal || order.totalAmount}`, summaryTop + 10);

    let yOffset = summaryTop + 25;

    if (discountAmount > 0) {
      drawRow("Discount:", `- ₹${discountAmount}`, yOffset);
      yOffset += 15;
    }

    if (order.coupon) {
      drawRow(
        "Coupon:",
        `${order.coupon.code || "Applied"}`,
        yOffset
      );
      yOffset += 15;
    }

    drawRow("Shipping:", "FREE", yOffset);
    yOffset += 20;

    doc.rect(350, yOffset, 195, 30).fill(lightGray);

    drawRow(
      "TOTAL:",
      `₹${order.totalAmount}`,
      yOffset + 8,
      true
    );

    // --- FOOTER ---
    const footerY = 750;

    doc
      .strokeColor(lightGray)
      .moveTo(leftMargin, footerY)
      .lineTo(doc.page.width - rightPadding, footerY)
      .stroke();

    doc
      .fillColor(textGray)
      .font("Helvetica-Oblique")
      .fontSize(8)
      .text(
        "Thank you for supporting authentic Himalayan artisans.",
        leftMargin,
        footerY + 15,
        { align: "center", width: contentWidth }
      )
      .text(
        "This is a computer-generated invoice.",
        leftMargin,
        footerY + 28,
        { align: "center", width: contentWidth }
      );

    doc.end();
  });
};