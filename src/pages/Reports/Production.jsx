import React from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  MenuItem,
  Card,
  CardContent,
} from "@mui/material";
import { motion } from "framer-motion";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import DateRangeIcon from "@mui/icons-material/DateRange";
import FilterListIcon from "@mui/icons-material/FilterList";

const Production = () => {
  const productionData = [
    { product: "Product A", output: 1200, target: 1100, efficiency: 92, status: "Above Target" },
    { product: "Product B", output: 850, target: 900, efficiency: 94, status: "On Target" },
    { product: "Product C", output: 650, target: 700, efficiency: 93, status: "Slightly Below" },
    { product: "Product D", output: 950, target: 850, efficiency: 96, status: "Above Target" },
    { product: "Product E", output: 720, target: 750, efficiency: 91, status: "On Target" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h4" fontWeight={600}>
            Production Report
          </Typography>
          
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              select
              size="small"
              defaultValue="monthly"
              startIcon={<DateRangeIcon />}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
            </TextField>
            
            <Button variant="outlined" startIcon={<FilterListIcon />}>
              Filter
            </Button>
            
            <Button variant="contained" color="primary">
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Output
                </Typography>
                <Typography variant="h4">4,370</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <TrendingUpIcon sx={{ color: "success.main", mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    +12.5% from last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Average Efficiency
                </Typography>
                <Typography variant="h4">93.2%</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <TrendingUpIcon sx={{ color: "success.main", mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    +2.3% improvement
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Defect Rate
                </Typography>
                <Typography variant="h4">1.8%</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <TrendingDownIcon sx={{ color: "success.main", mr: 1 }} />
                  <Typography variant="body2" color="success.main">
                    -0.4% reduction
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Downtime
                </Typography>
                <Typography variant="h4">2.4 hrs</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <TrendingDownIcon sx={{ color: "error.main", mr: 1 }} />
                  <Typography variant="body2" color="error.main">
                    +0.8 hrs increase
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Production Table */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Production by Product Line
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell><strong>Product</strong></TableCell>
                  <TableCell align="right"><strong>Output</strong></TableCell>
                  <TableCell align="right"><strong>Target</strong></TableCell>
                  <TableCell align="right"><strong>Efficiency (%)</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {productionData.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.product}</TableCell>
                    <TableCell align="right">{row.output.toLocaleString()}</TableCell>
                    <TableCell align="right">{row.target.toLocaleString()}</TableCell>
                    <TableCell align="right">{row.efficiency}%</TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 2,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: row.status === "Above Target" ? "success.light" : 
                                   row.status === "On Target" ? "info.light" : "warning.light",
                          color: row.status === "Above Target" ? "success.dark" : 
                                 row.status === "On Target" ? "info.dark" : "warning.dark",
                        }}
                      >
                        {row.status}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Additional Insights */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Key Insights
              </Typography>
              <ul style={{ paddingLeft: 20 }}>
                <li><Typography variant="body1">Product D shows highest efficiency at 96%</Typography></li>
                <li><Typography variant="body1">Overall production exceeds target by 5.2%</Typography></li>
                <li><Typography variant="body1">Morning shift shows 15% higher output than evening</Typography></li>
                <li><Typography variant="body1">Maintenance scheduled for next week may impact output</Typography></li>
              </ul>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Recommendations
              </Typography>
              <ul style={{ paddingLeft: 20 }}>
                <li><Typography variant="body1">Increase raw material stock for Product A</Typography></li>
                <li><Typography variant="body1">Review evening shift scheduling</Typography></li>
                <li><Typography variant="body1">Implement preventive maintenance program</Typography></li>
                <li><Typography variant="body1">Consider cross-training for machine operators</Typography></li>
              </ul>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default Production;