import React, { useEffect, useState , res} from 'react';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, Snackbar, Alert, Badge, IconButton, Drawer, List, ListItem,
  ListItemText, useMediaQuery
} from '@mui/material';
import { MenuItem, InputAdornment, FormControlLabel, Switch, Slider, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, Divider, Tooltip } from '@mui/material';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Tabs, Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { runTransaction } from 'firebase/firestore';
import {
  generateInvoicePDF,
  generateMillInvoicePDF
} from './InvoiceGenerator';
import { signOut } from 'firebase/auth';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RiceBowlIcon from '@mui/icons-material/RiceBowl';
import {Avatar, Chip, Checkbox, Paper} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ChatBox from './ChatBox';
import TopNavbar from './TopNavbar';
import { db } from './firebase';
import { auth } from './firebase';
import { format } from 'date-fns-tz'; 
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, onSnapshot, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import HarvestImageCarousel from './HarvestImageCarousel'; // update path as needed

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import {
  FormControl, InputLabel, Select
} from '@mui/material';
import { isToday, isThisWeek, isThisMonth, isSameDay, getYear, getMonth } from 'date-fns';
import TawkMessenger from './TawkMessenger';
import MiddlemanLandingHero from './MiddlemanLandingHero';
import MiddlemanQuickActions from './MiddlemanQuickActions';
import MiddlemanDealTimeline from './MiddlemanDealTimeline';
import MiddlemanTipsAccordion from './MiddlemanTipsAccordion';
import ChatFeatureSection from './ChatFeatureSection';
import MillMapView from './MillMapView';
import HarvestMapView from './HarvestMapView';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import JourneyMap from './JourneyMap';














const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


// Utility: Parse quantity like "10 Kg" or "10.00 kg"
const parseQuantity = (str) => {
  const match = (str + '').match(/^([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
};


function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRad = val => (val * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ✅ Utility to check if rice type is accepted by mill
const isRiceTypeAcceptedByMill = (mill, riceType) => {
  if (!mill?.riceRates || !riceType) return false;
  return mill.riceRates.some(r =>
    r.riceType?.toLowerCase().trim() === riceType.toLowerCase().trim()
  );
};



export default function MiddlemanDashboard() {
  const [tab, setTab] = useState(0);
  const [optiondrawerOpen, setOptionDrawerOpen] = useState(false);
const tabLabels = [
  "Home",
  "Available Harvests",
  "Proposals Sent",
  "Inspection Responses",
  "Inventory",
  "Find Mills",
  "Track Processing",
  "Invoices",
  "Messages"
];
const [proposals, setProposals] = useState([]);
const [selectedFarmer, setSelectedFarmer] = useState(null);
const [journeyDestination, setJourneyDestination] = useState(null);
const [selectedChatId, setSelectedChatId] = useState(null);
const [paymentNotifications, setPaymentNotifications] = useState([]);

const [chats, setChats] = useState([]);

useEffect(() => {
  const user = auth.currentUser;
  const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));

  const unsub = onSnapshot(q, async (snap) => {
    const updatedChats = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const chat = { id: docSnap.id, ...docSnap.data() };
        const otherId = chat.participants.find(p => p !== user.uid);

        // Get other user's profile
        let otherUserData = { name: 'Unknown', profilePicture: null };
        try {
          const userSnap = await getDoc(doc(db, 'users', otherId));
          if (userSnap.exists()) {
            otherUserData = userSnap.data();
          }
        } catch (err) {
          console.error("User fetch error:", err.message);
        }

        // Count unseen messages
        let newMessages = 0;
        try {
          const messagesSnap = await getDocs(collection(db, 'chats', docSnap.id, 'messages'));
          newMessages = messagesSnap.docs.filter(doc =>
            doc.data().senderId !== user.uid && !doc.data().seen
          ).length;
        } catch (err) {
          console.error("Message count error:", err.message);
        }

        return {
          ...chat,
          otherUserName: otherUserData.name,
          otherUserProfile: otherUserData.profilePicture || null,
          chatDocId: docSnap.id,
          newMessages
        };
      })
    );

    setChats(updatedChats);

    // Update total unseen message count for the tab
    const totalUnseen = updatedChats.reduce((sum, c) => sum + c.newMessages, 0);
    setUnseenMessages(totalUnseen);
  });

  return () => unsub();
}, []);

const markNotificationAsSeen = async (id, type) => {
  try {
    await updateDoc(doc(db, 'notifications', id), { seen: true });
    if (type === 'processing_done') {
      setPaymentNotifications(prev => prev.map(n => n.id === id ? { ...n, seen: true } : n));
    }
  } catch (err) {
    console.error("❌ Failed to mark seen:", err.message);
  }
};


const [invoices, setInvoices] = useState([]);
const [calculatedCost, setCalculatedCost] = useState(0);
const [showHarvestMap, setShowHarvestMap] = useState(false);
const [showMap, setShowMap] = useState(true);
const [openFarmerDialog, setOpenFarmerDialog] = useState(false);
const [unseenMessages, setUnseenMessages] = useState(0);
const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('all'); 

const updateProcessingCost = (riceType, quantity) => {
  const rate = selectedMill?.riceRates?.find(r => r.riceType === riceType)?.ratePerKg;
  const qty = parseFloat(quantity);
  if (rate && qty) {
    setCalculatedCost((rate * qty).toFixed(2));
  } else {
    setCalculatedCost(0);
  }
};


const handleViewFarmer = async (farmerId) => {
  const docRef = doc(db, 'users', farmerId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    setSelectedFarmer({
      name: data.name || 'N/A',
      dob: data.dob || 'N/A',
      email: data.email || 'N/A',
      phone: data.phone || null,
      profileImage: data.profilePicture || null
    });
    setOpenFarmerDialog(true);
  }
};
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [invoiceToDelete, setInvoiceToDelete] = useState(null);


const [invoiceFilter, setInvoiceFilter] = useState('all');
const [specificDate, setSpecificDate] = useState(null);



const filteredInvoices = invoices.filter(inv => {
  const date = new Date(inv.timestamp);
  switch (invoiceFilter) {
    case 'today':
      return isToday(date);
    case 'week':
      return isThisWeek(date);
    case 'month':
      return isThisMonth(date);
    case 'date':
      return specificDate && isSameDay(date, specificDate);
    case 'year':
    case 'all':
    default:
      return true;
  }
}).filter(inv => {
  if (invoiceTypeFilter === 'mill') return inv.type === 'mill_processing';
  if (invoiceTypeFilter === 'farmer') return inv.type !== 'mill_processing';
  return true;
});


const groupedByMonth = filteredInvoices.reduce((acc, inv) => {
  const date = new Date(inv.timestamp);
  const monthName = format(date, 'MMMM yyyy');
  if (!acc[monthName]) acc[monthName] = [];
  acc[monthName].push(inv);
  return acc;
}, {});




const [unseenProposals, setUnseenProposals] = useState(0);
const [tawkDetails, setTawkDetails] = useState(null);
const [sendDialogOpen, setSendDialogOpen] = useState(false);
const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
const [selectedPaymentInspection, setSelectedPaymentInspection] = useState(null);
const [selectedMill, setSelectedMill] = useState(null);
const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
const [sendQuantity, setSendQuantity] = useState('');
const [unseenInspections, setUnseenInspections] = useState(0);
const [inventoryAddedIds, setInventoryAddedIds] = useState([]);
const [inspectionSnack, setInspectionSnack] = useState({ open: false, message: '', severity: 'info' });
  const [proposeDialogOpen, setProposeDialogOpen] = useState(false);
const [selectedHarvest, setSelectedHarvest] = useState(null);
const [selectedRiceType, setSelectedRiceType] = useState('');
const handleRiceTypeChange = (e) => {
  const selected = e.target.value;
  setSelectedRiceType(selected);

  if (!isRiceTypeAcceptedByMill(selectedMill, selected)) {
    setSnack({
      open: true,
      message: `${selectedMill?.name || 'This mill'} does not accept ${selected} rice type.`,
      severity: 'warning',
    });
  }
};
const [processingRequests, setProcessingRequests] = useState([]);
const [locationName, setLocationName] = useState('');
const [proposedPrice, setProposedPrice] = useState('');
const [disabledProposalIds, setDisabledProposalIds] = useState([]);
const [filterRiceType, setFilterRiceType] = useState('');
const [filterMillLocation, setFilterMillLocation] = useState('');
const [capacityRange, setCapacityRange] = useState([0, 10000]); // min to max in Kg
const [loadingProposal, setLoadingProposal] = useState(false);
const [inspectionResponses, setInspectionResponses] = useState([]);
const [isDistanceLoading, setIsDistanceLoading] = useState(false);
const [finalizing, setFinalizing] = useState(false);
  const [harvests, setHarvests] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
const [filterNearestMills, setFilterNearestMills] = useState(false);
  const [cart, setCart] = useState(() => {
    const storedCart = localStorage.getItem('middlemanCart');
    return storedCart ? JSON.parse(storedCart) : [];
  });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const [inventory, setInventory] = useState([]);
  const [searchRiceType, setSearchRiceType] = useState('');
  const [allMills, setAllMills] = useState([]);
const [filterLocation, setFilterLocation] = useState('');
const [filterNearest, setFilterNearest] = useState(false);
const [sortOption, setSortOption] = useState('');
const [processedInventory, setProcessedInventory] = useState([]);
const [distanceRadius, setDistanceRadius] = useState(20); // in km
const [currentLocation, setCurrentLocation] = useState(null);
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = angle => (angle * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
const navigate = useNavigate();


useEffect(() => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const q = query(collection(db, 'notifications'), where('userId', '==', uid));
  const unsub = onSnapshot(q, (snapshot) => {
    const relevant = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(n =>
        ['cash_payment_pending', 'razorpay_payment_done', 'processing_done'].includes(n.type)
      );

    setPaymentNotifications(relevant);

    // Optional: trigger snack for unseen processing_done
    relevant.forEach(n => {
      if (n.type === 'processing_done' && !n.seen) {
        setSnack({ open: true, message: n.message, severity: 'success' });
        updateDoc(doc(db, 'notifications', n.id), { seen: true });
      }
    });
  });

  return () => unsub();
}, []);



useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "invoices"), where("middlemanId", "==", user.uid));
  const unsub = onSnapshot(q, (snapshot) => {
    setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  return () => unsub();
}, []);


useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const fetchMiddlemanProfile = async () => {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setTawkDetails({
        name: data.name || user.displayName || 'Middleman',
        email: user.email || data.email || '',
        phone: data.phone || '',
        role: 'Middleman'
      });
    }
  };

  fetchMiddlemanProfile();
}, []);


useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, 'invoices'), where('middlemanId', '==', user.uid));
  const unsub = onSnapshot(q, (snapshot) => {
    setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });

  return () => unsub();
}, []);





// ✅ Load on mount
useEffect(() => {
  const stored = localStorage.getItem('disabledProposalIds');
  if (stored) setDisabledProposalIds(JSON.parse(stored));
}, []);

// ✅ Sync on change
useEffect(() => {
  localStorage.setItem('disabledProposalIds', JSON.stringify(disabledProposalIds));
}, [disabledProposalIds]);

useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lon: longitude });

      // Fetch location name
      const res = await fetch(`https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&apiKey=35d72c07d6f74bec8a373961eea91f46`);
      const data = await res.json();
      const place = data.features?.[0]?.properties?.formatted;
      if (place) setLocationName(place);
    },
    () => {
      console.warn('Location access denied');
    }
  );
}, []);

