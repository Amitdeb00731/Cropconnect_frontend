// src/CallService.js
import { db, auth } from './firebase';
import {
  doc, setDoc, updateDoc, onSnapshot, collection,
  addDoc, deleteDoc, getDoc, serverTimestamp
} from 'firebase/firestore';

let pc = null;
let localStream = null;
let remoteStream = null;

const servers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

export const createCall = async (calleeId, chatId) => {
  const currentUser = auth.currentUser;
  pc = new RTCPeerConnection(servers);
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();

  // Add local stream tracks
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
pc.ontrack = (event) => {
  if (event.streams && event.streams[0]) {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  } else if (event.track) {
    remoteStream.addTrack(event.track);
  }
};



  const callRef = doc(collection(db, 'calls'));
  const candidatesRef = collection(callRef, 'iceCandidates');

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      addDoc(candidatesRef, {
        candidate: e.candidate.toJSON(),
        sender: currentUser.uid,
      });
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await setDoc(callRef, {
    callerId: currentUser.uid,
    calleeId,
    offer: {
      type: offer.type,
      sdp: offer.sdp
    },
    status: 'calling',
    timestamp: Date.now()
  });


   // 🔔 Log call start in chat
  await logCallMessage({ chatId, senderId: currentUser.uid, type: 'started' });


  // Listen for answer and apply it
  onSnapshot(callRef, (snapshot) => {
    const data = snapshot.data();
    if (pc && data?.answer && !pc.currentRemoteDescription) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(console.error);
    }
  });

  // Buffer candidates
  const remoteCandidates = [];
  let remoteReady = false;

  onSnapshot(candidatesRef, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      if (data.sender !== currentUser.uid) {
        const candidate = new RTCIceCandidate(data.candidate);
        if (remoteReady && pc.remoteDescription) {
          if (pc && pc.remoteDescription) {
  pc.addIceCandidate(candidate).catch(console.error);
}

        } else {
          remoteCandidates.push(candidate);
        }
      }
    });
  });

  // Unblock queued ICE when ready
  pc.onconnectionstatechange = () => {
    if (pc.remoteDescription && !remoteReady) {
      remoteReady = true;
      remoteCandidates.forEach(c => pc.addIceCandidate(c).catch(console.error));
    }
  };

  return new Promise((resolve) => {
  const checkStream = setInterval(() => {
    if (remoteStream.getTracks().length > 0) {
      clearInterval(checkStream);
      resolve({ callId: callRef.id, localStream, remoteStream });
    }
  }, 100);
});

};

export const answerCall = async (callId, chatId) => {
  const callRef = doc(db, 'calls', callId);
  const callSnap = await getDoc(callRef);
  const data = callSnap.data();

  pc = new RTCPeerConnection(servers);
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  remoteStream = new MediaStream();
  const candidateQueue = [];

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
pc.ontrack = (event) => {
  if (event.streams && event.streams[0]) {
    event.streams[0].getTracks().forEach(track => {
      remoteStream.addTrack(track);
    });
  } else if (event.track) {
    remoteStream.addTrack(event.track);
  }
};



  const candidatesRef = collection(callRef, 'iceCandidates');

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      addDoc(candidatesRef, {
        candidate: e.candidate.toJSON(),
        sender: auth.currentUser.uid,
      });
    }
  };

  // Buffer ICE until remote description is set
  onSnapshot(candidatesRef, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      const data = change.doc.data();
      if (data.sender !== auth.currentUser.uid) {
        const candidate = new RTCIceCandidate(data.candidate);
        if (pc.remoteDescription) {
         if (pc && pc.remoteDescription) {
  pc.addIceCandidate(candidate).catch(console.error);
}

        } else {
          candidateQueue.push(candidate);
        }
      }
    });
  });

  await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

  for (const c of candidateQueue) {
    await pc.addIceCandidate(c).catch(console.error);
  }

  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  await updateDoc(callRef, {
    answer: {
      type: answer.type,
      sdp: answer.sdp
    },
    status: 'answered'
  });

   // ✅ Log answer in chat
  await logCallMessage({ chatId, senderId: auth.currentUser.uid, type: 'answered' });

 return new Promise((resolve) => {
  const checkStream = setInterval(() => {
    if (remoteStream.getTracks().length > 0) {
      clearInterval(checkStream);
      resolve({ localStream, remoteStream });
    }
  }, 100);
});

};

export const listenForCall = (userId, onIncomingCall) => {
  return onSnapshot(doc(db, 'calls', userId), (snap) => {
    if (snap.exists() && snap.data().calleeId === userId && snap.data().status === 'calling') {
      onIncomingCall({ callId: snap.id, ...snap.data() });
    }
  });
};

export const closeCall = async (callId, chatId = null, callerId = null, startTime = null) => {
  try {
    const callRef = doc(db, 'calls', callId);
    await updateDoc(callRef, { status: 'ended' });

    // 🕒 Log call ended message if chatId and callerId are provided
    if (chatId && callerId && startTime) {
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins} min ${secs} sec`;
      };
      const durationFormatted = formatDuration(durationSec);

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: callerId,
        type: 'call',
        text: `📵 Call ended. Duration: ${durationFormatted}`,
        timestamp: serverTimestamp(),
        seen: false,
      });
    }
  } catch (e) {
    console.error("Failed to close call:", e);
  }

  if (pc) {
    pc.close();
    pc = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  if (remoteStream) {
    remoteStream = null;
  }
};




export const logCallMessage = async ({ chatId, senderId, type, duration = null }) => {
  let text = '';

  switch (type) {
    case 'started':
      text = '📞 Video call started.';
      break;
    case 'answered':
      text = '✅ Video call answered.';
      break;
    case 'declined':
      text = '❌ Video call declined.';
      break;
    case 'missed':
      text = '🚫 Missed video call.';
      break;
    case 'ended':
      text = `📵 Call ended. Duration: ${duration || '0s'}`;
      break;
    default:
      return;
  }

  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    type: 'call',
    text,
    timestamp: serverTimestamp(),
    seen: false,
  });
};

