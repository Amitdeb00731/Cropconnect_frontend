import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import {
  Container,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Box,
  Divider
} from "@mui/material";

export default function FaceEnroll() {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation(); // { uid, accountType }

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
      console.error("Error loading models:", err);
      alert("Face recognition models failed to load.");
    });
  }, []);

  const handleCapture = async () => {
    setLoading(true);
    const imageSrc = webcamRef.current.getScreenshot();
    const img = await faceapi.fetchImage(imageSrc);
    const result = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) {
      alert("Face not detected. Please try again.");
      setLoading(false);
      return;
    }

    const embedding = Array.from(result.descriptor);
    await setDoc(doc(db, "users", state.uid), {
      faceEnrolled: true,
      faceDescriptor: embedding
    }, { merge: true });

    navigate("/face-verify", {
      state: { uid: state.uid, nextRoute: `/${state.accountType}-dashboard` }
    });
  };

  return (
    <Container maxWidth="sm">
      <Paper sx={{ mt: 6, p: 4, borderRadius: 3, boxShadow: 3 }}>
        <Box textAlign="center" mb={3}>
          <img src="/logo.png" alt="Logo" style={{ height: 50, marginBottom: 8 }} />
          <Typography variant="h5" fontWeight="bold">Enroll Your Face</Typography>
          <Typography variant="body2" color="text.secondary">
            This is required for secure login. Please look directly at the camera.
          </Typography>
        </Box>

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
          size="large"
          onClick={handleCapture}
          disabled={!modelsLoaded || loading}
        >
          {loading ? <CircularProgress size={24} /> : "Capture & Save"}
        </Button>
      </Paper>
    </Container>
  );
}
