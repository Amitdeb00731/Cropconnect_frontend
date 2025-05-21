// src/VideoCallUIWrapper.js
import React from 'react';
import VideoCallUI from './VideoCallUI';
import { useVideoCall } from './VideoCallManager';
import { closeCall } from './CallService';

export default function VideoCallUIWrapper() {
  const { callState, setCallState } = useVideoCall();

  if (!callState.inCall) return null;

  const handleEnd = async () => {
    // 🔴 End call in Firestore
    if (callState.currentCallId) {
      await closeCall(callState.currentCallId);
    }

    // 🔇 Stop local media tracks
    if (callState.localStream) {
      callState.localStream.getTracks().forEach(track => track.stop());
    }

    // 🔇 Stop remote media tracks
    if (callState.remoteStream) {
      callState.remoteStream.getTracks().forEach(track => track.stop());
    }

    // ♻️ Reset call state
    setCallState({
      inCall: false,
      currentCallId: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
    });
  };

  return (
    <VideoCallUI
      localStream={callState.localStream}
      remoteStream={callState.remoteStream}
      onEnd={handleEnd}
    />
  );
}
