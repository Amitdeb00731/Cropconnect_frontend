import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, onSnapshot, updateDoc, query, collection, where } from 'firebase/firestore';
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
    callStartTime: null
  });

useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, (user) => {
    if (!user) return;

    const q = query(
      collection(db, 'calls'),
      where('calleeId', '==', user.uid),
      where('status', '==', 'calling')
    );

    const unsubCall = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data();
        if (!data) return;

        // Only act if not already in a call
        if (data.calleeId === user.uid && data.status === 'calling') {
          console.log("📞 Incoming call detected:", data);
          setCallState(prev => ({
            ...prev,
            incomingCall: { ...data, callId: change.doc.id }
          }));
        }

       if (data.status === 'ended') {
  console.log("🔚 Call ended remotely.");
  // Stop any active streams
  callState.localStream?.getTracks().forEach(t => t.stop());
  callState.remoteStream?.getTracks().forEach(t => t.stop());

  setCallState({
    inCall: false,
    incomingCall: null,
    currentCallId: null,
    localStream: null,
    remoteStream: null,
    callStartTime: null
  });
}

      });
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
