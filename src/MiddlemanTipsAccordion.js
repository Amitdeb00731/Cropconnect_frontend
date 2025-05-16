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

// ✅ Optional animation (you can remove this if not needed)
import tipsAnim from './assets/tips.json';

const tips = [
  {
    title: 'How to write smart proposals?',
    content:
      'Include fair pricing, expected inspection time, and clear communication. Be transparent to gain trust.'
  },
  {
    title: 'Handling inspection rejections',
    content:
      'Review the farmer’s notes and follow up with improvements. Respectful discussion often helps seal the deal.'
  },
  {
    title: 'Managing your inventory',
    content:
      'Update your inventory regularly. Mark sold items and add milled items once delivered.'
  },
  {
    title: 'Working with mills effectively',
    content:
      'Choose mills with short turnaround times. Track processing and avoid delays in inventory addition.'
  }
];

const MiddlemanTipsAccordion = () => {
  return (
    <Box sx={{ px: 2, py: 4 }}>
      <Typography variant="h6" textAlign="center" fontWeight={600} mb={2}>
        <LightbulbIcon sx={{ mb: '-4px', mr: 1, color: '#fbc02d' }} />
        Helpful Tips for Middlemen
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

export default MiddlemanTipsAccordion;