useEffect(() => {
  const middlemanId = auth.currentUser?.uid;
  if (!middlemanId) return;

  const q = query(
    collection(db, 'millProcessingRequests'),
    where('middlemanId', '==', middlemanId)
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    const enriched = await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };

      // Enrich with mill details
      const millSnap = await getDoc(doc(db, 'mills', data.millId));
      const millData = millSnap.exists() ? millSnap.data() : {};
      return { ...data, mill: millData };
    }));

    // Update visible list (only ones not cleared)
    const visible = enriched.filter(r => !r.middlemanCleared);
    setProcessingRequests(visible);

    // Handle restoration for declined requests
   for (const req of enriched) {
  if (req.requestStatus === 'declined' && !req.restored) {
  try {
    await runTransaction(db, async (transaction) => {
      const reqRef = doc(db, 'millProcessingRequests', req.id);
      const reqSnap = await transaction.get(reqRef);
      if (!reqSnap.exists()) return;

      const { restored, riceType, quantity } = reqSnap.data();
      if (restored) return;

      const invQuery = query(
        collection(db, 'inventory'),
        where('middlemanId', '==', middlemanId),
        where('riceType', '==', riceType),
        where('category', '==', 'raw')
      );

      // 🧠 Read inventory inside transaction to avoid Firestore error
      const invDocs = await getDocs(invQuery);
      let restoredQty = parseQuantity(quantity);

      if (!invDocs.empty) {
        const invDoc = invDocs.docs[0];
        const invRef = doc(db, 'inventory', invDoc.id);
        const invSnap = await transaction.get(invRef);

        const currentQty = parseQuantity(invSnap.data().quantity);
        const newQty = currentQty + restoredQty;

        transaction.update(invRef, {
          quantity: `${newQty.toFixed(2)} Kg`
        });
      } else {
        const newInvRef = doc(collection(db, 'inventory'));
        transaction.set(newInvRef, {
          middlemanId,
          riceType,
          quantity: `${restoredQty.toFixed(2)} Kg`,
          category: 'raw',
          timestamp: Date.now()
        });
      }

      // ✅ Mark request as restored inside same transaction
      transaction.update(reqRef, { restored: true });
    });

    setSnack({
      open: true,
      message: `✅ Declined request – inventory safely restored`,
      severity: 'info'
    });
  } catch (err) {
    console.error("❌ Error in transaction restore:", err.message);
    setSnack({
      open: true,
      message: 'Failed to restore inventory. Try again.',
      severity: 'error'
    });
  }
}

}

  });

  return () => unsub();
}, []);



const addToProcessedInventory = async (req) => {
  try {
    const quantity = parseFloat(req.quantity);
    if (isNaN(quantity) || quantity <= 0) throw new Error("Invalid quantity");

    const invQuery = query(
      collection(db, 'inventory'),
      where('middlemanId', '==', auth.currentUser.uid),
      where('riceType', '==', req.riceType),
      where('category', '==', 'processed')
    );

    const invSnap = await getDocs(invQuery);

    if (!invSnap.empty) {
      const invDoc = invSnap.docs[0];
      const currentQty = parseFloat(invDoc.data().quantity);
      await updateDoc(invDoc.ref, {
        quantity: `${(currentQty + quantity).toFixed(2)} Kg`
      });
    } else {
      await addDoc(collection(db, 'inventory'), {
        middlemanId: auth.currentUser.uid,
        riceType: req.riceType,
        quantity: `${quantity.toFixed(2)} Kg`,
        category: 'processed',
        timestamp: Date.now(),
        harvestId: req.harvestId || null
      });
    }

    // ✅ Mark the request as processed in Firestore
    await updateDoc(doc(db, 'millProcessingRequests', req.id), {
      inventoryAdded: true
    });

    // ✅ Also update local state to disable the button immediately
    setInventoryAddedIds(prev => [...prev, req.id]);

    setSnack({ open: true, message: 'Inventory updated successfully!', severity: 'success' });
  } catch (err) {
    console.error("Error adding to inventory:", err);
    setSnack({ open: true, message: 'Failed to add to inventory.', severity: 'error' });
  }
};

const generateCashInvoiceAfterConfirmation = async (req) => {
  try {
    const middlemanId = req.middlemanId || auth.currentUser?.uid;
    if (!middlemanId) throw new Error("Missing middlemanId");

    const middlemanSnap = await getDoc(doc(db, 'users', middlemanId));
    const middlemanName = middlemanSnap.exists() ? middlemanSnap.data().name : 'Unknown';

    await addDoc(collection(db, 'invoices'), {
      middlemanId,
      millId: req.millId,
      middlemanName,
      millName: req.mill?.name || 'Unknown Mill',
      millLocation: req.mill?.location || 'N/A',
      riceType: req.riceType,
      quantity: req.quantity,
      processingCost: req.processingCost,
      paymentMethod: 'cash',
      paymentTimestamp: Date.now(),
      timestamp: Date.now(),
      type: 'mill_processing'
    });

    setSnack({ open: true, message: 'Invoice generated after mill cash confirmation.', severity: 'success' });
  } catch (err) {
    console.error('Invoice generation error:', err);  // 🔍 helpful for debugging
    setSnack({ open: true, message: 'Failed to generate invoice after confirmation.', severity: 'error' });
  }
};



const handleMillCashPayment = async (req) => {
  try {
    await updateDoc(doc(db, 'millProcessingRequests', req.id), {
      paymentStatus: 'cash_pending',
      paymentDetails: {
        method: 'cash',
        amount: req.processingCost,
        requestedAt: Date.now()
      }
    });

    await addDoc(collection(db, 'notifications'), {
      userId: req.millId,
      type: 'cash_payment_pending',
      message: `Cash payment of ₹${req.processingCost} pending for ${req.riceType}`,
      seen: false,
      timestamp: Date.now(),
      requestId: req.id
    });

    setSnack({ open: true, message: 'Cash payment requested. Awaiting mill confirmation.', severity: 'info' });
  } catch (err) {
    console.error('Cash payment error:', err);
    setSnack({ open: true, message: 'Failed to send payment.', severity: 'error' });
  }
};





const handleMillRazorpayPayment = async (req) => {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    setSnack({ open: true, message: 'Razorpay SDK failed to load', severity: 'error' });
    return;
  }

  try {
    const res = await fetch("https://flask-razorpay-backend.onrender.com/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(req.processingCost), currency: "INR" })
    });

    const orderData = await res.json();

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.order_id,
      handler: async function (response) {
        await updateDoc(doc(db, 'millProcessingRequests', req.id), {
          paymentStatus: 'razorpay_done',
          paymentDetails: {
            method: 'razorpay',
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            paidAt: Date.now()
          }
        });

        await addDoc(collection(db, 'notifications'), {
          userId: req.millId,
          type: 'razorpay_payment_done',
          message: `Razorpay payment ₹${req.processingCost} received for ${req.riceType}`,
          seen: false,
          requestId: req.id,
          timestamp: Date.now()
        });

        // ✅ Generate and Save Invoice
        const middlemanSnap = await getDoc(doc(db, 'users', req.middlemanId));
        const middlemanName = middlemanSnap.exists() ? middlemanSnap.data().name : 'Unknown';

        await addDoc(collection(db, 'invoices'), {
          middlemanId: req.middlemanId,
          millId: req.millId,
          middlemanName,
          millName: req.mill?.name || 'Unknown Mill',
          millLocation: req.mill?.location || 'N/A', 
          riceType: req.riceType,
          quantity: req.quantity,
          processingCost: req.processingCost,
          paymentMethod: 'razorpay',
          paymentTimestamp: Date.now(),
          timestamp: Date.now(),
          type: 'mill_processing'
        });

        setSnack({ open: true, message: 'Payment done via Razorpay and invoice saved!', severity: 'success' });
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error('Razorpay error:', err);
    setSnack({ open: true, message: 'Payment failed', severity: 'error' });
  }
};







const handleLogout = () => {
  signOut(auth).then(() => {
    navigate('/');
  });
};


useEffect(() => {
  

  const fetchMills = async () => {
    const snapshot = await getDocs(collection(db, 'mills'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAllMills(list);
  };
  fetchMills();
}, []);

const getIndianSoldOutInfo = () => {
  const indiaTimeZone = 'Asia/Kolkata';
  const dateObj = new Date();
  const soldOutDate = format(dateObj, 'yyyy-MM-dd HH:mm:ss', { timeZone: indiaTimeZone });
  return { soldOutAt: soldOutDate, soldOutTimestamp: dateObj.getTime() };
};



const riceSummary = inventory.reduce((acc, item) => {
  const [qtyStr, unit] = item.quantity.split(' ');
  const qty = parseFloat(qtyStr);
  const key = `${item.riceType} (${unit})`;

  if (!acc[key]) acc[key] = 0;
  acc[key] += qty;

  return acc;
}, {});



useEffect(() => {
  const fetchLocation = async () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ latitude, longitude });

        // Reverse geocoding to get location name
        try {
          const res = await fetch(
            `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=ZtLMRcAp2381Ojm85ObA3WGPdBQnRafj`
          );
          const data = await res.json();
          const address = data?.addresses?.[0]?.address;
          if (address) {
            const name = `${address.municipality || ''}, ${address.countrySubdivision || ''}, ${address.country || ''}`;
            setLocationName(name);
          } else {
            setLocationName('Unknown Location');
          }
        } catch (err) {
          console.error('Reverse geocode failed', err.message);
          setLocationName('Unknown Location');
        }
      },
      async (err) => {
        console.warn('Geolocation error:', err.message);
        setCurrentLocation(null);
        setLocationName('Unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  fetchLocation();
}, []);





useEffect(() => {
  if (!filterNearest || !currentLocation) return;

  setIsDistanceLoading(true);

  const debounce = setTimeout(() => {
    // Artificial delay to simulate loading effect
    setIsDistanceLoading(false);
  }, 300); // You can adjust the delay for responsiveness

  return () => clearTimeout(debounce);
}, [distanceRadius, filterNearest, currentLocation]);




useEffect(() => {
  const q = query(collection(db, 'harvests'));
  const unsubHarvests = onSnapshot(q, async (snapshot) => {
    const harvestList = [];

    for (let docSnap of snapshot.docs) {
      const data = docSnap.data();
      const farmerDoc = await getDoc(doc(db, 'users', data.farmerId));
      const farmerName = farmerDoc.exists() ? farmerDoc.data().name : 'Unknown';
      harvestList.push({ id: docSnap.id, ...data, farmerName });
    }

    setHarvests(harvestList);

    // 🧹 Clean sold-out items from cart
    setCart((prevCart) =>
      prevCart.filter(item => {
        const updated = harvestList.find(h => h.id === item.id);
        return updated && !updated.isSoldOut && updated.remainingQuantity > 0;
      })
    );
  });

  // Load cart from localStorage
  const storedCart = localStorage.getItem('middlemanCart');
  if (storedCart) {
    setCart(JSON.parse(storedCart));
  }

  // Listen for proposal updates
  const user = auth.currentUser;
  let unsubProposals = () => {};

  if (user) {
    const q = query(
      collection(db, 'proposals'),
      where('middlemanId', '==', user.uid)
    );

    unsubProposals = onSnapshot(q, (snapshot) => {
      const allProposals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProposals(allProposals);

      const pending = allProposals.filter(p => p.status === 'pending').length;
      setUnseenProposals(pending);

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const proposal = change.doc.data();
          if (proposal.status === 'accepted' || proposal.status === 'declined') {
            setSnack({
              open: true,
              message: `Your proposal for Harvest #${proposal.harvestId} was ${proposal.status}`,
              severity: proposal.status === 'accepted' ? 'success' : 'info'
            });
          }
        }
      });
    });
  }

  // ✅ Cleanup both listeners
  return () => {
    unsubHarvests();
    unsubProposals();
  };
}, []);




