import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
const VideoCallContext = createContext();

export const VideoCallProvider = ({ children }) => {
  const [callState, setCallState] = useState({
    inCall: false,
    incomingCall: null,
    currentCallId: null,
    remoteUserId: null,
    localStream: null,
    remoteStream: null,
  });

useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const callDoc = doc(db, 'calls', user.uid);
    const unsubCall = onSnapshot(callDoc, (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.status === 'ended') {
        console.log("🔚 Call ended remotely.");
        setCallState({
          inCall: false,
          incomingCall: null,
          currentCallId: null,
          localStream: null,
          remoteStream: null
        });
      }

      if (data.calleeId === user.uid && data.status === 'calling') {
        console.log("📞 Incoming call detected:", data);
        setCallState((prev) => ({ ...prev, incomingCall: { ...data, callId: snap.id } }));
      }
    });

    return unsubCall;
  });

  return () => unsubAuth();
}, []);


  return (
    <VideoCallContext.Provider value={{ callState, setCallState }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => useContext(VideoCallContext);
