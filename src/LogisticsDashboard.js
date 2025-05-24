import React, { useEffect, useState , res, useRef} from 'react';
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, onSnapshot, query, where, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Container, Typography, Box, Tabs, Tab, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import TopNavbar from './TopNavbar';
import logo from './assets/shipconnect_logo.png';

export default function LogisticsDashboard() {
  const [tab, setTab] = React.useState(0);


  const [shippingPage, setShippingPage] = useState(1);
const shippingItemsPerPage = 3;


  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };
  const [logisticsRequests, setLogisticsRequests] = useState([]);


  useEffect(() => {
  const unsub = onSnapshot(collection(db, 'logisticsRequests'), (snap) => {
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setLogisticsRequests(list);
  });

  return () => unsub();
}, []);


const updateLogisticsStatus = async (id, newStatus) => {
  try {
    await updateDoc(doc(db, 'logisticsRequests', id), {
      status: newStatus
    });
  } catch (err) {
    console.error('Failed to update logistics status:', err.message);
  }
};



const markAsPickedUp = async (id) => {
  try {
    await updateDoc(doc(db, 'logisticsRequests', id), {
      pickedUp: true
    });
  } catch (err) {
    console.error('❌ Failed to mark as picked up:', err.message);
  }
};
const markAsInTransit = async (id) => {
  try {
    await updateDoc(doc(db, 'logisticsRequests', id), {
      inTransit: true
    });
  } catch (err) {
    console.error('❌ Failed to mark as in transit:', err.message);
  }
};

const markAsDelivered = async (id) => {
  try {
    const reqRef = doc(db, 'logisticsRequests', id);
    const reqSnap = await getDoc(reqRef);
    const req = reqSnap.data();

    await updateDoc(reqRef, { delivered: true });

    // 🔔 Notify Mill
    await addDoc(collection(db, 'notifications'), {
      userId: req.millId,
      type: 'logistics_delivered',
      message: `A shipment of ${req.riceType} (${req.quantity} Kg) has been delivered. Please confirm.`,
      seen: false,
      timestamp: Date.now()
    });

    console.log("✅ Delivery marked and mill notified.");
  } catch (err) {
    console.error('❌ Failed to mark as delivered or notify mill:', err.message);
  }
};




  return (
    <Container sx={{ py: 4 }}>
      <Box textAlign="center" mb={3}>
        <Box component="img" src={logo} alt="App Logo" sx={{ height: 60, mb: 1 }} />
      </Box>

      <TopNavbar title="Logistics Dashboard" />

      <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Home" />
          <Tab label="Shipping Requests" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Typography variant="h6" align="center">Welcome to ShipConnect Logistics Dashboard</Typography>
      )}

      {tab === 1 && (
  <Box mt={2}>
    <Typography variant="h6" gutterBottom>Shipping Requests</Typography>
   <Grid container spacing={2}>
      {(() => {
        const sorted = [...logisticsRequests].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const totalPages = Math.ceil(sorted.length / shippingItemsPerPage);
        const paginated = sorted.slice(
          (shippingPage - 1) * shippingItemsPerPage,
          shippingPage * shippingItemsPerPage
        );

        return (
          <>
            {paginated.map((req) => (

        <Grid item xs={12} sm={6} md={4} key={req.id}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1">{req.riceType} — {req.quantity} Kg</Typography>
              <Typography variant="body2">From: {req.middlemanName}</Typography>
              <Typography variant="body2">Mill: {req.millName} ({req.millLocation})</Typography>
              <Typography variant="body2">Pickup: {req.pickupLocation}</Typography>
              <Typography variant="body2">Date: {new Date(req.pickupDate).toLocaleDateString()}</Typography>
              <Typography variant="body2">Time: {req.pickupTime}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">Requested by: {req.requester}</Typography>
              {req.status === 'pending' && (
  <Box display="flex" gap={1} mt={1}>
    <Button
      size="small"
      variant="contained"
      color="success"
      onClick={() => updateLogisticsStatus(req.id, 'accepted')}
    >
      Accept
    </Button>
    <Button
      size="small"
      variant="outlined"
      color="error"
      onClick={() => updateLogisticsStatus(req.id, 'declined')}
    >
      Decline
    </Button>
  </Box>
)}

{req.status === 'accepted' && !req.pickedUp && (
  <Box display="flex" flexDirection="column" gap={1} mt={1}>
    <Chip label="Accepted" color="success" variant="outlined" />
    <Button
      size="small"
      variant="contained"
      color="primary"
      onClick={() => markAsPickedUp(req.id)}
    >
      Mark as Picked Up
    </Button>
  </Box>
)}

{req.status === 'accepted' && req.pickedUp && !req.inTransit && (
  <Box display="flex" flexDirection="column" gap={1} mt={1}>
    <Chip label="Picked Up" color="primary" variant="outlined" />
    <Button
      size="small"
      variant="contained"
      color="warning"
      onClick={() => markAsInTransit(req.id)}
    >
      Mark as In Transit
    </Button>
  </Box>
)}

{req.status === 'accepted' && req.inTransit && !req.delivered && (
  <Box display="flex" flexDirection="column" gap={1} mt={1}>
    <Chip label="In Transit" color="info" variant="outlined" />
    <Button
      size="small"
      variant="contained"
      color="success"
      onClick={() => markAsDelivered(req.id)}
    >
      Mark as Delivered
    </Button>
  </Box>
)}

{req.status === 'accepted' && req.delivered && (
  <Chip label="Delivered ✅" color="success" variant="outlined" sx={{ mt: 1 }} />
)}

{req.status === 'declined' && (
  <Chip label="Declined ❌" color="error" variant="outlined" sx={{ mt: 1 }} />
)}

            </CardContent>
          </Card>
        </Grid>
      ))}
     {/* Pagination Controls */}
            {totalPages > 1 && (
              <Grid item xs={12} display="flex" justifyContent="center" mt={2}>
                <Button
                  variant="outlined"
                  disabled={shippingPage === 1}
                  onClick={() => {
  setShippingPage((prev) => Math.max(prev - 1, 1));
  window.scrollTo({ top: 0, behavior: 'smooth' }); // 👈 Scroll to top
}}
                  sx={{ mr: 2 }}
                >
                  Previous
                </Button>
                <Typography sx={{ lineHeight: '36px' }}>
                  Page {shippingPage} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={shippingPage === totalPages}
                  onClick={() => {
  setShippingPage((prev) => Math.min(prev + 1, totalPages));
  window.scrollTo({ top: 0, behavior: 'smooth' }); // 👈 Scroll to top
}}
                  sx={{ ml: 2 }}
                >
                  Next
                </Button>
              </Grid>
            )}
          </>
        );
      })()}
    </Grid>
  </Box>
)}


    </Container>
  );
}
