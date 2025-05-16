import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import Lottie from 'lottie-react';

// ✅ Import Lottie animations
import earningsAnim from './assets/earnings.json';
import harvestAnim from './assets/add-harvest.json';
import dealsAnim from './assets/payment.json';

const FarmerQuickStats = ({
  totalEarnings = 0,
  totalHarvests = 0,
  totalDeals = 0
}) => {
  const stats = [
    {
      label: 'Total Earnings',
      value: `₹${totalEarnings.toFixed(2)}`,
      animation: earningsAnim
    },
    {
      label: 'Harvests Listed',
      value: totalHarvests,
      animation: harvestAnim
    },
    {
      label: 'Deals Finalized',
      value: totalDeals,
      animation: dealsAnim
    }
  ];

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Your Quick Stats
      </Typography>

      <List disablePadding>
        {stats.map((stat, index) => (
          <ListItem
            key={index}
            sx={{
              bgcolor: 'grey.100',
              borderRadius: 2,
              mb: 1,
              px: 2,
              py: 1.5
            }}
          >
            <ListItemAvatar>
              <Box sx={{ width: 50, height: 50 }}>
                <Lottie animationData={stat.animation} loop autoplay style={{ height: '100%' }} />
              </Box>
            </ListItemAvatar>

            <ListItemText
              primary={
                <Typography variant="h6" fontWeight={700}>
                  {stat.value}
                </Typography>
              }
              secondary={
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default FarmerQuickStats;