const finalizeInspection = async (inspectionId, status) => {
  setFinalizing(true);
  try {
    await updateDoc(doc(db, 'inspectionRequests', inspectionId), {
      inspectionStatus: status
    });

    const inspectionDoc = await getDoc(doc(db, 'inspectionRequests', inspectionId));
    const { harvestId, farmerId: farmerIdFromInspection, proposalId } = inspectionDoc.data() || {};

    if (!harvestId) throw new Error("Harvest ID missing in inspection document");

    const harvestRef = doc(db, 'harvests', harvestId);
    const harvestDoc = await getDoc(harvestRef);
    let harvest = harvestDoc.exists() ? harvestDoc.data() : null;

    if (!harvest) throw new Error("No harvest data");

    const farmerId = harvest.farmerId || farmerIdFromInspection;
    harvest = {
      ...harvest,
      farmerId,
      dateOfHarvest: typeof harvest.dateOfHarvest === 'string'
        ? harvest.dateOfHarvest
        : new Date(harvest.dateOfHarvest).toISOString().split('T')[0]
    };

   if (status === 'done') {
  if (!harvest || !harvest.remainingQuantity || !harvest.quantityUnit || !harvest.riceType) {
    throw new Error("Incomplete harvest data for inventory creation");
  }

  let proposal = null;
  if (proposalId) {
    const proposalDoc = await getDoc(doc(db, 'proposals', proposalId));
    if (proposalDoc.exists()) {
      proposal = proposalDoc.data();
    }
  }

  const finalizedPrice = proposal?.proposedPrice ?? harvest.askingPrice ?? 0;

  // ✅ Update the inspection request to reflect inspection is done and payment is pending
  await updateDoc(doc(db, 'inspectionRequests', inspectionId), {
    inspectionStatus: 'done',
    paymentStatus: 'pending',
    finalizedPrice
  });

  // ✅ Save this inspection and harvest info for the upcoming payment dialog
  setSelectedPaymentInspection({
    id: inspectionId,
    ...inspectionDoc.data(),
    harvest,
    finalizedPrice,
    farmerId,
  });

  // ✅ Show dialog to let middleman choose payment method
  setPaymentDialogOpen(true);

  setSnack({
    open: true,
    message: 'Inspection marked as DONE. Please complete the payment.',
    severity: 'success'
  });

} else if (status === 'not_satisfied') {
  setCart(prev => prev.filter(item => item.id !== harvestId));
  setSnack({
    open: true,
    message: 'Not Satisfied – Deal Closed',
    severity: 'info'
  });
}

  } catch (err) {
    console.error("Inspection finalization error:", err);
    setSnack({ open: true, message: 'Update failed: ' + err.message, severity: 'error' });
  } finally {
    setFinalizing(false);
  }
};

const confirmDeleteInvoice = (invoice) => {
  setInvoiceToDelete(invoice);
  setDeleteDialogOpen(true);
};

const handleConfirmedDelete = async () => {
  try {
    await deleteDoc(doc(db, 'invoices', invoiceToDelete.id));
    setInvoices(prev => prev.filter(inv => inv.id !== invoiceToDelete.id));
    setSnack({ open: true, message: 'Invoice deleted.', severity: 'success' });
  } catch (err) {
    setSnack({ open: true, message: 'Delete failed.', severity: 'error' });
  } finally {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  }
};


const renderInvoiceCard = (inv) => {
  const isMillInvoice = inv.type === 'mill_processing';
  const total = isMillInvoice
    ? parseFloat(inv.processingCost || 0)
    : inv.harvests.reduce(
        (sum, h) => sum + parseFloat(h.finalizedPrice || h.proposedPrice || 0),
        0
      );

  return (
    <Grid item xs={12} sm={6} md={4} key={inv.id}>
      <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Invoice #{inv.id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Date: {new Date(inv.timestamp).toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Middleman: {inv.middlemanName}
        </Typography>

        {isMillInvoice ? (
          <>
            <Typography variant="body2" color="text.secondary">
  Mill: {inv.millName} — {inv.millLocation || 'N/A'}
</Typography>

            <Typography variant="body2" color="text.secondary">
              Payment: {inv.paymentMethod}
            </Typography>
            <Box mt={1}>
              <Typography variant="body2">
                • {inv.riceType} — {inv.quantity} Kg — ₹{inv.processingCost}
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">
              Farmer: {inv.farmerName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment: {inv.paymentMethod}
            </Typography>
            <Box mt={1}>
              {inv.harvests.map((h, i) => (
                <Typography key={i} variant="body2">
                  • {h.riceType} — {h.remainingQuantity} Kg — ₹{h.finalizedPrice || h.proposedPrice}
                </Typography>
              ))}
            </Box>
          </>
        )}

        <Typography variant="body2" sx={{ mt: 1 }}>
          Total: ₹{total.toFixed(2)}
        </Typography>

        <Box mt={2} display="flex" gap={1} flexWrap="wrap">
          <Button
  size="small"
  variant="contained"
  onClick={() =>
    inv.type === 'mill_processing'
      ? generateMillInvoicePDF(inv)
      : generateInvoicePDF(inv)
  }
>
  Download
</Button>

          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => confirmDeleteInvoice(inv)}
          >
            Delete
          </Button>
        </Box>
      </Card>
    </Grid>
  );
};




const handleCashPayment = async () => {
  const middlemanId = auth.currentUser?.uid;
  const paymentData = selectedPaymentInspection;
  if (!middlemanId || !paymentData) return;

  try {
    const middlemanDoc = await getDoc(doc(db, 'users', middlemanId));
    const middlemanName = middlemanDoc.exists() ? middlemanDoc.data().name : 'Unknown';

    // ✅ Update payment status in inspectionRequests
    await updateDoc(doc(db, 'inspectionRequests', paymentData.id), {
      paymentStatus: 'cash_pending'
    });

    // ✅ Send notification to farmer
    await addDoc(collection(db, 'notifications'), {
      userId: paymentData.farmerId,
      message: `${middlemanName} is satisfied with the inspection for ${paymentData.harvest.riceType} — Payment pending ₹${paymentData.finalizedPrice}`,
      seen: false,
      type: 'cash_payment_pending',
      finalizedPrice: paymentData.finalizedPrice,
      harvestDetails: paymentData.harvest,
      timestamp: Date.now()
    });

    setSnack({ open: true, message: 'Cash payment notification sent!', severity: 'info' });
    setPaymentDialogOpen(false);
  } catch (err) {
    console.error("Cash payment error:", err);
    setSnack({ open: true, message: 'Failed to notify farmer.', severity: 'error' });
  }
};








useEffect(() => {
  const middlemanId = auth.currentUser?.uid;
  if (!middlemanId) return;

  const q = query(
    collection(db, 'inspectionRequests'),
    where('middlemanId', '==', middlemanId)
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    const enriched = await Promise.all(
      snapshot.docs.map(async (docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        if (data.status === 'pending') return null;

        // Fetch harvest details
        let harvest = null;
        if (data.harvestId) {
          const harvestDoc = await getDoc(doc(db, 'harvests', data.harvestId));
          if (harvestDoc.exists()) {
            harvest = harvestDoc.data();
          }
        }

        return { ...data, harvest };
      })
    );

    setInspectionResponses(enriched.filter(Boolean));
    const unseen = enriched.filter(res =>
  res?.status === 'accepted' || res?.status === 'declined'
).length;
setUnseenInspections(unseen);

  });

  return () => unsub();
}, []);


useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, 'inventory'), where('middlemanId', '==', user.uid));

  const unsub = onSnapshot(q, (snapshot) => {
    const raw = [];
    const processed = [];

    snapshot.forEach((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };

      if (data.category === 'processed') {
        processed.push(data);
      } else if (data.category === 'raw') {
        raw.push(data);
      } else {
        // 🧠 Infer if category is missing
        if (data.harvestId) {
          raw.push(data); // likely raw from harvest
        } else {
          processed.push(data); // likely processed from mill
        }
      }
    });

    setInventory(raw);
    setProcessedInventory(processed);
  });

  return () => unsub();
}, []);





useEffect(() => {
  const q = query(collection(db, 'inspectionRequests'), where('middlemanId', '==', auth.currentUser?.uid));
  const unsub = onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
  if (change.type === 'modified') {
  const { status, inspectionStatus, harvestId } = data;

  // Show message only when farmer newly accepts the inspection
  if (status === 'accepted' && !inspectionStatus) {
    setInspectionSnack({
      open: true,
      message: `Farmer accepted your inspection request for Harvest #${harvestId}`,
      severity: 'success'
    });
  }

  // Middleman feedback for their own actions
  if (inspectionStatus === 'done') {
    setInspectionSnack({
      open: true,
      message: `You marked inspection as DONE for Harvest #${harvestId}`,
      severity: 'success'
    });
  } else if (inspectionStatus === 'not_satisfied') {
    setInspectionSnack({
      open: true,
      message: `You marked inspection as NOT SATISFIED for Harvest #${harvestId}`,
      severity: 'info'
    });
  }
}


    });
  });
  return () => unsub();
}, []);



  useEffect(() => {
    localStorage.setItem('middlemanCart', JSON.stringify(cart));
  }, [cart]);
  const fetchHarvestsWithFarmerNames = async () => {
    const snapshot = await getDocs(collection(db, 'harvests'));
    const harvestList = [];

    for (let docSnap of snapshot.docs) {
      const data = docSnap.data();
      const farmerDoc = await getDoc(doc(db, 'users', data.farmerId));
      const farmerName = farmerDoc.exists() ? farmerDoc.data().name : 'Unknown';
      harvestList.push({ id: docSnap.id, ...data, farmerName });
    }

    setHarvests(harvestList);
  };

  const addToCart = (harvest) => {
    if (!cart.find(item => item.id === harvest.id)) {
      setCart(prev => [...prev, harvest]);
      setSnack({ open: true, message: 'Added to cart', severity: 'success' });
    } else {
      setSnack({ open: true, message: 'Already in cart', severity: 'info' });
    }
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
    setSnack({ open: true, message: 'Removed from cart', severity: 'info' });
  };
  const openProposalDialog = (harvest) => {
  setSelectedHarvest(harvest);
  setProposeDialogOpen(true);
};

const removeFromInventory = async (id) => {
  try {
    await deleteDoc(doc(db, 'inventory', id)); // 🔥 must use Firestore item ID
    setSnack({ open: true, message: 'Item removed from inventory', severity: 'success' });
  } catch (err) {
    setSnack({ open: true, message: 'Failed to remove item', severity: 'error' });
  }
};



const handleRequestInspectionClick = async (proposalId) => {
  await sendInspectionRequest(null, proposalId);
  setDisabledProposalIds((prev) => [...prev, proposalId]);
};





const submitProposal = async () => {
  if (!proposedPrice || isNaN(proposedPrice)) {
    setSnack({ open: true, message: 'Enter a valid number', severity: 'warning' });
    return;
  }

  const price = parseFloat(proposedPrice);
  const askingPrice = parseFloat(selectedHarvest.askingPrice);

  if (price >= askingPrice) {
    setSnack({
      open: true,
      message: `Proposed price must be less than the asking price (₹${askingPrice})`,
      severity: 'error'
    });
    return;
  }

  setLoadingProposal(true);
  try {
    await addDoc(collection(db, 'proposals'), {
      harvestId: selectedHarvest.id,
      farmerId: selectedHarvest.farmerId,
      middlemanId: auth.currentUser.uid,
      proposedPrice: price,
      status: 'pending',
      timestamp: Date.now()
    });
    setSnack({ open: true, message: 'Proposal sent!', severity: 'success' });
  } catch (err) {
    console.error('Proposal error:', err);
    setSnack({ open: true, message: `Failed to send: ${err.message}`, severity: 'error' });
  } finally {
    setLoadingProposal(false);
    setProposeDialogOpen(false);
    setProposedPrice('');
  }
};



