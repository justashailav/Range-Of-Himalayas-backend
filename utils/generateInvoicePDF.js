import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const generateInvoicePDFBuffer = async (order, products = [], user = {}) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // 🎨 THEME COLORS
    const primaryRed = "#B23A2E";
    const darkSlate = "#2D3436";
    const lightGray = "#F9F9F9";
    const borderGray = "#EEF2F3";
    const textMuted = "#636E72";

    const leftMargin = 50;
    const contentWidth = 495;

    // Sidebar Accent
    doc.rect(0, 0, 10, 842).fill(primaryRed);

    // ================= HEADER =================
    doc.rect(10, 0, 585, 125).fill(lightGray);

    doc
      .fillColor(primaryRed)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("RANGE OF HIMALAYAS", leftMargin, 40);

    doc
      .fillColor(textMuted)
      .fontSize(8)
      .font("Helvetica")
      .text("AUTHENTIC WELLNESS FROM THE PEAKS", leftMargin, 65, { characterSpacing: 1 });

    doc
      .fillColor(darkSlate)
      .fontSize(26)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 40, { align: "right", width: 145 });

    // ================= INVOICE META (FIXED OVERLAP) =================
    const invoiceNumber = `INV_${order?._id?.toString() || "N/A"}`;
    const metaY = 75;
    
    // Use a smaller font for the ID and more width to prevent wrapping onto the date
    doc.fillColor(textMuted).fontSize(9).font("Helvetica").text("Invoice No:", 350, metaY, { align: "right", width: 80 });
    doc.fillColor(darkSlate).fontSize(8.5).font("Helvetica-Bold").text(invoiceNumber, 440, metaY, { align: "right", width: 105 });
    
    const date = new Date(order.createdAt || order.orderDate);
    const formattedDate = !isNaN(date) ? date.toLocaleDateString("en-IN") : "N/A";
    
    // Increased gap to 18 to ensure no line collision
    doc.fillColor(textMuted).fontSize(9).font("Helvetica").text("Date:", 350, metaY + 18, { align: "right", width: 80 });
    doc.fillColor(darkSlate).font("Helvetica-Bold").text(formattedDate, 440, metaY + 18, { align: "right", width: 105 });

    // ================= ADDRESS & PAYMENT (FIXED COINCIDING) =================
    let currentY = 160;

    // Bill To (Left Side)
    doc.fillColor(primaryRed).fontSize(10).font("Helvetica-Bold").text("BILL TO", leftMargin, currentY);
    doc.fillColor(darkSlate).fontSize(11).text(user?.name || "Customer", leftMargin, currentY + 15);
    doc.fillColor(textMuted).fontSize(9).font("Helvetica")
      .text(order.addressInfo?.phone || "", leftMargin, currentY + 28)
      .text(order.addressInfo?.address || "", { width: 250 }) // Constrain width so it doesn't bleed into the box
      .text(`${order.addressInfo?.city || ""} - ${order.addressInfo?.pincode || ""}`);

    // Payment Info Box (Right Side - Pushed further right and height adjusted)
    const boxX = 365; 
    const boxWidth = 180;
    doc.rect(boxX, currentY - 5, boxWidth, 85).strokeColor(borderGray).stroke();
    doc.fillColor(primaryRed).fontSize(8).font("Helvetica-Bold").text("PAYMENT DETAILS", boxX + 10, currentY + 5);
    
    const drawMetaRow = (label, value, y) => {
      doc.fillColor(textMuted).font("Helvetica").fontSize(8.5).text(label, boxX + 10, y);
      doc.fillColor(darkSlate).font("Helvetica-Bold").text(value, boxX + 80, y, { align: "right", width: 90 });
    };

    drawMetaRow("Method:", order.paymentMethod?.toUpperCase() || "COD", currentY + 22);
    drawMetaRow("Status:", (order.paymentStatus || "PAID").toUpperCase(), currentY + 37);
    drawMetaRow("Order Ref:", order.iccOrderId || "PENDING", currentY + 52);

    // ================= TABLE =================
    currentY = 285; // Lowered table starting position to clear the address box

    doc.rect(leftMargin, currentY, contentWidth, 25).fill(darkSlate);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9);
    doc.text("ITEM DESCRIPTION", leftMargin + 10, currentY + 8);
    doc.text("PRICE", 330, currentY + 8, { align: "right", width: 60 });
    doc.text("QTY", 400, currentY + 8, { align: "center", width: 40 });
    doc.text("TOTAL", 465, currentY + 8, { align: "right", width: 80 });

    currentY += 30;

    (order.cartItems || []).forEach((item, i) => {
      const price = Number(item.price) || 0;
      const total = price * item.quantity;

      if (i % 2 === 0) {
        doc.rect(leftMargin, currentY - 5, contentWidth, 25).fill("#FCFCFC");
      }

      doc.fillColor(darkSlate).font("Helvetica-Bold").fontSize(9).text(item.title, leftMargin + 10, currentY, { width: 200 });
      
      if (item.weight || item.size) {
        doc.fillColor(textMuted).fontSize(7).font("Helvetica").text(item.weight || item.size, leftMargin + 10, currentY + 11);
      }

      doc.fillColor(darkSlate).font("Helvetica").fontSize(9);
      doc.text(`Rs. ${price.toLocaleString()}`, 330, currentY, { align: "right", width: 60 });
      doc.text(item.quantity, 400, currentY, { align: "center", width: 40 });
      doc.text(`Rs. ${total.toLocaleString()}`, 465, currentY, { align: "right", width: 80 });

      currentY += 28;
    });

    // ================= SUMMARY =================
    currentY += 20;
    const summaryX = 350;

    const drawSummaryRow = (label, value, isTotal = false) => {
      if (isTotal) {
        doc.rect(summaryX, currentY - 8, 195, 30).fill(primaryRed);
        doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(11);
      } else {
        doc.fillColor(textMuted).font("Helvetica").fontSize(10);
      }
      doc.text(label, summaryX + 10, currentY);
      doc.text(value, 465, currentY, { align: "right", width: 80 });
      currentY += isTotal ? 35 : 22;
    };

    drawSummaryRow("Subtotal", `Rs. ${order.totalAmount.toLocaleString()}`);
    drawSummaryRow("Shipping", "FREE");

    if (order.paymentMethod === "cod") {
      doc.fillColor(primaryRed).fontSize(8).font("Helvetica-Bold").text("COD BREAKDOWN", summaryX + 10, currentY - 5);
      currentY += 12;
      drawSummaryRow("Advance Paid", `Rs. ${order.codAdvanceAmount || 0}`);
      drawSummaryRow("Remaining", `Rs. ${order.codRemainingAmount || 0}`);
    }

    drawSummaryRow("GRAND TOTAL", `Rs. ${order.totalAmount.toLocaleString()}`, true);

    // ================= FOOTER =================
    const footerY = 720;
    const qrData = `https://www.rangeofhimalayas.co.in/order-tracking`;
    const qrImage = await QRCode.toDataURL(qrData);
    doc.image(qrImage, leftMargin, footerY - 20, { width: 70 });
    doc.fillColor(textMuted).fontSize(7).text("SCAN TO TRACK", leftMargin + 5, footerY + 55);

    doc.moveTo(leftMargin, footerY + 80).lineTo(545, footerY + 80).strokeColor(borderGray).stroke();

    doc
      .fillColor(textMuted)
      .fontSize(8)
      .text("Thank you for supporting sustainable Himalayan communities.", 0, footerY + 90, { align: "center", width: 595 })
      .text("Support: +91-6230867344 | contactrangeofhimalayas@gmail.com", 0, footerY + 102, { align: "center", width: 595 });

    doc
      .fontSize(7)
      .fillColor("#ABB2B9")
      .text("This is a computer-generated document. No signature required.", 0, footerY + 115, { align: "center", width: 595 });

    doc.end();
  });
};