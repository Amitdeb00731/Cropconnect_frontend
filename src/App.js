import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RegisterFarmer from "./RegisterFarmer";
import Login from "./Login";
import LandingPage from "./LandingPage";
import FarmerDashboard from "./FarmerDashboard";
import MiddlemanDashboard from "./MiddlemanDashboard";
import ProtectedRoute from "./ProtectedRoute"; // import the new ProtectedRoute
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import CompleteProfile from "./CompleteProfile";
import MillDashboard from './MillDashboard';
import { VideoCallProvider } from './VideoCallManager';
import IncomingCallDialog from './IncomingCallDialog';
import VideoCallUI from './VideoCallUI';
import VideoCallUIWrapper from "./VideoCallUIWrapper";



function App() {
  const [user, setUser] = useState(null);
  const [accountType, setAccountType] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setAccountType(userDoc.data().accountType);
        }
      } else {
        setAccountType("");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <VideoCallProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterFarmer />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/farmer-dashboard"
          element={
            <ProtectedRoute allowedAccountType="farmer">
              <FarmerDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/middleman-dashboard"
          element={
            <ProtectedRoute allowedAccountType="middleman">
              <MiddlemanDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route
  path="/mill-dashboard"
  element={
    <ProtectedRoute allowedAccountType="mill">
      <MillDashboard />
    </ProtectedRoute>
  }
/>

      </Routes>

     
    </Router>
     <IncomingCallDialog />
     <VideoCallUIWrapper />
    </VideoCallProvider>
  );
}

export default App;