const clearAllProposals = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, 'proposals'), where('middlemanId', '==', user.uid));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, 'proposals', docSnap.id))
    );

    await Promise.all(deletePromises);

    setProposals([]); // clear UI
    setSnack({ open: true, message: 'All proposals cleared!', severity: 'success' });
  } catch (err) {
    console.error('Error clearing proposals:', err);
    setSnack({ open: true, message: 'Failed to clear proposals.', severity: 'error' });
  }
};

useEffect(() => {
  if (tab === 1) setUnseenProposals(0);
  if (tab === 2) setUnseenInspections(0);
}, [tab]);



const clearAllInspectionResponses = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'inspectionRequests'),
      where('middlemanId', '==', user.uid)
    );
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs
      .filter(docSnap => {
        const status = docSnap.data().status;
        return status === 'accepted' || status === 'declined';
      })
      .map(docSnap => deleteDoc(doc(db, 'inspectionRequests', docSnap.id)));

    await Promise.all(deletePromises);

    setInspectionResponses([]);
    setSnack({ open: true, message: 'All inspection responses cleared!', severity: 'success' });
  } catch (err) {
    console.error('Error clearing responses:', err);
    setSnack({ open: true, message: 'Failed to clear inspection responses.', severity: 'error' });
  }
};





const sendInspectionRequest = async (harvest = null, proposalId = null) => {
  try {
    const middlemanId = auth.currentUser?.uid;
    const harvestId = harvest?.id || proposals.find(p => p.id === proposalId)?.harvestId;
    const farmerId = harvest?.farmerId || proposals.find(p => p.id === proposalId)?.farmerId;

    if (!middlemanId || !harvestId || !farmerId) {
      setSnack({ open: true, message: 'Invalid data', severity: 'error' });
      return;
    }

    // ✅ Check for existing request
    const q = query(
      collection(db, 'inspectionRequests'),
      where('middlemanId', '==', middlemanId),
      where('farmerId', '==', farmerId),
      where('harvestId', '==', harvestId),
      where('status', '==', 'pending')
    );

    const existing = await getDocs(q);
    if (!existing.empty) {
      setSnack({ open: true, message: 'Already requested inspection for this harvest.', severity: 'info' });
      return;
    }

    // ✅ Add only if no existing request
    await addDoc(collection(db, 'inspectionRequests'), {
      harvestId,
      farmerId,
      middlemanId,
      status: 'pending',
      proposalId: proposalId || null,
      timestamp: Date.now()
    });

    setSnack({ open: true, message: 'Inspection request sent', severity: 'success' });
  } catch (err) {
    console.error('Inspection error:', err);
    setSnack({ open: true, message: 'Failed to send inspection request', severity: 'error' });
  }
};


const combinedNotifications = [
  ...proposals
    .filter(p => p.status !== 'pending')
    .map(p => ({
      ...p,
      type: 'proposal',
      title: 'Proposal Response',
      farmerName: harvests.find(h => h.id === p.harvestId)?.farmerName || 'Unknown',
      description: `Proposal for Harvest #${p.harvestId} was ${p.status}.`
    })),
  ...inspectionResponses
    .filter(res => res.status === 'accepted' || res.status === 'declined')
    .map(res => ({
      ...res,
      type: 'inspection',
      title: 'Inspection Response',
      farmerName: harvests.find(h => h.id === res.harvestId)?.farmerName || 'Unknown',
      description: `Farmer ${res.status} inspection for Harvest #${res.harvestId}.`
    }))
];




const handleSendRequest = async () => {
  if (!selectedMill || !selectedRiceType || !sendQuantity) return;

  const qtyToSend = parseFloat(sendQuantity);
  const middlemanId = auth.currentUser?.uid;
  if (!middlemanId || isNaN(qtyToSend) || qtyToSend <= 0) {
    setSnack({ open: true, message: 'Invalid request data', severity: 'error' });
    return;
  }

  const availableStock = groupedInventory[selectedRiceType] || 0;
  if (qtyToSend > availableStock) {
    setSnack({ open: true, message: 'Not enough stock available', severity: 'error' });
    return;
  }

  // ✅ Check for duplicate request
  const existing = await getDocs(query(
    collection(db, 'millProcessingRequests'),
    where('middlemanId', '==', middlemanId),
    where('millId', '==', selectedMill.managerId),
    where('riceType', '==', selectedRiceType),
    where('requestStatus', 'in', ['pending', 'accepted'])
  ));

  const sameQuantityExists = existing.docs.some(doc => {
    const existingQty = parseQuantity(doc.data().quantity);
    return existingQty === qtyToSend;
  });

  if (sameQuantityExists) {
    setSnack({ open: true, message: 'Already requested this rice type and quantity to this mill.', severity: 'info' });
    return;
  }

  // ✅ Deduct inventory using Firestore transaction BEFORE writing new request
  const matchingItems = inventory.filter(item =>
    item.riceType === selectedRiceType &&
    (item.category === 'raw' || !item.category)
  );
  let qtyToDeduct = qtyToSend;

  try {
    await runTransaction(db, async (transaction) => {
      // 🔒 Read all documents first
      const inventoryDocs = await Promise.all(
        matchingItems.map(item => transaction.get(doc(db, 'inventory', item.id)))
      );

      for (let i = 0; i < inventoryDocs.length && qtyToDeduct > 0; i++) {
        const docSnap = inventoryDocs[i];
        if (!docSnap.exists()) continue;

        const currentQty = parseQuantity(docSnap.data().quantity);
        if (isNaN(currentQty)) continue;

        const itemRef = doc(db, 'inventory', docSnap.id);

        if (currentQty <= qtyToDeduct) {
          transaction.delete(itemRef);
          qtyToDeduct -= currentQty;
        } else {
          const newQty = currentQty - qtyToDeduct;
          transaction.update(itemRef, {
            quantity: `${newQty.toFixed(2)} Kg`
          });
          qtyToDeduct = 0;
        }
      }

      // 🛡 Fail if not enough inventory
      if (qtyToDeduct > 0) {
        throw new Error('Not enough inventory in grouped items');
      }

      // 📝 Now add processing request
      const newRequestRef = doc(collection(db, 'millProcessingRequests'));
      const rateObj = selectedMill.riceRates.find(r => r.riceType === selectedRiceType);
const ratePerKg = rateObj ? parseFloat(rateObj.ratePerKg) : 0;
const processingCost = ratePerKg * qtyToSend;

transaction.set(newRequestRef, {
  millId: selectedMill.managerId,
  middlemanId,
  riceType: selectedRiceType,
  quantity: qtyToSend,
  requestStatus: 'pending',
  timestamp: Date.now(),
  harvestId: selectedInventoryItem?.harvestId || null,
  middlemanCleared: false,
  millCleared: false,
  processingCost: parseFloat(processingCost.toFixed(2))
});
    });

    // ✅ Reset form and show confirmation
    setSendDialogOpen(false);
    setSendQuantity('');
    setSelectedRiceType('');
    setSnack({ open: true, message: 'Request sent and inventory updated!', severity: 'success' });

  } catch (err) {
    console.error("❌ Transaction failed:", err.message);
    setSnack({ open: true, message: 'Failed to send request: ' + err.message, severity: 'error' });
  }
};







const groupedInventory = inventory.reduce((acc, item) => {
  const riceType = item.riceType;
  const qty = parseFloat((item.quantity + '').match(/[\d.]+/)[0]) || 0;

  if (!acc[riceType]) {
    acc[riceType] = {
      riceType,
      totalQuantity: 0,
      timestamp: null,
      items: [] // Optional: raw access to original entries
    };
  }

  acc[riceType].totalQuantity += qty;
  acc[riceType].items.push(item);

  // Update latest timestamp
  if (!acc[riceType].timestamp || item.timestamp > acc[riceType].timestamp) {
    acc[riceType].timestamp = item.timestamp;
  }

  return acc;
}, {});









useEffect(() => {
  const q = query(collection(db, 'notifications'), where('userId', '==', auth.currentUser?.uid));
  const unsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      if (!data.seen && data.type === 'processing_done') {
        setSnack({ open: true, message: data.message, severity: 'success' });
        updateDoc(change.doc.ref, { seen: true }); // Mark as seen
      }
    });
  });

  return () => unsub();
}, []);



useEffect(() => {
  const q = query(
    collection(db, 'processedRice'),
    where('middlemanId', '==', auth.currentUser?.uid),
    where('status', '==', 'pending_inventory')
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const quantity = parseQuantity(data.quantity);
      const riceType = data.riceType;

      const invQuery = query(
        collection(db, 'inventory'),
        where('middlemanId', '==', auth.currentUser.uid),
        where('riceType', '==', riceType),
        where('category', '==', 'processed')
      );
      const invSnap = await getDocs(invQuery);

      if (!invSnap.empty) {
        const invDoc = invSnap.docs[0];
        const currentQty = parseQuantity(invDoc.data().quantity);
        await updateDoc(invDoc.ref, {
          quantity: `${(currentQty + quantity).toFixed(2)} Kg`
        });
      } else {
        await addDoc(collection(db, 'inventory'), {
          middlemanId: auth.currentUser.uid,
          riceType,
          quantity: `${quantity.toFixed(2)} Kg`,
          category: 'processed',
          timestamp: Date.now(),
          harvestId: data.harvestId || null
        });
      }

      await updateDoc(doc(db, 'processedRice', docSnap.id), {
        status: 'added_to_inventory'
      });
    }
  });

  return () => unsub();
}, []);


