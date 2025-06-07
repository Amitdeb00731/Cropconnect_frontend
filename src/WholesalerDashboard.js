// WholesalerDashboard.js
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Snackbar, Alert, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, TextField, Button, Paper, InputAdornment, IconButton, Tabs, Tab
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, query, collection, where, onSnapshot, updateDoc, getDocs, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import TawkMessenger from './TawkMessenger';
import WarehouseMapPicker from './WarehouseMapPicker';
import SwipeableViews from 'react-swipeable-views';
import Lottie from 'lottie-react';
import winnerAnim from './assets/winner-celebration.json';




export default function WholesalerDashboard() {
  const [uid, setUid] = useState(null);
  const [wholesalerProfile, setWholesalerProfile] = useState(null);
  const [warehouse, setWarehouse] = useState({
    location: '',
    landmark: '',
    capacity: '',
    contact: '',
    latitude: null,
    longitude: null
  });






  const [liveAuctions, setLiveAuctions] = useState([]);
const [timerKey, setTimerKey] = useState(Date.now());
const [bidAmount, setBidAmount] = useState('');
const [biddingAuction, setBiddingAuction] = useState(null);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);


const [filterRiceType, setFilterRiceType] = useState('');


const [selectedAuctionForDetails, setSelectedAuctionForDetails] = useState(null);



  const [editMode, setEditMode] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const checkWarehouse = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const snap = await getDoc(doc(db, 'warehouses', uid));
      if (!snap.exists()) {
        navigate('/warehouse-setup');
      }
    };

    checkWarehouse();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    setUid(user.uid);

    const fetchProfile = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setWholesalerProfile(snap.data());
      } else {
        setSnack({ open: true, message: 'Profile not found', severity: 'error' });
      }
    };

    const fetchWarehouse = async () => {
      const ref = doc(db, 'warehouses', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setWarehouse(snap.data());
      }
      setLoading(false);
    };

    fetchProfile();
    fetchWarehouse();
  }, []);




useEffect(() => {
  const q = query(collection(db, 'auctions'));

  const unsub = onSnapshot(q, snapshot => {
    const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sorted = all.sort((a, b) => b.timestamp - a.timestamp); // Optional: sort newest first
    setLiveAuctions(sorted);
  });

  return () => unsub();
}, []);




useEffect(() => {
  const interval = setInterval(() => {
    setTimerKey(Date.now());
  }, 1000);
  return () => clearInterval(interval);
}, []);



const getRemainingTime = (auction) => {
  if (!auction || auction.status === 'closed') return '00:00:00';

  const diff = auction.endTime - Date.now();
  if (diff <= 0) return '00:00:00';

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};








