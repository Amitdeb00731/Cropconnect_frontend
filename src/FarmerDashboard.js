// FarmerDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Button, Typography, Container, Box, Tab, Tabs, Grid, Paper, MenuItem, TextField, Autocomplete,
  Snackbar, Alert, Accordion, AccordionSummary, AccordionDetails, Card, CardContent, CardActions, Badge, CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import IconButton from '@mui/material/IconButton';
import { useSwipeable } from 'react-swipeable';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { SwipeableList, SwipeableListItem, Type as ListType } from 'react-swipeable-list';
import 'react-swipeable-list/dist/styles.css';
import { useTheme, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { Tooltip, Dialog, DialogTitle, DialogContent } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { auth, db } from './firebase';
import { useNavigate } from 'react-router-dom';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import { MobileStepper} from '@mui/material';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import TopNavbar from './TopNavbar';
import { startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';
import {
  collection, addDoc, getDocs, getDoc, doc, updateDoc, query, where, deleteDoc
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns-tz'; 
import axios from 'axios';
import TawkMessenger from './TawkMessenger';
import FarmerLandingHero from './FarmerLandingHero';
import FarmerQuickStats from './FarmerQuickStats';
import FarmerTimeline from './FarmerTimeline';
import FarmerQuickActions from './FarmerQuickActions';
import FarmerTipsAccordion from './FarmerTipsAccordion';






export default function FarmerDashboard() {

  useEffect(() => {
  // ✅ Load Razorpay script dynamically on component mount
  const loadRazorpayScript = () => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => console.log("✅ Razorpay script loaded");
      script.onerror = () => console.error("❌ Razorpay script failed to load");
      document.body.appendChild(script);
    }
  };

  loadRazorpayScript();
}, []);



  const ricePrices = {
    Basmati: 50, // Price per Kg
    Jasmine: 60,
    SonaMasoori: 40,
    Parboiled: 45,
    Brown: 55,
  };
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [harvest, setHarvest] = useState({
    riceType: '',
    totalQuantity: '',
    quantityUnit: '',
    remainingQuantity: '',
    farmLocation: '',
    latitude: null,
    longitude: null,
    dateOfHarvest: null,
    id: null
  });
  const [deals, setDeals] = useState([]);
  const [tawkDetails, setTawkDetails] = useState(null);
  const [selectedMiddleman, setSelectedMiddleman] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
const [openMiddlemanDialog, setOpenMiddlemanDialog] = useState(false);
  const [inspectionRequests, setInspectionRequests] = useState([]);
  const [soldTransactions, setSoldTransactions] = useState([]);
  const totalAmount = soldTransactions.reduce((sum, txn) => {
  const price = parseFloat(txn.finalizedPrice || txn.proposedPrice || txn.askingPrice || 0);
  return sum + price;
}, 0);
  const [askingPrice, setAskingPrice] = useState('');
  const [proposals, setProposals] = useState([]);
  const [harvests, setHarvests] = useState([]);
  const [notifications, setNotifications] = useState([]);
const [unseenCount, setUnseenCount] = useState(0);
  const [uid, setUid] = useState(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });


  const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); // ✅ Your actual upload preset

  const res = await fetch('https://api.cloudinary.com/v1_1/dfdot1hfz/image/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  return data.secure_url;
};




  const handleViewMiddleman = async (middlemanId) => {
  try {
    const docRef = doc(db, 'users', middlemanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setSelectedMiddleman({
        name: data.name || 'N/A',
        dob: data.dob || 'N/A',
        email: data.email || 'N/A',
        phone: data.phone || 'N/A',
        profileImage: data.profilePicture || null
      });
      setOpenMiddlemanDialog(true);
    }
  } catch (err) {
    console.error("Failed to fetch middleman profile:", err);
  }
};


  const riceTypes = ['Basmati', 'Jasmine', 'Sona Masoori', 'Parboiled', 'Brown'];
  const quantityUnits = ['Kg'];
  const getIndianSoldOutInfo = () => {
  const indiaTimeZone = 'Asia/Kolkata';
  const dateObj = new Date();
  const soldOutDate = format(dateObj, 'yyyy-MM-dd HH:mm:ss', { timeZone: indiaTimeZone });
  return { soldOutAt: soldOutDate, soldOutTimestamp: dateObj.getTime() };
};

  const [filterType, setFilterType] = useState('all');

const getFilteredTransactions = () => {
  if (filterType === 'all') return soldTransactions;

  const now = new Date();
  let fromDate;

  switch (filterType) {
    case 'weekly':
      fromDate = startOfWeek(now);
      break;
    case 'monthly':
      fromDate = startOfMonth(now);
      break;
    case 'yearly':
      fromDate = startOfYear(now);
      break;
    default:
      return soldTransactions;
  }

 return soldTransactions.filter(txn =>
  txn.soldOutTimestamp && isAfter(new Date(txn.soldOutTimestamp), fromDate)
);
};

const filteredTransactions = getFilteredTransactions();

