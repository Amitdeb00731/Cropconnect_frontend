import React from 'react';
import { Button } from '@mui/material';
import { generateMillInvoicePDF } from './InvoiceGenerator';

export default function MillInvoiceDownloadButton({ invoice, millProfile }) {
  const handleDownload = async () => {
    await generateMillInvoicePDF({
      ...invoice,
      millName: millProfile?.name || 'Unknown Mill',
      millLocation: millProfile?.location || 'N/A'
    });
  };

  return (
    <Button variant="outlined" onClick={handleDownload}>
      Download Invoice
    </Button>
  );
}
