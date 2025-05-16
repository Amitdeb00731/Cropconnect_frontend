// MillDashboard.js
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Dialog, DialogTitle, DialogContent, Tab, Tabs, Grid, Card,
  TextField, Button, Snackbar, Alert, CircularProgress, Autocomplete, IconButton
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import axios from 'axios';
import {
  getDoc, doc, setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import TopNavbar from './TopNavbar';
import CloseIcon from '@mui/icons-material/Close';
import { DialogActions} from '@mui/material';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, updateDoc } from 'firebase/firestore';
import { getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import TawkMessenger from './TawkMessenger';
import MillLandingHero from './MillLandingHero';
import MillQuickActions from './MillQuickActions';
import MillDealTimeline from './MillDealTimeline';
import MillTipsAccordion from './MillTipsAccordion';





// Utility: Parse quantity like "10 Kg" or "10.00 kg"
const parseQuantity = (str) => {
  const match = (str + '').match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
};




export default function MillDashboard() {
  const [millProfile, setMillProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState(null);
const [openDecisionDialog, setOpenDecisionDialog] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    capacity: '',
    riceTypes: '',
    location: '',
    latitude: '',
    longitude: '',
  });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });


useEffect(() => {
  if (!auth.currentUser?.uid) return;

  const q = query(
    collection(db, 'millProcessingRequests'),
    where('millId', '==', auth.currentUser.uid),
    where('millCleared', '!=', true)
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    const enriched = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };

      // Fetch middleman name
      let middlemanName = 'Unknown';
      try {
        const mmSnap = await getDoc(doc(db, 'users', data.middlemanId));
        if (mmSnap.exists()) {
          middlemanName = mmSnap.data().name;
        }
      } catch (err) {
        console.warn('Failed to fetch middleman info:', err.message);
      }

      return { ...data, middlemanName };
    }));

    setRequests(enriched);
  });

  return () => unsub();
}, []);




const handleAcceptRequest = (request) => {
  setSelectedRequest(request);
  setOpenDecisionDialog(true);
};

const markLot = async (request, status) => {
  try {
    await updateDoc(doc(db, 'millProcessingRequests', request.id), {
      requestStatus: 'accepted',
      processingStatus: status
    });
    setOpenDecisionDialog(false);
    setSnack({ open: true, message: `Lot marked as ${status.replace('_', ' ')}`, severity: 'success' });
  } catch (err) {
    setSnack({ open: true, message: 'Update failed: ' + err.message, severity: 'error' });
  }
};

const markProcessingDone = async (id) => {
  try {
    const reqRef = doc(db, 'millProcessingRequests', id);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) throw new Error("Request not found");

    await updateDoc(reqRef, {
      processingStatus: 'done',
      completedAt: Date.now()
    });

    await addDoc(collection(db, 'notifications'), {
      userId: reqSnap.data().middlemanId,
      type: 'processing_done',
      message: `Your lot of ${reqSnap.data().riceType} (${reqSnap.data().quantity} Kg) is now marked complete.`,
      seen: false,
      timestamp: Date.now()
    });

    setSnack({ open: true, message: 'Marked as processing complete.', severity: 'success' });
  } catch (err) {
  console.warn("⚠️ markProcessingDone warning:", err.message);
  // Suppress permission error if status was already set
  if (err.message.includes("Missing or insufficient permissions")) {
    setSnack({ open: true, message: 'Processing marked complete. Update was already made.', severity: 'info' });
  } else {
    setSnack({ open: true, message: 'Failed to complete processing: ' + err.message, severity: 'error' });
  }
}

};