const totalFilteredAmount = filteredTransactions.reduce((sum, txn) => {
  const price = parseFloat(txn.finalizedPrice || txn.proposedPrice || txn.askingPrice || 0);
  return sum + price;
}, 0);

useEffect(() => {
  const user = auth.currentUser;

  if (user) {
    setUid(user.uid);
    fetchDeals(user.uid);

    const fetchFarmerDetails = async () => {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    setTawkDetails({
      name: data.name || user.displayName || 'Farmer',
      email: user.email || data.email || '',
      phone: data.phone || '',
      role: 'Farmer'
    });
  }
};
fetchFarmerDetails();

    
    const unsubHarvests = fetchHarvests(user.uid);


  const fetchSoldTransactions = async (userId) => {
  const q = query(
    collection(db, 'transactions'),
    where('farmerId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const sold = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => new Date(b.dateOfHarvest) - new Date(a.dateOfHarvest));

  setSoldTransactions(sold);
};

fetchSoldTransactions(user.uid);

    // ✅ Listen to Proposals (updates proposals[] + notifications[])
    const proposalQuery = query(collection(db, 'proposals'), where('farmerId', '==', user.uid));
    const unsubProposals = onSnapshot(proposalQuery, async (snapshot) => {
      const enrichedProposals = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const p = { id: docSnap.id, ...docSnap.data() };
        if (p.status !== 'pending') return null;

        // Get middleman's name
        let middlemanName = 'Unknown';
        const middlemanDoc = await getDoc(doc(db, 'users', p.middlemanId));
        if (middlemanDoc.exists()) {
          middlemanName = middlemanDoc.data().name;
        }

        // Get harvest details
        let harvestDetails = null;
        const harvestDoc = await getDoc(doc(db, 'harvests', p.harvestId));
        if (harvestDoc.exists()) {
          harvestDetails = harvestDoc.data();
        }

        return { ...p, middlemanName, harvestDetails };
      }));

      const validProposals = enrichedProposals.filter(Boolean);
      setProposals(validProposals);

      // ✅ Notifications for proposals
      const proposalNotifications = validProposals.map(p => ({
        ...p,
        type: 'proposal',
        seen: false
      }));

      setNotifications(prev => [
        ...prev.filter(n => n.type !== 'proposal'),
        ...proposalNotifications
      ]);
    });

    // ✅ Listen to Inspection Requests (updates inspectionRequests[] + notifications[])
    const inspectionQuery = query(collection(db, 'inspectionRequests'), where('farmerId', '==', user.uid));
    const unsubInspection = onSnapshot(inspectionQuery, async (snapshot) => {
      const enrichedInspections = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        if (data.status !== 'pending') return null;

        // Get middleman's name
        let middlemanName = 'Unknown';
        const middlemanDoc = await getDoc(doc(db, 'users', data.middlemanId));
        if (middlemanDoc.exists()) {
          middlemanName = middlemanDoc.data().name;
        }

        // Get harvest details
        let harvestDetails = null;
        const harvestDoc = await getDoc(doc(db, 'harvests', data.harvestId));
        if (harvestDoc.exists()) {
          harvestDetails = harvestDoc.data();
        }

        // ✅ NEW: Fetch proposed price from linked proposal
        let proposedPrice = null;
        if (data.proposalId) {
          const proposalDoc = await getDoc(doc(db, 'proposals', data.proposalId));
          if (proposalDoc.exists()) {
            proposedPrice = proposalDoc.data().proposedPrice;
          }
        }

        return { ...data, middlemanName, harvestDetails, proposedPrice };
      }));

      // Keep only latest inspection per harvest
      const latestPerHarvest = {};
      enrichedInspections.forEach((req) => {
        if (!req) return;
        const { harvestId, timestamp } = req;
        if (
          !latestPerHarvest[harvestId] ||
          (timestamp > latestPerHarvest[harvestId].timestamp)
        ) {
          latestPerHarvest[harvestId] = req;
        }
      });

      const validInspections = Object.values(latestPerHarvest);
      setInspectionRequests(validInspections);

      // ✅ Notifications for inspections
      const inspectionNotifications = validInspections.map(req => ({
        ...req,
        type: 'inspection',
        seen: false
      }));

      setNotifications(prev => [
        ...prev.filter(n => n.type !== 'inspection'),
        ...inspectionNotifications
      ]);
    });

    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );

    const unsubNotif = onSnapshot(notifQuery, (snapshot) => {
      const paymentNotifications = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(n =>
    (n.type === 'cash_payment_pending' || n.type === 'razorpay_payment_done') &&
    (n.seen === false || n.seen === undefined)
  );



    setNotifications(prev => {
  const existingIds = new Set(prev.map(n => n.id));
  const fresh = paymentNotifications.filter(n => !existingIds.has(n.id));
  return [...prev, ...fresh];
})


    });

    // ✅ Cleanup listeners
    return () => {
      unsubProposals();
      unsubInspection();
      unsubHarvests();
      unsubNotif();
    };
  } else {
    navigate('/login');
  }
}, []);






