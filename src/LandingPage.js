import React, { useState } from 'react';
import {
  AppBar, Toolbar, Button, Container, Box, Grid,
  Card, CardContent, CardMedia, Link, Stack, useMediaQuery, useTheme, Typography, Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';
import Lottie from 'lottie-react';
import animationData from './assets/Animation - 1746804888282.json';
import { TextField,  Snackbar, Alert } from '@mui/material';
import 'react-phone-input-2/lib/material.css';
import PhoneInput from 'react-phone-input-2';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import { Link as ScrollLink } from 'react-scroll';
import { Divider } from '@mui/material';
import TawkMessenger from './TawkMessenger';








export default function LandingPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
const toggleDrawer = () => setDrawerOpen(!drawerOpen);


const handleFormSubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  // Add phone number from state to form data
  formData.set('phone', phone);

  fetch(form.action, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
    },
  })
    .then((response) => {
      if (response.ok) {
        setOpenSnackbar(true);
        form.reset();
        setPhone(''); // Clear phone input
      } else {
        alert('Something went wrong. Please try again later.');
      }
    })
    .catch(() => {
      alert('Network error. Please try again later.');
    });
};


const handleSnackbarClose = () => {
  setOpenSnackbar(false);
};

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <div>
      {/* Top AppBar */}
      <AppBar position="sticky" sx={{ backgroundColor: '#ffffff', color: '#333', boxShadow: 2 }}>
  <Toolbar sx={{ justifyContent: 'space-between', px: 2 }}>
    {/* Logo */}
    <Box display="flex" alignItems="center">
      <img src={logo} alt="CropConnect Logo" style={{ height: 48, cursor: 'pointer' }} onClick={() => navigate('/')} />
    </Box>

    {/* Desktop Menu */}
    {!isMobile && (
      <Box display="flex" gap={2}>
  <Button
    onClick={() => navigate('/login')}
    sx={{ color: '#333', fontWeight: 'bold' }}
  >
    Login
  </Button>
  <Button
    onClick={() => navigate('/register')}
    variant="contained"
    sx={{ fontWeight: 'bold' }}
  >
    Register
  </Button>
</Box>

    )}

    {/* Mobile Hamburger Icon */}
    {isMobile && (
      <IconButton edge="end" onClick={toggleDrawer} color="inherit">
        <MenuIcon />
      </IconButton>
    )}
  </Toolbar>
</AppBar>

