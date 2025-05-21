import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Paper, TextField, IconButton, Typography, Avatar, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tooltip
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Menu, MenuItem } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import WaveSurfer from 'wavesurfer.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { createCall } from './CallService';
import { useVideoCall } from './VideoCallManager';
import VideocamIcon from '@mui/icons-material/Videocam';










const ChatBox = ({ chatId, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
const [typingUserName, setTypingUserName] = useState('');
const typingTimeout = useRef(null);
  const [newMsg, setNewMsg] = useState('');
  const [playingAudios, setPlayingAudios] = useState({});
  const [showPicker, setShowPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
const fileInputRef = useRef(null);
const [viewingUserId, setViewingUserId] = useState(null);

const { setCallState } = useVideoCall();



const [startX, setStartX] = useState(null);
const [isCancelling, setIsCancelling] = useState(false);
const [anchorEl, setAnchorEl] = useState(null);
const [menuMessageId, setMenuMessageId] = useState(null);
const open = Boolean(anchorEl);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const waveformRefs = useRef({});
  const [isRecording, setIsRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState(null);
const [recordedChunks, setRecordedChunks] = useState([]);
const [recordingStartTime, setRecordingStartTime] = useState(null);
const [recordingElapsed, setRecordingElapsed] = useState(0);
const waveformRef = useRef(null);
const canvasRef = useRef(null);
const [recordingStartX, setRecordingStartX] = useState(null);
const [canceled, setCanceled] = useState(false);
const recordingTimerRef = useRef(null);
const [editedText, setEditedText] = useState('');
const [chatPartnerData, setChatPartnerData] = useState(null);
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

      if (uid !== currentUser?.uid) {
    setChatPartnerData(data);
  }


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


const startVideoCall = async () => {
  const partnerId = chatPartnerData?.uid || messages.find(m => m.senderId !== currentUser?.uid)?.senderId;
  if (!partnerId) return;

  const { callId, localStream, remoteStream } = await createCall(partnerId);

  setCallState({
    inCall: true,
    currentCallId: callId,
    localStream,
    remoteStream
  });
};


const uploadImageToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');

  const res = await fetch('https://api.cloudinary.com/v1_1/dfdot1hfz/image/upload', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
};

const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;

  setUploadingImage(true);

  try {
    const imageUrl = await uploadImageToCloudinary(file);
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: currentUser.uid,
      type: 'image',
      imageUrl,
      timestamp: serverTimestamp(),
      seen: false
    });
  } catch (err) {
    console.error("❌ Image upload failed:", err);
  } finally {
    setUploadingImage(false);
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
 <Tooltip title="Start Video Call">
  <IconButton onClick={startVideoCall} color="primary">
    <VideocamIcon />
  </IconButton>
</Tooltip>


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
          <Tooltip title="View Profile" arrow>
  <Avatar
    sx={{ mr: 1, cursor: 'pointer' }}
    src={avatarSrc}
    onClick={() => {
      setViewingUserId(msg.senderId);
      setProfileOpen(true);
    }}
  >
    {!avatarSrc && fallbackLetter}
  </Avatar>
</Tooltip>


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

         {msg.deleted ? (
  <Typography variant="body2" fontStyle="italic" color="text.secondary">
    Message deleted
  </Typography>
) : msg.type === 'image' ? (
  <img
    src={msg.imageUrl}
    alt="Sent Image"
    style={{
      maxWidth: '100%',
      borderRadius: 8,
      cursor: 'pointer'
    }}
    onClick={() => window.open(msg.imageUrl, '_blank')}
  />
) : msg.type === 'audio' ? (
  <Box display="flex" alignItems="center" gap={1}>
    <IconButton
      size="small"
      onClick={() => {
        const wave = waveformRefs.current[msg.id];
        if (wave) {
          wave.playPause();

          const isPlaying = wave.isPlaying();
          setPlayingAudios(prev => ({
            ...prev,
            [msg.id]: !prev[msg.id]  // toggle
          }));
        }
      }}
    >
      {playingAudios[msg.id] ? <PauseIcon /> : <PlayArrowIcon />}
    </IconButton>

    <Box sx={{ flex: 1 }}>
      <div
        id={`waveform-${msg.id}`}
        ref={(ref) => {
          if (!ref || waveformRefs.current[msg.id]) return;

          const wave = WaveSurfer.create({
            container: ref,
            waveColor: '#90caf9',
            progressColor: '#1976d2',
            height: 40,
            responsive: true
          });

          wave.load(msg.audioUrl);

          waveformRefs.current[msg.id] = wave;

          // Handle playback end
          wave.on('finish', () => {
            setPlayingAudios(prev => ({
              ...prev,
              [msg.id]: false
            }));
          });
        }}
      />
    </Box>
  </Box>
) : editingMessageId === msg.id ? (
  <Box display="flex" alignItems="center" gap={1}>
    <TextField
      size="small"
      fullWidth
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
      onKeyDown={async (e) => {
        if (e.key === 'Enter') {
          await updateDoc(doc(db, 'chats', chatId, 'messages', msg.id), {
            text: editedText,
            edited: true
          });
          setEditingMessageId(null);
        } else if (e.key === 'Escape') {
          setEditingMessageId(null);
        }
      }}
    />
    <Button
      size="small"
      variant="outlined"
      onClick={async () => {
        await updateDoc(doc(db, 'chats', chatId, 'messages', msg.id), {
          text: editedText,
          edited: true
        });
        setEditingMessageId(null);
      }}
    >
      Save
    </Button>
  </Box>
) : (
  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
    {msg.text}
    {msg.edited && (
      <Typography
        component="span"
        variant="caption"
        sx={{ ml: 1, fontStyle: 'italic', color: 'gray' }}
      >
        (edited)
      </Typography>
    )}
  </Typography>
)}

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
  <Box display="flex" alignItems="center" gap={0.5}>
    {/* Three Dots Menu */}
    <IconButton
      size="small"
      onClick={(e) => {
        setAnchorEl(e.currentTarget);
        setMenuMessageId(msg.id);
      }}
    >
      <MoreVertIcon fontSize="small" />
    </IconButton>

    {/* Avatar with View Profile Tooltip */}
    <Tooltip title="View Profile" arrow>
      <Avatar
        sx={{ ml: 0.5, cursor: 'pointer' }}
        src={userCache[currentUser?.uid]?.profilePicture || null}
        onClick={() => {
          setViewingUserId(currentUser?.uid);
          setProfileOpen(true);
        }}
      >
        {!userCache[currentUser?.uid]?.profilePicture &&
          (userCache[currentUser?.uid]?.name?.[0] ||
            currentUser?.displayName?.[0] ||
            currentUser?.uid?.[0])}
      </Avatar>
    </Tooltip>
  </Box>
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
      {isRecording && (
  <Typography color="error" fontWeight={600} mt={1}>
    🔴 Recording... {recordingElapsed}s
  </Typography>
)}

{isRecording && (
  <Box mt={1} display="flex" justifyContent="center">
    <canvas
      ref={canvasRef}
      width="300"
      height="50"
      style={{
        background: '#f5f5f5',
        borderRadius: 6,
        boxShadow: 'inset 0 0 3px rgba(0,0,0,0.2)'
      }}
    />
  </Box>
)}

{isRecording && (
  <Typography
    variant="body2"
    color={isCancelling ? 'error' : 'textSecondary'}
    textAlign="center"
    mt={1}
  >
    {isCancelling ? 'Release to cancel recording' : 'Slide left to cancel'}
  </Typography>
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

        <input
  type="file"
  accept="image/*"
  ref={fileInputRef}
  style={{ display: 'none' }}
  onChange={handleImageUpload}
/>
{uploadingImage && (
  <Typography variant="caption" color="primary" textAlign="center" mt={1}>
    Uploading image...
  </Typography>
)}


<Tooltip title="Send Image">
  <IconButton onClick={() => fileInputRef.current?.click()}>
    <PhotoCamera />
  </IconButton>
</Tooltip>



        <IconButton onClick={sendMessage} color="primary">
          <SendIcon />
        </IconButton>
       <Box
  onTouchStart={(e) => setRecordingStartX(e.touches[0].clientX)}
  onTouchMove={(e) => {
    const moveX = e.touches[0].clientX;
    if (recordingStartX && moveX < recordingStartX - 80) {
      setIsCancelling(true);
      mediaRecorder?.stop();
      setIsRecording(false);
      setCanceled(true);
      clearInterval(recordingTimerRef.current);
    }
  }}
  onTouchEnd={() => setRecordingStartX(null)}
  onMouseDown={(e) => setRecordingStartX(e.clientX)}
  onMouseMove={(e) => {
    if (recordingStartX && e.buttons === 1 && e.clientX < recordingStartX - 80) {
      setIsCancelling(true);
      mediaRecorder?.stop();
      setIsRecording(false);
      setCanceled(true);
      clearInterval(recordingTimerRef.current);
    }
  }}
  onMouseUp={() => setRecordingStartX(null)}
>
  <IconButton
    color={isRecording ? 'error' : 'default'}
    onClick={async () => {
      if (isRecording) {
        mediaRecorder?.stop();
        setIsRecording(false);
        clearInterval(recordingTimerRef.current);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks = [];

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();

        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');

        const drawWaveform = () => {
          if (!ctx) return;
          requestAnimationFrame(drawWaveform);

          analyser.getByteFrequencyData(dataArray);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#1976d2';
          const barWidth = (canvas.width / bufferLength) * 1.5;

          for (let i = 0; i < bufferLength; i++) {
            const x = i * barWidth;
            const height = dataArray[i] / 2;
            ctx.fillRect(x, canvas.height - height, barWidth * 0.8, height);
          }
        };
        drawWaveform();

        recorder.ondataavailable = (e) => chunks.push(e.data);

        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });

          if (canceled) {
            setCanceled(false);
            return;
          }

          const formData = new FormData();
          formData.append('file', blob);
          formData.append('upload_preset', 'ml_default');

          const res = await fetch('https://api.cloudinary.com/v1_1/dfdot1hfz/video/upload', {
            method: 'POST',
            body: formData
          });

          const data = await res.json();
          const audioUrl = data.secure_url;

          await addDoc(collection(db, 'chats', chatId, 'messages'), {
            senderId: currentUser.uid,
            type: 'audio',
            audioUrl,
            timestamp: serverTimestamp(),
            seen: false
          });
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        setIsCancelling(false);
        setRecordedChunks([]);
        const start = Date.now();
        setRecordingStartTime(start);
        setRecordingElapsed(0);

        recordingTimerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - start) / 1000);
          setRecordingElapsed(elapsed);
        }, 1000);
      } catch (err) {
        alert("🎙 Microphone access denied or failed: " + err.message);
        console.error(err);
      }
    }}
  >
    <MicIcon />
  </IconButton>
