// WholesalerDashboard.js
import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Snackbar, Alert,
  CircularProgress, TextField, Button, Paper, InputAdornment, IconButton, Tabs, Tab
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import TawkMessenger from './TawkMessenger';
import WarehouseMapPicker from './WarehouseMapPicker';

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

      <TawkMessenger />

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Container>
  );
}
