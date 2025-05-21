// src/VideoCallUIWrapper.js
import React from 'react';
import VideoCallUI from './VideoCallUI';
import { useVideoCall } from './VideoCallManager';
import { closeCall } from './CallService';

export default function VideoCallUIWrapper() {
  const { callState, setCallState } = useVideoCall();

  if (!callState.inCall) return null;

  const handleEnd = async () => {
    await closeCall(callState.currentCallId);
    setCallState(prev => ({ ...prev, inCall: false, localStream: null, remoteStream: null }));
  };

  return (
    <VideoCallUI
      localStream={callState.localStream}
      remoteStream={callState.remoteStream}
      onEnd={handleEnd}
    />
  );
}
