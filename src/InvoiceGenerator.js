import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "./assets/Screenshot 2025-05-07 113933-Photoroom.png";
import signature from "./assets/signature.png";

// Utility: Rotate image using a canvas
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

export const generateInvoicePDF = async (purchase) => {
  const doc = new jsPDF();
  const rupee = "Rs.";

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ✅ Add watermark using rotated image base64
  const rotatedWatermark = await createRotatedImageBase64(logo);
  doc.addImage(rotatedWatermark, "PNG", 0, 0, pageWidth, pageHeight);

  // ✅ Header: Logo + title
  doc.setFont("helvetica", "bold");
  doc.addImage(logo, "PNG", 10, 10, 40, 15);
  doc.setFontSize(18);
  doc.text("Harvest Purchase Invoice", 105, 25, { align: "center" });

  // ✅ Invoice metadata
  doc.setFontSize(12);
  doc.setLineWidth(0.1);
  doc.rect(14, 35, 180, 35);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice ID: ${purchase.id}`, 18, 45);
  doc.text(`Date: ${new Date(purchase.timestamp).toLocaleString()}`, 18, 52);
  doc.text(`Middleman: ${purchase.middlemanName}`, 18, 59);
  doc.text(`Farmer: ${purchase.farmerName}`, 100, 45);

  // ✅ Table of purchased items
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

  // ✅ Total amount + payment method
  const total = purchase.harvests.reduce((acc, item) => {
  const price = parseFloat(item.finalizedPrice || item.proposedPrice || item.askingPrice || 0);
  return acc + (isNaN(price) ? 0 : price);
}, 0);


  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Amount: ${rupee} ${total.toFixed(2)}`, 14, finalY);
  doc.text(`Payment Method: ${purchase.paymentMethod}`, 14, finalY + 10);

  // ✅ Invoice Terms
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const termsY = finalY + 25;
  doc.text("Terms & Conditions:", 14, termsY);
  doc.setFontSize(9);
  doc.text("- This invoice is generated electronically and does not require physical signature.", 14, termsY + 6);
  doc.text("- Please retain this invoice for your records.", 14, termsY + 12);
  doc.text("- Payment once made is non-refundable.", 14, termsY + 18);
  doc.text("- For queries, contact us using the information below.", 14, termsY + 24);

  // ✅ Signature
  const sigWidth = 40;
  const sigHeight = 15;
  const sigY = pageHeight - 50;
  doc.addImage(signature, "PNG", 14, sigY, sigWidth, sigHeight);
  doc.setFontSize(10);
  doc.text("Authorized Signature", 14, sigY + sigHeight + 5);
  doc.text("Market Authority", 14, sigY + sigHeight + 11);

  // ✅ Footer (company/contact info)
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(
    "© 2025 CropConnect | Contact: +91 8170843004 | Email: amitdebrnp380@gmail.com",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" }
  );

  // ✅ Save
  doc.save(`Invoice_${purchase.id}.pdf`);
};
