// WarehouseSetup.js
import React, { useState } from 'react';
import {
  Container, Typography, TextField, Button, Box, Snackbar, Alert, Paper, InputAdornment, IconButton
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from './firebase';
import { useNavigate } from 'react-router-dom';

export default function WarehouseSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    location: '',
    landmark: '',
    capacity: '',
    contact: '',
    latitude: null,
    longitude: null
  });
  const [locationOptions, setLocationOptions] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

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
          setForm(prev => ({
            ...prev,
            location: place,
            latitude,
            longitude
          }));
          setSnack({ open: true, message: 'Location autofilled!', severity: 'success' });
        }
      },
      () => {
        setSnack({ open: true, message: 'Location access denied', severity: 'warning' });
      }
    );
  };

  const handleSearchLocation = async (input) => {
    if (!input) return;
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        input
      )}&limit=5&apiKey=35d72c07d6f74bec8a373961eea91f46`
    );
    const data = await response.json();
    const suggestions = data.features.map((f) => ({
      label: f.properties.formatted,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0]
    }));
    setLocationOptions(suggestions);
  };

  const handleSubmit = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !form.location || !form.capacity) {
      setSnack({ open: true, message: 'Please fill all required fields.', severity: 'warning' });
      return;
    }

    await setDoc(doc(db, 'warehouses', uid), form);
    navigate('/wholesaler-dashboard');
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 8, p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Set Up Your Warehouse
        </Typography>

       <Autocomplete
  fullWidth
  freeSolo
  options={locationOptions}
  value={{ label: form.location }} // ✅ Controlled by form.location
  getOptionLabel={(option) => typeof option === 'string' ? option : option.label}
  onInputChange={(e, value) => {
    setForm(prev => ({ ...prev, location: value }));
    handleSearchLocation(value);
  }}
  onChange={(e, value) => {
    if (value) {
      setForm(prev => ({
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
      label="Location"
      margin="normal"
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton onClick={handleGeolocate} edge="end">
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
          value={form.landmark}
          onChange={(e) => setForm({ ...form, landmark: e.target.value })}
        />
        <TextField
          label="Storage Capacity (tons)"
          fullWidth
          margin="normal"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
        <TextField
          label="Contact Info"
          fullWidth
          margin="normal"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
        />

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button variant="contained" onClick={handleSubmit}>
            Save & Continue
          </Button>
        </Box>
      </Paper>

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