useEffect(() => {
  const unseen = notifications.filter(n => !n.seen).length;
  setUnseenCount(unseen);
}, [notifications]);


  const fetchDeals = async (userId) => {
    const q = query(collection(db, 'deals'), where('farmerId', '==', userId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setDeals(data);
  };

 const fetchHarvests = (userId) => {
  const q = query(collection(db, 'harvests'), where('farmerId', '==', userId));
  const unsub = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHarvests(data);
  });
  return unsub; // so we can clean up
};


  const deleteHarvest = async (id) => {
    try {
      await deleteDoc(doc(db, 'harvests', id));
      fetchHarvests(uid);
      setSnack({ open: true, message: 'Harvest deleted', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: 'Delete failed: ' + err.message, severity: 'error' });
    }
  };

  const editHarvest = (harvestData) => {
    setTab(0);
    setHarvest({
      ...harvestData,
      dateOfHarvest: new Date(harvestData.dateOfHarvest)
    });
  };
const respondProposal = async (proposalId, status) => {
  await updateDoc(doc(db, 'proposals', proposalId), { status });
  setProposals(prev => prev.filter(p => p.id !== proposalId));
  setSnack({ open: true, message: `Proposal ${status}`, severity: 'info' });
};

const respondToInspection = async (id, status) => {
  await updateDoc(doc(db, 'inspectionRequests', id), { status });
  setSnack({ open: true, message: `Inspection ${status}`, severity: 'info' });
};

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/'));
  };

  const handleTabChange = (e, newVal) => setTab(newVal);

  const [calculatedPrice, setCalculatedPrice] = useState(0);
 
  const handleHarvestChange = (e) => {
    const { name, value } = e.target;
    setHarvest(prev => {
      const updatedHarvest = { ...prev, [name]: value };
      // Calculate price based on remaining quantity
      if (updatedHarvest.riceType && updatedHarvest.totalQuantity && updatedHarvest.quantityUnit) {
        const pricePerUnit = ricePrices[updatedHarvest.riceType] || 0;
        const totalQuantity = parseFloat(updatedHarvest.totalQuantity) || 0;
        const remainingQuantity = parseFloat(updatedHarvest.remainingQuantity) || totalQuantity; // Default to total if remaining is not set
        // Use the lesser of total or remaining quantity for price calculation
        const quantityForPrice = Math.min(totalQuantity, remainingQuantity);
        const newCalculatedPrice = pricePerUnit * quantityForPrice;
        setCalculatedPrice(newCalculatedPrice);
      } else {
        setCalculatedPrice(0); // Reset if inputs are not valid
      }
      return updatedHarvest;
    });
  if (name === 'askingPrice') {
    setAskingPrice(value);
  }
};

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
    } catch (err) {
      console.error('Location fetch error:', err);
    }
  };



const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    setSnack({ open: true, message: 'Geolocation not supported by this browser!', severity: 'error' });
    return;
  }

  setFetchingLocation(true);

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;

      console.log(`📍 Latitude: ${latitude}, Longitude: ${longitude}, Accuracy: ${accuracy} meters`);

      try {
        const response = await axios.get('https://api.geoapify.com/v1/geocode/reverse', {
          params: {
            lat: latitude,
            lon: longitude,
            apiKey: '35d72c07d6f74bec8a373961eea91f46',
          },
        });

        const locationName = response.data.features[0]?.properties.formatted || '';
        setHarvest(prev => ({
  ...prev,
  farmLocation: locationName,
  latitude,
  longitude
}));
        setSnack({ open: true, message: 'Location fetched!', severity: 'success' });
      } catch (err) {
        console.error('🌐 Geoapify reverse geocoding failed:', err);
        setSnack({ open: true, message: 'Failed to fetch address from Geoapify.', severity: 'error' });
      } finally {
        setFetchingLocation(false);
      }
    },
    (error) => {
      console.error('❌ Geolocation error:', error);
      let message = 'Location access failed.';
      if (error.code === error.PERMISSION_DENIED) message = 'Permission denied for location.';
      else if (error.code === error.POSITION_UNAVAILABLE) message = 'Position unavailable.';
      else if (error.code === error.TIMEOUT) message = 'Location request timed out.';
      setSnack({ open: true, message, severity: 'error' });
      setFetchingLocation(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 15000, // wait longer for GPS if needed
      maximumAge: 0
    }
  );
};


