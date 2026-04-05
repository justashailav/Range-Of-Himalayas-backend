import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const generateInvoicePDFBuffer = async (order, products = [], user = {}) => {
  return new Promise(async (resolve, reject) => {
    // A4: 595.28 x 841.89
    const doc = new PDFDocument({ size: "A4", margin: 0 }); // Margin 0 to allow full-bleed accents
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // 🎨 MODERN COLOR PALETTE
    const colors = {
      primary: "#1A1A1A",    // Deep Charcoal
      accent: "#B23A2E",     // Himalayan Red
      secondary: "#4A5568",  // Slate Gray
      lightBg: "#F7FAFC",    // Soft Gray Blue
      border: "#E2E8F0",     // Light Border
      white: "#FFFFFF"
    };

    const leftMargin = 50;
    const contentWidth = 500;

    // ================= SIDEBAR ACCENT (Visual Branding) =================
    doc.rect(0, 0, 15, 842).fill(colors.accent); // Thin red line on the far left

    // ================= HEADER =================
    // Top Background Shape
    doc.rect(15, 0, 580, 120).fill(colors.lightBg);

    doc
      .fillColor(colors.primary)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("RANGE OF HIMALAYAS", leftMargin, 45);

    doc
      .fillColor(colors.secondary)
      .fontSize(8)
      .font("Helvetica")
      .text("AUTHENTIC WELLNESS FROM THE PEAKS", leftMargin, 70, { characterSpacing: 1.5 });

    doc
      .fillColor(colors.accent)
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 45, { align: "right", width: 145 });

    // ================= INFO GRID (Modern Box Layout) =================
    let currentY = 140;

    const drawSectionHeader = (label, x, y) => {
      doc.fillColor(colors.accent).fontSize(8).font("Helvetica-Bold").text(label.toUpperCase(), x, y);
    };

    // Customer Info
    drawSectionHeader("Bill To", leftMargin, currentY);
    doc
      .fillColor(colors.primary)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(user?.name || "Valued Customer", leftMargin, currentY + 15)
      .font("Helvetica")
      .fontSize(9)
      .fillColor(colors.secondary)
      .text(order.addressInfo?.phone || "", { lineGap: 2 })
      .text(`${order.addressInfo?.address || ""}`)
      .text(`${order.addressInfo?.city || ""} - ${order.addressInfo?.pincode || ""}`);

    // Invoice Meta Info (Right Side)
    const metaX = 380;
    drawSectionHeader("Invoice Details", metaX, currentY);
    
    const drawMetaRow = (label, value, y) => {
      doc.fillColor(colors.secondary).font("Helvetica").fontSize(9).text(label, metaX, y);
      doc.fillColor(colors.primary).font("Helvetica-Bold").text(value, metaX + 80, y, { align: "right", width: 85 });
    };

    const date = new Date(order.createdAt || order.orderDate);
    const formattedDate = !isNaN(date) ? date.toLocaleDateString("en-IN") : "N/A";

    drawMetaRow("Invoice No:", `#${order?._id?.toString().slice(-6).toUpperCase() || "N/A"}`, currentY + 15);
    drawMetaRow("Date:", formattedDate, currentY + 30);
    drawMetaRow("Payment:", order.paymentMethod?.toUpperCase() || "COD", currentY + 45);
    drawMetaRow("Tracking:", order.iccOrderId || "PENDING", currentY + 60);

    // ================= TABLE SECTION =================
    currentY = 250;

    // Table Header
    doc.rect(leftMargin, currentY, contentWidth, 22).fill(colors.primary);
    doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(9);
    doc.text("PRODUCT DESCRIPTION", leftMargin + 10, currentY + 7);
    doc.text("PRICE", 320, currentY + 7, { width: 60, align: "right" });
    doc.text("QTY", 400, currentY + 7, { width: 40, align: "center" });
    doc.text("TOTAL", 460, currentY + 7, { width: 80, align: "right" });

    currentY += 32;

    // Table Rows
    (order.cartItems || []).forEach((item, index) => {
      const price = Number(item.price) || 0;
      const total = price * item.quantity;

      // Zebra Striping
      if (index % 2 === 0) {
        doc.rect(leftMargin, currentY - 5, contentWidth, 25).fill(colors.lightBg);
      }

      doc.fillColor(colors.primary).font("Helvetica-Bold").fontSize(9).text(item.title, leftMargin + 10, currentY);
      
      if (item.weight || item.size) {
        doc.fillColor(colors.secondary).fontSize(7).font("Helvetica").text(item.weight || item.size, leftMargin + 10, currentY + 10);
      }

      doc.fillColor(colors.primary).font("Helvetica").fontSize(9);
      doc.text(`₹${price.toLocaleString()}`, 320, currentY, { width: 60, align: "right" });
      doc.text(item.quantity, 400, currentY, { width: 40, align: "center" });
      doc.text(`₹${total.toLocaleString()}`, 460, currentY, { width: 80, align: "right" });

      currentY += 30;
    });

    // ================= SUMMARY SECTION =================
    currentY += 10;
    const summaryX = 350;

    const drawTotalRow = (label, value, isGrand = false) => {
      if (isGrand) {
        doc.rect(summaryX, currentY - 5, 200, 30).fill(colors.accent);
        doc.fillColor(colors.white).font("Helvetica-Bold").fontSize(12);
      } else {
        doc.fillColor(colors.secondary).font("Helvetica").fontSize(10);
      }

      doc.text(label, summaryX + 10, currentY + (isGrand ? 5 : 0));
      doc.text(value, 460, currentY + (isGrand ? 5 : 0), { width: 80, align: "right" });
      currentY += isGrand ? 40 : 20;
    };

    drawTotalRow("Subtotal", `₹${order.totalAmount.toLocaleString()}`);
    drawTotalRow("Shipping", "FREE");

    if (order.paymentMethod === "cod") {
       doc.fillColor(colors.accent).fontSize(8).font("Helvetica-Bold").text("COD BREAKDOWN", summaryX + 10, currentY);
       currentY += 15;
       drawTotalRow("Advance Paid", `₹${order.codAdvanceAmount || 0}`);
       drawTotalRow("Pay on Delivery", `₹${order.codRemainingAmount || 0}`);
    }

    drawTotalRow("GRAND TOTAL", `₹${order.totalAmount.toLocaleString()}`, true);

    // ================= QR & FOOTER =================
    const qrData = `https://www.rangeofhimalayas.co.in/track-order/${order._id}`;
    const qrImage = await QRCode.toDataURL(qrData);

    doc.image(qrImage, leftMargin, 710, { width: 65 });
    doc
      .fillColor(colors.primary)
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("SCAN TO TRACK ORDER", leftMargin, 780);

    // Footer Info
    const footerY = 730;
    doc
      .fillColor(colors.secondary)
      .fontSize(8)
      .font("Helvetica")
      .text("Thank you for choosing Range of Himalayas.", 200, footerY, { align: "right", width: 345 })
      .text("We support sustainable Himalayan farming communities.", 200, footerY + 12, { align: "right", width: 345 })
      .fillColor(colors.accent)
      .text("Support: +91-6230867344 | contactrangeofhimalayas@gmail.com", 200, footerY + 24, { align: "right", width: 345 });

    // Final Note
    doc
      .fillColor("#CBD5E0")
      .fontSize(7)
      .text("Computer generated invoice. No signature required.", 0, 810, { align: "center", width: 595 });

    doc.end();
  });
};