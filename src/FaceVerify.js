import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Box
} from "@mui/material";
import Lottie from "lottie-react";
import verifyAnim from "./assets/verify.json";
import successAnim from "./assets/success.json";



export default function FaceVerify() {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const { state } = useLocation(); // { uid, nextRoute }

  useEffect(() => {
    const loadModels = async () => {
      const base = "/models";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(`${base}/tiny_face_detector`),
        faceapi.nets.faceLandmark68Net.loadFromUri(`${base}/face_landmark_68`),
        faceapi.nets.faceRecognitionNet.loadFromUri(`${base}/face_recognition`)
      ]);
      setModelsLoaded(true);
    };
    loadModels().catch(err => {
      console.error("Model loading failed:", err);
      alert("Face verification models failed to load.");
    });
  }, []);

  const handleVerify = async () => {
    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();
    const img = await faceapi.fetchImage(imageSrc);
    const result = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) {
      alert("No face detected. Try again.");
      setLoading(false);
      return;
    }

    const userSnap = await getDoc(doc(db, "users", state.uid));
    const stored = userSnap.data()?.faceDescriptor;
    if (!stored) {
      alert("No face reference found. Redirecting to enroll.");
      navigate("/face-enroll", { state: { uid: state.uid, accountType: userSnap.data()?.accountType } });
      return;
    }

    const distance = faceapi.euclideanDistance(stored, result.descriptor);
   if (distance < 0.55) {
  setVerifying(true);        // Start "verifying..." animation
  setLoading(false);         // Stop loading spinner on button

  setTimeout(() => {
    setVerifying(false);     // Hide verifying animation
    setVerified(true);       // Show "Verified ✅" animation

    setTimeout(() => {
      navigate(state.nextRoute); // Final redirect to dashboard
    }, 2000); // 2 sec success animation
  }, 3000); // 3 sec verifying animation
} else {
  alert("Face mismatch. Access denied.");
  setLoading(false);
}

};

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 6, p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box textAlign="center" mb={3}>
          <img src="/logo.png" alt="Logo" style={{ height: 50, marginBottom: 8 }} />
          <Typography variant="h5" fontWeight="bold">Verify Your Face</Typography>
          <Typography variant="body2" color="text.secondary">
            Look straight at the camera to confirm your identity.
          </Typography>
        </Box>

        {verifying ? (
        <Box textAlign="center">
          <Lottie animationData={verifyAnim} style={{ height: 250 }} />
          <Typography variant="body1" mt={2}>Verifying identity...</Typography>
        </Box>
      ) : verified ? (
        <Box textAlign="center">
          <Lottie animationData={successAnim} style={{ height: 200 }} />
          <Typography variant="h6" mt={1} color="green">Verified</Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              mb: 2,
              border: "1px solid #ccc"
            }}
          >
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              style={{ width: "100%", aspectRatio: "4/3" }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            onClick={handleVerify}
            disabled={!modelsLoaded || loading}
          >
            {loading ? <CircularProgress size={24} /> : "Verify & Continue"}
          </Button>
        </>
      )}
    </Paper>
  </Container>
);
}