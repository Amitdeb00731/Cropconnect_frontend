// ChatFeatureSection.js
import React from 'react';
import { Box, Typography, Button, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Lottie from 'lottie-react';
import chatAnimation from './assets/chat-animation.json'; // 🔁 Replace with your Lottie animation

export default function ChatFeatureSection({ onRedirect, name }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        mt: 4,
        px: 3,
        py: 5,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 4,
        boxShadow: 4,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography variant={isMobile ? 'h6' : 'h4'} fontWeight={600} gutterBottom>
          Connect Instantly with {name === 'Farmer' ? 'Middlemen' : 'Farmers'}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Stay informed and negotiate deals directly using our secure real-time chat system.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onRedirect}
          sx={{ borderRadius: 8, px: 4 }}
        >
          Open Chat
        </Button>
      </Box>

      <Box sx={{ flex: 1, maxWidth: 300 }}>
        <Lottie animationData={chatAnimation} loop autoplay />
      </Box>
    </Box>
  );
}
