import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  TextField, Button, Box, Typography, Divider, Stack, Switch, FormControlLabel, Chip
} from '@mui/material';
import { db, auth } from './firebase';
import {
  collection, addDoc, onSnapshot, query, orderBy, Timestamp,
  doc, getDoc, getDocs, where, setDoc, serverTimestamp
} from 'firebase/firestore';
import { format } from 'date-fns';
import { Player } from '@lottiefiles/react-lottie-player';
import moderatorAnim from './assets/moderator-lottie.json';
import bidderAnim from './assets/bidder-lottie.json';
import { writeBatch } from 'firebase/firestore';
import {
  Popover, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import annAnim from './assets/announcement.json';
import GavelIcon from '@mui/icons-material/Gavel';





export default function AuctionChatModal({ open, onClose, auctionId,  auction }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [auctionData, setAuctionData] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUserList, setOnlineUserList] = useState([]);
const [showOnlineList, setShowOnlineList] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);



  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
const [topBids, setTopBids] = useState([]);


  const [replyTo, setReplyTo] = useState(null);


  const [allUsersMap, setAllUsersMap] = useState({});


  const [isAnnouncement, setIsAnnouncement] = useState(false);



  const [readByAnchorEl, setReadByAnchorEl] = useState(null);
const [selectedReadBy, setSelectedReadBy] = useState([]);


useEffect(() => {
  if (!auctionId || !auth.currentUser) return;

  const user = auth.currentUser;
  const userRef = doc(db, 'auctionChats', auctionId, 'onlineUsers', user.uid);

  const updateOnlineStatus = async () => {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    const profile = userSnap.exists() ? userSnap.data() : {};

    const name = profile.name || user.displayName || 'User';
    const profilePicture = profile.profilePicture || null;

    // ✅ Detect role using auctionData
    const role = auctionData?.middlemanId === user.uid ? 'moderator' : 'bidder';

    await setDoc(userRef, {
      name,
      profilePicture,
      lastSeen: serverTimestamp(),
      role, // ✅ include role here
    });
  };

  updateOnlineStatus();
  const interval = setInterval(updateOnlineStatus, 60000);

  return () => {
    clearInterval(interval);
    setDoc(userRef, { lastSeen: null });
  };
}, [auctionId, auctionData]);


 useEffect(() => {
  if (!auctionId) return;

  const unsub = onSnapshot(
    collection(db, 'auctionChats', auctionId, 'onlineUsers'),
    (snap) => {
      const now = Date.now();

      const active = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          lastSeen: doc.data().lastSeen?.toDate?.()
        }))
        .filter(user => user.lastSeen && now - user.lastSeen.getTime() < 120000); // 2 min

      setOnlineUsers(active.length);       
      setOnlineUserList(active);          
    }
  );

  return () => unsub();
}, [auctionId]);




  useEffect(() => {
    const fetchInfo = async () => {
      const user = auth.currentUser;
      if (!user || !auctionId) return;

      const auctionSnap = await getDoc(doc(db, 'auctions', auctionId));
      if (!auctionSnap.exists()) return;

      const auction = auctionSnap.data();
      setAuctionData(auction);






      // Fetch user profile
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const profile = userSnap.exists() ? userSnap.data() : {};
      setUserProfile(profile);

      const isMiddleman = auction.middlemanId === user.uid;

      // Check if bidder
      const bidSnap = await getDocs(
        query(collection(db, 'auctions', auctionId, 'bids'), where('wholesalerId', '==', user.uid))
      );

      if (isMiddleman || !bidSnap.empty) {
        setAuthorized(true);
      }
    };

    fetchInfo();
  }, [auctionId]);




  useEffect(() => {
  if (!auctionId) return;

  const q = query(
    collection(db, 'auctions', auctionId, 'bids'),
    orderBy('amount', 'desc')
  );

  const unsub = onSnapshot(q, (snap) => {
    const updated = snap.docs.map(doc => doc.data());
    setTopBids(updated);
  });

  return () => unsub();
}, [auctionId]);





  useEffect(() => {
  if (!auctionId || !authorized) return;

  const q = collection(db, 'auctionChats', auctionId, 'typing');
  const unsub = onSnapshot(q, (snap) => {
    const active = snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(t => {
        const tms = t.timestamp?.toDate?.();
        return tms && Date.now() - tms.getTime() < 3000;
      });

    setTypingUsers(active);
  });

  return () => unsub();
}, [auctionId, authorized]);



