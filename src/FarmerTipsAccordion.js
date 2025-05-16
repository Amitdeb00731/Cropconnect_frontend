import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import Lottie from 'lottie-react';
import tipsAnim from './assets/tips.json';

const tips = [
  {
    title: 'How to price your rice correctly?',
    content: 'Research local market rates and set a fair asking price. Keep quality in mind — better quality earns more.'
  },
  {
    title: 'When to list your harvest?',
    content: 'List early in the morning for better visibility. Use clear photos and updated quantity.'
  },
  {
    title: 'Handling inspection requests',
    content: 'Prepare your harvest, store it cleanly, and be responsive when middlemen initiate inspections.'
  },
  {
    title: 'Getting better deals',
    content: 'Be transparent with quality and quantity. Negotiate politely and maintain your deal history.'
  },
];

const FarmerTipsAccordion = () => {
  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" textAlign="center" fontWeight={600} mb={2}>
        <LightbulbIcon sx={{ mb: '-4px', mr: 1, color: '#f9a825' }} />
        Helpful Tips for Farmers
      </Typography>

     <Box display="flex" justifyContent="center" mb={2}>
        <Box sx={{ maxWidth: 180 }}>
          <Lottie animationData={tipsAnim} loop style={{ width: '100%' }} />
        </Box>
      </Box>

      {tips.map((tip, i) => (
        <Accordion key={i} sx={{ borderRadius: 2, mb: 1, boxShadow: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={600}>{tip.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {tip.content}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
      </Box>
  );
};

export default FarmerTipsAccordion;