function HarvestImageCarousel({ images }) {
  const [activeStep, setActiveStep] = useState(0);
  const [zoomedImg, setZoomedImg] = useState(null);
  const maxSteps = images.length;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNext = () => setActiveStep((prev) => (prev + 1) % maxSteps);
  const handleBack = () => setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handleBack,
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  // ✅ Mobile View
  if (isMobile) {
    return (
      <Box {...swipeHandlers} sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={images[activeStep]}
          alt={`Image ${activeStep + 1}`}
          sx={{
            width: '100%',
            height: 180,
            objectFit: 'cover',
            borderRadius: 2,
            userSelect: 'none'
          }}
          onClick={() => setZoomedImg(images[activeStep])}
        />
        {maxSteps > 1 && (
          <MobileStepper
            steps={maxSteps}
            position="static"
            activeStep={activeStep}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              justifyContent: 'space-between',
              mt: 1,
              px: 1
            }}
            nextButton={<Button size="small" onClick={handleNext}><KeyboardArrowRight /></Button>}
            backButton={<Button size="small" onClick={handleBack}><KeyboardArrowLeft /></Button>}
          />
        )}
        <ImageZoomDialog image={zoomedImg} onClose={() => setZoomedImg(null)} />
      </Box>
    );
  }

  // ✅ Desktop View
  return (
    <Box>
      <Grid container spacing={1}>
        {images.map((img, idx) => (
          <Grid item xs={4} key={idx}>
            <Box
              component="img"
              src={img}
              alt={`Image ${idx + 1}`}
              onClick={() => setZoomedImg(img)}
              sx={{
                width: '100%',
                height: 120,
                objectFit: 'cover',
                borderRadius: 2,
                cursor: 'pointer',
                transition: '0.3s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 3
                }
              }}
            />
          </Grid>
        ))}
      </Grid>
      <ImageZoomDialog image={zoomedImg} onClose={() => setZoomedImg(null)} />
    </Box>
  );
}

// 🔍 Zoom Dialog Component
function ImageZoomDialog({ image, onClose }) {
  return (
    <Dialog open={!!image} onClose={onClose} maxWidth="md">
      <DialogTitle>
        Preview
        <IconButton onClick={onClose} sx={{ float: 'right' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Box
          component="img"
          src={image}
          alt="Zoomed"
          sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 2 }}
        />
      </DialogContent>
    </Dialog>
  );
}




const submitHarvest = async () => {
  try {
    let imageURLs = [];

    // Only upload images if it's a new harvest
    if (!harvest.id && selectedImages.length > 0) {
      setSnack({ open: true, message: 'Uploading images...', severity: 'info' });

      imageURLs = await Promise.all(
        selectedImages.map(file => uploadToCloudinary(file))
      );
    }

    if (harvest.id) {
      // UPDATE Existing Harvest
      await updateDoc(doc(db, 'harvests', harvest.id), {
        ...harvest,
        askingPrice: askingPrice,
        dateOfHarvest: harvest.dateOfHarvest?.toISOString().split('T')[0],
        isSoldOut: harvest.isSoldOut || false,
        latitude: harvest.latitude,
        longitude: harvest.longitude
        // Note: not updating images during edit
      });
      setSnack({ open: true, message: 'Harvest updated!', severity: 'success' });
    } else {
      // NEW Harvest with image URLs
      const docRef = await addDoc(collection(db, 'harvests'), {
        ...harvest,
        askingPrice: askingPrice,
        dateOfHarvest: harvest.dateOfHarvest?.toISOString().split('T')[0],
        farmerId: uid,
        remainingQuantity: harvest.remainingQuantity || harvest.totalQuantity,
        isSoldOut: false,
        latitude: harvest.latitude,
        longitude: harvest.longitude,
        images: imageURLs
      });

      await updateDoc(docRef, { id: docRef.id });

      setSnack({ open: true, message: 'Harvest uploaded!', severity: 'success' });
    }

    // Reset form and image selection
    setHarvest({
      riceType: '',
      totalQuantity: '',
      quantityUnit: '',
      remainingQuantity: '',
      farmLocation: '',
      dateOfHarvest: null,
      id: null,
      latitude: null,
      longitude: null
    });
    setAskingPrice('');
    setSelectedImages([]);
    fetchHarvests(uid);
  } catch (err) {
    console.error('Submit error:', err);
    setSnack({ open: true, message: 'Upload failed: ' + err.message, severity: 'error' });
  }
};




const markAsSoldOut = async (id) => {
  try {
    const harvestRef = doc(db, 'harvests', id);
    const docSnap = await getDoc(harvestRef);
    if (!docSnap.exists()) throw new Error("Harvest not found");

    const data = docSnap.data();

 const { soldOutAt, soldOutTimestamp } = getIndianSoldOutInfo();
await addDoc(collection(db, 'transactions'), {
  ...data,
  harvestId: id,
  farmerId: uid,
  soldOutAt,
  soldOutTimestamp,
  timestamp: soldOutTimestamp
});


    // Step 2: Update the original harvest as sold (optional: delete instead)
    await updateDoc(harvestRef, {
      isSoldOut: true,
      remainingQuantity: 0
    });

    fetchHarvests(uid);
    setSnack({ open: true, message: 'Marked as Sold Out & saved to history!', severity: 'success' });
  } catch (err) {
    setSnack({ open: true, message: 'Failed: ' + err.message, severity: 'error' });
  }
};



const markAsSeen = (id) => {
  setNotifications(prev =>
    prev.map(notif => notif.id === id ? { ...notif, seen: true } : notif)
  );
};

