import React, { useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useVideoCall } from './VideoCallManager';
import { answerCall, closeCall } from './CallService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export default function IncomingCallDialog() {
  const { callState, setCallState } = useVideoCall();
  const { incomingCall } = callState;
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (incomingCall) {
      // 🔔 Start ringing
      audioRef.current = new Audio('/ringtone.mp3');
      audioRef.current.loop = true;
      audioRef.current.play().catch(e => console.warn("Audio autoplay blocked:", e));

      // ⏱️ Set timeout to auto-decline
      timeoutRef.current = setTimeout(async () => {
        await updateDoc(doc(db, 'calls', incomingCall.callId), { status: 'missed' });
        setCallState(prev => ({ ...prev, incomingCall: null }));
      }, 30000); // 30 seconds
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      clearTimeout(timeoutRef.current);
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const handleReject = async () => {
    clearTimeout(timeoutRef.current);
    if (audioRef.current) audioRef.current.pause();
    await closeCall(incomingCall.callId);
    setCallState(prev => ({ ...prev, incomingCall: null }));
  };

  const handleAccept = async () => {
    clearTimeout(timeoutRef.current);
    if (audioRef.current) audioRef.current.pause();
    const { localStream, remoteStream } = await answerCall(incomingCall.callId);
    setCallState({
      inCall: true,
      incomingCall: null,
      currentCallId: incomingCall.callId,
      localStream,
      remoteStream,
    });
  };

  return (
    <Dialog open={true} onClose={handleReject}>
      <DialogTitle>📞 Incoming Video Call</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          You have a call from <strong>{incomingCall.callerId}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Auto-rejecting in 30 seconds...
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReject} color="error">Reject</Button>
        <Button onClick={handleAccept} variant="contained" color="primary">Accept</Button>
      </DialogActions>
    </Dialog>
  );
}