useEffect(() => {
  return () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };
}, []);






 useEffect(() => {
  if (!auctionId || !authorized) return;

  const q = query(collection(db, 'auctionChats', auctionId, 'messages'), orderBy('timestamp'));

  const unsub = onSnapshot(q, async (snap) => {
    const user = auth.currentUser;
    if (!user) return;

    // 📦 Extract messages with IDs for updating
    const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setMessages(msgs);

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // ✅ Mark unread messages as read
    const batch = writeBatch(db);
    msgs.forEach(msg => {
      if (!msg.readBy || !msg.readBy[user.uid]) {
        const msgRef = doc(db, 'auctionChats', auctionId, 'messages', msg.id);
        batch.update(msgRef, {
          [`readBy.${user.uid}`]: Timestamp.now()
        });
      }
    });

    if (msgs.length > 0) {
      try {
        await batch.commit();
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }
    }
  });

  return () => unsub();
}, [auctionId, authorized]);




const handleSend = async () => {
  const user = auth.currentUser;
  if (!newMessage.trim() || !userProfile || !auctionData) return;

  const messageData = {
    senderId: user.uid,
    senderName: userProfile.name || 'User',
    profilePicture: userProfile.profilePicture || null,
    role: user.uid === auctionData.middlemanId ? 'moderator' : 'bidder',
    message: newMessage.trim(),
    timestamp: Timestamp.now(),
    readBy: { [user.uid]: Timestamp.now() },
    isAnnouncement: isAnnouncement || false
  };

  if (replyTo) {
    messageData.replyTo = {
      senderId: replyTo.senderId,
      senderName: replyTo.senderName,
      message: replyTo.message
    };
  }

  await addDoc(collection(db, 'auctionChats', auctionId, 'messages'), messageData);

  // clear typing and input
  await setDoc(doc(db, 'auctionChats', auctionId, 'typing', user.uid), {
    name: userProfile.name || 'User',
    timestamp: Timestamp.fromDate(new Date(0))
  });

  setNewMessage('');
  setReplyTo(null);
  setIsAnnouncement(false);
 // ✅ clear reply context after send
};



useEffect(() => {
  const fetchAllChatUsers = async () => {
    if (!auctionId) return;
    const users = {};
    const usersCol = collection(db, 'auctionChats', auctionId, 'onlineUsers');
    const usersSnap = await getDocs(usersCol);
    usersSnap.forEach(doc => {
      users[doc.id] = doc.data();
    });
    setAllUsersMap(users);
  };
  fetchAllChatUsers();
}, [auctionId]);



const renderMessage = (msg, i) => {


 if (msg.isAnnouncement) {
  return (
    <Box key={i} width="100%" my={2}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'warning.main',
          color: 'white',
          px: 3,
          py: 2,
          borderRadius: 2,
          boxShadow: 3,
          animation: 'fadeIn 0.5s ease-in-out',
        }}
      >
        <Player
          autoplay
          loop
          src={annAnim}
          style={{ height: 60, width: 60, marginRight: 16 }}
        />
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Moderator Announcement
          </Typography>
          <Typography variant="body1" sx={{ mb: 0.5 }}>
            {msg.message}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'PPPpp') : ''}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}


