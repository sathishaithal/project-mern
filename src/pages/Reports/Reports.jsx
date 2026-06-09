import React from "react";
import { Box, Grid, Paper, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TimelineIcon from "@mui/icons-material/Timeline";
import { useColorMode } from "../../theme/ThemeContext";
import SummaryCardsSystem from "../../components/SummaryCardsSystem/SummaryCardsSystem";

const Reports = () => {
  const navigate = useNavigate();
  const { selectedAccent } = useColorMode();
  const accent  = selectedAccent?.primary   || '#1a237e';
  const accent2 = selectedAccent?.secondary || '#283593';

  const reportCards = [
    {
      title: "Production Report",
      description: "View manufacturing output, efficiency metrics, and production timelines",
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      path: "/reports/production",
      color: "#1976d2",
    },
    {
      title: "Sales Report",
      description: "Month-wise and year-on-year sales performance with multi-year drill-down",
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      path: "/reports/sales",
      color: "#2e7d32",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Box>
        <SummaryCardsSystem context="reports" accent={accent} accent2={accent2} />

        <Typography variant="h4" gutterBottom fontWeight={600}>
          Reports Dashboard
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Generate and analyze comprehensive reports across all business departments.
          Select a report type to view detailed analytics and insights.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {reportCards.map((card, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 6,
                  },
                }}
              >
                <Box sx={{ color: card.color, mb: 2 }}>
                  {card.icon}
                </Box>
                
                <Typography variant="h6" gutterBottom fontWeight={600}>
                  {card.title}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, mb: 3 }}>
                  {card.description}
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(card.path)}
                    sx={{ flexGrow: 1 }}
                  >
                    View Report
                  </Button>
                  
                  {/* <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                  >
                    Export
                  </Button> */}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

      </Box>
    </motion.div>
  );
};

export default Reports;