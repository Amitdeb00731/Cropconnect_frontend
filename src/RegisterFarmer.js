// Updated RegisterFarmer.js with professional UI and responsive design
import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Paper,
  Avatar,
  useMediaQuery
} from '@mui/material';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';




export default function RegisterFarmer() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('');
  const navigate = useNavigate();


  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

const handleRegister = () => {
  if (!email || !password || !name || !accountType) {
    alert("Please fill all fields.");
    return;
  }

  // Only navigate with user input data
  navigate('/complete-profile', {
    state: {
      name,
      email,
      password,
      accountType,
    }
  });
};

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 4, mt: 6, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box alignSelf="flex-start" mb={2}>
  <Button
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate('/')}
    sx={{
      textTransform: 'none',
      fontWeight: 'bold',
      color: '#333',
      borderRadius: 2,
      px: 2,
      py: 1,
      backgroundColor: '#f5f5f5',
      '&:hover': {
        backgroundColor: '#e0e0e0'
      }
    }}
  >
    Back to Home
  </Button>
</Box>

         <Box component="img" src={logo} alt="Logo" sx={{ width: 200, height: 60, marginRight:2.5, marginBottom:2 }} />
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Create Your Account
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Name"
          margin="normal"
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          fullWidth
          label="Email"
          margin="normal"
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          onChange={(e) => setPassword(e.target.value)}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel id="account-type-label">Account Type</InputLabel>
          <Select
            labelId="account-type-label"
            value={accountType}
            label="Account Type"
            onChange={(e) => setAccountType(e.target.value)}
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

        <Button
          fullWidth
          variant="contained"
          color="primary"
          sx={{ mt: 2, py: 1.5, fontWeight: 'bold', fontSize: '1rem' }}
          onClick={handleRegister}
        >
          Register
        </Button>
      </Paper>
    </Container>
  );
}