const handleDeclineRequest = async (request) => {
  try {
    // ✅ Mark request as declined
    await updateDoc(doc(db, 'millProcessingRequests', request.id), {
      requestStatus: 'declined',
      restored: false // important for middleman to know this needs to be restored
    });

    setSnack({ open: true, message: 'Request declined. Middleman will be notified.', severity: 'info' });
  } catch (err) {
    console.error("Decline error:", err.message);
    setSnack({ open: true, message: 'Failed to decline request', severity: 'error' });
  }
};



  // 🟡 Fetch mill profile once user is ready
  useEffect(() => {
    if (!auth.currentUser) return;

   const fetchProfile = async () => {
  try {
    const ref = doc(db, 'mills', auth.currentUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
  const data = snap.data();

  // ✅ Check if required fields are present (excluding phone)
  const isComplete =
    data.name &&
    data.capacity &&
    data.acceptedRiceTypes &&
    Array.isArray(data.acceptedRiceTypes) &&
    data.acceptedRiceTypes.length > 0 &&
    data.location;

  if (isComplete) {
    setMillProfile(data);
  } else {
    // Open the form prefilled if partially filled
    setFormData({
      name: data.name || '',
      capacity: data.capacity || '',
      riceTypes: (data.acceptedRiceTypes || []).join(', '),
      location: data.location || '',
      latitude: data.latitude || '',
      longitude: data.longitude || '',
    });
    setEditMode(true);
    setShowProfileForm(true);
  }
} else {
  // First time user
  setFormData({
    name: '',
    capacity: '',
    riceTypes: '',
    location: '',
    latitude: '',
    longitude: '',
  });
  setEditMode(true);
  setShowProfileForm(true);
}
  } catch (error) {
    console.error('Error fetching mill profile:', error);
  }
};


    fetchProfile();
  }, [auth.currentUser]);

  // 📍 Get current location
  const getCurrentLocation = () => {
    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await axios.get('https://api.geoapify.com/v1/geocode/reverse', {
            params: {
              lat: latitude,
              lon: longitude,
              apiKey: '35d72c07d6f74bec8a373961eea91f46',
            }
          });
          const place = res.data.features[0]?.properties.formatted || '';
          setFormData(prev => ({
            ...prev,
            location: place,
            latitude,
            longitude,
          }));
          setSnack({ open: true, message: 'Location fetched!', severity: 'info' });
        } catch {
          setSnack({ open: true, message: 'Failed to fetch address', severity: 'error' });
        } finally {
          setFetchingLocation(false);
        }
      },
      () => {
        setSnack({ open: true, message: 'Location access denied', severity: 'error' });
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 🔎 Autocomplete location search
  const handleLocationSearch = async (value) => {
    if (!value) return setLocationOptions([]);
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: value,
          format: 'json',
          addressdetails: 1,
          limit: 5,
        }
      });
      const options = response.data.map(loc => loc.display_name);
      setLocationOptions(options);

      const geo = response.data[0];
      if (geo) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(geo.lat),
          longitude: parseFloat(geo.lon),
        }));
      }
    } catch (err) {
      console.error('❌ Location fetch error:', err);
    }
  };

  // 💾 Save mill profile to Firestore
  const saveMillProfile = async () => {
    const millId = auth.currentUser?.uid;
    if (!millId) return;

    const ref = doc(db, 'mills', millId);

    await setDoc(ref, {
      name: formData.name,
      capacity: parseFloat(formData.capacity),
      acceptedRiceTypes: formData.riceTypes.split(',').map(r => r.trim()),
      location: formData.location,
      latitude: formData.latitude,
      longitude: formData.longitude,
      engagedCapacity: millProfile?.engagedCapacity || 0,
      managerId: millId,
      timestamp: Date.now()
    });

    const savedSnap = await getDoc(ref);
    if (savedSnap.exists()) {
      setMillProfile(savedSnap.data());
    }

    setShowProfileForm(false);
    setSnack({ open: true, message: 'Mill profile saved!', severity: 'success' });
  };

  // ✏️ Open form in edit mode
  const openEditProfile = () => {
    setFormData({
      name: millProfile.name,
      capacity: millProfile.capacity,
      riceTypes: millProfile.acceptedRiceTypes.join(', '),
      location: millProfile.location,
      latitude: millProfile.latitude,
      longitude: millProfile.longitude,
    });
    setShowProfileForm(true);
  };

  const underProcess = requests.filter(r => r.processingStatus === 'under_process');
