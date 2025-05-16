import React from 'react';
import { Box, Button, Typography, Container, useMediaQuery, useTheme } from '@mui/material';
import Lottie from 'lottie-react';
import animationData from './assets/middleman-hero.json'; // ✅ Use suitable Lottie

const MiddlemanLandingHero = ({ name = 'Middleman', onBrowseHarvests }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ py: 6, background: 'linear-gradient(135deg, #e3f2fd, #ffffff)' }}>
      <Container maxWidth="md">
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={700}>
            Welcome, {name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mt={2}>
            Connect with farmers, propose deals, and grow your network.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            sx={{ mt: 3 }}
            onClick={onBrowseHarvests}
          >
            Browse Available Harvests
          </Button>

          <Box mt={4}>
            <Lottie animationData={animationData} style={{ height: isMobile ? 200 : 300 }} loop />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MiddlemanLandingHero;