if (msg.isBidStatus) {
  return (
    <Box
      key={i}
      width="100%"
      my={1}
      px={2}
      py={1}
      sx={{
        backgroundColor: '#e3f2fd',
        borderLeft: '4px solid #1976d2',
        borderRadius: 2,
        fontStyle: 'italic',
        animation: 'fadeIn 0.3s ease-in-out'
      }}
    >
      <Typography variant="body2" fontWeight="bold">
        {msg.message}
      </Typography>
    </Box>
  );
}




  const isOwn = msg.senderId === auth.currentUser?.uid;
  const name = isOwn ? 'You' : msg.senderName;
  const time = msg.timestamp?.toDate?.() ? format(msg.timestamp.toDate(), 'p') : '';

 const othersRead = Object.entries(msg.readBy || {})
  .filter(([uid]) => uid !== msg.senderId)
  .map(([uid]) => {
    const user = allUsersMap[uid];
    return {
      uid,
      name: user?.name || 'Someone',
      profilePicture: user?.profilePicture || '',
      role: user?.role || 'Bidder'
    };
  });

  const visibleAvatars = othersRead.slice(0, 3);
  const extraCount = othersRead.length - visibleAvatars.length;

  return (
    <Box key={i} display="flex" justifyContent={isOwn ? 'flex-end' : 'flex-start'} mb={1}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        sx={{
          maxWidth: '75%',
          bgcolor: isOwn ? '#DCF8C6' : '#F1F1F1',
          p: 1.5,
          borderRadius: 2,
          flexDirection: isOwn ? 'row-reverse' : 'row',
        }}
      >
        <Avatar src={msg.profilePicture} alt={name} sx={{ width: 32, height: 32 }} />
        <Box>
          <Typography fontWeight="bold" variant="subtitle2">
            {name} {msg.role === 'moderator' ? '(Moderator)' : '(Bidder)'}
          </Typography>


           {msg.replyTo && (
            <Box
              sx={{
                background: '#f0f0f0',
                borderLeft: '4px solid #888',
                padding: '4px 8px',
                mb: 1,
                borderRadius: 1
              }}
            >
              <Typography variant="caption" fontWeight="bold">
                Reply to {msg.replyTo.senderName}
              </Typography>
              <Typography variant="caption" noWrap>
                {msg.replyTo.message}
              </Typography>
            </Box>
          )}


          <Typography variant="body2">{msg.message}</Typography>

          <Typography variant="caption" sx={{ color: 'gray' }}>{time}</Typography>

            <Typography
            variant="caption"
            sx={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer', mt: 0.5, display: 'inline-block' }}
            onClick={() => setReplyTo({ senderId: msg.senderId, senderName: msg.senderName, message: msg.message })}
          >
            Reply
          </Typography>


          {isOwn && othersRead.length > 0 && (
            <Box mt={0.5} display="flex" alignItems="center" gap={0.5}>
              <Typography variant="caption" color="primary">✔ Read by:</Typography>
              {visibleAvatars.map((user, idx) => (
                <Avatar
                  key={idx}
                  src={user.profilePicture}
                  alt={user.name}
                  sx={{ width: 20, height: 20 }}
                />
              ))}
              {extraCount > 0 && (
                <Avatar
                  sx={{ width: 20, height: 20, bgcolor: 'grey.500', fontSize: 12, cursor: 'pointer' }}
                  onClick={(e) => {
                    setSelectedReadBy(othersRead);
                    setReadByAnchorEl(e.currentTarget);
                  }}
                >
                  +{extraCount}
                </Avatar>
              )}
              {othersRead.length <= 3 && (
                <Box
                  sx={{ cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}
                  onClick={(e) => {
                    setSelectedReadBy(othersRead);
                    setReadByAnchorEl(e.currentTarget);
                  }}
                >
                  details
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};



 return (
  <>
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Auction Chat Room
        <Typography
          variant="caption"
          sx={{ float: 'right', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => setShowOnlineList(true)}
        >
          👥 {onlineUsers} online
        </Typography>
        <Button
    variant="outlined"
    size="small"
    startIcon={<GavelIcon />}
    onClick={() => setLeaderboardOpen(true)}
    sx={{ textTransform: 'none' }}
  >
    Leaderboard
  </Button>
      </DialogTitle>
      <Divider />
      <DialogContent dividers sx={{ minHeight: 300, maxHeight: 400 }}>
        {authorized ? (
          <>
            {messages.map((msg, i) => renderMessage(msg, i))}

            {typingUsers.filter(u => u.id !== auth.currentUser?.uid).length > 0 && (
              <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'gray', mb: 1 }}>
                {typingUsers
                  .filter(u => u.id !== auth.currentUser?.uid)
                  .map(u => u.name)
                  .join(', ')}{' '}
                {typingUsers.length > 2 ? 'are' : 'is'} typing...
              </Typography>
            )}

            <div ref={messagesEndRef} />
          </>
        ) : (
          <Typography color="error" textAlign="center">
            🚫 You must bid to access this chat.
          </Typography>
        )}
      </DialogContent>

      {authorized && (
        <DialogActions>

        {replyTo && (
  <Box
    display="flex"
    alignItems="center"
    justifyContent="space-between"
    sx={{
      bgcolor: '#e0f7fa',
      p: 1,
      borderRadius: 1,
      mb: 1
    }}
  >
    <Box>
      <Typography variant="caption" fontWeight="bold">
        Replying to {replyTo.senderName}
      </Typography>
      <Typography variant="body2" noWrap>{replyTo.message}</Typography>
    </Box>
    <Button onClick={() => setReplyTo(null)} size="small" color="error">Cancel</Button>
  </Box>
)}


          <TextField
            fullWidth
            size="small"
            value={auction?.status === 'closed' ? '' : newMessage}
            onChange={(e) => {

              if (auction?.status === 'closed') return;


              setNewMessage(e.target.value);

              if (!auth.currentUser || !authorized) return;

              const typingRef = doc(db, 'auctionChats', auctionId, 'typing', auth.currentUser.uid);

              // Set typing status immediately
              setDoc(typingRef, {
                name: userProfile?.name || 'User',
                timestamp: Timestamp.now()
              });

              // Clear previous timeout
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }

              // Remove typing status after 1.5s of inactivity
              typingTimeoutRef.current = setTimeout(() => {
                setDoc(typingRef, {
                  name: userProfile?.name || 'User',
                  timestamp: Timestamp.fromDate(new Date(0))
                });
              }, 1500);
            }}
            placeholder={auction?.status === 'closed' ? '🚫 Auction ended. Chat disabled.' : 'Type your message...'}
            disabled={auction?.status === 'closed'}
            onKeyDown={(e) => e.key === 'Enter' && auction?.status !== 'closed' && handleSend()}
          />
          {auctionData?.middlemanId === auth.currentUser?.uid && (
  <FormControlLabel
    control={
      <Switch
        checked={isAnnouncement}
        onChange={() => setIsAnnouncement(prev => !prev)}
        color="warning"
      />
    }
    label="Send as Announcement"
    sx={{ mt: 1 }}
  />
)}

          <Button
      onClick={handleSend}
      variant="contained"
      disabled={auction?.status === 'closed'}
      sx={{ mt: 1 }}
    >
      Send
    </Button>
    {auction?.status === 'closed' && (
      <Typography variant="caption" color="error" mt={1} align="center">
        🚫 This auction has ended. Messaging is disabled.
      </Typography>
    )}
        </DialogActions>
      )}
      <Popover
  open={Boolean(readByAnchorEl)}
  anchorEl={readByAnchorEl}
  onClose={() => setReadByAnchorEl(null)}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
>
  <List sx={{ minWidth: 220 }}>
    {selectedReadBy.map((user, idx) => (
      <ListItem key={idx}>
        <ListItemAvatar>
          <Avatar src={user.profilePicture} />
        </ListItemAvatar>
        <ListItemText
          primary={user.name}
          secondary={user.role === 'moderator' ? 'Moderator' : 'Bidder'}
        />
      </ListItem>
    ))}
  </List>
</Popover>



<Dialog open={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} maxWidth="xs" fullWidth>
  <DialogTitle>🏆 Auction Leaderboard</DialogTitle>
  <DialogContent dividers>
    {topBids.length === 0 ? (
      <Typography>No bids yet.</Typography>
    ) : (
      topBids.map((bid, index) => (
        <Box
          key={index}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={1}
          bgcolor={index === 0 ? '#e3f2fd' : '#f5f5f5'}
          borderRadius={2}
          mb={1}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={bid.profilePicture || ''} />
            <Box>
              <Typography fontWeight="bold">{index + 1}. {bid.wholesalerName || 'Unknown'}</Typography>
              <Typography variant="caption">{new Date(bid.bidTime).toLocaleTimeString()}</Typography>
            </Box>
          </Box>
          <Chip label={`₹${bid.amount}`} color={index === 0 ? 'primary' : 'default'} />
        </Box>
      ))
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setLeaderboardOpen(false)}>Close</Button>
  </DialogActions>
</Dialog>




    </Dialog>

    {/* ✅ Online Users Dialog */}
    <Dialog open={showOnlineList} onClose={() => setShowOnlineList(false)} maxWidth="xs" fullWidth>
      <DialogTitle>Online Users</DialogTitle>
      <DialogContent dividers>
        {onlineUserList.length === 0 ? (
          <Typography variant="body2" align="center">
            No users online.
          </Typography>
        ) : (
          onlineUserList.map((user, index) => (
            <Box
  key={user.id || index}
  display="flex"
  alignItems="center"
  justifyContent="space-between"
  p={1}
>
  <Box display="flex" alignItems="center" gap={1}>
    <Avatar src={user.profilePicture || ''} sx={{ width: 32, height: 32 }} />

    <Box>
      <Typography variant="body2">
        {user.id === auth.currentUser?.uid ? 'You' : (user.name || 'User')}
      </Typography>

      <Box display="flex" alignItems="center" gap={1}>
        <Player
          autoplay
          loop
          src={user.role === 'moderator' ? moderatorAnim : bidderAnim}
          style={{ height: 30, width: 30 }}
        />
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: user.role === 'moderator' ? 'goldenrod' : 'gray',
          }}
        >
          {user.role === 'moderator' ? 'Moderator' : 'Bidder'}
        </Typography>
      </Box>
    </Box>
  </Box>

  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      bgcolor: 'green',
      boxShadow: '0 0 4px rgba(0,255,0,0.6)'
    }}
  />
</Box>

          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowOnlineList(false)}>Close</Button>
      </DialogActions>
      
    </Dialog>
  </>
);
}