// UsersTab.js
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Avatar, Dialog, DialogTitle, DialogContent, Button,
  CircularProgress, DialogActions, TextField, MenuItem, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs
        .map(doc => ({ uid: doc.id, ...doc.data() }))
        .filter(user => (user.accountType || '').toLowerCase() !== 'admin');
      setUsers(list);
      setFilteredUsers(list);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (searchName) {
      result = result.filter(u => u.name?.toLowerCase().includes(searchName.toLowerCase()));
    }
    if (searchEmail) {
      result = result.filter(u => u.email?.toLowerCase().includes(searchEmail.toLowerCase()));
    }
    if (filterRole !== 'all') {
      result = result.filter(u => u.accountType === filterRole);
    }
    setFilteredUsers(result);
  }, [searchName, searchEmail, filterRole, users]);

  const handleView = (user) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const renderRoleChip = (type) => {
    let color = 'default';
    if (type === 'farmer') color = 'success';
    else if (type === 'middleman') color = 'warning';
    else if (type === 'mill') color = 'info';
    return <Chip label={type} color={color} variant="outlined" />;
  };

  const columns = [
    {
      field: 'profilePicture',
      headerName: 'Profile',
      width: 100,
      renderCell: (params) => (
        <Avatar src={params.value} alt="avatar" sx={{ width: 40, height: 40 }} />
      )
    },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'uid', headerName: 'UID', width: 250 },
    {
      field: 'accountType',
      headerName: 'Account Type',
      width: 150,
      renderCell: (params) => renderRoleChip(params.value)
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button size="small" variant="outlined" onClick={() => handleView(params.row)}>
          View Account
        </Button>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h5" mb={2}>All Users (excluding Admins)</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />

        <TextField
          label="Search by Email"
          variant="outlined"
          size="small"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
        />

        <TextField
          label="Filter by Role"
          select
          size="small"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="farmer">Farmer</MenuItem>
          <MenuItem value="middleman">Middleman</MenuItem>
          <MenuItem value="mill">Mill</MenuItem>
        </TextField>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <div style={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredUsers.map((u, i) => ({ id: i, ...u }))}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
          />
        </div>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ textAlign: 'center' }}>
              <Avatar src={selectedUser.profilePicture} sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }} />
              <Typography><b>UID:</b> {selectedUser.uid}</Typography>
              <Typography><b>Name:</b> {selectedUser.name}</Typography>
              <Typography><b>Email:</b> {selectedUser.email}</Typography>
              <Typography><b>Phone:</b> {selectedUser.phoneNumber || 'N/A'}</Typography>
              <Typography><b>Date of Birth:</b> {selectedUser.dob || 'N/A'}</Typography>
              <Typography><b>Account Type:</b> {selectedUser.accountType || 'N/A'}</Typography>
              <Typography><b>Profile Completed:</b> {selectedUser.profileCompleted ? 'Yes' : 'No'}</Typography>
              <Typography><b>Face Enrolled:</b> {selectedUser.faceEnrolled ? 'Yes' : 'No'}</Typography>
              <Typography>
  <b>Created:</b> {selectedUser.createdAt?.toDate().toLocaleString() || 'N/A'}
</Typography>

            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}