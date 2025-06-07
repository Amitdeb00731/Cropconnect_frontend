import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar,
  TextField, Button, Box, Typography, Divider, Stack
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





export default function AuctionChatModal({ open, onClose, auctionId }) {
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

    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(doc => doc.data()));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [auctionId, authorized]);

const handleSend = async () => {
  const user = auth.currentUser;
  if (!newMessage.trim() || !userProfile || !auctionData) return;

  // 1. Send the message to Firestore
  await addDoc(collection(db, 'auctionChats', auctionId, 'messages'), {
    senderId: user.uid,
    senderName: userProfile.name || 'User',
    profilePicture: userProfile.profilePicture || null,
    role: user.uid === auctionData.middlemanId ? 'moderator' : 'bidder',
    message: newMessage.trim(),
    timestamp: Timestamp.now()
  });

  // 2. Clear your typing status
  await setDoc(doc(db, 'auctionChats', auctionId, 'typing', user.uid), {
    name: userProfile.name || 'User',
    timestamp: Timestamp.fromDate(new Date(0)) // epoch -> disables indicator
  });

  setNewMessage('');
};


  const renderMessage = (msg, i) => {
    const isOwn = msg.senderId === auth.currentUser?.uid;
    const name = isOwn ? 'You' : msg.senderName;
    const time = msg.timestamp?.toDate?.() ? format(msg.timestamp.toDate(), 'p') : '';

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
            <Typography variant="body2">{msg.message}</Typography>
            <Typography variant="caption" sx={{ color: 'gray' }}>{time}</Typography>
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
          <TextField
            fullWidth
            size="small"
            value={newMessage}
            onChange={(e) => {
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
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button onClick={handleSend} variant="contained">
            Send
          </Button>
        </DialogActions>
      )}
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