const handleRazorpayPayment = async () => {
  const inspection = selectedPaymentInspection;
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    setSnack({ open: true, message: 'Razorpay SDK failed to load. Are you online?', severity: 'error' });
    return;
  }

  if (!inspection?.harvest?.riceType) {
    console.error("❌ Missing harvest data in inspection:", inspection);
    setSnack({ open: true, message: 'Missing harvest info. Try again.', severity: 'error' });
    return;
  }

  try {
    const res = await fetch("https://flask-razorpay-backend.onrender.com/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseInt(inspection.finalizedPrice) })
    });

    const orderData = await res.json();

    if (!orderData.order_id) {
      throw new Error("No order ID received");
    }

    // ✅ Send payment initiation notification
    const middlemanDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const middlemanName = middlemanDoc.exists() ? middlemanDoc.data().name : 'Unknown';

    await addDoc(collection(db, 'notifications'), {
      userId: inspection.harvest?.farmerId,
      message: `Payment using Razorpay initiated. ${middlemanName} is satisfied with the inspection for ${inspection.harvest.riceType} — Payment pending ₹${inspection.finalizedPrice}`,
      seen: false,
      type: 'razorpay_payment_pending',
      finalizedPrice: inspection.finalizedPrice,
      harvestDetails: inspection.harvest,
      timestamp: Date.now()
    });

    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.order_id,
      name: "Rice Deal Payment",
      description: `Payment for ${inspection.harvest?.riceType}`,
      handler: async function (response) {
        console.log("✅ Razorpay Success:", response);

        await updateDoc(doc(db, 'inspectionRequests', inspection.id), {
          paymentStatus: 'paid'
        });

        await updateDoc(doc(db, 'harvests', inspection.harvestId), {
          isSoldOut: true,
          remainingQuantity: 0,
          proposedPrice: inspection.finalizedPrice
        });

        const { soldOutAt, soldOutTimestamp } = getIndianSoldOutInfo();
        await addDoc(collection(db, 'transactions'), {
          ...inspection.harvest,
          harvestId: inspection.harvestId,
          farmerId: inspection.harvest.farmerId,
          middlemanId: auth.currentUser.uid,
          proposedPrice: inspection.finalizedPrice,
          soldOutAt,
          soldOutTimestamp,
          timestamp: soldOutTimestamp,
          paymentStatus: 'paid',
          paymentMethod: 'razorpay'
        });


   // 🧠 Fetch farmer name properly from Firestore
const farmerDoc = await getDoc(doc(db, 'users', inspection.harvest.farmerId));
const farmerName = farmerDoc.exists() ? farmerDoc.data().name : 'Farmer';

await addDoc(collection(db, 'invoices'), {
  timestamp: Date.now(),
  middlemanId: auth.currentUser.uid,
  middlemanName,
  farmerName,
  harvests: [{
    riceType: inspection.harvest.riceType,
    remainingQuantity: inspection.harvest.remainingQuantity,
    askingPrice: inspection.harvest.askingPrice,
    finalizedPrice: inspection.finalizedPrice
  }],
  paymentMethod: 'razorpay'
});



        await addDoc(collection(db, 'inventory'), {
          middlemanId: auth.currentUser.uid,
          riceType: inspection.harvest.riceType,
          quantity: `${parseQuantity(inspection.harvest.remainingQuantity).toFixed(2)} Kg`,
          harvestId: inspection.harvestId,
          category: 'raw',
          timestamp: Date.now()
        });

        // ✅ Notify farmer of successful Razorpay payment
await addDoc(collection(db, 'notifications'), {
  userId: inspection.harvest?.farmerId,
  message: `${middlemanName} paid ₹${inspection.finalizedPrice} via Razorpay for ${inspection.harvest?.riceType}`,
  seen: false,
  type: 'razorpay_payment_done',
  finalizedPrice: inspection.finalizedPrice,
  harvestDetails: inspection.harvest,
  timestamp: Date.now()
});

        setSnack({ open: true, message: 'Payment successful! Inventory updated.', severity: 'success' });
      },
      prefill: {
        name: "Middleman",
        email: "middleman@example.com"
      },
      theme: {
        color: "#2E7D32"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (error) {
    console.error("🔥 Razorpay Payment Init Error:", error);
    setSnack({ open: true, message: 'Payment initiation failed.', severity: 'error' });
  } finally {
    setPaymentDialogOpen(false);
  }
};






const handleCashOption = async (inspection) => {
  try {
    // Update inspection and harvest status
    await updateDoc(doc(db, 'inspectionRequests', inspection.id), {
      paymentStatus: 'cash_pending'
    });

    await updateDoc(doc(db, 'harvests', inspection.harvestId), {
      paymentMethod: 'cash',
      paymentStatus: 'pending'
    });

    const farmerId = inspection.harvest.farmerId;
    const middlemanDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
    const middlemanName = middlemanDoc.exists() ? middlemanDoc.data().name : 'Middleman';

    // ✅ Check if a cash_payment_pending notification already exists
    const notifQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', farmerId),
      where('type', '==', 'cash_payment_pending'),
      where('harvestDetails.id', '==', inspection.harvest.id)
    );
    const notifSnap = await getDocs(notifQuery);
    if (notifSnap.empty) {
      await addDoc(collection(db, 'notifications'), {
        userId: farmerId,
        type: 'cash_payment_pending',
        seen: false,
        harvestDetails: inspection.harvest,
        middlemanName,
        finalizedPrice: inspection.finalizedPrice,
        message: `${middlemanName} wants to pay ₹${inspection.finalizedPrice} in cash for your ${inspection.harvest.riceType}. Please confirm collection.`,
        timestamp: Date.now()
      });
    }

    setSnack({ open: true, message: 'Cash option selected. Farmer will confirm.', severity: 'info' });
  } catch (err) {
    console.error('Cash payment error:', err);
    setSnack({ open: true, message: 'Failed to process cash option.', severity: 'error' });
  } finally {
    setPaymentDialogOpen(false);
  }
};















const initiateChatWithFarmer = async (farmerId) => {
  const middlemanId = auth.currentUser?.uid;
  if (!middlemanId) return;

  const q = query(
    collection(db, 'chats'),
    where('participants', 'in', [[middlemanId, farmerId], [farmerId, middlemanId]])
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    // Chat exists, open it
    const chatId = snapshot.docs[0].id;
    setTab(8);  // Assuming tab 3 is the "Messages" tab
    setSelectedChatId(chatId);
  } else {
    // No chat exists, create new
    const docRef = await addDoc(collection(db, 'chats'), {
      participants: [middlemanId, farmerId],
      createdAt: serverTimestamp()
    });
    setTab(8);  // Messages tab
    setSelectedChatId(docRef.id);
  }
};

useEffect(() => {
  const unsub = auth.onAuthStateChanged(user => {
    if (!user) setSelectedChatId(null);
  });
  return () => unsub();
}, []);


useEffect(() => {
  return auth.onAuthStateChanged(user => {
    if (!user) {
      setProposals([]);
      setInspectionResponses([]);
      setPaymentNotifications([]);
    }
  });
}, []);



useEffect(() => {
  const middlemanId = auth.currentUser?.uid;
  if (!middlemanId) return;

  const q = query(
    collection(db, 'millProcessingRequests'),
    where('middlemanId', '==', middlemanId),
    where('paymentStatus', '==', 'cash_collected')
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    for (const docSnap of snapshot.docs) {
      const req = { id: docSnap.id, ...docSnap.data() };

      // 🔍 Check if invoice already exists
      const existing = await getDocs(query(
        collection(db, 'invoices'),
        where('middlemanId', '==', middlemanId),
        where('millId', '==', req.millId),
        where('paymentMethod', '==', 'cash'),
        where('riceType', '==', req.riceType),
        where('quantity', '==', req.quantity)
      ));
      if (!existing.empty) continue; // ✅ Already invoiced

      // ✅ Enrich with mill info if missing
      if (!req.mill || !req.mill.name) {
        const millSnap = await getDoc(doc(db, 'mills', req.millId));
        if (millSnap.exists()) {
          req.mill = millSnap.data();
        }
      }

      await addToProcessedInventory(req);
      await generateCashInvoiceAfterConfirmation(req);
    }
  });

  return () => unsub();
}, []);



useEffect(() => {
  const middlemanId = auth.currentUser?.uid;
  if (!middlemanId) return;

  const q = query(
    collection(db, 'millProcessingRequests'),
    where('middlemanId', '==', middlemanId),
    where('paymentStatus', '==', 'cash_collected')
  );

  const unsub = onSnapshot(q, async (snapshot) => {
    for (const docSnap of snapshot.docs) {
      const data = { id: docSnap.id, ...docSnap.data() };

      // 🛡 Prevent duplicate invoice generation
      const existingInvoices = await getDocs(query(
        collection(db, 'invoices'),
        where('middlemanId', '==', middlemanId),
        where('millId', '==', data.millId),
        where('riceType', '==', data.riceType),
        where('paymentMethod', '==', 'cash'),
        where('quantity', '==', data.quantity)
      ));
      if (!existingInvoices.empty) continue;

      // 👀 Enrich with mill info if not already present
      if (!data.mill || !data.mill.name) {
        const millSnap = await getDoc(doc(db, 'mills', data.millId));
        if (millSnap.exists()) {
          data.mill = millSnap.data();
        }
      }

      // ✅ Generate invoice
      await generateCashInvoiceAfterConfirmation(data);
    }
  });

  return () => unsub();
}, []);




  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
    <Container sx={{ py: 4 }}>
      {/* Centered Logo and Title */}
      <Box textAlign="center" mb={3}>
        <Box component="img" src={logo} alt="App Logo" sx={{ height: 60, mb: 1 }} />
        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={600}>
          Middleman Dashboard
        </Typography>
      </Box>
      
   <TopNavbar
  title="Middleman Dashboard"
  unseenNotifications={
  proposals.filter(p => !p.seen).length +
  inspectionResponses.filter(r => !r.seen).length +
  paymentNotifications.filter(n => !n.seen).length
}
  notifications={[
    ...combinedNotifications,
    ...paymentNotifications
  ]}
  onDeleteNotification={async (id) => {
  try {
    await deleteDoc(doc(db, 'notifications', id));
    setProposals(prev => prev.filter(p => p.id !== id));
    setInspectionResponses(prev => prev.filter(r => r.id !== id));
    setPaymentNotifications(prev => prev.filter(n => n.id !== id));
  } catch (err) {
    console.error("Delete failed:", err.message);
  }
}}

 onClearNotifications={async () => {
  try {
    const notifQuery = query(collection(db, 'notifications'), where('userId', '==', auth.currentUser.uid));
    const snapshot = await getDocs(notifQuery);
    await Promise.all(snapshot.docs.map(docSnap => deleteDoc(doc(db, 'notifications', docSnap.id))));
    setProposals([]);
    setInspectionResponses([]);
    setPaymentNotifications([]);
  } catch (err) {
    console.error("Clear all failed:", err.message);
  }
}}

/>



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
  <Tab label="Available Harvests" />
 <Tab
  label={
    <Box display="flex" alignItems="center" gap={1}>
      <span>Proposals Sent</span>
      <Badge
        badgeContent={unseenProposals > 0 ? unseenProposals : null}
        color="error"
        sx={{ "& .MuiBadge-badge": { fontSize: '0.7rem' } }}
      />
    </Box>
  }
/>

<Tab
  label={
    <Box display="flex" alignItems="center" gap={1}>
      <span>Inspection Responses</span>
      <Badge
        badgeContent={unseenInspections > 0 ? unseenInspections : null}
        color="primary"
        sx={{ "& .MuiBadge-badge": { fontSize: '0.7rem' } }}
      />
    </Box>
  }
/>

  <Tab label="Inventory" />
  <Tab label="Find Mills" />
  <Tab label="Track Processing" />
  <Tab label="Invoices" />
  <Tab label={
  <Badge badgeContent={unseenMessages} color="error">
    Messages
  </Badge>
} />

</Tabs>
 <IconButton onClick={() => setOptionDrawerOpen(true)}>
    <MoreVertIcon />
  </IconButton>
