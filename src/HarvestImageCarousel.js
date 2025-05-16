import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MobileStepper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useSwipeable } from 'react-swipeable';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import CloseIcon from '@mui/icons-material/Close';

export default function HarvestImageCarousel({ images }) {
  const [activeStep, setActiveStep] = useState(0);
  const [zoomedImg, setZoomedImg] = useState(null);
  const maxSteps = images?.length || 0;

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % maxSteps);
  };

  const handleBack = () => {
    setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handleBack,
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  // ✅ MOBILE VIEW: Swipeable Carousel
  if (isMobile) {
    return (
      <Box {...swipeHandlers} sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={images?.[activeStep] || 'https://via.placeholder.com/300x180?text=No+Image'}
          alt={`Image ${activeStep + 1}`}
          sx={{
            width: '100%',
            height: 180,
            objectFit: 'cover',
            borderRadius: 2,
            userSelect: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setZoomedImg(images?.[activeStep])}
        />
        {maxSteps > 1 && (
          <MobileStepper
            steps={maxSteps}
            position="static"
            activeStep={activeStep}
            sx={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              justifyContent: 'space-between',
              mt: 1,
              px: 1
            }}
            nextButton={<Button size="small" onClick={handleNext}><KeyboardArrowRight /></Button>}
            backButton={<Button size="small" onClick={handleBack}><KeyboardArrowLeft /></Button>}
          />
        )}
        <ImageZoomDialog image={zoomedImg} onClose={() => setZoomedImg(null)} />
      </Box>
    );
  }

  // ✅ DESKTOP VIEW: Grid + Zoom on Click
  return (
  <Box sx={{ px: 2, pt: 2 }}>
    <Grid container spacing={1}>
      {(images?.length ? images : ['https://via.placeholder.com/300x180?text=No+Image']).map((img, idx) => (
        <Grid item xs={4} key={idx}>
          <Box
            component="img"
            src={img}
            alt={`Image ${idx + 1}`}
            onClick={() => setZoomedImg(img)}
            sx={{
              width: '100%',
              height: 120,
              objectFit: 'cover',
              borderRadius: 2,
              cursor: 'pointer',
              transition: '0.3s',
              '&:hover': {
                transform: 'scale(1.03)',
                boxShadow: 3
              }
            }}
          />
        </Grid>
      ))}
    </Grid>
    <ImageZoomDialog image={zoomedImg} onClose={() => setZoomedImg(null)} />
  </Box>
);

}

// 🔍 Dialog for Zoomed Image
function ImageZoomDialog({ image, onClose }) {
  return (
    <Dialog open={!!image} onClose={onClose} maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Image Preview
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Box
          component="img"
          src={image}
          alt="Zoomed"
          sx={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 2 }}
        />
      </DialogContent>
    </Dialog>
  );
}
