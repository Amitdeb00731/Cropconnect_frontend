// src/VideoCallUI.js
import React, { useEffect, useRef } from 'react';
import { useVideoCall } from './VideoCallManager';
import './VideoCallUI.css'; // create this stylesheet

export default function VideoCallUI({ localStream, remoteStream, onEnd }) {
  const localRef = useRef();
  const remoteRef = useRef();

  useEffect(() => {
  let wakeLock = null;
  if ('wakeLock' in navigator) {
    navigator.wakeLock.request('screen').then(lock => wakeLock = lock).catch(console.warn);
  }
  return () => wakeLock?.release();
}, []);


useEffect(() => {
  if (localRef.current && localStream) {
    localRef.current.srcObject = localStream;
  }

  if (remoteRef.current && remoteStream && remoteStream.getTracks().length > 0) {
  remoteRef.current.srcObject = remoteStream;
} else {
  const wait = setInterval(() => {
    if (remoteStream && remoteStream.getTracks().length > 0 && remoteRef.current) {
      remoteRef.current.srcObject = remoteStream;
      clearInterval(wait);
    }
  }, 200);
}

}, [localStream, remoteStream]);


  return (
    <div className="video-call-container">
      <video ref={remoteRef} autoPlay playsInline className="remote-video" />
      <video ref={localRef} autoPlay playsInline muted className="local-video" />
      <button className="end-call-btn" onClick={onEnd}>End Call</button>
    </div>
  );
}
