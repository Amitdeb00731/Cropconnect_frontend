// ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ProtectedRoute({ children, allowedAccountType }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists() && docSnap.data().accountType === allowedAccountType) {
          setAuthorized(true);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedAccountType]);

  if (loading) return null;
  return authorized ? children : <Navigate to="/login" />;
}
