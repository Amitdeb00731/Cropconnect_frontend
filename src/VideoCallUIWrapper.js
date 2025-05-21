// src/VideoCallUIWrapper.js
import React from 'react';
import VideoCallUI from './VideoCallUI';
import { useVideoCall } from './VideoCallManager';
import { closeCall } from './CallService';
import { auth } from './firebase';

export default function VideoCallUIWrapper({ chatId }) {
  const { callState, setCallState } = useVideoCall();
  const currentUser = auth.currentUser;

  if (!callState.inCall) return null;

  const handleEnd = async () => {
    // 🔴 End call and log duration
    if (callState.currentCallId && chatId && currentUser && callState.callStartTime) {
      await closeCall(
        callState.currentCallId,
        chatId,
        currentUser.uid,
        callState.callStartTime
      );
    } else if (callState.currentCallId) {
      await closeCall(callState.currentCallId);
    }

    // 🔇 Stop local media tracks
    callState.localStream?.getTracks().forEach(track => track.stop());

    // 🔇 Stop remote media tracks
    callState.remoteStream?.getTracks().forEach(track => track.stop());

    // ♻️ Reset state
    setCallState({
      inCall: false,
      currentCallId: null,
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      callStartTime: null
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