const deleteNotification = (id) => {
  setNotifications(prev => prev.filter(notif => notif.id !== id));
};


const handleCashCollected = async (notif) => {
  try {
    const inspectionQuery = query(
      collection(db, 'inspectionRequests'),
      where('farmerId', '==', uid),
      where('paymentStatus', '==', 'cash_pending')
    );
    const snapshot = await getDocs(inspectionQuery);

    if (snapshot.empty) {
      setSnack({ open: true, message: 'No matching inspection found.', severity: 'warning' });
      return;
    }

    const docSnap = snapshot.docs.find(doc => doc.data().harvestId === notif.harvestDetails?.id);
    if (!docSnap) {
      setSnack({ open: true, message: 'No matching harvest in cash request.', severity: 'error' });
      return;
    }

    const inspection = docSnap.data();
    const inspectionId = docSnap.id;
    const harvest = notif.harvestDetails;

    // ✅ Mark inspection as paid
    await updateDoc(doc(db, 'inspectionRequests', inspectionId), {
      paymentStatus: 'paid'
    });

    // ✅ Mark harvest as sold out
    await updateDoc(doc(db, 'harvests', harvest.id), {
      isSoldOut: true,
      remainingQuantity: 0,
      proposedPrice: inspection.finalizedPrice
    });

    // ✅ Create transaction with cash method
    const { soldOutAt, soldOutTimestamp } = getIndianSoldOutInfo();
    await addDoc(collection(db, 'transactions'), {
      ...harvest,
      harvestId: harvest.id,
      farmerId: uid,
      middlemanId: inspection.middlemanId,
      proposedPrice: inspection.finalizedPrice,
      soldOutAt,
      soldOutTimestamp,
      timestamp: soldOutTimestamp,
      paymentStatus: 'paid',
      paymentMethod: 'cash'
    });

// 🧠 Fetch middleman name from users collection
const middlemanDoc = await getDoc(doc(db, 'users', inspection.middlemanId));
const middlemanName = middlemanDoc.exists() ? middlemanDoc.data().name : 'Unknown';

// 🧠 Fetch farmer name from users collection (instead of auth.displayName)
const farmerDoc = await getDoc(doc(db, 'users', uid));
const farmerName = farmerDoc.exists() ? farmerDoc.data().name : 'Farmer';

// ✅ Store invoice with correct pricing key
await addDoc(collection(db, 'invoices'), {
  timestamp: Date.now(),
  middlemanId: inspection.middlemanId,
  middlemanName,
  farmerName,
  harvests: [{
    riceType: harvest.riceType,
    remainingQuantity: harvest.remainingQuantity,
    askingPrice: harvest.askingPrice,
    finalizedPrice: inspection.finalizedPrice
  }],
  paymentMethod: 'cash'
});



    // ✅ Add to middleman's inventory
    await addDoc(collection(db, 'inventory'), {
      middlemanId: inspection.middlemanId,
      riceType: harvest.riceType,
      quantity: `${parseFloat(harvest.remainingQuantity).toFixed(2)} Kg`,
      harvestId: harvest.id,
      category: 'raw',
      timestamp: Date.now()
    });

    setSnack({ open: true, message: 'Cash collected and transaction recorded.', severity: 'success' });
    await deleteDoc(doc(db, 'notifications', notif.id));
    setNotifications(prev => prev.filter(n => n.id !== notif.id));// remove from UI
  } catch (err) {
    console.error("Cash collection error:", err);
    setSnack({ open: true, message: 'Failed to mark as collected.', severity: 'error' });
  }
};



const clearAllNotifications = async () => {
  try {
    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', uid)
    );
    const snapshot = await getDocs(notifQuery);

    const deletePromises = snapshot.docs.map(docSnap =>
      deleteDoc(doc(db, 'notifications', docSnap.id))
    );

    await Promise.all(deletePromises);
    setNotifications([]);
    setSnack({ open: true, message: 'All notifications cleared', severity: 'success' });
  } catch (err) {
    console.error('Failed to clear notifications:', err);
    setSnack({ open: true, message: 'Failed to clear notifications', severity: 'error' });
  }
};


  

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems="center"
          justifyContent="center"
          mb={3}
          textAlign={{ xs: 'center', sm: 'left' }}
        >
          <Box
            component="img"
            src={logo}
            alt="App Logo"
            sx={{
              height: { xs: 60, sm: 50 },
              mb: { xs: 1, sm: 0 },
              mr: { sm: 2 }
            }}
          />
          <Typography variant="h4" fontWeight={600}>
            Farmer Dashboard
          </Typography>
        </Box>
      <TopNavbar
  title="Farmer Dashboard"
  unseenNotifications={unseenCount}
  notifications={notifications}
  onDeleteNotification={(id) =>
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }
  onClearNotifications={() => setNotifications([])}