{/* Mobile Drawer */}
<Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer}>
  <Box sx={{ width: 250, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
    <ScrollLink to="features" smooth duration={500} offset={-64} onClick={toggleDrawer}>
      <Button fullWidth>Features</Button>
    </ScrollLink>
    <ScrollLink to="why" smooth duration={500} offset={-64} onClick={toggleDrawer}>
      <Button fullWidth>Why CropConnect</Button>
    </ScrollLink>
    <ScrollLink to="how-it-works" smooth duration={500} offset={-64} onClick={toggleDrawer}>
      <Button fullWidth>How It Works</Button>
    </ScrollLink>
    <ScrollLink to="testimonials" smooth duration={500} offset={-64} onClick={toggleDrawer}>
      <Button fullWidth>Testimonials</Button>
    </ScrollLink>
     <Divider sx={{ my: 1 }} />

    <Button fullWidth onClick={() => { toggleDrawer(); navigate('/login'); }}>
      Login
    </Button>
    <Button
      fullWidth
      variant="contained"
      onClick={() => { toggleDrawer(); navigate('/register'); }}
    >
      Register
    </Button>
  </Box>
</Drawer>



      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 6, md: 12 },
          textAlign: 'center',
          background: 'linear-gradient(135deg, #e0f7fa, #ffffff)',
        }}
      >
        <Container>
          <Box maxWidth="md" mx="auto">
            <Box sx={{ px: { xs: 2, md: 6 } }}>
              <h1 style={{
                fontSize: isMobile ? '2rem' : '3.5rem',
                fontWeight: 700,
                marginBottom: '16px',
                lineHeight: 1.2
              }}>
                Transforming Rice Supply Chains
              </h1>
              <p style={{
                fontSize: isMobile ? '1rem' : '1.25rem',
                color: '#555',
                marginBottom: '24px'
              }}>
                A transparent and traceable platform empowering farmers and middlemen to connect efficiently.
              </p>
              <Button variant="contained" color="primary" size={isMobile ? 'medium' : 'large'} onClick={() => navigate('/register')}>
                Get Started
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Feature Cards */}
      <Container id="features" sx={{ py: 6 }}>
        <h2 style={{ textAlign: 'center', fontSize: isMobile ? '1.75rem' : '2.5rem', marginBottom: '32px', fontWeight: 600 }}>
          Key Features
        </h2>
        <Grid container spacing={4}>
          {[
            {
              title: 'Traceable Harvests',
              desc: 'Track rice harvests from farm to market with full transparency.',
              img: 'https://i.postimg.cc/3Jq2MYc0/23940923-6874913.jpg'
            },
            {
              title: 'Secure Deals',
              desc: 'Negotiate prices and finalize deals with built-in inspection process.',
              img: 'https://i.postimg.cc/DZcY585X/54106.jpg'
            },
            {
              title: 'Smart Analytics',
              desc: 'View insightful dashboards and statistics of your rice business.',
              img: 'https://i.postimg.cc/rFG7QyFc/freepicdownloader-com-smart-farm-ui-hologram-system-control-maintenance-displaying-growth-informat.jpg'
            },
          ].map((feature, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  boxShadow: 3,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={feature.img}
                  alt={feature.title}
                />
                <CardContent>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.5 }}>
                    {feature.desc}
                  </p>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Info Section */}
      <Box id="why" sx={{ py: 8, bgcolor: 'grey.100' }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6} order={{ xs: 2, md: 1 }}>
              <h2 style={{ fontSize: isMobile ? '1.75rem' : '2.5rem', marginBottom: '16px', fontWeight: 700 }}>
                Why Choose CropConnect?
              </h2>
              <p style={{ color: '#555', fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px' }}>
                Our platform bridges the gap between farmers and middlemen by ensuring transparent transactions,
                traceable harvests, and secure communication.
              </p>
              <Button variant="contained" color="primary" size={isMobile ? 'medium' : 'large'} onClick={() => navigate('/register')}>
                Join Us Today
              </Button>
            </Grid>
             <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
    <Lottie
      animationData={animationData}
      loop
      style={{ width: '100%', maxHeight: 600 }}
    />
  </Grid>
          </Grid>
        </Container>
      </Box>

      {/* How It Works Section */}
<Box id="how-it-works" sx={{ py: 8, bgcolor: 'white' }}>
  <Container>
    <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
      How It Works
    </Typography>
    <Grid container spacing={4} mt={3}>
      {[
        {
          title: 'Create an Account',
          desc: 'Sign up as a farmer, middleman, or another role to get started.',
          icon: '📝'
        },
        {
          title: 'List or Browse Harvests',
          desc: 'Farmers list their rice harvests while middlemen explore them.',
          icon: '🌾'
        },
        {
          title: 'Negotiate Deals',
          desc: 'Middlemen propose prices or accept asking rates to initiate deals.',
          icon: '🤝'
        },
        {
          title: 'Track & Inspect',
          desc: 'Conduct inspections, track orders, and build inventory.',
          icon: '📦'
        }
      ].map((step, idx) => (
        <Grid item xs={12} sm={6} md={3} key={idx}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 4, boxShadow: 2 }}>
            <Typography fontSize="2.5rem">{step.icon}</Typography>
            <Typography variant="h6" fontWeight={600} mt={1}>
              {step.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {step.desc}
            </Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
</Box>




<Box  id="testimonials" sx={{ py: 8, backgroundColor: '#f9fafb' }}>
  <Container maxWidth="md">
    <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
      What Our Users Say
    </Typography>
    <Typography variant="subtitle1" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
      Hear from farmers, traders, and exporters who’ve transformed their workflow with CropConnect.
    </Typography>

    {[
      {
        name: 'Ravi Kumar',
        role: 'Farmer, Punjab',
        text: 'CropConnect helped me find buyers faster and get better prices. It’s simple and effective!',
        avatar: 'https://i.postimg.cc/q7W0gzXC/depositphotos-530990110-stock-photo-pabna-bangladesh-july-2012-old.webp',
      },
      {
        name: 'Anjali Singh',
        role: 'Trader, Uttar Pradesh',
        text: 'The transparency and tracking saved me time and built trust with my network.',
        avatar: 'https://i.postimg.cc/FRtq2qQ2/portrait-indian-business-woman-15923252.webp',
      },
      {
        name: 'Vikram Chauhan',
        role: 'Exporter, Haryana',
        text: 'Managing inspections and finding quality harvests has never been easier.',
        avatar: 'https://i.postimg.cc/x1pqyGSk/58061908c9e0b29f0a7b23c6-w800.jpg',
      },
    ].map((testimonial, idx) => (
      <Card
        key={idx}
        sx={{
          mb: 4,
          p: 4,
          borderRadius: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
          transition: 'transform 0.3s',
          '&:hover': { transform: 'translateY(-5px)' },
        }}
      >
        <Typography variant="body1" fontStyle="italic" color="text.primary" mb={3}>
          “{testimonial.text}”
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={testimonial.avatar} alt={testimonial.name} sx={{ width: 48, height: 48 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              {testimonial.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {testimonial.role}
            </Typography>
          </Box>
        </Box>
      </Card>
    ))}
  </Container>
</Box>






{/* Contact Us Section */}
<Box sx={{ py: 8, backgroundColor: '#f9f9f9' }}>
  <Container maxWidth="md">
    <Typography variant="h4" fontWeight={600} textAlign="center" gutterBottom>
      Get in Touch
    </Typography>
    <Typography variant="body1" textAlign="center" sx={{ mb: 4, color: 'text.secondary' }}>
      We'd love to hear from you! Fill out the form below and we’ll get back to you shortly.
    </Typography>
    <Box
  component="form"
  onSubmit={handleFormSubmit}
  action="https://formspree.io/f/mzzrznle"
  method="POST"
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    bgcolor: 'white',
    p: 4,
    borderRadius: 3,
    boxShadow: 3,
  }}
>

      <TextField
        fullWidth
        name="name"
        label="Your Name"
        required
        variant="outlined"
      />
      <TextField
        fullWidth
        name="email"
        label="Email Address"
        type="email"
        required
        variant="outlined"
      />
      <PhoneInput
  country={'in'}
  value={phone}
  onChange={setPhone}
  inputProps={{
    name: 'phone',
    required: false,
    autoFocus: false,
  }}
  inputStyle={{
    width: '100%',
    height: '56px',
    borderRadius: '4px',
    borderColor: '#c4c4c4',
    fontSize: '16px',
    paddingLeft: '48px'
  }}
/>

      <TextField
        fullWidth
        name="message"
        label="Message"
        required
        multiline
        rows={4}
        variant="outlined"
      />
      <Button type="submit" variant="contained" size="large">
        Send Message
      </Button>
    </Box>
    <Snackbar
  open={openSnackbar}
  autoHideDuration={4000}
  onClose={handleSnackbarClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
>
  <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
    Message sent successfully!
  </Alert>
</Snackbar>

  </Container>
</Box>


      {/* Footer */}
      
<Box sx={{ bgcolor: 'primary.main', color: 'white', pt: 6, pb: 3 }}>
  <Container>
    <Grid container spacing={4} justifyContent="center">
      <Grid item xs={12} md={4} textAlign={{ xs: 'center', md: 'left' }}>
        <img src={logo} alt="Logo" style={{ height: 40, marginBottom: 12 }} />
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Empowering Agricultural Supply Chains with transparency and innovation.
        </Typography>
      </Grid>

      <Grid item xs={12} md={4}>
        <Typography variant="h6" sx={{ mb: 1, textAlign: { xs: 'center', md: 'left' } }}>
          Quick Links
        </Typography>
        <Stack
          spacing={1}
          direction={{ xs: 'column', md: 'row' }}
          justifyContent={isMobile ? 'center' : 'flex-start'}
          alignItems={isMobile ? 'center' : 'flex-start'}
        >
          <Link href="#" color="inherit" underline="hover" sx={{ opacity: 0.9 }}>
            About
          </Link>
          <Link href="#" color="inherit" underline="hover" sx={{ opacity: 0.9 }}>
            Contact
          </Link>
          <Link href="#" color="inherit" underline="hover" sx={{ opacity: 0.9 }}>
            Terms
          </Link>
        </Stack>
      </Grid>
    </Grid>

    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.2)', mt: 4, pt: 2, textAlign: 'center', fontSize: '0.85rem', opacity: 0.7 }}>
      © 2025 CropConnect — All rights reserved
    </Box>
  </Container>
</Box>
<TawkMessenger />

    </div>
  );
}
