import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@mui/material';
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

      // ⏱️ Auto-decline after 30s
      timeoutRef.current = setTimeout(async () => {
        try {
          await updateDoc(doc(db, 'calls', incomingCall.callId), { status: 'missed' });
        } catch (err) {
          console.error("Failed to auto-decline call:", err);
        }
        setCallState(prev => ({ ...prev, incomingCall: null }));
      }, 30000);
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

    try {
      await closeCall(incomingCall.callId);
    } catch (err) {
      console.error("Error rejecting call:", err);
    }

    setCallState({
      inCall: false,
      currentCallId: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
    });
  };

  const handleAccept = async () => {
    clearTimeout(timeoutRef.current);
    if (audioRef.current) audioRef.current.pause();

    try {
      const { localStream, remoteStream } = await answerCall(incomingCall.callId, incomingCall.chatId);
      setCallState({
        inCall: true,
        incomingCall: null,
        currentCallId: incomingCall.callId,
        localStream,
        remoteStream,
        callStartTime: Date.now(),  
      });
    } catch (err) {
      console.error("Error answering call:", err);
      setCallState(prev => ({ ...prev, incomingCall: null }));
    }
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
