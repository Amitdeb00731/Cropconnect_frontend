import React, { useState } from 'react';
import { Box, CssBaseline, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemText, IconButton, Divider, Grid, Paper } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import NotificationsIcon from '@mui/icons-material/Notifications';
import BarChartIcon from '@mui/icons-material/BarChart';
import UsersTab from './UsersTab';
import { useTheme, useMediaQuery } from '@mui/material';

const drawerWidth = 240;

const navItems = [
  { label: 'Users', icon: <PeopleIcon /> },
];



export default function AdminDashboard() {

  
const theme = useTheme();
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));



  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Overview');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem button key={item.label} onClick={() => setSelectedTab(item.label)}>
            {item.icon}&nbsp;
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Admin Dashboard - {selectedTab}
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
  variant="temporary"
  open={mobileOpen}
  onClose={handleDrawerToggle}
  ModalProps={{ keepMounted: true }}
  sx={{
    display: { xs: 'block', sm: 'none' },
    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
  }}
>
  {drawer}
</Drawer>

{/* Permanent Drawer for Desktop */}
<Drawer
  variant="permanent"
  sx={{
    display: { xs: 'none', sm: 'block' },
    '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
  }}
  open
>
  {drawer}
</Drawer>
      <Box
  component="main"
  sx={{
    flexGrow: 1,
    p: 3,
    ml: { sm: `${drawerWidth}px` }, // Add left margin for permanent drawer
  }}
>

        <Toolbar />
        {selectedTab === 'Users' && <UsersTab />}

        {/* Tabs like Users, Harvests, etc., will render respective components here */}
      </Box>
    </Box>
  );
}
