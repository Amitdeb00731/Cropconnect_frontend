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
  const [error, setError] = useState("");

  const [faceInside, setFaceInside] = useState(false);



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


  

  useEffect(() => {
  let interval;

  const checkCentering = async () => {
    if (!modelsLoaded) return;

    interval = setInterval(async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;

        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();

        if (
  !detection ||
  !detection.detection ||
  detection.detection.box.x === undefined ||
  webcamRef.current?.video?.videoWidth === 0
) {
  setFaceInside(false);
  return;
}


        // Get face bounding box center
        const { x, y, width, height } = detection.detection.box;
        const faceCenterX = x + width / 2;
        const faceCenterY = y + height / 2;

        // Get video frame center
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const videoCenterX = videoWidth / 2;
        const videoCenterY = videoHeight / 2;

        // Define a tolerance box (center window)
        const tolerance = 100; // pixels

        const isCentered =
          Math.abs(faceCenterX - videoCenterX) < tolerance &&
          Math.abs(faceCenterY - videoCenterY) < tolerance;

        setFaceInside(isCentered); // Only green if face is centered
      } else {
        setFaceInside(false);
      }
    }, 500);
  };

  checkCentering();

  return () => clearInterval(interval);
}, [modelsLoaded]);







  const handleVerify = async () => {
    setLoading(true);
    setError(""); // Clear previous errors
  setFaceInside(false); // Reset visual state


    const imageSrc = webcamRef.current.getScreenshot();
    const img = await faceapi.fetchImage(imageSrc);
    const result = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) {
      setFaceInside(false);
      setError("No face detected. Try again.");
      setLoading(false);
      return;
    }

     setFaceInside(true);

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
   setFaceInside(false); 
  setError("Face not recognized. Please align properly and try again.");
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
          {!verifying && !verified && (
  <Typography
    variant="body2"
    color={faceInside ? "success.main" : "error"}
    align="center"
    sx={{ mb: 1, fontWeight: 500 }}
  >
    {faceInside
      ? "Face centered! Ready to verify ✅"
      : "Align your face in the center of the frame"}
  </Typography>
)}


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
) : error ? (
  <Box textAlign="center">
    <Typography variant="body1" color="error" mb={2}>{error}</Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={() => {
        setError("");
        setVerified(false);
        setVerifying(false);
        setFaceInside(false);
      }}
    >
      Try Again
    </Button>
  </Box>
) : (
  <>
    <Box
      sx={{
        position: "relative",
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

      {/* 3x3 Grid Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
        }}
      >
        {[...Array(9)].map((_, i) => (
          <Box key={i} sx={{ border: "1px solid rgba(0,0,0,0.2)" }} />
        ))}
      </Box>
        {/* Face Centering Circle */}
  {/* Face Centering Oval with Pulse & Color */}
<Box
  sx={{
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "60%",
    height: "70%",
    borderRadius: "50% / 60%",
    border: faceInside
      ? "4px solid #4caf50" // green if centered
      : "3px dashed #f44336", // red if off-center or missing

    animation: faceInside
      ? "pulse 2s infinite ease-in-out"
      : "none",

    pointerEvents: "none",
    zIndex: 2,

    '@keyframes pulse': {
      '0%': {
        boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.4)',
      },
      '70%': {
        boxShadow: '0 0 0 20px rgba(76, 175, 80, 0)',
      },
      '100%': {
        boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
      }
    }
  }}
/>


    </Box>

    <Button
  fullWidth
  variant="contained"
  color="success"
  size="large"
  onClick={handleVerify}
  disabled={!modelsLoaded || loading || !faceInside} // ⛔ if not centered
>
  {loading ? <CircularProgress size={24} /> : "Verify & Continue"}
</Button>
  </>
)}
    </Paper>
  </Container>
);
}