/>



        <Tabs
          value={tab}
          onChange={handleTabChange}
          centered
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 4 }}
        >
          <Tab label="Home" />
          <Tab label="New Harvest" />
          <Tab label="Existing Harvests" />
          <Tab
  icon={<NotificationsActiveIcon />}
  iconPosition="start"
  label={
    <Box display="flex" alignItems="center" gap={1}>
      <span>Notifications</span>
      {unseenCount > 0 && (
        <Badge badgeContent={unseenCount} color="error" sx={{ "& .MuiBadge-badge": { fontSize: '0.7rem' } }} />
      )}
    </Box>
  }
/>
<Tab label="Transaction History" />

        </Tabs>

        {tab === 0 && (
  <>
    <FarmerLandingHero
  farmerName={tawkDetails?.name || 'Farmer'}
  onAddHarvest={() => setTab(1)} // Switch to "Add Harvest" tab
/>
<FarmerQuickStats
  totalEarnings={totalFilteredAmount}
  totalHarvests={harvests.length}
  totalDeals={soldTransactions.length}
/>
<FarmerTimeline />
<FarmerQuickActions
  onAddHarvest={() => setTab(1)}
  onViewProposals={() => setTab(3)}
  onCheckInventory={() => setTab(4)} // Adjust this if Inventory is a different tab
/>
<FarmerTipsAccordion />




  </>
)}

        {tab === 1 && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
  <Typography variant="subtitle1" gutterBottom>Upload Harvest Photos (Max 3)</Typography>
  <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
    {selectedImages.map((img, index) => (
      <Box key={index} position="relative">
        <img
          src={URL.createObjectURL(img)}
          alt={`preview-${index}`}
          style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }}
        />
      </Box>
    ))}

    {selectedImages.length < 3 && (
      <label htmlFor="image-upload">
        <input
          accept="image/*"
          id="image-upload"
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => {
            const files = Array.from(e.target.files).slice(0, 3);
            setSelectedImages(files);
          }}
        />
        <IconButton component="span" color="primary" size="large" sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          width: 100,
          height: 100,
          justifyContent: 'center',
          alignItems: 'center',
          display: 'flex'
        }}>
          <PhotoCamera fontSize="large" />
        </IconButton>
      </label>
    )}
  </Box>
</Grid>

            
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Rice Type" name="riceType"
                value={harvest.riceType} onChange={handleHarvestChange}
                sx={{ mr: 10 }}  
              >
                {Object.keys(ricePrices).map((type, idx) => (
                  <MenuItem key={idx} value={type}>{type}</MenuItem>
                ))}
                
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Total Quantity" name="totalQuantity"
                value={harvest.totalQuantity} onChange={handleHarvestChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth label="Unit" name="quantityUnit"
                value={harvest.quantityUnit} onChange={handleHarvestChange}
                sx={{ mr: 10 }} 
              >
                {['Kg'].map((unit, idx) => (
                  <MenuItem key={idx} value={unit}>{unit}</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Remaining Quantity"
                name="remainingQuantity"
                value={harvest.remainingQuantity}
                onChange={handleHarvestChange}
                InputProps={{
                  endAdornment: harvest.quantityUnit ? ` ${harvest.quantityUnit}` : ''
                }}
              />
            </Grid>
           

            <Grid item xs={12} sm={6}>
              <Autocomplete
  freeSolo
  options={locationOptions}
  inputValue={harvest.farmLocation}
  onInputChange={async (e, val) => {
  setHarvest(prev => ({ ...prev, farmLocation: val }));
  handleLocationSearch(val);

  // New: Geocode the typed/selected value
  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: val,
        apiKey: '35d72c07d6f74bec8a373961eea91f46',
        limit: 1,
      }
    });

    const location = response.data.features[0];
    if (location) {
      setHarvest(prev => ({
        ...prev,
        latitude: location.properties.lat,
        longitude: location.properties.lon
      }));
    }
  } catch (err) {
    console.error('❌ Failed to geocode manual location:', err);
  }
}}

  renderInput={(params) => (
    <TextField
      {...params}
      label="Farm Location"
      fullWidth
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
           <IconButton onClick={getCurrentLocation} size="small" sx={{ ml: 1 }} disabled={fetchingLocation}>
  {fetchingLocation ? (
    <CircularProgress size={20} />
  ) : (
    <MyLocationIcon />
  )}
</IconButton>

            {params.InputProps.endAdornment}
          </>
        ),
      }}
      sx={{ mr: 10 }} 
    />
  )}
/>


            </Grid>

            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Date of Harvest"
                value={harvest.dateOfHarvest}
                onChange={(date) => setHarvest(prev => ({ ...prev, dateOfHarvest: date }))}
                renderInput={(params) => <TextField fullWidth {...params} />}
              />
            </Grid>
             <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Asking Price"
                name="askingPrice"
                value={askingPrice}
                onChange={handleHarvestChange}
                error={parseFloat(askingPrice) < calculatedPrice && askingPrice !== ''}
                helperText={parseFloat(askingPrice) < calculatedPrice && askingPrice !== '' ? `Minimum asking price is ₹${calculatedPrice.toFixed(2)}` : ''}
              />
            </Grid>
            <Grid item xs={12}>
             <Button
  variant="contained"
  color="primary"
  onClick={submitHarvest}
  disabled={parseFloat(askingPrice) < calculatedPrice}
