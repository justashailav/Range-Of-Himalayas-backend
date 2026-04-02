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

export const generateInvoicePDFBuffer = (order, products = [], user = {}) => {
  return new Promise((resolve, reject) => {
    // Standard A4: 595.28 x 841.89
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // --- DESIGN SYSTEM ---
    const primaryColor = "#B23A2E"; // Deep Himalayan Red
    const secondaryColor = "#2D3436"; // Dark Slate
    const mutedColor = "#636E72"; // Grey
    const borderColor = "#DFE6E9"; // Light Grey Line
    const tableHeaderColor = "#F8F9FA"; // Soft Background
    
    const leftMargin = 50;
    const rightColumnX = 380;
    const pageWidth = doc.page.width - 100;

    const orderId = order?._id?.toString() || "N/A";
    const date = new Date(order.createdAt || order.orderDate);
    const formattedDate = !isNaN(date) ? date.toLocaleDateString("en-IN") : "N/A";

    // ================= HEADER SECTION =================
    // Brand Logo/Name
    doc.fillColor(primaryColor).fontSize(24).font("Helvetica-Bold").text("RANGE OF HIMALAYAS", leftMargin, 50);
    doc.fillColor(mutedColor).fontSize(9).font("Helvetica").text("AUTHENTIC WELLNESS FROM THE PEAKS", leftMargin, 75);
    
    // Invoice Label (Top Right)
    doc.fillColor(secondaryColor).fontSize(28).font("Helvetica-Bold").text("INVOICE", 0, 50, { align: "right", indent: 50 });
    
    // Horizontal Divider
    doc.moveTo(leftMargin, 100).lineTo(545, 100).strokeColor(borderColor).lineWidth(1).stroke();

    // ================= INFO SECTION =================
    // Left: Customer Details
    doc.fillColor(primaryColor).fontSize(10).font("Helvetica-Bold").text("BILL TO", leftMargin, 125);
    doc.fillColor(secondaryColor).fontSize(12).font("Helvetica-Bold").text(user?.name || order.userName || "Customer", leftMargin, 140);
    
    doc.fillColor(mutedColor).fontSize(10).font("Helvetica").lineGap(2)
      .text(order.addressInfo?.phone || "")
      .text(`${order.addressInfo?.address || ""}`)
      .text(`${order.addressInfo?.city || ""} - ${order.addressInfo?.pincode || ""}`);

    // Right: Order Metadata
    const infoTableY = 125;
    const labelWidth = 70;

    const drawMetaRow = (label, value, y) => {
      doc.fillColor(mutedColor).font("Helvetica-Bold").fontSize(9).text(label, rightColumnX, y);
      doc.fillColor(secondaryColor).font("Helvetica").fontSize(9).text(value, rightColumnX + labelWidth, y, { align: "right", width: 95 });
    };

    drawMetaRow("Invoice No:", orderId.slice(-8).toUpperCase(), infoTableY);
    drawMetaRow("Order Date:", formattedDate, infoTableY + 15);
    drawMetaRow("Payment:", order.paymentMethod?.toUpperCase() || "COD", infoTableY + 30);
    drawMetaRow("Status:", (order.orderStatus || "Pending").toUpperCase(), infoTableY + 45);

    // ================= TABLE SECTION =================
    let currentY = 220;

    // Header Table
    doc.rect(leftMargin, currentY, pageWidth, 25).fill(tableHeaderColor);
    doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(10);
    
    doc.text("ITEM DESCRIPTION", leftMargin + 10, currentY + 8);
    doc.text("PRICE", 330, currentY + 8, { width: 60, align: "right" });
    doc.text("QTY", 400, currentY + 8, { width: 40, align: "center" });
    doc.text("TOTAL", 465, currentY + 8, { width: 80, align: "right" });

    currentY += 30;

    // Table Rows
    (order.cartItems || []).forEach((item) => {
      const title = item.title || "Product";
      const subTitle = item.weight || item.size || "";
      const price = Number(item.price) || 0;
      const total = (price * item.quantity).toFixed(2);

      // Row Zebra Stripe (Optional)
      // doc.rect(leftMargin, currentY - 5, pageWidth, 20).fill("#fafafa"); 

      doc.fillColor(secondaryColor).font("Helvetica").fontSize(10);
      doc.text(title, leftMargin + 10, currentY, { width: 200 });
      
      if (subTitle) {
        doc.fontSize(8).fillColor(mutedColor).text(subTitle, leftMargin + 10, currentY + 12);
      }

      doc.fillColor(secondaryColor).fontSize(10);
      doc.text(`Rs. ${price}`, 330, currentY, { width: 60, align: "right" });
      doc.text(item.quantity, 400, currentY, { width: 40, align: "center" });
      doc.text(`Rs. ${total}`, 465, currentY, { width: 80, align: "right" });

      currentY += subTitle ? 35 : 25;

      // Draw thin line between items
      doc.moveTo(leftMargin, currentY - 5).lineTo(545, currentY - 5).strokeColor(tableHeaderColor).lineWidth(0.5).stroke();
    });

    // ================= SUMMARY SECTION =================
    currentY += 20;
    const summaryX = 350;

    const drawSummaryRow = (label, value, isTotal = false) => {
      if (isTotal) {
        doc.rect(summaryX, currentY - 5, 195, 25).fill(primaryColor);
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(12);
      } else {
        doc.fillColor(mutedColor).font("Helvetica").fontSize(10);
      }

      doc.text(label, summaryX + 10, currentY);
      doc.text(value, 465, currentY, { width: 70, align: "right" });
      currentY += isTotal ? 30 : 20;
    };

    const discount = Number(order.discountAmount || 0) + Number(order.couponDiscount || 0);

    drawSummaryRow("Subtotal", `Rs. ${order.subTotal || order.totalAmount}`);
    
    if (discount > 0) {
      drawSummaryRow("Discount", `- Rs. ${discount}`);
    }

    if (order.paymentMethod === "cod") {
      drawSummaryRow("Advance Paid", `Rs. ${order.codAdvanceAmount || 0}`);
      drawSummaryRow("Balance Due", `Rs. ${order.codRemainingAmount || 0}`);
    }

    drawSummaryRow("Shipping", "FREE");
    drawSummaryRow("GRAND TOTAL", `Rs. ${order.totalAmount}`, true);

    // ================= FOOTER =================
    const footerY = 750;
    
    doc.moveTo(leftMargin, footerY).lineTo(545, footerY).strokeColor(borderColor).stroke();

    doc
      .fillColor(mutedColor)
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text("Thank you for supporting sustainable Himalayan communities.", 0, footerY + 15, { align: "center", width: 595 })
      .font("Helvetica")
      .fontSize(7)
      .fillColor("#ABB2B9")
      .text("This is a computer-generated document. No signature required.", 0, footerY + 30, { align: "center", width: 595 });

    doc.end();
  });
};