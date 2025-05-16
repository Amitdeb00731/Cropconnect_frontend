import React from 'react';
import { Box, Stack, Button, Typography } from '@mui/material';
import Lottie from 'lottie-react';

// ✅ Lottie animations
import addHarvestAnim from './assets/add-harvest.json';
import proposalsAnim from './assets/proposals.json';
import inventoryAnim from './assets/transactions.json';

const AnimatedIcon = ({ animation }) => (
  <Box sx={{ width: 32, height: 32 }}>
    <Lottie animationData={animation} loop autoplay />
  </Box>
);

const FarmerQuickActions = ({ onAddHarvest, onViewProposals, onCheckInventory }) => {
  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
      >
        {/* Add Harvest */}
        <Button
          variant="contained"
          onClick={onAddHarvest}
          sx={{
            minWidth: 220,
            borderRadius: 3,
            boxShadow: 3,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <AnimatedIcon animation={addHarvestAnim} />
          <Typography fontWeight={600}>Add Harvest</Typography>
        </Button>

        {/* View Proposals */}
        <Button
          variant="outlined"
          onClick={onViewProposals}
          sx={{
            minWidth: 220,
            borderRadius: 3,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <AnimatedIcon animation={proposalsAnim} />
          <Typography fontWeight={600}>View Proposals</Typography>
        </Button>

        {/* Check Transactions */}
        <Button
          variant="outlined"
          onClick={onCheckInventory}
          sx={{
            minWidth: 220,
            borderRadius: 3,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <AnimatedIcon animation={inventoryAnim} />
          <Typography fontWeight={600}>Check Transactions</Typography>
        </Button>
      </Stack>
    </Box>
  );
};

export default FarmerQuickActions;