const pendingLot = requests.filter(r => r.processingStatus === 'pending_lot');


  return (
    <Container sx={{ py: 4 }}>
      <Box textAlign="center" mb={3}>
        <Box component="img" src={logo} alt="App Logo" sx={{ height: 60, mb: 1 }} />
      </Box>
      <TopNavbar title="Mill Dashboard" />
         <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        centered
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 4 }}
      >
  <Tab label="Home" />      
  <Tab label="Processing Requests" />
  <Tab label="Under Process" />
  <Tab label="Pending Lot" />
</Tabs>


{tab === 0 && (
<>




 {millProfile && (
  <Box textAlign="right" mt={2} display="flex" justifyContent="space-between">
    <Button variant="outlined" onClick={openEditProfile}>
      View / Edit Mill Details
    </Button>
  </Box>
)}




   <MillLandingHero
  millName={millProfile?.name || 'Mill'}
  onViewRequests={() => setTab(2)} // or whichever tab shows pending requests
/>

<MillQuickActions
  onRequests={() => setTab(1)}
  onUnderProcess={() => setTab(2)}
  onPendingLots={() => setTab(3)}
/>


<MillDealTimeline />
<MillTipsAccordion />



</>

)}


{tab === 1 && (
  <Box mt={4}>
    <Button
  variant="outlined"
  color="error"
  onClick={async () => {
    const q = query(
      collection(db, 'millProcessingRequests'),
      where('millId', '==', auth.currentUser.uid),
      where('millCleared', '!=', true)
    );
    const snapshot = await getDocs(q);
    await Promise.all(snapshot.docs.map(docSnap =>
      updateDoc(doc(db, 'millProcessingRequests', docSnap.id), {
        millCleared: true
      })
    ));
    setSnack({ open: true, message: 'Request history cleared!', severity: 'success' });
  }}
  sx={{ mb: 2 }}
>
  Clear Processing Requests
</Button>

    <Typography variant="h6" gutterBottom>
      Processing Requests
    </Typography>
    <Grid container spacing={2}>
      {requests.map((req) => (
        <Grid item xs={12} sm={6} md={4} key={req.id}>
          <Card sx={{ p: 2, borderRadius: 2 }}>
            <Typography><strong>Middleman ID:</strong> {req.middlemanId}</Typography>
            <Typography><strong>Rice:</strong> {req.riceType}</Typography>
            <Typography><strong>Quantity:</strong> {req.quantity} Kg</Typography>
            <Typography><strong>Status:</strong> {req.requestStatus}</Typography>

            {req.requestStatus === 'pending' && (
              <Box mt={2} display="flex" gap={1}>
                <Button variant="contained" onClick={() => handleAcceptRequest(req)}>
                  Accept
                </Button>
                <Button variant="outlined" color="error" onClick={() => handleDeclineRequest(req)}>
                  Decline
                </Button>
              </Box>
            )}
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
)}


     


     
      

      {/* 📝 Mill Profile Form */}
     <Dialog open={showProfileForm} fullWidth maxWidth="sm">
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  {editMode ? 'Edit Mill Details' : 'Mill Details'}
  {!editMode && (
    <IconButton onClick={() => {
      setShowProfileForm(false);
      setEditMode(false);
    }}>
      <CloseIcon />
    </IconButton>
  )}
</DialogTitle>

  <DialogContent>

    {editMode ? (
      <>
        <TextField
          label="Mill Name"
          fullWidth margin="normal"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <TextField
          label="Daily Capacity (Kg)"
          type="number"
          fullWidth margin="normal"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
        />
        <TextField
          label="Accepted Rice Types (comma separated)"
          fullWidth margin="normal"
          value={formData.riceTypes}
          onChange={(e) => setFormData({ ...formData, riceTypes: e.target.value })}
        />
        <Autocomplete
          freeSolo
          options={locationOptions}
          inputValue={formData.location}
          onInputChange={(e, val) => {
            setFormData(prev => ({ ...prev, location: val }));
            handleLocationSearch(val);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Mill Location"
              margin="normal"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    <IconButton onClick={getCurrentLocation} disabled={fetchingLocation}>
                      {fetchingLocation ? <CircularProgress size={20} /> : <MyLocationIcon />}
                    </IconButton>
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => setEditMode(false)}>Cancel</Button>
          <Button onClick={saveMillProfile} variant="contained">Save</Button>
        </Box>
      </>
    ) : (
      <>
        <Typography variant="subtitle1" gutterBottom><strong>Mill Name:</strong> {millProfile?.name}</Typography>
        <Typography variant="subtitle1" gutterBottom><strong>Capacity:</strong> {millProfile?.capacity} Kg</Typography>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Accepted Rice Types:</strong> {millProfile?.acceptedRiceTypes?.join(', ')}
        </Typography>
        <Typography variant="subtitle1" gutterBottom><strong>Location:</strong> {millProfile?.location}</Typography>

        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button onClick={() => {
            setFormData({
              name: millProfile.name,
              capacity: millProfile.capacity,
              riceTypes: millProfile.acceptedRiceTypes.join(', '),
              location: millProfile.location,
              latitude: millProfile.latitude,
              longitude: millProfile.longitude,
            });
            setEditMode(true);
          }} variant="contained">
            Edit
          </Button>
        </Box>
      </>
    )}
  </DialogContent>
</Dialog>


{tab === 2 && (
  <Box mt={3}>
    <Typography variant="h6">Lots Under Processing</Typography>
    <Grid container spacing={2}>
      {underProcess.map((req) => (
        <Grid item xs={12} sm={6} md={4} key={req.id}>
          <Card sx={{ p: 2 }}>
            <Typography><strong>Middleman:</strong> {req.middlemanName}</Typography>
            <Typography><strong>Rice:</strong> {req.riceType}</Typography>
            <Typography><strong>Quantity:</strong> {req.quantity} Kg</Typography>
            <Button
              variant="contained"
              color="success"
              sx={{ mt: 2 }}
              onClick={() => markProcessingDone(req.id)}
            >
              Mark Processing Done
            </Button>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
)}

{tab === 3 && (
  <Box mt={3}>
    <Typography variant="h6">Pending Lots (On Hold)</Typography>
    <Grid container spacing={2}>
      {pendingLot.map((req) => (
        <Grid item xs={12} sm={6} md={4} key={req.id}>
          <Card sx={{ p: 2 }}>
            <Typography><strong>Middleman:</strong> {req.middlemanName}</Typography>
            <Typography><strong>Rice:</strong> {req.riceType}</Typography>
            <Typography><strong>Quantity:</strong> {req.quantity} Kg</Typography>
            <Typography color="warning.main" fontWeight="bold" sx={{ mt: 1 }}>Waiting to Process</Typography>
            <Button
  variant="contained"
  color="primary"
  sx={{ mt: 2 }}
  onClick={() => markLot(req, 'under_process')}
>
  Send for Processing
</Button>

          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
)}


      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snack.severity} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
      <Dialog open={openDecisionDialog} onClose={() => setOpenDecisionDialog(false)}>
  <DialogTitle>Accept Request</DialogTitle>
  <DialogContent>
    <Typography>Choose what to do with this lot:</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => markLot(selectedRequest, 'under_process')} variant="contained">
      Send for Processing
    </Button>
    <Button onClick={() => markLot(selectedRequest, 'pending_lot')} variant="outlined">
      Hold Lot
    </Button>
  </DialogActions>
</Dialog>


{millProfile && (
  <TawkMessenger
    name={millProfile.name}
    email={auth.currentUser?.email || ''}
    phone={millProfile.phone || ''}
    role="Mill"
  />
)}




    </Container>
  );
}