>
  {harvest.id ? 'Update Harvest' : 'Upload Harvest'}
</Button>
            </Grid>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Calculated Price
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    ₹{calculatedPrice.toFixed(2)}
                  </Typography>
                </CardContent>
                <CardActions>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === 2 && harvests.map((item, i) => (
          <Accordion key={item.id}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
  Harvest #{i + 1}: {item.riceType}
  {item.isSoldOut && (
    <Typography component="span" color="error" sx={{ ml: 1 }}>
      (Sold Out)
    </Typography>
  )}
</Typography>

            </AccordionSummary>
            <AccordionDetails>
  {/* 🖼️ Image Carousel */}
  <Box mb={2}>
    {item.images && item.images.length > 0 ? (
      <HarvestImageCarousel images={item.images} />
    ) : (
      <Box
        component="img"
        src="https://via.placeholder.com/300x180?text=No+Image"
        alt="No Image"
        sx={{
          width: '100%',
          height: 180,
          objectFit: 'cover',
          borderRadius: 2,
          mb: 2
        }}
      />
    )}
  </Box>

  {/* 🔢 Harvest Details */}
  <Typography><strong>ID:</strong> {item.id}</Typography>
  <Typography><strong>Total Quantity:</strong> {item.totalQuantity} {item.quantityUnit}</Typography>
  <Typography><strong>Remaining Quantity:</strong> {item.remainingQuantity} {item.quantityUnit}</Typography>
  <Typography><strong>Asking Price: </strong>₹{item.askingPrice}</Typography>
  <Typography><strong>Farm Location:</strong> {item.farmLocation}</Typography>
  <Typography><strong>Date of Harvest:</strong> {item.dateOfHarvest}</Typography>

  <Box mt={2}>
    <Button variant="outlined" color="primary" sx={{ mr: 1 }} onClick={() => editHarvest(item)}>
      Edit
    </Button>
    <Button variant="outlined" color="error" sx={{ mr: 1 }} onClick={() => deleteHarvest(item.id)}>
      Delete
    </Button>
    <Button
      variant="outlined"
      color="success"
      disabled={item.isSoldOut}
      onClick={() => markAsSoldOut(item.id)}
    >
      {item.isSoldOut ? 'Sold Out' : 'Mark as Sold Out'}
    </Button>
  </Box>
</AccordionDetails>

          </Accordion>
        ))}

        <Box textAlign="center" mt={4}>
          <Button variant="outlined" color="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </Box>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={snack.severity} onClose={() => setSnack(prev => ({ ...prev, open: false }))}>
            {snack.message}
          </Alert>
        </Snackbar>
        

{tab === 3 && (
  <Box mt={2}>
    {notifications.length === 0 ? (
  <Typography variant="body1" textAlign="center" color="text.secondary">
    No Notifications
  </Typography>
) : (
  <>
    <Button
      variant="outlined"
      color="error"
      fullWidth
      sx={{ mb: 2 }}
      startIcon={<DeleteSweepIcon />}
      onClick={clearAllNotifications}
    >
      Clear All Notifications
    </Button>

    <SwipeableList type={ListType.IOS}>
      {notifications.map((notif) => (
        <SwipeableListItem
          key={notif.id}
          swipeLeft={{
            content: (
              <Box
                sx={{
                  backgroundColor: 'red',
                  color: 'white',
                  px: 2,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Delete
              </Box>
            ),
            action: () => deleteNotification(notif.id),
          }}
        >
          <Card
            sx={{
              mb: 2,
              backgroundColor: notif.seen ? 'white' : '#e3f2fd',
              boxShadow: notif.seen ? 1 : 3,
              transition: '0.3s',
              cursor: 'pointer'
            }}
            onClick={() => markAsSeen(notif.id)}
          >
            <CardContent>
              {/* 👤 View Middleman Profile */}
              {notif.middlemanId && (
                <Tooltip title="View Middleman Profile" arrow>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewMiddleman(notif.middlemanId);
                    }}
                    color="primary"
                    size="small"
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      ml: 1,
                      mt: 0.5
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* 🔔 Notification Type */}
              <Typography variant="subtitle1" fontWeight={600}>
                {notif.type === 'proposal'
                  ? 'New Price Proposal'
                  : notif.type === 'inspection'
                  ? 'New Inspection Request'
                  : notif.type === 'cash_payment_pending'
                  ? 'Cash Payment Pending'
                  : 'Notification'}
              </Typography>

              {/* 📤 Sender Info */}
              <Typography variant="body2" color="text.secondary">
                From: {notif.middlemanName || notif.middlemanId || 'Unknown'}
              </Typography>

              {/* 🌾 Rice Type */}
              {notif.harvestDetails?.riceType && (
                <Typography variant="body2" color="text.secondary">
                  Rice Type: {notif.harvestDetails.riceType}
                </Typography>
              )}

              {/* 💰 Price Info */}
              {(notif.finalizedPrice || notif.proposedPrice || notif.harvestDetails?.askingPrice) && (
                <Typography variant="body2" color="text.secondary">
                  Price: ₹{notif.finalizedPrice || notif.proposedPrice || notif.harvestDetails.askingPrice}
                </Typography>
              )}

              {/* 💬 Optional Message */}
              {notif.message && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {notif.message}
                </Typography>
              )}

              {/* 🎯 Action Buttons */}
              <Box mt={1}>
                {notif.type === 'proposal' ? (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      sx={{ mr: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        respondProposal(notif.id, 'accepted');
                        deleteNotification(notif.id);
                      }}
                    >
                      Accept Proposal
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        respondProposal(notif.id, 'declined');
                        deleteNotification(notif.id);
                      }}
                    >
                      Decline Proposal
                    </Button>
                  </>
                ) : notif.type === 'inspection' ? (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      sx={{ mr: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        respondToInspection(notif.id, 'accepted');
                        deleteNotification(notif.id);
                      }}
                    >
                      Accept Inspection
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        respondToInspection(notif.id, 'declined');
                        deleteNotification(notif.id);
                      }}
                    >
                      Decline Inspection
                    </Button>
                  </>
                ) : notif.type === 'cash_payment_pending' ? (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={notif.processing}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCashCollected(notif);
                      setNotifications((prev) =>
                        prev.map((n) =>
                          n.id === notif.id ? { ...n, processing: true } : n
                        )
                      );
                    }}
                  >
                    {notif.processing ? 'Processing...' : 'Mark as Cash Collected'}
                  </Button>
                ) : null}
              </Box>
            </CardContent>
          </Card>
        </SwipeableListItem>
      ))}
    </SwipeableList>
  </>
)}


  </Box>
)}

