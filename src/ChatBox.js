import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, TextField, IconButton, Typography, Avatar, useMediaQuery
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EmojiPicker from 'emoji-picker-react';
import { db, auth } from './firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc
} from 'firebase/firestore';
import moment from 'moment';
import { motion } from 'framer-motion';


const ChatBox = ({ chatId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
const [typingUserName, setTypingUserName] = useState('');
const typingTimeout = useRef(null);
  const [newMsg, setNewMsg] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [userCache, setUserCache] = useState({});
  const user = auth.currentUser;
  const endRef = useRef();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    setCurrentUser(user);
  });
  return () => unsubscribe();
}, []);

  // 🔍 Fetch user info by UID and cache it
  const getUserData = async (uid) => {
    if (userCache[uid]) return userCache[uid];
    try {
      const docRef = doc(db, 'users', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setUserCache(prev => ({ ...prev, [uid]: data }));
        return data;
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
    return null;
  };

  // 🔄 Fetch messages + preload avatars
 useEffect(() => {
  let isMounted = true;

  const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('timestamp'));
  const unsub = onSnapshot(q, async (snap) => {
     if (!isMounted || !currentUser) return;

    const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (isMounted) setMessages(msgs);

    const uniqueSenderIds = [...new Set(msgs.map(msg => msg.senderId))];
    for (const uid of uniqueSenderIds) {
      if (!userCache[uid]) await getUserData(uid);
    }

     const unseen = msgs.filter(msg => msg.senderId !== currentUser.uid && !msg.seen);
    for (const msg of unseen) {
      try {
        const msgRef = doc(db, 'chats', chatId, 'messages', msg.id);
        await updateDoc(msgRef, { seen: true });
      } catch (e) {
        if (isMounted) console.warn("Failed to update seen:", e);
      }
    }
  });

  return () => {
    isMounted = false;
    unsub();
  };
}, [chatId, currentUser]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

const sendMessage = async () => {
  if (!newMsg.trim() || !currentUser) return;

  try {
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: currentUser.uid,
      text: newMsg,
      timestamp: serverTimestamp(),
      seen: false
    });
    setNewMsg('');
    setShowPicker(false);
  } catch (err) {
    console.error("❌ Failed to send message:", err);
  }
};

  const handleEmojiClick = (emojiData) => {
    setNewMsg(prev => prev + emojiData.emoji);
  };
  useEffect(() => {
  const typingRef = doc(db, 'chats', chatId, 'typingStatus', 'status');
  const unsub = onSnapshot(typingRef, (docSnap) => {
    const data = docSnap.data();
    if (!data || data.uid === user.uid || !data.isTyping) {
      setIsOtherTyping(false);
      return;
    }
    setIsOtherTyping(true);
    setTypingUserName(data.name || 'Someone');

    // Auto-clear after 3s
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setIsOtherTyping(false), 3000);
  });

  return () => {
    unsub();
    clearTimeout(typingTimeout.current);
  };
}, [chatId]);


const handleTypingStatus = (isTyping) => {
  if (!currentUser) return;
  const typingRef = doc(db, 'chats', chatId, 'typingStatus', 'status');
  setDoc(typingRef, {
    uid: currentUser.uid,
    name: userCache[currentUser.uid]?.name || 'You',
    isTyping,
    timestamp: serverTimestamp()
  });

  clearTimeout(typingTimeout.current);
  if (isTyping) {
    typingTimeout.current = setTimeout(() => {
      setDoc(typingRef, { uid: user.uid, name: userCache[user.uid]?.name, isTyping: false }, { merge: true });
    }, 2000);
  }
};



  return (
   <Paper elevation={3} sx={{
  p: { xs: 1, sm: 2 },
  height: isMobile ? '65vh' : '75vh',
  display: 'flex',
  flexDirection: 'column'
}}>

        <Box display="flex" alignItems="center" mb={1}>
  {onBack && (
    <IconButton onClick={onBack} sx={{ mr: 1 }}>
      ←
    </IconButton>
  )}
  <Typography variant="h6" fontWeight={500}>
    Chat
  </Typography>
</Box>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
        {messages.map((msg) => {
  const isMine = msg.senderId === currentUser?.uid;
  const senderData = userCache[msg.senderId];
  const avatarSrc = senderData?.profilePicture || null;
  const fallbackLetter = senderData?.name?.[0] || msg.senderId[0];
  const senderLabel = isMine ? 'You' : (senderData?.name || 'Unknown');

  return (
    <Box
      key={msg.id}
      display="flex"
      flexDirection="column"
      alignItems={isMine ? 'flex-end' : 'flex-start'}
      mb={1}
    >
      <Typography variant="caption" sx={{ mb: 0.2, color: 'gray' }}>
        {senderLabel}
      </Typography>

      <Box display="flex" alignItems="flex-end">
        {!isMine && (
          <Avatar sx={{ mr: 1 }} src={avatarSrc}>
            {!avatarSrc && fallbackLetter}
          </Avatar>
        )}
       <Box
  sx={{
    maxWidth: { xs: '90%', sm: '80%' },
    minWidth: '60px',
    backgroundColor: isMine ? '#d1e7dd' : '#e3f2fd',
    px: 2,
    py: 1,
    borderRadius: 2,
    wordBreak: 'break-word'
  }}
>

          <Typography variant="body2">{msg.text}</Typography>
          <Typography variant="caption" display="block" textAlign="right">
  {msg.timestamp ? moment(msg.timestamp.toDate()).fromNow() : '...'}
  {isMine && (
    <span style={{ marginLeft: 6, fontStyle: 'italic', color: msg.seen ? '#4caf50' : '#999' }}>
      {msg.seen ? 'Seen' : 'Sent'}
    </span>
  )}
</Typography>

        </Box>
        {isMine && (
          <Avatar sx={{ ml: 1 }} src={userCache[user.uid]?.profilePicture || null}>
            {!userCache[user.uid]?.profilePicture && (user.displayName?.[0] || user.uid[0])}
          </Avatar>
        )}
      </Box>
    </Box>
  );
})}

     {isOtherTyping && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Typography
      variant="caption"
      sx={{ fontStyle: 'italic', color: 'gray', mb: 1, ml: 1 }}
    >
      {typingUserName} is typing...
    </Typography>
  </motion.div>
)}



        <div ref={endRef} />
      </Box>

      {showPicker && (
        <Box sx={{ position: 'absolute', bottom: '90px', zIndex: 10 }}>
          <EmojiPicker onEmojiClick={handleEmojiClick} height={350} />
        </Box>
      )}

      <Box display="flex" alignItems="center" mt={2} gap={1}>
        <IconButton onClick={() => setShowPicker(!showPicker)}>
          <EmojiEmotionsIcon />
        </IconButton>
        <TextField
          fullWidth
          size="small"
          placeholder="Type your message..."
          value={newMsg}
          onChange={(e) => {
  setNewMsg(e.target.value);
  handleTypingStatus(true);
}}
        />
        <IconButton onClick={sendMessage} color="primary">
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default ChatBox;
