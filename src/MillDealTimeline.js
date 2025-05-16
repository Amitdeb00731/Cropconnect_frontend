import React from 'react';
import { Box, Typography, useTheme, useMediaQuery } from '@mui/material';
import { ArrowForwardIos, ArrowDownward } from '@mui/icons-material';
import Lottie from 'lottie-react';

// ✅ Lottie animation imports
import requestAnim from './assets/request.json';
import acceptedAnim from './assets/accepted.json';
import underProcessAnim from './assets/processing.json';
import completeAnim from './assets/completed.json';

const steps = [
  {
    title: 'Request Received',
    desc: 'A middleman submitted a request for processing.',
    animation: requestAnim,
    bg: '#fff3e0'
  },
  {
    title: 'Request Accepted',
    desc: 'You accepted the request and confirmed the schedule.',
    animation: acceptedAnim,
    bg: '#e8f5e9'
  },
  {
    title: 'Under Process',
    desc: 'The harvest is being milled or dried.',
    animation: underProcessAnim,
    bg: '#e3f2fd'
  },
  {
    title: 'Processing Completed',
    desc: 'The lot is fully processed and ready for return.',
    animation: completeAnim,
    bg: '#ede7f6'
  }
];

const MillDealTimeline = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" fontWeight={600} textAlign="center" mb={4}>
        Deal Processing Timeline
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

export default MillDealTimeline;