</Box>


      </Box>
   <Dialog open={profileOpen} onClose={() => setProfileOpen(false)}>
  <DialogTitle>User Profile</DialogTitle>
  <DialogContent>
    {viewingUserId ? (
      <Box display="flex" flexDirection="column" alignItems="center" gap={2} mt={1}>
        <Avatar
          src={userCache[viewingUserId]?.profilePicture}
          sx={{ width: 80, height: 80 }}
        >
          {!userCache[viewingUserId]?.profilePicture && userCache[viewingUserId]?.name?.[0]}
        </Avatar>
        <Typography variant="h6">
          {userCache[viewingUserId]?.name || 'Unknown'}
        </Typography>
        <Typography variant="body2" color="primary" fontWeight={500}>
  Role: {userCache[viewingUserId]?.accountType || 'Unknown'}
</Typography>

        <Typography variant="body2" color="textSecondary">
          Email: {userCache[viewingUserId]?.email || 'Not available'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Phone: {userCache[viewingUserId]?.phone || 'Not available'}
        </Typography>
      </Box>
    ) : (
      <Typography>Loading...</Typography>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setProfileOpen(false)}>Close</Button>
  </DialogActions>
</Dialog>


<Menu
  anchorEl={anchorEl}
  open={open}
  onClose={() => {
    setAnchorEl(null);
    setMenuMessageId(null);
  }}
>
  <MenuItem
    onClick={() => {
      const msg = messages.find(m => m.id === menuMessageId);
      setEditedText(msg.text);
      setEditingMessageId(menuMessageId);
      setAnchorEl(null);
    }}
  >
    Edit
  </MenuItem>
  <MenuItem
    onClick={async () => {
      await updateDoc(doc(db, 'chats', chatId, 'messages', menuMessageId), {
        deleted: true
      });
      setAnchorEl(null);
      setMenuMessageId(null);
    }}
  >
    Delete
  </MenuItem>
</Menu>


    </Paper>
  );
};

export default ChatBox;
