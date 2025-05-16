// CompleteProfile.js
import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Container, Typography, Box, MenuItem, Select,
  InputLabel, FormControl, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions, Avatar
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';

export default function CompleteProfile() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    name: defaultName,
    email,
    password,
    accountType: defaultAccountType = ''
  } = location.state || {};

  const [name, setName] = useState(defaultName || '');
  const [accountType, setAccountType] = useState(defaultAccountType);
  const [dob, setDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uid, setUid] = useState('');

  useEffect(() => {
    if (!email || !password) {
      alert("Missing user credentials. Please register again.");
      navigate('/');
    }
  }, [email, password, navigate]);

  const handleComplete = async () => {
    if (!accountType || !dob || !name || !email || !password) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      setUid(userId);

      // Save user profile to Firestore
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        name,
        email,
        accountType,
        dob,
        phoneNumber,
        profileCompleted: true,
        createdAt: serverTimestamp()
      });

      setImageDialogOpen(true); // Prompt for optional profile picture

    } catch (error) {
      alert("Failed to create account: " + error.message);
    }
  };

  const handleSkipUpload = () => {
    navigate(`/${accountType}-dashboard`);
  };

  const handleUploadImage = async () => {
    if (!imageFile || !uid) {
      alert("Missing image or user ID.");
      return;
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", "ml_default"); // your Cloudinary preset

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dfdot1hfz/image/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.secure_url) {
        console.error("Cloudinary upload response:", data);
        alert("Image upload failed.");
        return;
      }

      await setDoc(doc(db, "users", uid), {
        profilePicture: data.secure_url
      }, { merge: true });

      navigate(`/${accountType}-dashboard`);
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, mt: 6, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box component="img" src={logo} alt="Logo" sx={{ width: 200, height: 60, mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Complete Your Profile
          </Typography>
        </Box>

        <TextField fullWidth label="Name" margin="normal" value={name} disabled />
        <TextField fullWidth label="Email" margin="normal" value={email} disabled />

        <FormControl fullWidth margin="normal">
          <InputLabel id="account-type-label">Account Type</InputLabel>
          <Select
            labelId="account-type-label"
            value={accountType}
            label="Account Type"
            onChange={(e) => setAccountType(e.target.value)}
            disabled={!!defaultAccountType}
          >
            <MenuItem value="farmer">Farmer</MenuItem>
            <MenuItem value="middleman">Middleman</MenuItem>
            <MenuItem value="mill">Mill</MenuItem>
            <MenuItem value="distributor">Distributor</MenuItem>
            <MenuItem value="retailer">Retailer</MenuItem>
            <MenuItem value="wholesaler">Wholesaler</MenuItem>
            <MenuItem value="customer">Customer</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Date of Birth"
          type="date"
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
        <TextField
          fullWidth
          label="Phone Number (Optional)"
          margin="normal"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />

        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleComplete}
          sx={{ mt: 2, py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}
        >
          Save & Continue
        </Button>

        <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} fullWidth maxWidth="xs">
          <DialogTitle>Upload Profile Picture (Optional)</DialogTitle>
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={1}>
              <Avatar
                src={imageFile ? URL.createObjectURL(imageFile) : undefined}
                sx={{ width: 100, height: 100 }}
              >
                {!imageFile && name?.[0]}
              </Avatar>

              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                {imageFile ? "Change Image" : "Choose Image"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
              </Button>

              {imageFile && (
                <Typography variant="body2" color="textSecondary">
                  Selected: {imageFile.name}
                </Typography>
              )}
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleSkipUpload}>Skip</Button>
            <Button
              variant="contained"
              onClick={handleUploadImage}
              disabled={!imageFile}
            >
              Upload & Continue
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}
