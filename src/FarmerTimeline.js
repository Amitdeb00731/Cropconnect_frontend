import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Lottie from 'lottie-react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ✅ Import your Lottie files
import harvestAnim from './assets/harvest-list.json';
import inspectionAnim from './assets/inspection.json';
import proposalAnim from './assets/proposal.json';
import paymentAnim from './assets/payment.json';

const steps = [
  {
    title: 'Harvest Listed',
    desc: 'You’ve added your harvest to the platform.',
    animation: harvestAnim,
    bg: '#e8f5e9'
  },
  {
    title: 'Inspection Requested',
    desc: 'A middleman wants to inspect your rice.',
    animation: inspectionAnim,
    bg: '#e3f2fd'
  },
  {
    title: 'Price Proposed',
    desc: 'Middleman has proposed a price.',
    animation: proposalAnim,
    bg: '#fffde7'
  },
  {
    title: 'Sold & Paid',
    desc: 'Deal finalized and payment received.',
    animation: paymentAnim,
    bg: '#f1f8e9'
  }
];

const FarmerTimeline = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" textAlign="center" fontWeight={600} mb={4}>
        Your Harvest Journey
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: isMobile ? 2 : 3
        }}
      >
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            {/* Timeline Card */}
            <Card
              sx={{
                backgroundColor: step.bg,
                borderRadius: 3,
                boxShadow: 4,
                maxWidth: 260,
                width: '100%',
                textAlign: 'center',
                p: 2
              }}
            >
              <CardContent>
                <Box mb={1}>
                  <Lottie animationData={step.animation} style={{ height: 100 }} loop />
                </Box>
                <Typography fontWeight={600} fontSize="1rem">
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {step.desc}
                </Typography>
              </CardContent>
            </Card>

            {/* Arrow Between Cards */}
            {i < steps.length - 1 && (
              <Box>
                {isMobile ? (
                  <ArrowDownwardIcon sx={{ fontSize: 32, color: '#bbb', my: 1 }} />
                ) : (
                  <ArrowForwardIcon sx={{ fontSize: 32, color: '#bbb' }} />
                )}
              </Box>
            )}
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default FarmerTimeline;