</Box>




      {/* Cart Icon */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <IconButton color="primary" onClick={() => setDrawerOpen(true)}>
          <Badge badgeContent={cart.length} color="error">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>
      </Box>

      {tab === 0 && (
        <>
        <MiddlemanLandingHero
  name={tawkDetails?.name || 'Middleman'}
  onBrowseHarvests={() => setTab(1)} // or whatever tab has harvests
/>


<MiddlemanQuickActions
  onBrowse={() => setTab(1)}
  onProposals={() => setTab(2)}
  onInspection={() => setTab(3)}
  onInventory={() => setTab(4)}
  onFindMills={() => setTab(5)}
  onProcessing={() => setTab(6)}
  onInvoices={() => setTab(7)}
/>
<ChatFeatureSection onRedirect={() => setTab(8)} name="Middleman" />

<MiddlemanDealTimeline />
<MiddlemanTipsAccordion />




        
        </>

      )}


    {tab === 1 && (
  <>
    <Container sx={{ mt: 2, mb: 4 }}>
      <Box textAlign="center" mb={2}>
        <Button variant="outlined" onClick={() => setShowHarvestMap(!showHarvestMap)}>
          {showHarvestMap ? 'Hide Nearby Harvests Map' : 'Show Nearby Harvests Map'}
        </Button>
      </Box>

      {showHarvestMap && currentLocation && (
        <Box
          sx={{
            height: { xs: 300, sm: 400, md: 500 },
            mb: 3,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
         <HarvestMapView
  currentLocation={currentLocation}
  harvests={harvests.filter((h) => {
    const dist = haversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      h.latitude,
      h.longitude
    );
    return dist <= distanceRadius;
  })}
  onSelectJourney={(h) => setJourneyDestination({ lat: h.latitude, lng: h.longitude })}
/>

        </Box>
      )}
    </Container>

    <Grid container spacing={3}>
      {/* 🔍 Filter and Sort Controls */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            variant="outlined"
            label="Search Rice Type"
            value={searchRiceType}
            onChange={(e) => setSearchRiceType(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Autocomplete
            freeSolo
            fullWidth
            options={[...new Set(harvests.map(h => h.farmLocation))]}
            value={filterLocation}
            onChange={(e, newValue) => setFilterLocation(newValue || '')}
            inputValue={filterLocation}
            onInputChange={(e, newInputValue) => setFilterLocation(newInputValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Filter by Location"
                placeholder="Type location..."
                sx={{ mr: 10 }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            variant="outlined"
            label="Sort By"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            sx={{ mr: 10 }}
          >
            <MenuItem value="">None</MenuItem>
            <MenuItem value="date_newest">Date of Harvest (Newest First)</MenuItem>
            <MenuItem value="price_low_high">Price (Low to High)</MenuItem>
            <MenuItem value="price_high_low">Price (High to Low)</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {/* 📍 Nearest Filter */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={filterNearest}
                onChange={() => setFilterNearest(prev => !prev)}
              />
            }
            label="Filter by Nearest Harvests"
          />
        </Grid>

        {filterNearest && (
          <Grid item xs={12}>
            {locationName && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                📍 Your location: {locationName}
              </Typography>
            )}
            <Typography gutterBottom>Distance Radius (km)</Typography>
            <Slider
              value={distanceRadius}
              onChange={(e, val) => setDistanceRadius(val)}
              valueLabelDisplay="on"
              min={1}
              max={200}
            />
          </Grid>
        )}
      </Grid>

      {filterNearest && isDistanceLoading && (
        <Typography
          variant="body1"
          color="textSecondary"
          textAlign="center"
          sx={{ mb: 2, width: '100%' }}
        >
          Fetching nearest harvests...
        </Typography>
      )}

      {/* 🧺 Harvest Cards */}
      {harvests
        .filter(h =>
          h.riceType.toLowerCase().includes(searchRiceType.toLowerCase()) &&
          (filterLocation === '' || h.farmLocation === filterLocation)
        )
        .filter(h => {
          if (!filterNearest) return true;
          if (currentLocation && h.latitude && h.longitude) {
            const dist = haversineDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              h.latitude,
              h.longitude
            );
            h.distanceFromUser = dist.toFixed(2);
            return dist <= distanceRadius;
          }
          return false;
        })
        .sort((a, b) => {
          if (sortOption === 'date_newest') {
            return new Date(b.dateOfHarvest) - new Date(a.dateOfHarvest);
          } else if (sortOption === 'price_low_high') {
            return parseFloat(a.askingPrice) - parseFloat(b.askingPrice);
          } else if (sortOption === 'price_high_low') {
            return parseFloat(b.askingPrice) - parseFloat(a.askingPrice);
          }
          return 0;
        })
        .map((harvest) => (
          <Grid item xs={12} sm={6} md={4} key={harvest.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <HarvestImageCarousel images={harvest.images || []} />
              <CardContent sx={{ flexGrow: 1 }}>
                {harvest.isSoldOut && (
                  <Typography color="error" fontWeight={700}>
                    SOLD OUT
                  </Typography>
                )}
                <Typography variant="h6">{harvest.riceType}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Quantity: {harvest.totalQuantity} {harvest.quantityUnit}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Remaining: {harvest.remainingQuantity} {harvest.quantityUnit}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Location: {harvest.farmLocation}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Harvest Date: {harvest.dateOfHarvest}
                </Typography>
                {harvest.distanceFromUser && (
                  <Typography variant="body2" color="textSecondary">
                    Distance: {harvest.distanceFromUser} km
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Farmer:</strong> {harvest.farmerName}
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  <strong>{harvest.askingPrice} /-</strong>
                </Typography>
              </CardContent>
              <CardActions>
                <Tooltip title="View Farmer Profile" arrow>
                  <IconButton
                    onClick={() => handleViewFarmer(harvest.farmerId)}
                    color="primary"
                    size="small"
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      ml: 1,
                      mt: 1
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Button onClick={() => initiateChatWithFarmer(harvest.farmerId)}>
                  Message Farmer
                </Button>

                <Button
                  fullWidth
                  variant="contained"
                  disabled={harvest.isSoldOut}
                  onClick={() => addToCart(harvest)}
                >
                  {harvest.isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
    </Grid>
  </>
)}


      {tab === 2 && (
  <Box>
     {proposals.length > 0 && (
      <Button
        variant="outlined"
        color="error"
        onClick={clearAllProposals}
        sx={{ mb: 2 }}
      >
        Clear All Proposals
      </Button>
    )}
    {proposals.length === 0 ? (
      <Typography>No proposals sent yet.</Typography>
    ) : (
      proposals.map((p) => (
        <Card key={p.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography><strong>Harvest ID:</strong> {p.harvestId}</Typography>
            <Typography><strong>Proposed Price:</strong> ₹{p.proposedPrice}</Typography>
            <Typography display="flex" alignItems="center" gap={1}>
              <strong>Status:</strong>
              {p.status === 'accepted' && (
                <>
                  <CheckCircleIcon sx={{ color: 'green' }} />
                  <span style={{ color: 'green' }}>Accepted</span>
                </>
              )}
              {p.status === 'declined' && (
                <>
                  <CancelIcon sx={{ color: 'red' }} />
                  <span style={{ color: 'red' }}>Declined</span>
                </>
              )}
              {p.status === 'pending' && (
                <>
                  <HourglassEmptyIcon sx={{ color: 'orange' }} />
                  <span style={{ color: 'orange' }}>Pending</span>
                </>
              )}
            </Typography>
           {p.status === 'accepted' && (
  <Button
    variant="contained"
    sx={{ mt: 1 }}
    onClick={() => handleRequestInspectionClick(p.id)}
    disabled={disabledProposalIds.includes(p.id)}
  >
    {disabledProposalIds.includes(p.id) ? 'Requested' : 'Request Inspection'}
  </Button>
)}

          </CardContent>
        </Card>
      ))
    )}
  </Box>
)}

{tab === 3 && (
  <Box>
    {inspectionResponses.length > 0 && (
      <Button
        variant="outlined"
        color="error"
        onClick={clearAllInspectionResponses}
        sx={{ mb: 2 }}
      >
        Clear All Inspection Responses
      </Button>
    )}
    {inspectionResponses.length === 0 ? (
      <Typography>No inspection responses yet.</Typography>
    ) : (
      inspectionResponses.map((res) => (
  <Card key={res.id} sx={{ mb: 2 }}>
    <CardContent>
      <Typography><strong>Harvest ID:</strong> {res.harvestId}</Typography>

      {res.harvest && (
        <>
          <Typography><strong>Rice Type:</strong> {res.harvest.riceType}</Typography>
          <Typography><strong>Quantity:</strong> {res.harvest.totalQuantity} {res.harvest.quantityUnit}</Typography>
          <Typography>
            <strong>Location:</strong> {res.harvest.farmLocation}
            {res.harvest.farmLocation && (
              <Button
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(res.harvest.farmLocation)}`}
                target="_blank"
                rel="noopener"
              >
                View on Map
              </Button>
            )}
          </Typography>
          <Typography><strong>Harvest Date:</strong> {res.harvest.dateOfHarvest}</Typography>
        </>
      )}

      <Typography>
        <strong>Status:</strong>{" "}
        <span style={{ color: res.status === 'accepted' ? 'green' : 'red' }}>
          {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
        </span>
      </Typography>

      {/* ✅ Final inspection status */}
      {res.inspectionStatus && (
        <Typography sx={{ mt: 1 }}>
          <strong>Final Status:</strong>{' '}
          <span style={{ color: res.inspectionStatus === 'done' ? 'green' : 'red' }}>
            {res.inspectionStatus === 'done' ? 'Inspection Complete' : 'Not Satisfied – Deal Closed'}
          </span>
        </Typography>
      )}

      {/* ✅ Finalized price shown after inspection marked "done" */}
      {res.inspectionStatus === 'done' && res.finalizedPrice && (
        <Typography sx={{ mt: 1 }}>
          <strong>Finalized Price:</strong> ₹{res.finalizedPrice}
        </Typography>
      )}

      <Chip
  label={
    res.paymentStatus === 'paid'
      ? 'Payment Successful'
      : 'Payment Pending'
  }
  color={res.paymentStatus === 'paid' ? 'success' : 'warning'}
  variant="outlined"
  sx={{ mt: 1 }}
/>


      {/* ✅ Show payment pending if inspection is done */}
      {res.paymentStatus === 'pending' && (
  <Box mt={2}>
    <Typography color="warning.main" gutterBottom>
      💸 Payment Pending — Amount: ₹{res.finalizedPrice}
    </Typography>
<Button
  variant="contained"
  color="success"
  onClick={() => {
    setSelectedPaymentInspection(res);
    setTimeout(() => setPaymentDialogOpen(true), 100); // small delay to ensure state is set
  }}
>
  Pay Now
</Button>


  </Box>
)}


      {/* ✅ Show inspection action buttons if accepted and not finalized */}
      {res.status === 'accepted' && !res.inspectionStatus && (
        <Box mt={2} display="flex" gap={1}>
          <Button
            variant="contained"
            color="success"
            onClick={() => finalizeInspection(res.id, 'done')}
            disabled={finalizing}
          >
            Inspection Done (Satisfied)
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => finalizeInspection(res.id, 'not_satisfied')}
            disabled={finalizing}
          >
            Not Satisfied – Close Deal
          </Button>
        </Box>
      )}
    </CardContent>
  </Card>
))


    )}
  </Box>
)}


{tab === 4 && (
  <Box>
    {/* 📦 Inventory Summary Section */}
    <Box
      sx={{
        my: 4,
        py: 3,
        px: { xs: 2, sm: 3 },
        bgcolor: 'grey.100',
        borderRadius: 3,
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        📦 Inventory Insights
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {Object.entries(riceSummary).map(([key, total], idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 1.5,
                borderRadius: 3,
                boxShadow: 2,
                bgcolor: 'white',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.02)' },
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                <RiceBowlIcon />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {key}
                </Typography>
                <Chip
                  label={`Total: ${total.toFixed(2)}`}
                  color="primary"
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>

    {/* 🌾 Raw Inventory Section */}
    <Box mb={5}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        🌾 Raw Inventory
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {inventory.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          No inventory items yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {Object.values(groupedInventory).map((item) => (
  <Grid item xs={12} sm={6} md={4} key={item.riceType}>
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 3,
        boxShadow: 3,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.02)' },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight={700} color="primary">
            {item.riceType}
          </Typography>
          <img
            src="https://i.postimg.cc/mDLWrYtP/pngtree-wheat-rice-icon-barley-vector-png-image-4991947-Photoroom.png"
            alt="Rice icon"
            width={56}
            height={56}
            style={{ borderRadius: 8 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          <strong>Total Quantity:</strong> {item.totalQuantity.toFixed(2)} Kg
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Latest Added:</strong>{' '}
          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
        </Typography>
      </CardContent>

      <Box display="flex" justifyContent="flex-end" alignItems="center" p={2}>
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<DeleteIcon />}
          onClick={() =>
            inventory
              .filter(inv => inv.riceType === item.riceType)
              .forEach(inv => removeFromInventory(inv.id))
          }
        >
          Delete All
        </Button>
      </Box>
    </Card>
  </Grid>
))}

        </Grid>
      )}
    </Box>

    {/* 🍚 Processed Items Section */}
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        🍚 Processed Inventory
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {processedInventory.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          No processed items available yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {processedInventory.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 3,
                  boxShadow: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={700} color="secondary">
                      {item.riceType}
                    </Typography>
                    <img
                      src="https://i.postimg.cc/VNyy7yN7/images-Photoroom.png"
                      alt="Processed rice icon"
                      width={48}
                      height={48}
                      style={{ borderRadius: 8 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Quantity:</strong> {item.quantity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Processed On:</strong>{' '}
                    {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  </Box>
)}




{tab === 5 && (
  <Box>
    <Typography variant="h6" gutterBottom>
      Available Mills
    </Typography>
   <Box sx={{ my: 3 }}>
  <FormControlLabel
    control={
      <Switch
        checked={filterNearest}
        onChange={(e) => setFilterNearest(e.target.checked)}
      />
    }
    label="Show Nearby Mills on Map"
  />
</Box>

{filterNearest && (
  <>
    {/* Radius control */}
    <Box sx={{ maxWidth: 300, mb: 2 }}>
      <Typography gutterBottom>Distance Radius: {distanceRadius} km</Typography>
      <Slider
        value={distanceRadius}
        onChange={(e, val) => setDistanceRadius(val)}
        step={5}
        min={5}
        max={200}
        valueLabelDisplay="auto"
      />
    </Box>

    {/* 🌍 Mobile-Friendly Map View */}
    {currentLocation && showMap && (
      <Box
        component={Paper}
        elevation={3}
        sx={{
          position: 'relative',
          height: isMobile ? '60vh' : { xs: 400, md: 500 },
          p: { xs: 0, sm: 2 },
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3
        }}
      >


       {/* ✖️ Close button */}
        {isMobile && (
          <IconButton
            size="small"
            onClick={() => setShowMap(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 999,
              backgroundColor: 'rgba(255,255,255,0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,1)',
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}



        
        <MillMapView
          currentLocation={currentLocation}
          mills={allMills.filter((m) => {
            const dist = haversineDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              m.latitude,
              m.longitude
            );
            return dist <= distanceRadius;
          })}
        />
      </Box>
    )}

     {/* 🔄 Show Map Again if Closed */}
    {!showMap && (
      <Box textAlign="center" mb={3}>
        <Button variant="outlined" onClick={() => setShowMap(true)}>
          Show Nearby Mills Map
        </Button>
      </Box>
    )}

  </>
)}





    {/* Filters */}
    <Box mb={3}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Search by Rice Type"
            value={filterRiceType}
            onChange={(e) => setFilterRiceType(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Autocomplete
            freeSolo
            fullWidth
            options={[...new Set(allMills.map(m => m.location))]}
            value={filterMillLocation}
            onChange={(e, newVal) => setFilterMillLocation(newVal || '')}
            inputValue={filterMillLocation}
            onInputChange={(e, newVal) => setFilterMillLocation(newVal)}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Location" />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Typography variant="body2" gutterBottom>
            Filter by Capacity (Kg)
          </Typography>
          <Slider
            value={capacityRange}
            onChange={(e, val) => setCapacityRange(val)}
            min={0}
            max={20000}
            step={500}
            valueLabelDisplay="auto"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={filterNearestMills}
                onChange={(e) => setFilterNearestMills(e.target.checked)}
              />
            }
            label="Filter by Nearest Mills"
          />
        </Grid>

        {locationName && (
          <Grid item xs={12}>
            <Typography variant="body2" color="textSecondary">
              📍 Your location: {locationName}
            </Typography>
          </Grid>
        )}

        {filterNearestMills && (
          <Grid item xs={12}>
            <Typography gutterBottom>Distance Radius (km)</Typography>
            <Slider
              value={distanceRadius}
              onChange={(e, val) => setDistanceRadius(val)}
              valueLabelDisplay="on"
              min={1}
              max={200}
            />
          </Grid>
        )}
      </Grid>
    </Box>

    {/* Mills List */}
    <Grid container spacing={3}>
      {allMills
        .filter(mill => {
          const matchRiceType = !filterRiceType || mill.acceptedRiceTypes?.some(type =>
            type.toLowerCase().includes(filterRiceType.toLowerCase())
          );
          const matchLocation = !filterMillLocation || mill.location === filterMillLocation;
          const matchCapacity = mill.capacity >= capacityRange[0] && mill.capacity <= capacityRange[1];
          const withinDistance = !filterNearestMills || (
            userCoords &&
            calculateDistance(userCoords.lat, userCoords.lon, mill.latitude, mill.longitude) <= distanceRadius
          );

          return matchRiceType && matchLocation && matchCapacity && withinDistance;
        })
        .sort((a, b) => {
          if (!filterNearestMills || !userCoords) return 0;
          const distA = calculateDistance(userCoords.lat, userCoords.lon, a.latitude, a.longitude);
          const distB = calculateDistance(userCoords.lat, userCoords.lon, b.latitude, b.longitude);
          return distA - distB;
        })
        .map((mill) => (
          <Grid item xs={12} sm={6} md={4} key={mill.id}>
            <Box mb={2}>
            <Card sx={{ p: 2, borderRadius: 3, boxShadow: 2, height: '100%', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                {mill.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Capacity: {mill.capacity} Kg/day
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Engaged: {mill.engagedCapacity || 0} Kg
              </Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
  <strong>Rice Rates:</strong>
</Typography>
{mill.riceRates?.length > 0 ? (
  <ul style={{ paddingLeft: 20 }}>
    {mill.riceRates.map((rate, idx) => (
      <li key={idx}>
        {rate.riceType} — ₹{rate.ratePerKg}/Kg
      </li>
    ))}
  </ul>
) : (
  <Typography variant="body2" color="text.secondary">
    No rice rates defined
  </Typography>
)}

              <Typography variant="body2" color="text.secondary">
                Location: {mill.location}
                <Button
                  size="small"
                  variant="text"
                  href={`https://maps.google.com/?q=${encodeURIComponent(mill.location)}`}
                  target="_blank"
                  sx={{ ml: 1 }}
                >
                  View Map
                </Button>
              </Typography>
              {userCoords && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Distance: {calculateDistance(userCoords.lat, userCoords.lon, mill.latitude, mill.longitude).toFixed(2)} km
                </Typography>
              )}
             <Button
  variant="contained"
  size="small"
  sx={{ mt: 2 }}
  onClick={() => {
    setSelectedMill(mill);
    setSendDialogOpen(true);
    setSelectedInventoryItem(null);   // ✅ Reset
    setSelectedRiceType('');
  }}
>
  Send Request
</Button>

            </Card>
            </Box>
          </Grid>
        ))}
    </Grid>
  </Box>
)}

<Dialog open={sendDialogOpen} onClose={() => setSendDialogOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>Send to {selectedMill?.name}</DialogTitle>
  <DialogContent>
    <Typography>Select Rice from Inventory:</Typography>

    <Autocomplete
      options={[...new Set(inventory.map(item => item.riceType))]}
      getOptionLabel={(option) => option}
      value={selectedRiceType}
      onChange={(e, value) => {
        setSelectedRiceType(value);
        const matchedItem = inventory.find(item => item.riceType === value);
        setSelectedInventoryItem(matchedItem || null);
        updateProcessingCost(value, sendQuantity);

        // ✅ Check if the selected mill accepts this rice type
        if (value && !isRiceTypeAcceptedByMill(selectedMill, value)) {
          setSnack({
            open: true,
            message: `${selectedMill?.name || 'This mill'} does not accept ${value} rice type.`,
            severity: 'warning',
          });
        }
      }}
      renderOption={(props, option) => {
        const isDisabled = !isRiceTypeAcceptedByMill(selectedMill, option);
        return (
          <li {...props} style={{ color: isDisabled ? 'gray' : 'inherit' }}>
            {option} {isDisabled ? '(Not accepted)' : ''}
          </li>
        );
      }}
      isOptionEqualToValue={(option, value) => option === value}
      renderInput={(params) => (
        <TextField {...params} label="Rice Type" margin="normal" />
      )}
    />

    {selectedRiceType && (
      <Typography variant="body2" sx={{ mt: 1 }}>
        Available: {(groupedInventory[selectedRiceType]?.totalQuantity || 0).toFixed(2)} Kg
      </Typography>
    )}

    <TextField
      fullWidth
      label="Quantity to Send"
      type="number"
      value={sendQuantity}
      onChange={(e) => {
        setSendQuantity(e.target.value);
        updateProcessingCost(selectedRiceType, e.target.value);
      }}
      margin="normal"
    />

    {calculatedCost > 0 && (
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        💰 Estimated Processing Cost: ₹{calculatedCost}
      </Typography>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setSendDialogOpen(false)}>Cancel</Button>
    <Button
      variant="contained"
      onClick={handleSendRequest}
      disabled={
        !selectedRiceType ||
        !sendQuantity ||
        !isRiceTypeAcceptedByMill(selectedMill, selectedRiceType)
      }
    >
      Send Request
    </Button>
  </DialogActions>
</Dialog>






{tab === 6 && (
  <Box>
    <Button
  variant="outlined"
  color="error"
  onClick={async () => {
    const q = query(
      collection(db, 'millProcessingRequests'),
      where('middlemanId', '==', auth.currentUser.uid),
      where('middlemanCleared', '!=', true)
    );
    const snapshot = await getDocs(q);

    await Promise.all(snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();

      // Only clear if NOT declined or if already restored
      if (data.requestStatus !== 'declined' || data.restored === true) {
        await updateDoc(doc(db, 'millProcessingRequests', docSnap.id), {
          middlemanCleared: true
        });
      }
    }));

    setSnack({
      open: true,
      message: 'Tracking history cleared! Declined-unrestored requests were skipped.',
      severity: 'success'
    });
  }}
  sx={{ mb: 2 }}
>
  Clear Tracked Requests
</Button>


    <Typography variant="h6" gutterBottom>Track Processing Requests</Typography>
    <Grid container spacing={2}>
      {processingRequests.length === 0 ? (
  <Grid item xs={12}>
    <Typography>No processing requests found.</Typography>
  </Grid>
) : (
  processingRequests.map((req) => (
    <Grid item xs={12} sm={6} md={4} key={req.id}>
      <Card
        sx={{
          p: 2,
          borderLeft: 5,
          borderColor:
            req.processingStatus === 'done'
              ? 'blue'
              : req.requestStatus === 'accepted'
              ? 'green'
              : req.requestStatus === 'pending'
              ? 'orange'
              : 'red',
        }}
      >
        <Typography><strong>Mill:</strong> {req.mill?.name || 'Unknown'}</Typography>
        <Typography><strong>Location:</strong> {req.mill?.location || 'N/A'}</Typography>
        <Typography><strong>Rice Type:</strong> {req.riceType}</Typography>
        <Typography><strong>Quantity:</strong> {req.quantity} Kg</Typography>

        <Box mt={1}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>Status:</Typography>

          <Chip
            label={
              req.processingStatus === 'done'
                ? 'Processing Complete'
                : req.processingStatus === 'under_process'
                ? 'Processing Started'
                : req.processingStatus === 'pending_lot'
                ? 'Processing Soon'
                : req.requestStatus
            }
            color={
              req.processingStatus === 'done'
                ? 'primary'
                : req.processingStatus === 'under_process'
                ? 'success'
                : req.processingStatus === 'pending_lot'
                ? 'warning'
                : req.requestStatus === 'declined'
                ? 'error'
                : 'default'
            }
            sx={{ mr: 1 }}
          />

          <Chip
            label={req.requestStatus?.toUpperCase()}
            color={
              req.requestStatus === 'accepted'
                ? 'success'
                : req.requestStatus === 'pending'
                ? 'warning'
                : 'error'
            }
          />

          {/* ✅ Add to Inventory Button */}
          {req.processingStatus === 'done' && (
  <>
    <Typography sx={{ mt: 1 }}>
      ✅ Processing Complete
    </Typography>

    {req.paymentStatus !== 'cash_collected' && req.paymentStatus !== 'razorpay_done' ? (
      <>
        <Typography sx={{ mt: 1 }}>
          ⚠️ Payment Pending: ₹{req.processingCost}
        </Typography>
        <Button
  variant="outlined"
  color="warning"
  sx={{ mt: 1, mr: 1 }}
  onClick={() => handleMillCashPayment(req)}
>
  Pay in Cash
</Button>
<Button
  variant="contained"
  color="primary"
  sx={{ mt: 1 }}
  onClick={() => handleMillRazorpayPayment(req)}
>
  Pay with Razorpay
</Button>
      </>
    ) : (
      <>
        <Typography sx={{ mt: 1 }}>✅ Payment Complete</Typography>
        <Button
          variant="contained"
          color="success"
          size="small"
          sx={{ mt: 2 }}
          onClick={() => addToProcessedInventory(req)}
          disabled={req.inventoryAdded}
        >
          {req.inventoryAdded ? 'Added' : 'Add to Inventory'}
        </Button>
      </>
    )}
  </>
)}

        </Box>
      </Card>
    </Grid>
  ))
)}

    </Grid>
  </Box>
)}


{tab === 7 && (
  <Box mt={3} px={{ xs: 1, sm: 3 }}>
    <Typography variant="h5" gutterBottom>My Invoices</Typography>

    {/* Filter Controls */}
    <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3}>
    
  <FormControl sx={{ minWidth: 180 }}>
    <InputLabel>Invoice Type</InputLabel>
    <Select
      label="Invoice Type"
      value={invoiceTypeFilter}
      onChange={(e) => setInvoiceTypeFilter(e.target.value)}
    >
      <MenuItem value="all">All</MenuItem>
      <MenuItem value="mill">Mill Processing</MenuItem>
      <MenuItem value="farmer">Farmer Purchases</MenuItem>
    </Select>
  </FormControl>


      <FormControl sx={{ minWidth: 180 }}>
        <InputLabel>Filter</InputLabel>
        <Select
          value={invoiceFilter}
          label="Filter"
          onChange={(e) => setInvoiceFilter(e.target.value)}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="today">Today</MenuItem>
          <MenuItem value="week">This Week</MenuItem>
          <MenuItem value="month">This Month</MenuItem>
          <MenuItem value="year">This Year (by Month)</MenuItem>
          <MenuItem value="date">Specific Date</MenuItem>
        </Select>
      </FormControl>

      {invoiceFilter === 'date' && (
        <DatePicker
          label="Pick a Date"
          value={specificDate}
          onChange={(newDate) => setSpecificDate(newDate)}
          renderInput={(params) => <TextField {...params} />}
        />
      )}
    </Box>

    {/* Filtered & Grouped Invoices */}
    {filteredInvoices.length === 0 ? (
      <Typography color="text.secondary">No invoices match the selected filter.</Typography>
    ) : invoiceFilter === 'year' ? (
      Object.entries(groupedByMonth).map(([month, items]) => (
        <Box key={month} mb={4}>
          <Typography variant="h6" gutterBottom>{month}</Typography>
          <Grid container spacing={2}>
            {items.map(renderInvoiceCard)}
          </Grid>
        </Box>
      ))
    ) : (
      <Grid container spacing={2}>
        {filteredInvoices.map(renderInvoiceCard)}
      </Grid>
    )}
  </Box>
)}




{tab === 8 && (
  <Box sx={{ p: 2 }}>
    {!selectedChatId ? (
      <Paper elevation={3} sx={{ p: 2, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom>Messages</Typography>

        {chats.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No chats yet. Message a farmer from a harvest card to begin.
          </Typography>
        ) : (
          chats.map(chat => {
            const otherId = chat.participants.find(p => p !== auth.currentUser?.uid);
            return (
              <Box
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                sx={{
                  p: 2,
                  my: 1,
                  borderRadius: 2,
                  cursor: 'pointer',
                  backgroundColor: '#f5f5f5',
                  '&:hover': {
                    backgroundColor: '#e0e0e0'
                  },
                  transition: '0.2s ease'
                }}
              >
             <ListItem button onClick={() => setSelectedChatId(chat.id)}>
  <Avatar src={chat.otherUserProfile}>
    {!chat.otherUserProfile && chat.otherUserName?.[0]}
  </Avatar>
  <ListItemText
    primary={
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <span>{chat.otherUserName}</span>
        {chat.newMessages > 0 && (
          <Badge badgeContent={chat.newMessages} color="error" />
        )}
      </Box>
    }
  />
</ListItem>

              </Box>
            );
          })
        )}
      </Paper>
    ) : (
      <Box>
        <ChatBox chatId={selectedChatId} />
        <Box textAlign="center" mt={2}>
          <Button
            variant="outlined"
            onClick={() => setSelectedChatId(null)}
            sx={{ mt: 1 }}
          >
            Back to Messages
          </Button>
        </Box>
      </Box>
    )}
  </Box>
)}










      {/* Cart Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
  <Box width={300} p={2}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
      <Typography variant="h6">Your Cart</Typography>
      <IconButton onClick={() => setDrawerOpen(false)}>
        <CloseIcon />
      </IconButton>
    </Box>
   <List>
  {cart.map(item => {
    const isSoldOut = item.isSoldOut || item.remainingQuantity <= 0;
    return (
      <ListItem
        key={item.id}
        alignItems="flex-start"
        sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {item.riceType}
          </Typography>
          <IconButton edge="end" color="error" onClick={() => removeFromCart(item.id)} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          Qty: {item.totalQuantity} {item.quantityUnit}
        </Typography>
{(item.isSoldOut || item.remainingQuantity <= 0) && (
  <Typography color="error" fontWeight={600} gutterBottom>
    SOLD OUT
  </Typography>
)}

        <Box display="flex" flexDirection="column" gap={1}>
  <Button
    size="small"
    variant="outlined"
    fullWidth
    onClick={() => openProposalDialog(item)}
    disabled={item.isSoldOut || item.remainingQuantity <= 0}
  >
    Propose Price
  </Button>
  <Button
    size="small"
    variant="contained"
    fullWidth
    color="success"
    onClick={() => sendInspectionRequest(item, null)}
    disabled={item.isSoldOut || item.remainingQuantity <= 0}
  >
    Accept Asking Price & Inspect
  </Button>
</Box>

      </ListItem>
    );
  })}

  {cart.length === 0 && (
    <Typography variant="body2" color="textSecondary" mt={2} textAlign="center">
      No items in cart.
    </Typography>
  )}
</List>

  </Box>
</Drawer>


      {/* Feedback Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>
          {snack.message}
        </Alert>
      </Snackbar>
      <Dialog open={proposeDialogOpen} onClose={() => setProposeDialogOpen(false)}>
  <DialogTitle>Propose Price</DialogTitle>
  <DialogContent>
   <TextField
  autoFocus
  margin="dense"
  label="Proposed Price"
  fullWidth
  variant="outlined"
  value={proposedPrice}
  onChange={(e) => setProposedPrice(e.target.value)}
  error={parseFloat(proposedPrice) >= parseFloat(selectedHarvest?.askingPrice)}
  helperText={
    parseFloat(proposedPrice) >= parseFloat(selectedHarvest?.askingPrice)
      ? `Must be less than ₹${selectedHarvest?.askingPrice}`
      : ''
  }
/>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setProposeDialogOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={submitProposal} disabled={loadingProposal}>
      {loadingProposal ? <CircularProgress size={24} /> : 'Submit'}
    </Button>
  </DialogActions>
</Dialog>
<Snackbar
  open={inspectionSnack.open}
  autoHideDuration={4000}
  onClose={() => setInspectionSnack(prev => ({ ...prev, open: false }))}
>
  <Alert severity={inspectionSnack.severity} onClose={() => setInspectionSnack(prev => ({ ...prev, open: false }))}>
    {inspectionSnack.message}
  </Alert>
</Snackbar>


<Dialog
  open={openFarmerDialog}
  onClose={() => setOpenFarmerDialog(false)}
  fullWidth
  maxWidth="sm"
  PaperProps={{ sx: { borderRadius: 3 } }}
>

  <DialogTitle>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">Farmer Profile</Typography>
      <IconButton onClick={() => setOpenFarmerDialog(false)}>
        <CloseIcon />
      </IconButton>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
  {selectedFarmer ? (
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} sm={4} textAlign="center">
        <Box
          component="img"
          src={selectedFarmer.profileImage || '/no-img.jpg'}
          alt="Farmer Profile"
          sx={{
            width: { xs: 100, sm: 120 },
            height: { xs: 100, sm: 120 },
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: 3
          }}
        />
      </Grid>

      <Grid item xs={12} sm={8}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {selectedFarmer.name}
        </Typography>

        <Box mb={1}>
          <Typography variant="body2" color="text.secondary">📅 Date of Birth</Typography>
          <Typography variant="body1">{selectedFarmer.dob}</Typography>
        </Box>

        <Box mb={1}>
          <Typography variant="body2" color="text.secondary">✉️ Email</Typography>
          <Typography variant="body1">{selectedFarmer.email}</Typography>
        </Box>

        {selectedFarmer.phone && (
          <Box mb={1}>
            <Typography variant="body2" color="text.secondary">📞 Phone</Typography>
            <Typography variant="body1">{selectedFarmer.phone}</Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  ) : (
    <Box display="flex" justifyContent="center" alignItems="center" py={4}>
      <CircularProgress />
    </Box>
  )}
</DialogContent>
</Dialog>




<Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
  <DialogTitle>Complete Payment</DialogTitle>
  <DialogContent>
    <Typography variant="subtitle1"><strong>Harvest:</strong> {selectedPaymentInspection?.harvest?.riceType}</Typography>
    <Typography variant="subtitle1"><strong>Amount:</strong> ₹{selectedPaymentInspection?.finalizedPrice}</Typography>
    <Box mt={2} display="flex" justifyContent="space-between">
      <Button variant="outlined" onClick={handleCashPayment}>Pay in Cash</Button>
      <Button variant="contained" onClick={handleRazorpayPayment}>Pay with Razorpay</Button>
    </Box>
  </DialogContent>
</Dialog>

<Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
  <DialogTitle>Confirm Deletion</DialogTitle>
  <DialogContent>
    <Typography>Are you sure you want to delete this invoice?</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
      Cancel
    </Button>
    <Button onClick={handleConfirmedDelete} color="error" variant="contained">
      Delete
    </Button>
  </DialogActions>
</Dialog>



{tawkDetails && (
  <TawkMessenger
    name={tawkDetails.name}
    email={tawkDetails.email}
    phone={tawkDetails.phone}
    role={tawkDetails.role}
  />
)}


<Drawer anchor="right" open={optiondrawerOpen} onClose={() => setOptionDrawerOpen(false)}>
  <Box sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}>
    
    {/* Header */}
    <Box sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {tawkDetails?.name || 'Middleman'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {tawkDetails?.email || 'email@example.com'}
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
              setOptionDrawerOpen(false);
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


{journeyDestination && (
  <JourneyMap
    destination={journeyDestination}
    onStop={() => setJourneyDestination(null)}
  />
)}


    </Container>
    </LocalizationProvider>
  );
}
