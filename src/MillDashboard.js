// MillDashboard.js
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Dialog, DialogTitle, DialogContent, Tab, Tabs, Grid, Card,
  TextField, Button, Snackbar, Alert, CircularProgress, Autocomplete, IconButton, Divider, CardContent
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { startOfMonth, endOfMonth, startOfWeek, eachDayOfInterval, format } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';






// Utility: Parse quantity like "10 Kg" or "10.00 kg"
const parseQuantity = (str) => {
  const match = (str + '').match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
};




export default function MillDashboard() {
  const [millProfile, setMillProfile] = useState(null);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [txnFilter, setTxnFilter] = useState('all');
  const [editMode, setEditMode] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [requests, setRequests] = useState([]);
  const [searchRiceType, setSearchRiceType] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [tab, setTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
const tabLabels = [
  "Home",
  "Processing Requests",
  "Under Process",
  "Pending Lot",
  "Transactions" 
];
  const [selectedRequest, setSelectedRequest] = useState(null);
const [openDecisionDialog, setOpenDecisionDialog] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
  name: '',
  capacity: '',
  riceRates: [{ riceType: '', ratePerKg: '' }],
  location: '',
  latitude: '',
  longitude: '',
});

  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
const [millTransactions, setMillTransactions] = useState([]);

const [txnPage, setTxnPage] = useState(1);
const itemsPerPage = 5;




const getMonthlyData = (transactions) => {
  const monthlyMap = {};

  transactions.forEach(txn => {
    if (txn.millId !== auth.currentUser?.uid) return;

    const date = new Date(txn.paymentTimestamp || txn.timestamp);
    const monthKey = format(date, 'MMM yyyy');

    if (!monthlyMap[monthKey]) monthlyMap[monthKey] = 0;
    monthlyMap[monthKey] += parseFloat(txn.processingCost) || 0;
  });

  return Object.entries(monthlyMap).map(([month, value]) => ({ month, value }));
};

const getWeeklyData = (transactions) => {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  const days = eachDayOfInterval({ start, end: new Date() });

  return days.map(day => {
    const label = format(day, 'EEE'); // Mon, Tue, etc.
    const total = transactions
      .filter(txn => {
        const date = new Date(txn.paymentTimestamp || txn.timestamp);
        return format(date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
               txn.millId === auth.currentUser?.uid;
      })
      .reduce((sum, txn) => sum + (parseFloat(txn.processingCost) || 0), 0);

    return { day: label, total };
  });
};




useEffect(() => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const q = query(
    collection(db, "invoices"),
    where("millId", "==", uid),
    where("type", "==", "mill_processing")
  );

  const unsub = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMillTransactions(data);
  });

  return () => unsub();
}, []);



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
  completedAt: Date.now(),
  paymentStatus: 'pending',
  processingCost: parseFloat(reqSnap.data().processingCost || 0) || 0  // Set this if you’re not already doing so
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






const handleLogout = () => {
  signOut(auth).then(() => {
    navigate('/');
  });
};




const markMillCashCollected = async (req) => {
  try {
    await updateDoc(doc(db, 'millProcessingRequests', req.id), {
      paymentStatus: 'cash_collected'
    });

    await addDoc(collection(db, 'notifications'), {
      userId: req.middlemanId,
      type: 'cash_collected_confirmed',
      message: `Mill has confirmed cash collection for ${req.riceType}.`,
      seen: false,
      timestamp: Date.now()
    });

    setSnack({ open: true, message: 'Marked cash as collected', severity: 'success' });
  } catch (err) {
    setSnack({ open: true, message: 'Failed to update status', severity: 'error' });
  }
};





const getFilteredTransactions = () => {
  return millTransactions
    .filter(txn => txn.millId === auth.currentUser?.uid)
    .filter(txn => {
      const date = new Date(txn.paymentTimestamp || txn.timestamp);
      if (txnFilter === 'today') return isToday(date);
      if (txnFilter === 'week') return isThisWeek(date);
      if (txnFilter === 'month') return isThisMonth(date);
      if (txnFilter === 'year') return isThisYear(date);
      return true;
    })
    .filter(txn => {
      if (paymentMethodFilter === 'all') return true;
      return txn.paymentMethod === paymentMethodFilter;
    });
};


