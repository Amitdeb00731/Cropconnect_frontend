import React from 'react';
import { Box, Button, Typography, Container, useTheme, useMediaQuery } from '@mui/material';
import Lottie from 'lottie-react';
import animationData from './assets/mill-hero.json'; // ✅ Replace with mill-related Lottie

const MillLandingHero = ({ millName = 'Mill', onViewRequests }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ py: 6, background: 'linear-gradient(135deg, #ede7f6, #ffffff)' }}>
      <Container maxWidth="md">
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={700}>
            Welcome, {millName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mt={2}>
            Manage processing requests, optimize operations, and track progress.
          </Typography>

          <Button
            variant="contained"
            size={isMobile ? 'medium' : 'large'}
            sx={{ mt: 3 }}
            onClick={onViewRequests}
          >
            View Incoming Requests
          </Button>

          <Box mt={4}>
            <Lottie animationData={animationData} style={{ height: isMobile ? 200 : 300 }} loop />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MillLandingHero;