{tab === 4 && (
  <Box>
    <Typography variant="h5" gutterBottom>Transaction History</Typography>

    {/* Filter dropdown */}
    <Box mb={2} display="flex" justifyContent="center" gap={2}>
      <TextField
        select
        label="Filter by"
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        sx={{ width: 200 }}
      >
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="weekly">This Week</MenuItem>
        <MenuItem value="monthly">This Month</MenuItem>
        <MenuItem value="yearly">This Year</MenuItem>
      </TextField>
    </Box>

    {/* Total filtered amount */}
    <Box mb={2} textAlign="center">
      <Card sx={{ backgroundColor: '#f0f4ff', boxShadow: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" color="text.secondary">Total Transaction Value</Typography>
          <Typography variant="h4" color="primary" fontWeight={600}>
            ₹{totalFilteredAmount.toFixed(2)}
          </Typography>
        </CardContent>
      </Card>
    </Box>

    {/* Filtered Transactions */}
    {filteredTransactions.length === 0 ? (
      <Typography>No transactions found for the selected period.</Typography>
    ) : (
      filteredTransactions.map((item, i) => (
        <Card key={item.id} sx={{ mb: 2, p: 2 }}>
          <Typography><strong>Rice Type:</strong> {item.riceType}</Typography>
          <Typography><strong>Remaining Quantity:</strong> {item.remainingQuantity} {item.quantityUnit}</Typography>
          <Typography><strong>Sold Price:</strong> ₹{item.proposedPrice || item.askingPrice}</Typography>
          <Typography><strong>Farm Location:</strong> {item.farmLocation}</Typography>
          <Typography>
            <strong>Date of Harvest:</strong> {item.dateOfHarvest ? new Date(item.dateOfHarvest).toLocaleDateString() : 'N/A'}
          </Typography>
          <Typography><strong>Sold Out On:</strong> {item.soldOutAt || 'N/A'}</Typography>
        </Card>
      ))
    )}
  </Box>
)}




<Dialog open={openMiddlemanDialog} onClose={() => setOpenMiddlemanDialog(false)}>
  <DialogTitle>Middleman Profile</DialogTitle>
  <DialogContent>
    {selectedMiddleman ? (
      <>
        {selectedMiddleman.profileImage && (
          <Box textAlign="center" mb={2}>
            <img
              src={selectedMiddleman.profileImage}
              alt="Middleman"
              style={{ width: 100, height: 100, borderRadius: '50%' }}
            />
          </Box>
        )}
        <Typography><strong>Name:</strong> {selectedMiddleman.name}</Typography>
        <Typography><strong>Dob:</strong> {selectedMiddleman.dob}</Typography>
        <Typography><strong>Email:</strong> {selectedMiddleman.email}</Typography>
        <Typography><strong>Phone:</strong> {selectedMiddleman.phone}</Typography>
      </>
    ) : (
      <Typography>No data available.</Typography>
    )}
  </DialogContent>
</Dialog>


{tawkDetails && (
  <TawkMessenger
    name={tawkDetails.name}
    email={tawkDetails.email}
    phone={tawkDetails.phone}
    role={tawkDetails.role}
  />
)}




      </Container>
    </LocalizationProvider>
  );
}
