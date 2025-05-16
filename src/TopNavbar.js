import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Avatar, Badge, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider, Drawer, List, ListItem, ListItemText, TextField
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon from '@mui/icons-material/Language';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Snackbar, Alert } from '@mui/material';
import logo from './assets/Screenshot 2025-05-07 113933-Photoroom.png';

export default function TopNavbar({
  title,
  unseenNotifications = 0,
  notifications = [],
  onDeleteNotification = () => {},
  onClearNotifications = () => {}
}) {

  const [anchorEl, setAnchorEl] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');
  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState(false);
const [editedName, setEditedName] = useState('');
const [editedDob, setEditedDob] = useState('');
const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });


  const navigate = useNavigate();

  useEffect(() => {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  getDoc(doc(db, 'users', uid)).then((docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      setUserData(data);
      setEditedName(data.name || '');
      setEditedDob(data.dob || '');
    }
  });
}, []);


  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, 'users', uid)).then((docSnap) => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });
  }, []);

  const handleLogout = () => {
    auth.signOut().then(() => navigate('/'));
  };

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'EN' ? 'HI' : 'EN'));
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#fff', color: '#333', boxShadow: 1 }}>
        <Toolbar disableGutters sx={{ px: 1 }}>
          <Box
            sx={{
              display: 'flex',
              overflowX: 'auto',
              width: '100%',
              minWidth: 0,
              '&::-webkit-scrollbar': { display: 'none' },
              scrollbarWidth: 'none',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minWidth: 'max-content',
                width: '100%',
                px: 1,
              }}
            >

              {/* Avatar */}
              <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar
  sx={{ width: 40, height: 40 }}
  src={userData?.profilePicture || undefined}
>
  {(!userData?.profilePicture && userData?.name) ? userData.name[0] : ''}
</Avatar>


              </IconButton>

              {/* Notifications */}
              <IconButton size="small" onClick={() => setNotifDrawerOpen(true)}>
                <Badge badgeContent={unseenNotifications} color="error">
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>

            

              

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled>{userData.name} ({userData.accountType})</MenuItem>
                <MenuItem onClick={() => { setProfileOpen(true); setAnchorEl(null); }}>
                  <SettingsIcon fontSize="small" sx={{ mr: 1 }} /> View Profile
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onClose={() => setProfileOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>User Profile</DialogTitle>
        <Divider />
       <DialogContent>
  <Box display="flex" flexDirection="column" gap={2} mt={1}>
    <Box display="flex" justifyContent="center" mb={2}>
  <Avatar
    src={userData?.profilePicture || undefined}
    sx={{ width: 100, height: 100 }}
  >
    {(!userData?.profilePicture && userData?.name) ? userData.name[0] : ''}
  </Avatar>
</Box>


    {editMode ? (
      <>
       <Button
  component="label"
  variant="outlined"
  fullWidth
  sx={{ mt: 1 }}
>
  Change Profile Picture
  <input
    hidden
    accept="image/*"
    type="file"
    onChange={async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ml_default"); // Optional: your unsigned preset

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dfdot1hfz/image/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    const url = data.secure_url;

    if (!url) {
      setSnack({ open: true, message: 'Upload returned no URL', severity: 'error' });
      return;
    }

    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      profilePicture: url
    }, { merge: true });

    setUserData(prev => ({ ...prev, profilePicture: url }));
    setSnack({ open: true, message: 'Profile picture updated!', severity: 'success' });

  } catch (err) {
    setSnack({ open: true, message: 'Upload failed: ' + err.message, severity: 'error' });
  }
}}

  />
</Button>
        <TextField
          label="Name"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          fullWidth
        />
        <TextField
          label="Date of Birth"
          type="date"
          value={editedDob}
          onChange={(e) => setEditedDob(e.target.value)}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
       

      </>
    ) : (
      <>
        <Typography><strong>Name:</strong> {userData.name}</Typography>
        <Typography><strong>Date of Birth:</strong> {userData.dob || 'Not Provided'}</Typography>
      </>
    )}

    {/* Always readonly fields */}
    <Typography><strong>Email:</strong> {userData.email}</Typography>
    <Typography><strong>Account Type:</strong> {userData.accountType}</Typography>
    <Typography><strong>UID:</strong> {userData.uid}</Typography>
    <Typography><strong>Phone Number:</strong> {userData.phoneNumber || 'Not Provided'}</Typography>
  </Box>
</DialogContent>



       <DialogActions>
  {editMode ? (
    <>
      <Button onClick={() => setEditMode(false)} color="error">
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={async () => {
          const uid = auth.currentUser?.uid;
          try {
            await setDoc(doc(db, 'users', uid), {
              ...userData,
              name: editedName,
              dob: editedDob,
              profileCompleted: true
            });
            setUserData(prev => ({ ...prev, name: editedName, dob: editedDob }));
            setEditMode(false);
            setProfileOpen(false);
            setSnack({ open: true, message: 'Profile updated successfully!', severity: 'success' });
          } catch (err) {
            setSnack({ open: true, message: 'Update failed: ' + err.message, severity: 'error' });
          }
        }}
      >
        Save
      </Button>
    </>
  ) : (
    <>
      <Button onClick={() => setProfileOpen(false)} variant="outlined">
        Close
      </Button>
      <Button onClick={() => setEditMode(true)} variant="contained">
        Edit
      </Button>
    </>
  )}
</DialogActions>



      </Dialog>

      {/* Notification Drawer */}
      <Drawer anchor="right" open={notifDrawerOpen} onClose={() => setNotifDrawerOpen(false)}>
        <Box width={300} p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
  <Typography variant="h6">Notifications</Typography>
 <IconButton onClick={() => setNotifDrawerOpen(false)} size="small">
  <CloseIcon fontSize="small" />
</IconButton>
</Box>

          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No new notifications.
            </Typography>
          ) : (
            <List>
              {notifications.map((n, idx) => (
                <ListItem key={n.id || idx} divider secondaryAction={
                  <IconButton edge="end" size="small" color="error" onClick={() => onDeleteNotification(n.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }>
                  <ListItemText
                    primary={
  n.type === 'proposal' ? 'Price Proposal'
  : n.type === 'inspection' ? 'Inspection Request'
  : n.type === 'cash_payment_pending' ? 'Cash Payment Pending'
  : 'Notification'
}
secondary={
  n.message || `From: ${n.middlemanName || n.farmerName || 'N/A'}`
}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Box mt={2}>
            <Button fullWidth variant="outlined" color="error" onClick={onClearNotifications}>
  Clear All
</Button>

          </Box>
        </Box>
      </Drawer>
      <Snackbar
  open={snack.open}
  autoHideDuration={4000}
  onClose={() => setSnack(prev => ({ ...prev, open: false }))}
>
  <Alert severity={snack.severity} onClose={() => setSnack(prev => ({ ...prev, open: false }))}>
    {snack.message}
  </Alert>
</Snackbar>
    </>
  );
}
