// Updated Login.js with professional UI and Google sign-in design
import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Paper,
  Avatar
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';



export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();

 const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (!userData.profileCompleted || !userData.dob) {
        navigate('/complete-profile', {
          state: {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            accountType: userData.accountType || ''
          }
        });
        return;
      }

      const { accountType } = userData;
      switch (accountType) {
        case 'farmer': navigate('/farmer-dashboard'); break;
        case 'middleman': navigate('/middleman-dashboard'); break;
        case 'mill': navigate('/mill-dashboard'); break;
        case 'distributor': navigate('/distributor-dashboard'); break;
        case 'retailer': navigate('/retailer-dashboard'); break;
        case 'wholesaler': navigate('/wholesaler-dashboard'); break;
        case 'customer': navigate('/customer-dashboard'); break;
        default: alert("Unknown account type.");
      }
    } else {
      // First-time Google user
      navigate('/complete-profile', {
        state: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        }
      });
    }
  } catch (error) {
    alert(error.message);
  }
};


const handleFacebookLogin = async () => {
  const provider = new FacebookAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (!userData.profileCompleted || !userData.dob) {
        navigate('/complete-profile', {
          state: {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            accountType: userData.accountType || ''
          }
        });
        return;
      }

      const { accountType } = userData;
      switch (accountType) {
        case 'farmer': navigate('/farmer-dashboard'); break;
        case 'middleman': navigate('/middleman-dashboard'); break;
        case 'mill': navigate('/mill-dashboard'); break;
        case 'distributor': navigate('/distributor-dashboard'); break;
        case 'retailer': navigate('/retailer-dashboard'); break;
        case 'wholesaler': navigate('/wholesaler-dashboard'); break;
        case 'customer': navigate('/customer-dashboard'); break;
        default: alert("Unknown account type.");
      }
    } else {
      // First-time Facebook user
      navigate('/complete-profile', {
        state: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        }
      });
    }
  } catch (error) {
    alert("Facebook login failed: " + error.message);
  }
};




const handleLogin = async () => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const userDoc = await getDoc(doc(db, "users", uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      if (!userData.profileCompleted || !userData.dob) {
        navigate('/complete-profile', {
          state: {
            uid,
            name: userData.name,
            email: userData.email,
            accountType: userData.accountType
          }
        });
        return;
      }

      const { accountType } = userData;
      switch (accountType) {
        case 'farmer': navigate('/farmer-dashboard'); break;
        case 'middleman': navigate('/middleman-dashboard'); break;
        case 'mill': navigate('/mill-dashboard'); break;
        case 'distributor': navigate('/distributor-dashboard'); break;
        case 'retailer': navigate('/retailer-dashboard'); break;
        case 'wholesaler': navigate('/wholesaler-dashboard'); break;
        case 'customer': navigate('/customer-dashboard'); break;
        default: alert("Unknown account type.");
      }
    } else {
      alert("No user data found in Firestore.");
    }
  } catch (error) {
    alert(error.message);
  }
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
            Welcome Back
          </Typography>
        </Box>

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
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleLogin}
          sx={{ mt: 2, py: 1.5, fontWeight: 'bold' }}
        >
          Login
        </Button>

        <Button
          fullWidth
          variant="outlined"
          onClick={handleGoogleLogin}
          sx={{
            mt: 2,
            textTransform: 'none',
            borderColor: '#ccc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            py: 1.2
          }}
        >
          <img
            src="https://i.postimg.cc/Nfh6xz4w/google-icon-logo-symbol-free-png.png"
            alt="Google Logo"
            style={{ width: 20, height: 20 }}
          />
          Sign in with Google
        </Button>
       <Button
  fullWidth
  onClick={handleFacebookLogin}
  sx={{
    mt: 2,
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: 2,
    textTransform: 'none',
    color: '#3b5998',
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  }}
  startIcon={
    <img
      src="https://i.postimg.cc/Vsr68LQV/facebook-png-icon-follow-us-facebook-1.png"
      alt="Facebook"
      style={{ width: 24, height: 24 }}
    />
  }
>
  Continue with Facebook
</Button>


      </Paper>
    </Container>
  );
}