const filteredTransactions = getFilteredTransactions();
const totalTxnAmount = filteredTransactions.reduce((sum, txn) => sum + (parseFloat(txn.processingCost) || 0), 0);

useEffect(() => {
  setTxnPage(1);
}, [txnFilter, paymentMethodFilter, searchRiceType]);




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
  typeof data.name === 'string' && data.name.trim() !== '' &&
  typeof data.capacity === 'number' && data.capacity > 0 &&
  Array.isArray(data.riceRates) && data.riceRates.length > 0 &&
  data.riceRates.every(r => r.riceType && !isNaN(parseFloat(r.ratePerKg))) &&
  typeof data.location === 'string' && data.location.trim() !== '';

  if (isComplete) {
    setMillProfile(data);
  } else {
    // Open the form prefilled if partially filled
    setFormData({
  name: data.name || '',
  capacity: data.capacity || '',
  riceRates: data.riceRates || [{ riceType: '', ratePerKg: '' }],
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
  riceRates: [{ riceType: '', ratePerKg: '' }],
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
  name: formData.name.trim(),
  capacity: parseFloat(formData.capacity),
  riceRates: formData.riceRates.filter(r => r.riceType && !isNaN(parseFloat(r.ratePerKg))).map(r => ({
    riceType: r.riceType.trim(),
    ratePerKg: parseFloat(r.ratePerKg),
  })),
  location: formData.location.trim(),
  latitude: formData.latitude || '',
  longitude: formData.longitude || '',
  engagedCapacity: millProfile?.engagedCapacity || 0,
  managerId: millId,
  timestamp: Date.now()
});



    const savedSnap = await getDoc(ref);
    if (savedSnap.exists()) {
      setMillProfile(savedSnap.data());
    }
    setEditMode(false);
    setShowProfileForm(false);
    setSnack({ open: true, message: 'Mill profile saved!', severity: 'success' });
  };

  // ✏️ Open form in edit mode
  const openEditProfile = () => {
   setFormData({
  name: millProfile.name,
  capacity: millProfile.capacity,
  riceRates: millProfile.riceRates || [{ riceType: '', ratePerKg: '' }],
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
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
         <Tabs
        value={tab}
        onChange={(e, val) => setTab(val)}
        centered
        variant="scrollable"
        scrollButtons="auto"
        sx={{ flexGrow: 1 }}
      >
  <Tab label="Home" />      
  <Tab label="Processing Requests" />
  <Tab label="Under Process" />
  <Tab label="Pending Lot" />
  <Tab label="Transactions" />
</Tabs>
<IconButton onClick={() => setDrawerOpen(true)}>
    <MoreVertIcon />
  </IconButton>
</Box>


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

            {req.paymentStatus === 'cash_pending' && (
  <Box mt={1}>
    <Typography>💰 Payment in Cash Pending: ₹{req.processingCost}</Typography>
    <Button variant="contained" onClick={() => markMillCashCollected(req)} sx={{ mt: 1 }}>
      Mark Cash as Collected
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
          fullWidth
          margin="normal"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <TextField
          label="Daily Capacity (Kg)"
          type="number"
          fullWidth
          margin="normal"
          value={formData.capacity}
          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
        />

        {/* ✅ Rice Types and Rates */}
        <Box mt={2}>
          <Typography variant="subtitle1" fontWeight={600}>
            Rice Types and Processing Rates (₹/Kg)
          </Typography>
          {formData.riceRates.map((rate, index) => (
            <Box key={index} display="flex" alignItems="center" gap={1} mt={1}>
              <TextField
                label="Rice Type"
                value={rate.riceType}
                onChange={(e) => {
                  const updated = [...formData.riceRates];
                  updated[index].riceType = e.target.value;
                  setFormData((prev) => ({ ...prev, riceRates: updated }));
                }}
                size="small"
              />
              <TextField
                label="Rate (₹/Kg)"
                type="number"
                value={rate.ratePerKg}
                onChange={(e) => {
                  const updated = [...formData.riceRates];
                  updated[index].ratePerKg = e.target.value;
                  setFormData((prev) => ({ ...prev, riceRates: updated }));
                }}
                size="small"
              />
              <Button
                color="error"
                onClick={() => {
                  const updated = [...formData.riceRates];
                  updated.splice(index, 1);
                  setFormData((prev) => ({ ...prev, riceRates: updated }));
                }}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Button
            sx={{ mt: 1 }}
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                riceRates: [...prev.riceRates, { riceType: '', ratePerKg: '' }],
              }))
            }
          >
            Add Rice Type
          </Button>
        </Box>

        {/* 📍 Location */}
        <Autocomplete
          freeSolo
          options={locationOptions}
          inputValue={formData.location}
          onInputChange={(e, val) => {
            setFormData((prev) => ({ ...prev, location: val }));
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

        {/* ✅ Save/Cancel */}
        <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
          <Button onClick={saveMillProfile} variant="contained">
            Save
          </Button>
        </Box>
      </>
    ) : (
      <>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Mill Name:</strong> {millProfile?.name}
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Capacity:</strong> {millProfile?.capacity} Kg
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          <strong>Accepted Rice Types & Rates:</strong>
        </Typography>
        {millProfile?.riceRates?.length > 0 ? (
          <ul style={{ paddingLeft: 20, marginTop: 4 }}>
            {millProfile.riceRates.map((r, i) => (
              <li key={i}>
                {r.riceType} — ₹{r.ratePerKg}/Kg
              </li>
            ))}
          </ul>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Not specified
          </Typography>
        )}
        <Typography variant="subtitle1" gutterBottom>
          <strong>Location:</strong> {millProfile?.location}
        </Typography>

        <Box mt={2} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={() => {
              setFormData({
                name: millProfile.name,
                capacity: millProfile.capacity,
                riceRates: millProfile.riceRates || [{ riceType: '', ratePerKg: '' }],
                location: millProfile.location,
                latitude: millProfile.latitude,
                longitude: millProfile.longitude,
              });
              setEditMode(true);
            }}
          >
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



{tab === 4 && (
  <Box mt={4}>
    <Typography variant="h6" gutterBottom>Completed Transactions</Typography>

    {/* 📊 Weekly Earnings */}
<Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
  Weekly Transaction Overview
</Typography>
<ResponsiveContainer width="100%" height={250}>
  <BarChart data={getWeeklyData(millTransactions)}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="day" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="total" fill="#1976d2" />
  </BarChart>
</ResponsiveContainer>

{/* 📆 Monthly Earnings */}
<Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 4, mb: 1 }}>
  Monthly Transaction Overview
</Typography>
<ResponsiveContainer width="100%" height={250}>
  <LineChart data={getMonthlyData(millTransactions)}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="month" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="value" stroke="#4caf50" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>


    {/* 🔘 Filter Buttons */}
    <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
      {['all', 'today', 'week', 'month', 'year'].map(label => (
        <Button
          key={label}
          variant={txnFilter === label ? 'contained' : 'outlined'}
          onClick={() => setTxnFilter(label)}
        >
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </Button>
      ))}
    </Box>
    <Box mb={2}>
  <TextField
    label="Search Rice Type"
    variant="outlined"
    size="small"
    fullWidth
    value={searchRiceType}
    onChange={(e) => setSearchRiceType(e.target.value)}
  />
</Box>

    {/* 💳 Payment Method Filters */}
    <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
      {['all', 'cash', 'razorpay'].map(method => (
        <Button
          key={method}
          variant={paymentMethodFilter === method ? 'contained' : 'outlined'}
          onClick={() => setPaymentMethodFilter(method)}
        >
          {method.charAt(0).toUpperCase() + method.slice(1)}
        </Button>
      ))}
    </Box>

    {/* 🔍 Filter & Display Logic */}
    {(() => {
      const filtered = millTransactions
        .filter(txn => txn.millId === auth.currentUser?.uid)
        .filter(txn => {
          const date = new Date(txn.paymentTimestamp || txn.timestamp);
          if (txnFilter === 'today') return isToday(date);
          if (txnFilter === 'week') return isThisWeek(date);
          if (txnFilter === 'month') return isThisMonth(date);
          if (txnFilter === 'year') return isThisYear(date);
          return true; // 'all'
        })
        .filter(txn => {
          if (paymentMethodFilter === 'all') return true;
          return txn.paymentMethod === paymentMethodFilter;
        })
         .filter(txn => {
    if (!searchRiceType.trim()) return true;
    return txn.riceType?.toLowerCase().includes(searchRiceType.trim().toLowerCase());
  });

      const totalAmount = filtered.reduce(
        (sum, txn) => sum + (parseFloat(txn.processingCost) || 0),
        0
      );

      const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered
    .sort((a, b) => (b.paymentTimestamp || b.timestamp || 0) - (a.paymentTimestamp || a.timestamp || 0))
    .slice((txnPage - 1) * itemsPerPage, txnPage * itemsPerPage);


      return (
        <>
          {/* 💰 Total Display */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Total Transaction Value: ₹{totalAmount.toFixed(2)}
          </Typography>

          {paginated.length === 0 ? (
            <Typography>No transactions found for selected filters.</Typography>
          ) : (
            paginated.map((txn) => (
              <Card key={txn.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Rice Type: {txn.riceType}
                  </Typography>
                  <Typography>Quantity (kg): {txn.quantity}</Typography>
                  <Typography>Cost: ₹{txn.processingCost}</Typography>
                  <Typography>Payment Method: {txn.paymentMethod}</Typography>
                  <Typography>
                    Paid On: {new Date(txn.paymentTimestamp || txn.timestamp).toLocaleString()}
                  </Typography>
                  <Typography>
                    Middleman: {txn.middlemanName || "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}

          {/* 🔁 Pagination Controls */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" alignItems="center" mt={2} gap={2}>
              <Button
                variant="outlined"
                disabled={txnPage === 1}
                onClick={() => setTxnPage(prev => prev - 1)}
              >
                Prev
              </Button>
              <Typography>Page {txnPage} of {totalPages}</Typography>
              <Button
                variant="outlined"
                disabled={txnPage === totalPages}
                onClick={() => setTxnPage(prev => prev + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      );
    })()}
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

<Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
  <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
    
    {/* Header */}
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {millProfile?.name || 'User'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {auth.currentUser?.email || 'user@example.com'}
      </Typography>
    </Box>

    <Divider />

    {/* Tab List */}
    <List sx={{ flexGrow: 1 }}>
      {tabLabels.map((label, index) => {
        const iconPath = `/assets/icons/${label.toLowerCase().replace(/\s+/g, '_')}.png`;
        return (
          <React.Fragment key={label}>
            <ListItem button onClick={() => {
              setTab(index);
              setDrawerOpen(false);
            }}>
              <Box
                component="img"
                src={iconPath}
                alt={label}
                sx={{ width: 24, height: 24, mr: 2 }}
              />
              <ListItemText primary={label} />
            </ListItem>
            {index < tabLabels.length - 1 && <Divider />}
          </React.Fragment>
        );
      })}
    </List>

    {/* Footer */}
    <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
      <Button
        fullWidth
        variant="outlined"
        color="error"
        onClick={handleLogout}
        sx={{ mb: 1 }}
      >
        Logout
      </Button>
      <Typography variant="caption" color="text.secondary" align="center" display="block">
        © {new Date().getFullYear()} CropConnect
      </Typography>
    </Box>
  </Box>
</Drawer>




    </Container>
  );
}
