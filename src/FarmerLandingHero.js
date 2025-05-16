import React from 'react';
import { Box, Button, Typography, useMediaQuery, useTheme, Container } from '@mui/material';
import Lottie from 'lottie-react';
import animationData from './assets/farmer-hero.json'; // ✅ Add animation file

const FarmerLandingHero = ({ farmerName = 'Farmer', onAddHarvest }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ py: 6, background: 'linear-gradient(135deg, #e0f2f1, #ffffff)' }}>
      <Container maxWidth="md">
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={700}>
            Welcome, {farmerName}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" mt={2}>
            Grow. List. Earn. Track your harvest journey in one place.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size={isMobile ? 'medium' : 'large'}
            sx={{ mt: 3 }}
            onClick={onAddHarvest}
          >
            Add New Harvest
          </Button>

          <Box mt={4}>
            <Lottie animationData={animationData} style={{ height: isMobile ? 200 : 300 }} loop />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default FarmerLandingHero;
