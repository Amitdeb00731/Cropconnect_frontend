import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, CircularProgress
} from '@mui/material';
import { generateMillInvoicePDF } from './InvoiceGenerator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function MillInvoicePreviewDialog({ open, onClose, invoice, millProfile }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState(null);

  const enrichedInvoice = {
    ...invoice,
    millName: millProfile?.name || 'Unknown Mill',
    millLocation: millProfile?.location || 'N/A'
  };

  useEffect(() => {
    const generatePreview = async () => {
      setLoading(true);
      const doc = await generateMillInvoicePDF(enrichedInvoice, { returnPdfDoc: true });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setLoading(false);
    };

    if (open) generatePreview();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    };
  }, [open]);

  const handleDownload = async () => {
    await generateMillInvoicePDF(enrichedInvoice);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Invoice Preview</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <CircularProgress />
        ) : (
          <iframe
            ref={iframeRef}
            title="Invoice Preview"
            src={pdfUrl}
            style={{ width: '100%', height: '500px', border: 'none' }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button onClick={handleDownload} variant="contained" color="primary">
          Download Invoice
        </Button>
      </DialogActions>
    </Dialog>
  );
}
