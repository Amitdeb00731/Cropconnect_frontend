import React from 'react';
import {
  Grid,
  Button,
  Typography,
  Box,
  Paper,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Lottie from 'lottie-react';

// ✅ Lottie animation imports
import browseAnim from './assets/browse.json';
import proposalAnim from './assets/proposals.json';
import inspectionAnim from './assets/inspection.json';
import inventoryAnim from './assets/inventory.json';
import millsAnim from './assets/mills.json';
import processingAnim from './assets/processing.json';
import invoiceAnim from './assets/transactions.json';

const actions = [
  { label: 'Browse Available Harvests', animation: browseAnim, onClickKey: 'onBrowse' },
  { label: 'View Proposals Sent', animation: proposalAnim, onClickKey: 'onProposals' },
  { label: 'Check Inspection Responses', animation: inspectionAnim, onClickKey: 'onInspection' },
  { label: 'Visit Inventory', animation: inventoryAnim, onClickKey: 'onInventory' },
  { label: 'Find Mills', animation: millsAnim, onClickKey: 'onFindMills' },
  { label: 'Track Processing Requests', animation: processingAnim, onClickKey: 'onProcessing' },
  { label: 'View Invoices', animation: invoiceAnim, onClickKey: 'onInvoices' }
];

const MiddlemanQuickActions = ({
  onBrowse,
  onProposals,
  onInspection,
  onInventory,
  onFindMills,
  onProcessing,
  onInvoices
}) => {
  const handlers = {
    onBrowse,
    onProposals,
    onInspection,
    onInventory,
    onFindMills,
    onProcessing,
    onInvoices
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" fontWeight={600} mb={3} textAlign="center">
        Quick Actions
      </Typography>

      <Grid container spacing={3}>
        {actions.map((action, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 2,
                borderRadius: 3,
                bgcolor: 'grey.100',
                minHeight: 110
              }}
            >
              {/* Icon */}
              <Box
                sx={{
                  width: 60,
                  minWidth: 60,
                  mr: 2,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Lottie animationData={action.animation} loop style={{ height: 50 }} />
              </Box>

              {/* Label + Button */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexGrow: 1,
                  flexWrap: 'wrap'
                }}
              >
                <Typography fontWeight={600} fontSize="1rem" flex={1} sx={{ pr: 2 }}>
                  {action.label}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handlers[action.onClickKey]}
                  sx={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.85rem',
                    minWidth: 100
                  }}
                >
                  Go
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MiddlemanQuickActions;
