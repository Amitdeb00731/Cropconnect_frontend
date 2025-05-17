import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "./assets/Screenshot 2025-05-07 113933-Photoroom.png";
import signature from "./assets/signature.png";

// ✅ Utility: Create rotated image watermark
const createRotatedImageBase64 = async (imageUrl, angleDeg = -45, width = 300, height = 300) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.translate(width / 2, height / 2);
      ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.globalAlpha = 0.05;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = imageUrl;
  });
};

// ✅ FARMER INVOICE GENERATOR
export const generateInvoicePDF = async (purchase) => {
  const doc = new jsPDF();
  const rupee = "Rs.";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const rotatedWatermark = await createRotatedImageBase64(logo);
  doc.addImage(rotatedWatermark, "PNG", 0, 0, pageWidth, pageHeight);

  doc.setFont("helvetica", "bold");
  doc.addImage(logo, "PNG", 10, 10, 40, 15);
  doc.setFontSize(18);
  doc.text("Harvest Purchase Invoice", 105, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setLineWidth(0.1);
  doc.rect(14, 35, 180, 35);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice ID: ${purchase.id}`, 18, 45);
  doc.text(`Date: ${new Date(purchase.timestamp).toLocaleString()}`, 18, 52);
  doc.text(`Middleman: ${purchase.middlemanName}`, 18, 59);
  doc.text(`Farmer: ${purchase.farmerName}`, 100, 45);

  const harvestDetails = purchase.harvests.map((item, i) => [
    i + 1,
    item.riceType,
    `${item.remainingQuantity} Kg`,
    `${rupee} ${item.askingPrice}`,
    `${rupee} ${parseFloat(item.finalizedPrice || item.proposedPrice || item.askingPrice || 0).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 75,
    head: [["#", "Crop", "Quantity", "Asking Price", "Final Price"]],
    body: harvestDetails,
    theme: "grid",
    headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 11 },
  });

  const total = purchase.harvests.reduce((acc, item) => {
    const price = parseFloat(item.finalizedPrice || item.proposedPrice || item.askingPrice || 0);
    return acc + (isNaN(price) ? 0 : price);
  }, 0);

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Amount: ${rupee} ${total.toFixed(2)}`, 14, finalY);
  doc.text(`Payment Method: ${purchase.paymentMethod}`, 14, finalY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const termsY = finalY + 25;
  doc.text("Terms & Conditions:", 14, termsY);
  doc.setFontSize(9);
  doc.text("- This invoice is generated electronically and does not require physical signature.", 14, termsY + 6);
  doc.text("- Please retain this invoice for your records.", 14, termsY + 12);
  doc.text("- Payment once made is non-refundable.", 14, termsY + 18);
  doc.text("- For queries, contact us using the information below.", 14, termsY + 24);

  const sigWidth = 40;
  const sigHeight = 15;
  const sigY = pageHeight - 50;
  doc.addImage(signature, "PNG", 14, sigY, sigWidth, sigHeight);
  doc.setFontSize(10);
  doc.text("Authorized Signature", 14, sigY + sigHeight + 5);
  doc.text("Market Authority", 14, sigY + sigHeight + 11);

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    "© 2025 CropConnect | Contact: +91 8170843004 | Email: amitdebrnp380@gmail.com",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  doc.save(`Invoice_${purchase.id}.pdf`);
};

// ✅ MILL INVOICE GENERATOR
export const generateMillInvoicePDF = async (invoice) => {
  const doc = new jsPDF();
  const rupee = "Rs.";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const rotatedWatermark = await createRotatedImageBase64(logo);
  doc.addImage(rotatedWatermark, "PNG", 0, 0, pageWidth, pageHeight);

  doc.setFont("helvetica", "bold");
  doc.addImage(logo, "PNG", 10, 10, 40, 15);
  doc.setFontSize(18);
  doc.text("Mill Processing Invoice", 105, 25, { align: "center" });

  doc.setFontSize(12);
  doc.setLineWidth(0.1);
  doc.rect(14, 35, 180, 35);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice ID: ${invoice.id}`, 18, 45);
  doc.text(`Date: ${new Date(invoice.timestamp).toLocaleString()}`, 18, 52);
  doc.text(`Middleman: ${invoice.middlemanName}`, 18, 59);
  doc.text(`Mill: ${invoice.millName}`, 100, 45);
  doc.text(`Payment Method: ${invoice.paymentMethod}`, 100, 52);

  const tableData = [[
    "1",
    invoice.riceType,
    `${invoice.quantity} Kg`,
    `${rupee} ${invoice.processingCost}`
  ]];

  autoTable(doc, {
    startY: 75,
    head: [["#", "Rice Type", "Quantity", "Processing Cost"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [34, 112, 147], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 11 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Amount: ${rupee} ${parseFloat(invoice.processingCost).toFixed(2)}`, 14, finalY);

  const termsY = finalY + 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Terms & Conditions:", 14, termsY);
  doc.setFontSize(9);
  doc.text("- This invoice is generated electronically and does not require physical signature.", 14, termsY + 6);
  doc.text("- Please retain this invoice for your records.", 14, termsY + 12);
  doc.text("- Payment once made is non-refundable.", 14, termsY + 18);
  doc.text("- For queries, contact us using the information below.", 14, termsY + 24);

  const sigWidth = 40;
  const sigHeight = 15;
  const sigY = pageHeight - 50;
  doc.addImage(signature, "PNG", 14, sigY, sigWidth, sigHeight);
  doc.setFontSize(10);
  doc.text("Authorized Signature", 14, sigY + sigHeight + 5);
  doc.text("Market Authority", 14, sigY + sigHeight + 11);

  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    "© 2025 CropConnect | Contact: +91 8170843004 | Email: amitdebrnp380@gmail.com",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  doc.save(`MillInvoice_${invoice.id}.pdf`);
};
