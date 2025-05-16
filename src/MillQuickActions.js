import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import Lottie from 'lottie-react';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// ✅ Lottie animation imports
import requestsAnim from './assets/requests.json';
import underProcessAnim from './assets/processing.json';
import pendingAnim from './assets/pending.json';

const actions = [
  {
    label: 'Processing Requests',
    subtext: 'View and accept new incoming processing requests.',
    animation: requestsAnim,
    onClickKey: 'onRequests'
  },
  {
    label: 'Under Process',
    subtext: 'Monitor all harvests currently being processed.',
    animation: underProcessAnim,
    onClickKey: 'onUnderProcess'
  },
  {
    label: 'Pending Lots',
    subtext: 'See which lots are approved but not yet completed.',
    animation: pendingAnim,
    onClickKey: 'onPendingLots'
  }
];

const MillQuickActions = ({
  onRequests,
  onUnderProcess,
  onPendingLots
}) => {
  const handlers = {
    onRequests,
    onUnderProcess,
    onPendingLots
  };

  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" fontWeight={600} mb={2}>
        Quick Operations
      </Typography>

      <List disablePadding>
        {actions.map((action, index) => (
          <React.Fragment key={index}>
            <ListItem
              alignItems="center"
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1.5,
                bgcolor: 'grey.100',
                mb: 1
              }}
              secondaryAction={
                <IconButton edge="end" onClick={handlers[action.onClickKey]}>
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemAvatar>
                <Box sx={{ width: 50, height: 50 }}>
                  <Lottie animationData={action.animation} loop style={{ height: '100%' }} />
                </Box>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Typography fontWeight={600}>{action.label}</Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {action.subtext}
                  </Typography>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default MillQuickActions;
