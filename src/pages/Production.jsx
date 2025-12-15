import React from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";  // Changed from Grid2 to Grid
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", output: 5800, target: 6000 },
  { day: "Tue", output: 6200, target: 6000 },
  { day: "Wed", output: 5900, target: 6000 },
  { day: "Thu", output: 6400, target: 6000 },
  { day: "Fri", output: 6800, target: 6500 },
  { day: "Sat", output: 7200, target: 7000 },
];

const Production = () => (
  <Box sx={{ p: 4 }}>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>Production Report</Typography>
    </motion.div>

    <Grid container spacing={4}>
      {/* Use 'item' prop and 'xs' instead of 'size' */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h6" gutterBottom>Daily Output vs Target</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="output" stroke="#ff5722" strokeWidth={4} />
              <Line type="monotone" dataKey="target" stroke="#2196f3" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 4, borderRadius: 4, height: "100%" }}>
          <Typography variant="h6" gutterBottom textAlign="center">Efficiency: 96.8%</Typography>
          <Typography variant="h3" textAlign="center" color="success.main" fontWeight={800}>Excellent</Typography>
        </Paper>
      </Grid>
    </Grid>
  </Box>
);

export default Production;