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
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // Add "RANGE OF HIMALAYAS" on the top right corner
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#888888")
      .text("RANGE OF HIMALAYAS", doc.page.width - doc.page.margins.right - 150, doc.page.margins.top - 10, {
        width: 150,
        align: "right",
        continued: false,
      });

    // Create product lookup map
    const productsMap = {};
    products.forEach((prod) => {
      productsMap[prod._id.toString()] = prod;
    });

    // Left margin for order info alignment
    const leftMargin = doc.page.margins.left;

    // Header - Title (Left aligned)
    doc
      .font("Helvetica-Bold")
      .fontSize(24)
      .fillColor("#333333")
      .text("INVOICE", leftMargin);

    doc.moveDown(1);

    // Order Info Box (Aligned Left)
    doc
      .fontSize(12)
      .fillColor("#555555")
      .text("Order ID: ", leftMargin, doc.y, { continued: true })
      .font("Helvetica")
      .fillColor("#000000")
      .text(order._id);

    doc
      .font("Helvetica-Bold")
      .fillColor("#555555")
      .text("Order Date: ", leftMargin, doc.y, { continued: true })
      .font("Helvetica")
      .fillColor("#000000")
      .text(new Date(order.orderDate).toLocaleDateString());

    doc
      .font("Helvetica-Bold")
      .fillColor("#555555")
      .text("Payment Method: ", leftMargin, doc.y, { continued: true })
      .font("Helvetica")
      .fillColor("#000000")
      .text(order.paymentMethod);

    doc.moveDown(1);

    // Horizontal line separator
    doc
      .strokeColor("#cccccc")
      .lineWidth(1)
      .moveTo(leftMargin, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    doc.moveDown(0.5);

    // Cart Items Header
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#333333")
      .text("Cart Items", leftMargin, doc.y, { underline: true });

    doc.moveDown(0.7);

    // Table header for cart items
    const cartX = leftMargin + 10;
    const cartTitleX = cartX;
    const cartQtyX = cartTitleX + 280;
    const cartPriceX = cartQtyX + 70;

    const headerY = doc.y; // fixed y-position for all headers

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#555555")
      .text("Item", cartTitleX, headerY)
      .text("Qty", cartQtyX, headerY, { width: 50, align: "center" })
      .text("Price", cartPriceX, headerY, { width: 90, align: "right" });

    doc.moveDown(0.4);

    doc
      .strokeColor("#dddddd")
      .lineWidth(0.7)
      .moveTo(cartTitleX, doc.y)
      .lineTo(cartPriceX + 90, doc.y)
      .stroke();

    doc.moveDown(0.4);

    // Cart Items List with columns
    order.cartItems.forEach((item, idx) => {
      const product = productsMap[item.productId?.toString()] || {};
      const title = item.title || product.title || "Product";
      const price = item.price || product.price || "N/A";

      const rowY = doc.y;
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#000000")
        .text(title, cartTitleX, rowY, { width: 280 })
        .text(item.quantity.toString(), cartQtyX, rowY, { width: 50, align: "center" })
        .text(`₹${price}`, cartPriceX, rowY, { width: 90, align: "right" });

      doc.moveDown(0.6);
    });

    // Boxes Section
    if (order.boxes && order.boxes.length > 0) {
      doc.moveDown(2);

      // "Boxes" header aligned left margin
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor("#333333")
        .text("Boxes", leftMargin, doc.y, { underline: true });

      order.boxes.forEach((box, index) => {
        doc.moveDown(1);

        // Box name aligned left margin (no extra indent)
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .fillColor("#222222")
          .text(`${index + 1}. Box: ${box.boxName || "Box"}`, leftMargin);

        if (box.items && box.items.length > 0) {
          const boxTableTop = doc.y + 5;
          const itemX = leftMargin + 20; // indent for box items
          const sizeX = itemX + 250;
          const qtyX = sizeX + 70;
          const priceX = qtyX + 70;

          // Table header for box items
          doc
            .font("Helvetica-Bold")
            .fontSize(12)
            .fillColor("#555555")
            .text("Item", itemX, boxTableTop)
            .text("Size", sizeX, boxTableTop, { width: 60, align: "center" })
            .text("Qty", qtyX, boxTableTop, { width: 60, align: "center" })
            .text("Price", priceX, boxTableTop, { width: 80, align: "right" });

          doc.moveDown(0.5);
          doc
            .strokeColor("#dddddd")
            .lineWidth(0.7)
            .moveTo(itemX, doc.y)
            .lineTo(priceX + 80, doc.y)
            .stroke();

          doc.moveDown(0.2);

          // Box items rows
          box.items.forEach((item) => {
            const product = productsMap[item.productId?.toString()] || {};
            const title = item.title || product.title || "Item";

            let price = "N/A";
            if (product.sizes && Array.isArray(product.sizes)) {
              const sizeObj = product.sizes.find((s) => s.size === item.size);
              if (sizeObj) price = sizeObj.salesPrice ?? sizeObj.price ?? "N/A";
            }

            const rowY = doc.y;
            doc
              .font("Helvetica")
              .fontSize(11)
              .fillColor("#000000")
              .text(title, itemX, rowY, { width: 240 })
              .text(item.size || "-", sizeX, rowY, { width: 60, align: "center" })
              .text(item.quantity.toString(), qtyX, rowY, { width: 60, align: "center" })
              .text(`₹${price}`, priceX, rowY, { width: 80, align: "right" });

            doc.moveDown(0.5);
          });
        } else {
          doc
            .font("Helvetica-Oblique")
            .fontSize(11)
            .fillColor("#888888")
            .text("- No items listed in this box.", { indent: 20 });
        }
      });
    }

    // Total Amount
    doc.moveDown(2);
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#000000")
      .text(`Total Amount: ₹${order.totalAmount}`, { align: "right" });

    doc.end();
  });
};
