import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export const generateInvoicePDFBuffer = async (
  order,
  products = [],
  user = {},
) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // 🎨 COLORS
    const primaryColor = "#B23A2E";
    const secondaryColor = "#2D3436";
    const mutedColor = "#636E72";
    const borderColor = "#DFE6E9";
    const tableHeaderColor = "#F8F9FA";

    const leftMargin = 50;
    const rightColumnX = 380;
    const pageWidth = doc.page.width - 100;

    const invoiceNumber = `INV_${order?._id?.toString() || "N/A"}`;
    const date = new Date(order.createdAt || order.orderDate);
    const formattedDate = !isNaN(date)
      ? date.toLocaleDateString("en-IN")
      : "N/A";

    // ================= HEADER =================
    doc
      .fillColor(primaryColor)
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("RANGE OF HIMALAYAS", leftMargin, 50);

    doc
      .fillColor(mutedColor)
      .fontSize(9)
      .text("AUTHENTIC WELLNESS FROM THE PEAKS", leftMargin, 75);

    doc
      .fillColor(secondaryColor)
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("INVOICE", 0, 50, { align: "right", indent: 50 });

    doc
      .moveTo(leftMargin, 100)
      .lineTo(545, 100)
      .strokeColor(borderColor)
      .stroke();

    // ================= BILL TO =================
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("BILL TO", leftMargin, 120);

    doc
      .fillColor(secondaryColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(user?.name || "Customer", leftMargin, 135);

    doc
      .fillColor(mutedColor)
      .fontSize(10)
      .font("Helvetica")
      .text(order.addressInfo?.phone || "")
      .text(order.addressInfo?.address || "")
      .text(
        `${order.addressInfo?.city || ""} - ${
          order.addressInfo?.pincode || ""
        }`,
      );

    // ================= SHIP TO =================
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("SHIP TO", leftMargin, 200);

    doc
      .fillColor(mutedColor)
      .fontSize(10)
      .font("Helvetica")
      .text(user?.name || "Customer")
      .text(order.addressInfo?.phone || "")
      .text(order.addressInfo?.address || "")
      .text(
        `${order.addressInfo?.city || ""} - ${
          order.addressInfo?.pincode || ""
        }`,
      );

    // ================= META =================
    const infoTableY = 120;

    const drawMetaRow = (label, value, y) => {
      doc
        .fillColor(mutedColor)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(label, rightColumnX, y);

      doc
        .fillColor(secondaryColor)
        .font("Helvetica")
        .text(value, rightColumnX + 90, y, { align: "right", width: 100 });
    };

    drawMetaRow("Invoice No:", invoiceNumber, infoTableY);
    drawMetaRow("Order Date:", formattedDate, infoTableY + 15);
    drawMetaRow(
      "Payment:",
      order.paymentMethod?.toUpperCase() || "COD",
      infoTableY + 30,
    );
    drawMetaRow(
      "Status:",
      (order.orderStatus || "Pending").toUpperCase(),
      infoTableY + 45,
    );

    drawMetaRow(
      "Payment Status:",
      order.paymentStatus?.toUpperCase() || "PAID",
      infoTableY + 60,
    );

    drawMetaRow("Courier Ref:", order.iccOrderId || "PENDING", infoTableY + 75);

    // ================= TABLE =================
    let currentY = 280;

    doc.rect(leftMargin, currentY, pageWidth, 25).fill(tableHeaderColor);

    doc.fillColor(secondaryColor).font("Helvetica-Bold").fontSize(10);
    doc.text("ITEM", leftMargin + 10, currentY + 8);
    doc.text("PRICE", 330, currentY + 8, { align: "right", width: 60 });
    doc.text("QTY", 400, currentY + 8, { align: "center", width: 40 });
    doc.text("TOTAL", 465, currentY + 8, { align: "right", width: 80 });

    currentY += 30;

    (order.cartItems || []).forEach((item) => {
      const price = Number(item.price) || 0;
      const total = price * item.quantity;

      doc.fillColor(secondaryColor).font("Helvetica").fontSize(10);

      doc.text(item.title, leftMargin + 10, currentY);

      if (item.weight || item.size) {
        doc
          .fontSize(8)
          .fillColor(mutedColor)
          .text(item.weight || item.size, leftMargin + 10, currentY + 12);
      }

      doc.fillColor(secondaryColor).fontSize(10);
      doc.text(`₹. ${price}`, 330, currentY, { align: "right", width: 60 });
      doc.text(item.quantity, 400, currentY, {
        align: "center",
        width: 40,
      });
      doc.text(`₹. ${total.toFixed(2)}`, 465, currentY, {
        align: "right",
        width: 80,
      });

      currentY += 30;
    });
    currentY += 20;

    const drawSummaryRow = (label, value, isTotal = false) => {
      if (isTotal) {
        doc.rect(350, currentY - 5, 195, 25).fill(primaryColor);
        doc.fillColor("#fff").font("Helvetica-Bold").fontSize(12);
      } else {
        doc.fillColor(mutedColor).font("Helvetica").fontSize(10);
      }

      doc.text(label, 360, currentY);
      doc.text(value, 465, currentY, { align: "right", width: 80 });

      currentY += isTotal ? 30 : 20;
    };

    // ✅ Subtotal (same as total since no discount shown)
    drawSummaryRow("Subtotal", `₹ ${order.totalAmount}`);

    // ================= COD =================
    if (order.paymentMethod === "cod") {
      doc
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Partial COD Details", 360, currentY);

      currentY += 15;

      drawSummaryRow("Advance Paid", `₹ ${order.codAdvanceAmount || 0}`);
      drawSummaryRow(
        "Remaining (Pay on Delivery)",
        `₹ ${order.codRemainingAmount || 0}`,
      );
      drawSummaryRow(
        "Advance Status",
        order.codAdvancePaid ? "PAID" : "PENDING",
      );
    }

    // ✅ Shipping
    drawSummaryRow("Shipping", "FREE");

    // ✅ Grand Total
    drawSummaryRow("GRAND TOTAL", `₹ ${order.totalAmount}`, true);
    // ================= QR CODE =================
    const qrData = `https://www.rangeofhimalayas.co.in/order-tracking`;
    const qrImage = await QRCode.toDataURL(qrData);

    doc.image(qrImage, 50, 700, { width: 80 });

    // ================= FOOTER =================
    const footerY = 750;

    doc
      .moveTo(leftMargin, footerY)
      .lineTo(545, footerY)
      .strokeColor(borderColor)
      .stroke();

    doc
      .fillColor(mutedColor)
      .fontSize(9)
      .text(
        "Thank you for supporting sustainable Himalayan communities.",
        0,
        footerY + 15,
        { align: "center" },
      );

    doc
      .fontSize(8)
      .text(
        "Support: +91-6230867344 | contactrangeofhimalayas@gmail.com",
        0,
        footerY + 30,
        { align: "center" },
      );

    doc
      .fontSize(7)
      .fillColor("#ABB2B9")
      .text(
        "This is a computer-generated document. No signature required.",
        0,
        footerY + 45,
        { align: "center" },
      );

    doc.end();
  });
};
