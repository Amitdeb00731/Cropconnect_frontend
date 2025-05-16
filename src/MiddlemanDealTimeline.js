import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ArrowForwardIos, ArrowDownward } from '@mui/icons-material';
import Lottie from 'lottie-react';

// ✅ Lottie imports
import proposalAnim from './assets/proposals.json';
import inspectionAnim from './assets/inspection.json';
import paymentAnim from './assets/payment.json';
import inventoryAnim from './assets/inventory.json';
import processingAnim from './assets/processing.json';

const steps = [
  {
    title: 'Proposal Sent',
    desc: 'You sent a price proposal to the farmer.',
    animation: proposalAnim,
    bg: '#e3f2fd'
  },
  {
    title: 'Inspection Accepted',
    desc: 'Farmer approved the inspection request.',
    animation: inspectionAnim,
    bg: '#e8f5e9'
  },
  {
    title: 'Payment Done',
    desc: 'The payment has been successfully completed.',
    animation: paymentAnim,
    bg: '#fff3e0'
  },
  {
    title: 'Inventory Updated',
    desc: 'The harvest was added to your inventory.',
    animation: inventoryAnim,
    bg: '#f1f8e9'
  },
  {
    title: 'Processing Tracked',
    desc: 'You’re monitoring milling and delivery status.',
    animation: processingAnim,
    bg: '#ede7f6'
  }
];

const MiddlemanDealTimeline = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" fontWeight={600} textAlign="center" mb={4}>
        Your Deal Timeline
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? 3 : 2
        }}
      >
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <Box
              sx={{
                backgroundColor: step.bg,
                borderRadius: 3,
                p: 2,
                minWidth: isMobile ? '100%' : 200,
                maxWidth: 240,
                textAlign: 'center',
                boxShadow: 3
              }}
            >
              <Box mb={1}>
                <Lottie animationData={step.animation} style={{ height: 80 }} loop />
              </Box>
              <Typography fontWeight={600}>{step.title}</Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {step.desc}
              </Typography>
            </Box>

            {i < steps.length - 1 && (
              <Box display="flex" justifyContent="center" alignItems="center" mt={isMobile ? 0 : 3}>
                {isMobile ? (
                  <ArrowDownward sx={{ fontSize: 24, color: '#aaa' }} />
                ) : (
                  <ArrowForwardIos sx={{ fontSize: 20, color: '#aaa' }} />
                )}
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default MiddlemanDealTimeline;
