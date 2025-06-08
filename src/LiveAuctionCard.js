import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Grid,
  Chip,
  Button,
  Box,
  Avatar,
  Divider,
  Stack,
  Badge
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatIcon from '@mui/icons-material/Chat';
import CancelIcon from '@mui/icons-material/Cancel';
import TimerIcon from '@mui/icons-material/Timer';
import GavelIcon from '@mui/icons-material/Gavel';
import { format } from 'date-fns';

export default function LiveAuctionCard({
  auction,
  bids,
  timeLeftStr,
  onJoinChat,
  onEndAuction
}) {
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
  const highest = sortedBids[0];
  const second = sortedBids[1];
  const third = sortedBids[2];

  return (
    <Accordion defaultExpanded sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Typography variant="h6" fontWeight="bold">
              {auction.riceType} Rice Auction - {auction.quantity} Kg
            </Typography>
            <Typography variant="body2">
              Start: {format(new Date(auction.startTime), 'PPPpp')} | ₹{auction.startingPricePerKg}/kg | Min +₹{auction.minIncrement}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Chip label="Live" color="success" />
            <Typography variant="body2" sx={{ mt: 1 }}>
              <TimerIcon fontSize="small" /> Ends in: <strong>{timeLeftStr}</strong>
            </Typography>
            <Badge color="secondary" badgeContent={bids.length} showZero>
              <GavelIcon sx={{ mt: 1 }} />
            </Badge>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Button
              variant="outlined"
              startIcon={<ChatIcon />}
              sx={{ mr: 1 }}
              onClick={onJoinChat}
            >
              Join Chat
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<CancelIcon />}
              onClick={onEndAuction}
            >
              End
            </Button>
          </Grid>
        </Grid>
      </AccordionSummary>

      <AccordionDetails>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" gutterBottom>
          🏆 Leaderboard
        </Typography>
        <Stack spacing={1}>
          {[highest, second, third].filter(Boolean).map((bid, index) => (
            <Box
              key={index}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              p={1}
              bgcolor={index === 0 ? '#e0f7fa' : index === 1 ? '#f1f8e9' : '#fffde7'}
              borderRadius={2}
              boxShadow={1}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar src={bid.profilePicture || ''} />
                <Typography variant="body1">
                  {index + 1}. {bid.wholesalerName || 'Unknown'}
                </Typography>
              </Box>
              <Chip
                label={`₹${bid.amount}`}
                color={index === 0 ? 'primary' : 'default'}
                size="small"
              />
            </Box>
          ))}
        </Stack>
       <Accordion>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography fontWeight="bold">💬 Live Bids & Chat</Typography>
    </AccordionSummary>

    <AccordionDetails>
      {bids.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No bids yet. Waiting for wholesalers to place their offers.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {bids.map((bid, index) => (
            <Box
              key={index}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              p={1}
              borderRadius={2}
              bgcolor="#f9f9f9"
              boxShadow={1}
            >
              <Box display="flex" gap={1} alignItems="center">
                <Avatar src={bid.profilePicture || ''} />
                <Box>
                  <Typography fontWeight="bold">{bid.wholesalerName || 'Unknown'}</Typography>
                  <Typography variant="caption">
                    ₹{bid.amount} at {new Date(bid.bidTime).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      <Box mt={2}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<ChatIcon />}
          onClick={onJoinChat}
        >
          Open Auction Chat
        </Button>
      </Box>
    </AccordionDetails>
  </Accordion>
</AccordionDetails>
    </Accordion>
  );
}