const handlePlaceBid = async () => {
  const bid = parseFloat(bidAmount);
  const auction = biddingAuction;

  if (!bid || !auction) {
    setSnack({ open: true, message: '❌ Invalid bid or auction data.', severity: 'error' });
    return;
  }

  const userId = auth.currentUser?.uid;
  if (!userId) {
    setSnack({ open: true, message: '❌ Not logged in.', severity: 'error' });
    return;
  }

  // Prevent rebidding if already highest bidder
  if (auction.highestBid?.wholesalerId === userId) {
    setSnack({
      open: true,
      message: '⏳ You are already the highest bidder.',
      severity: 'info'
    });
    return;
  }

  // Check for recent bid (within 10 seconds)
  try {
    const recentBidSnap = await getDocs(
      query(
        collection(db, 'auctions', auction.id, 'bids'),
        where('wholesalerId', '==', userId),
        orderBy('bidTime', 'desc'),
        limit(1)
      )
    );

    if (!recentBidSnap.empty) {
      const lastBid = recentBidSnap.docs[0].data();
      const timeSinceLast = Date.now() - lastBid.bidTime;

      if (timeSinceLast < 10000) { // 10 seconds
        setSnack({
          open: true,
          message: `⏳ Please wait ${Math.ceil((10000 - timeSinceLast) / 1000)}s before bidding again.`,
          severity: 'warning'
        });
        return;
      }
    }
  } catch (err) {
    console.error('Error checking previous bids:', err);
  }

  // Minimum bid enforcement
  const minBid = auction.highestBid?.amount
    ? auction.highestBid.amount + auction.minIncrement
    : auction.startingPricePerKg;

  if (bid < minBid) {
    setSnack({ open: true, message: `❌ Your bid must be at least ₹${minBid.toFixed(2)}`, severity: 'warning' });
    return;
  }

  // Warn if bid is unusually high
  if (bid > minBid * 2) {
    const confirmHigh = window.confirm(`⚠️ Your bid of ₹${bid.toFixed(2)} is quite high. Do you still want to place it?`);
    if (!confirmHigh) return;
  }

  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const wholesalerName = userSnap.exists() ? userSnap.data().name : 'Unknown';

    // Save the bid
    const bidRef = doc(collection(db, 'auctions', auction.id, 'bids'));
    await setDoc(bidRef, {
      wholesalerId: userId,
      wholesalerName,
      amount: bid,
      bidTime: Date.now()
    });

    // Update highest bid in auction doc
    await updateDoc(doc(db, 'auctions', auction.id), {
      highestBid: {
        wholesalerId: userId,
        wholesalerName,
        amount: bid
      }
    });

    setSnack({ open: true, message: '✅ Bid placed successfully!', severity: 'success' });
    setBiddingAuction(null);
    setBidAmount('');
    setShowConfirmDialog(false);
  } catch (err) {
    console.error('❌ Bid error:', err);
    setSnack({ open: true, message: 'Bid failed. Please try again.', severity: 'error' });
  }
};







  const handleGeolocate = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=35d72c07d6f74bec8a373961eea91f46`
        );
        const data = await res.json();
        const place = data.features?.[0]?.properties?.formatted;
        if (place) {
          setWarehouse(prev => ({
            ...prev,
            location: place,
            latitude,
            longitude
          }));
        }
      },
      () => {
        setSnack({ open: true, message: 'Location access denied.', severity: 'warning' });
      }
    );
  };

  const handleSearchLocation = async (input) => {
    if (!input) return;
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(input)}&limit=5&apiKey=35d72c07d6f74bec8a373961eea91f46`
    );
    const data = await response.json();
    const suggestions = data.features.map((f) => ({
      label: f.properties.formatted,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0]
    }));
    setLocationOptions(suggestions);
  };

  const handleSaveWarehouse = async () => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'warehouses', uid), warehouse);
      setSnack({ open: true, message: 'Warehouse details saved!', severity: 'success' });
      setEditMode(false);
    } catch (err) {
      setSnack({ open: true, message: 'Save failed.', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="lg">
      <TopNavbar />

      <Box mt={4} display="flex" flexDirection="column" alignItems="center">
        <img src={logo} alt="Logo" style={{ height: 50, marginBottom: 16 }} />
        <Typography variant="h4" fontWeight="bold">
          Wholesaler Dashboard
        </Typography>
        {loading ? (
          <CircularProgress sx={{ mt: 3 }} />
        ) : (
          wholesalerProfile && (
            <Typography variant="subtitle1" mt={2}>
              Welcome, {wholesalerProfile.name}
            </Typography>
          )
        )}
      </Box>

      <Tabs value={tab} onChange={(e, newVal) => setTab(newVal)} sx={{ mt: 4 }}>
        <Tab label="Warehouse Info" />
        <Tab label="Live Auctions" /> 
      </Tabs>

      {tab === 0 && (
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Warehouse Details
          </Typography>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Autocomplete
              fullWidth
              freeSolo
              options={locationOptions}
              value={{ label: warehouse.location }}
              getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
              onInputChange={(e, value) => {
                setWarehouse(prev => ({ ...prev, location: value }));
                handleSearchLocation(value);
              }}
              onChange={(e, value) => {
                if (value) {
                  setWarehouse(prev => ({
                    ...prev,
                    location: value.label || value,
                    latitude: value.latitude || null,
                    longitude: value.longitude || null
                  }));
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Warehouse Location"
                  margin="normal"
                  disabled={!editMode}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleGeolocate} edge="end" disabled={!editMode}>
                          <MyLocationIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />

            <TextField
              label="Nearby Landmark"
              fullWidth
              margin="normal"
              value={warehouse.landmark}
              onChange={(e) => setWarehouse({ ...warehouse, landmark: e.target.value })}
              disabled={!editMode}
            />
            <TextField
              label="Storage Capacity (tons)"
              fullWidth
              margin="normal"
              value={warehouse.capacity}
              onChange={(e) => setWarehouse({ ...warehouse, capacity: e.target.value })}
              disabled={!editMode}
            />
            <TextField
              label="Contact Info"
              fullWidth
              margin="normal"
              value={warehouse.contact}
              onChange={(e) => setWarehouse({ ...warehouse, contact: e.target.value })}
              disabled={!editMode}
            />

            <Box mt={3}>
              <Typography variant="subtitle2" mb={1}>Warehouse Location on Map</Typography>
              <WarehouseMapPicker
                lat={warehouse.latitude}
                lon={warehouse.longitude}
                readOnly={!editMode}
                onChange={(lat, lon) => {
                  setWarehouse(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lon
                  }));
                }}
              />
            </Box>

            <Box mt={3} display="flex" gap={2}>
              {!editMode ? (
                <Button variant="contained" onClick={() => setEditMode(true)}>Edit</Button>
              ) : (
                <Button variant="contained" onClick={handleSaveWarehouse}>Save</Button>
              )}
              {editMode && (
                <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
              )}
            </Box>
          </Paper>
        </Box>
      )}




      {tab === 1 && (
  <Box mt={4}>
    <Typography variant="h6" gutterBottom>Live Auctions</Typography>
    {liveAuctions.length === 0 ? (
      <Typography>No auctions available.</Typography>
    ) : (
      <Grid container spacing={2}>
        {liveAuctions.map(auction => (
          <Grid item xs={12} md={6} key={auction.id}>
           <Paper sx={{ p: 2, borderRadius: 2 }}>
  {auction.images && auction.images.length > 0 && (
    <Box mb={1} display="flex" gap={1} overflow="auto">
      {auction.images.map((img, idx) => (
        <img key={idx} src={img} alt="Auction" width={80} height={80} style={{ borderRadius: 8 }} />
      ))}
    </Box>
  )}

  <Typography fontWeight={600}>
    {auction.riceType} — {auction.quantity} Kg
  </Typography>

  <Typography fontStyle="italic" color="text.secondary" sx={{ mb: 1 }}>
    {auction.description || 'No description provided.'}
  </Typography>

  <Typography>Start: ₹{auction.startingPricePerKg} / Kg</Typography>
  <Typography>Min Increment: ₹{auction.minIncrement}</Typography>
  <Typography>
  {auction.highestBid?.amount
    ? `Current Highest Bid: ₹${auction.highestBid.amount}`
    : 'No bids yet. Be the first to bid!'}
</Typography>


{auction.status === 'closed' ? (
  auction.highestBid?.wholesalerId === uid ? (
    <>
      <Lottie animationData={winnerAnim} style={{ height: 120 }} loop={false} />
      <Typography color="success.main" fontWeight="bold">
        🎉 You won this auction!
      </Typography>
    </>
  ) : (
    <Typography color="error" fontWeight="bold">
      Auction Ended
    </Typography>
  )
) : (
  <Typography color="primary" fontWeight="bold">
    Time Left: {getRemainingTime(auction)}
  </Typography>
)}



  <Button
  variant="contained"
  sx={{ mt: 2 }}
  onClick={() => setBiddingAuction(auction)}
  disabled={auction.status === 'closed'}
>
  {auction.status === 'closed' ? 'Auction Closed' : 'Place Bid'}
</Button>
  <Button
  variant="outlined"
  onClick={() => setSelectedAuctionForDetails(auction)}
>
  See Full Details
</Button>

</Paper>

          </Grid>
        ))}
      </Grid>
    )}
  </Box>
)}






      <TawkMessenger />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>




      <Dialog
  open={Boolean(biddingAuction)}
  onClose={() => setBiddingAuction(null)}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle>Place Bid for {biddingAuction?.riceType}</DialogTitle>

  <DialogContent dividers>
    {biddingAuction && (
      <>
        <Typography variant="body1" gutterBottom>
          Quantity: <strong>{biddingAuction.quantity} Kg</strong>
        </Typography>

        <Typography variant="body1" gutterBottom>
          Starting Price: ₹{biddingAuction.startingPricePerKg} / Kg
        </Typography>

        <Typography variant="body1" gutterBottom>
          Minimum Increment: ₹{biddingAuction.minIncrement}
        </Typography>

        <Typography variant="body1" gutterBottom>
          Current Highest Bid:{' '}
            <strong>
    {biddingAuction.highestBid?.amount
      ? `₹${biddingAuction.highestBid.amount} / Kg`
      : 'No bids yet. Be the first to bid!'}
  </strong>

        </Typography>

        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Minimum Required Bid:</strong>{' '}
          ₹
          {biddingAuction.highestBid?.amount
            ? biddingAuction.highestBid.amount + biddingAuction.minIncrement
            : biddingAuction.startingPricePerKg}
        </Typography>

        <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
          To place a valid bid, enter an amount equal to or above the minimum required bid.
        </Typography>

        <TextField
          fullWidth
          label="Your Bid (₹ per Kg)"
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          margin="normal"
        />
      </>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setBiddingAuction(null)}>Cancel</Button>
    <Button variant="contained" onClick={() => setShowConfirmDialog(true)}>Submit</Button>
  </DialogActions>
</Dialog>











<Dialog
  open={Boolean(selectedAuctionForDetails)}
  onClose={() => setSelectedAuctionForDetails(null)}
  maxWidth="md"
  fullWidth
>
  <DialogTitle>
    Auction Details — {selectedAuctionForDetails?.riceType}
  </DialogTitle>
  <DialogContent dividers>
    {/* Carousel */}
    {selectedAuctionForDetails?.images?.length > 0 && (
      <SwipeableViews enableMouseEvents>
        {selectedAuctionForDetails.images.map((img, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            <img
              src={img}
              alt={`Slide ${index}`}
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'cover' }}
            />
          </Box>
        ))}
      </SwipeableViews>
    )}

    <Box mt={3}>
      <Typography><strong>Seller (Middleman):</strong> {selectedAuctionForDetails?.middlemanName || 'Unknown'}</Typography>
      <Typography><strong>Rice Type:</strong> {selectedAuctionForDetails?.riceType}</Typography>
      <Typography><strong>Quantity:</strong> {selectedAuctionForDetails?.quantity} Kg</Typography>
      <Typography><strong>Description:</strong></Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {selectedAuctionForDetails?.description || 'No description provided.'}
      </Typography>
      <Typography><strong>Starting Price:</strong> ₹{selectedAuctionForDetails?.startingPricePerKg} / Kg</Typography>
      <Typography><strong>Minimum Increment:</strong> ₹{selectedAuctionForDetails?.minIncrement}</Typography>
      <Typography color="primary" fontWeight="bold">
  Time Left: {selectedAuctionForDetails ? getRemainingTime(selectedAuctionForDetails) : '00:00:00'}
</Typography>
    </Box>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setSelectedAuctionForDetails(null)}>Close</Button>
  </DialogActions>
</Dialog>





<Dialog
  open={showConfirmDialog}
  onClose={() => setShowConfirmDialog(false)}
  maxWidth="xs"
  fullWidth
>
  <DialogTitle>Confirm Your Bid</DialogTitle>
  <DialogContent dividers>
    {biddingAuction && (
      <>
        <Typography variant="body1" gutterBottom>
          <strong>Rice Type:</strong> {biddingAuction.riceType}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Quantity:</strong> {biddingAuction.quantity} Kg
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>Your Bid:</strong> ₹{bidAmount} / Kg
        </Typography>
        <Typography variant="body1" gutterBottom color="primary">
          <strong>Total Cost:</strong> ₹{(parseFloat(bidAmount || 0) * parseFloat(biddingAuction.quantity || 0)).toFixed(2)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Are you sure you want to place this bid?
        </Typography>
      </>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
    <Button
      variant="contained"
      color="primary"
      onClick={async () => {
        await handlePlaceBid();
        setShowConfirmDialog(false);
      }}
    >
      Confirm & Place Bid
    </Button>
  </DialogActions>
</Dialog>








    </Container>
  );
}
