import React, { useEffect, useState , res, useRef} from 'react';
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, onSnapshot, query, where, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { Container, Typography, Box, Tabs, Tab, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import TopNavbar from './TopNavbar';
import logo from './assets/shipconnect_logo.png';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import LogoutIcon from '@mui/icons-material/Logout';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HomeIcon from '@mui/icons-material/Home';
import { Avatar, Divider, ListItemIcon } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';


export default function LogisticsDashboard() {
  const [tab, setTab] = React.useState(0);

const [deliveredPage, setDeliveredPage] = useState(1);

  const [shippingPage, setShippingPage] = useState(1);
const shippingItemsPerPage = 3;

const [drawerOpen, setDrawerOpen] = useState(false);

const user = auth.currentUser;

const tabLabels = [
  { label: "Home", icon: <HomeIcon /> },
  { label: "Shipping Requests", icon: <LocalShippingIcon /> },
   { label: "Delivered", icon: <LocalShippingIcon /> }
];

const navigate = useNavigate();


const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = angle => (angle * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};


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

    await updateDoc(reqRef, {
  delivered: true,
  deliveryTimestamp: Date.now()
});


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

 const sorted = [...logisticsRequests].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        const deliveredRequests = sorted.filter(req => req.delivered);
const pendingRequests = sorted.filter(req => !req.delivered);


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
          <Tab label="Delivered" />
        </Tabs>
         <IconButton onClick={() => setDrawerOpen(true)} sx={{ ml: 1 }}>
    <MoreVertIcon />
  </IconButton>
      </Box>

      {tab === 0 && (
        <Typography variant="h6" align="center">Welcome to ShipConnect Logistics Dashboard</Typography>
      )}

      {tab === 1 && (
  <Box mt={2}>
    <Typography variant="h6" gutterBottom>Shipping Requests</Typography>
   <Grid container spacing={2}>
      {(() => {
       
if (pendingRequests.length === 0) {
    return (
      <Grid item xs={12}>
        <Typography align="center" color="text.secondary">
          No shipping requests found.
        </Typography>
      </Grid>
    );
  }

  const totalPages = Math.ceil(pendingRequests.length / shippingItemsPerPage);
  const paginated = pendingRequests.slice(
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
               {req.pickupLat && req.pickupLon && req.millLat && req.millLon && (
    <Box sx={{ mt: 1, mb: 1 }}>
      <MapContainer
        center={[req.pickupLat, req.pickupLon]}
        zoom={8}
        scrollWheelZoom={false}
        style={{ height: 200, width: '100%', borderRadius: 10 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[req.pickupLat, req.pickupLon]}>
          <Popup>Pickup</Popup>
        </Marker>
        <Marker position={[req.millLat, req.millLon]}>
          <Popup>Drop</Popup>
        </Marker>
        <Polyline
          positions={[[req.pickupLat, req.pickupLon], [req.millLat, req.millLon]]}
          color="blue"
        />
      </MapContainer>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Distance: {haversineDistance(req.pickupLat, req.pickupLon, req.millLat, req.millLon).toFixed(2)} km
      </Typography>
    </Box>
  )}
              <Typography variant="body2">Pickup Date: {new Date(req.pickupDate).toLocaleDateString()}</Typography>
              <Typography variant="body2">Pickup Time: {req.pickupTime}</Typography>
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
{req.deliveryTimestamp && (
  <>
    <Typography variant="body2">Delivery Date: {new Date(req.deliveryTimestamp).toLocaleDateString()}</Typography>
    <Typography variant="body2">Delivery Time: {new Date(req.deliveryTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
  </>
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





{tab === 2 && (
  <Box mt={2}>
    <Typography variant="h6" gutterBottom>Delivered Shipments</Typography>
    <Grid container spacing={2}>
      {deliveredRequests.length === 0 ? (
        <Grid item xs={12}>
        <Typography>No delivered requests yet.</Typography>
         </Grid>
      ) : (
        (() => {
          const deliveredTotalPages = Math.ceil(deliveredRequests.length / shippingItemsPerPage);
          const paginatedDelivered = deliveredRequests.slice(
            (deliveredPage - 1) * shippingItemsPerPage,
            deliveredPage * shippingItemsPerPage
          );

          return (
            <>
              {paginatedDelivered.map((req) => (
          <Grid item xs={12} sm={6} md={4} key={req.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">{req.riceType} — {req.quantity} Kg</Typography>
                <Typography variant="body2">From: {req.middlemanName}</Typography>
                <Typography variant="body2">Mill: {req.millName} ({req.millLocation})</Typography>
                <Typography variant="body2">Pickup: {req.pickupLocation}</Typography>
                {req.pickupLat && req.pickupLon && req.millLat && req.millLon && (
                  <Box sx={{ mt: 1, mb: 1 }}>
                    <MapContainer
                      center={[req.pickupLat, req.pickupLon]}
                      zoom={8}
                      scrollWheelZoom={false}
                      style={{ height: 200, width: '100%', borderRadius: 10 }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[req.pickupLat, req.pickupLon]}>
                        <Popup>Pickup</Popup>
                      </Marker>
                      <Marker position={[req.millLat, req.millLon]}>
                        <Popup>Drop</Popup>
                      </Marker>
                      <Polyline
                        positions={[[req.pickupLat, req.pickupLon], [req.millLat, req.millLon]]}
                        color="blue"
                      />
                    </MapContainer>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Distance: {haversineDistance(req.pickupLat, req.pickupLon, req.millLat, req.millLon).toFixed(2)} km
                    </Typography>
                  </Box>
                )}
                <Typography variant="body2">Pickup Date: {new Date(req.pickupDate).toLocaleDateString()}</Typography>
                <Typography variant="body2">Pickup Time: {req.pickupTime}</Typography>
                {req.deliveryTimestamp && (
  <>
    <Typography variant="body2">
      Delivery Date: {new Date(req.deliveryTimestamp).toLocaleDateString()}
    </Typography>
    <Typography variant="body2">
      Delivery Time: {new Date(req.deliveryTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })}
    </Typography>
  </>
)}

                <Chip label="Delivered ✅" color="success" variant="outlined" sx={{ mt: 1 }} />
                
              </CardContent>
            </Card>
          </Grid>
            ))}
         {/* Pagination Controls */}
              {deliveredTotalPages > 1 && (
                <Grid item xs={12} display="flex" justifyContent="center" mt={2}>
                  <Button
                    variant="outlined"
                    disabled={deliveredPage === 1}
                    onClick={() => {
                      setDeliveredPage(prev => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    sx={{ mr: 2 }}
                  >
                    Previous
                  </Button>
                  <Typography sx={{ lineHeight: '36px' }}>
                    Page {deliveredPage} of {deliveredTotalPages}
                  </Typography>
                  <Button
                    variant="outlined"
                    disabled={deliveredPage === deliveredTotalPages}
                    onClick={() => {
                      setDeliveredPage(prev => Math.min(prev + 1, deliveredTotalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    sx={{ ml: 2 }}
                  >
                    Next
                  </Button>
                </Grid>
              )}
            </>
          );
        })()
      )}
    </Grid>
  </Box>
)}




<Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
  <Box sx={{ width: 260 }} role="presentation">
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
      <Avatar sx={{ width: 60, height: 60, mb: 1 }} />
      <Typography variant="subtitle1">Logistics</Typography>
      <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
    </Box>

    <Divider />

    <List>
      {tabLabels.map((tab, index) => (
        <ListItem button key={tab.label} onClick={() => setTab(index)}>
          <ListItemIcon>{tab.icon}</ListItemIcon>
          <ListItemText primary={tab.label} />
        </ListItem>
      ))}
    </List>

    <Divider />

    <Box sx={{ mt: 'auto', p: 2 }}>
      <ListItem button onClick={() => {
        signOut(auth).then(() => navigate('/'));
      }}>
        <ListItemIcon><LogoutIcon /></ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItem>

      <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 1 }}>
        © {new Date().getFullYear()} ShipConnect | CropConnect
      </Typography>
    </Box>
  </Box>
</Drawer>




    </Container>
  );
}
