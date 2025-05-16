import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EngineeringIcon from '@mui/icons-material/Engineering';
import Lottie from 'lottie-react';

// ✅ Optional animation
import tipsAnim from './assets/tips.json';

const tips = [
  {
    title: 'Prioritize urgent processing requests',
    content:
      'Use the request timestamps to process the oldest first. Confirm time slots quickly to maintain throughput.'
  },
  {
    title: 'Track lots actively',
    content:
      'Always update the status after every stage. This improves transparency and avoids disputes.'
  },
  {
    title: 'Coordinate with middlemen',
    content:
      'Notify middlemen when processing is complete. Build reliable, recurring relationships.'
  },
  {
    title: 'Maintain hygiene and consistency',
    content:
      'Keep machinery clean and processing consistent to maintain quality and avoid complaints.'
  }
];

const MillTipsAccordion = () => {
  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" textAlign="center" fontWeight={600} mb={2}>
        <EngineeringIcon sx={{ mb: '-4px', mr: 1, color: '#5e35b1' }} />
        Helpful Tips for Mill Operators
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

export default MillTipsAccordion;
