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
  Chip,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import { motion } from "framer-motion";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import InventoryIcon from "@mui/icons-material/Inventory";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TimelineIcon from "@mui/icons-material/Timeline";

const Inventory = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = React.useState(null);

  const inventoryData = [
    { 
      item: "Premium Widget", 
      sku: "PW-1001", 
      current: 450, 
      min: 100, 
      max: 800, 
      status: "In Stock",
      category: "Electronics" 
    },
    { 
      item: "Standard Gadget", 
      sku: "SG-2002", 
      current: 85, 
      min: 150, 
      max: 500, 
      status: "Low Stock",
      category: "Hardware" 
    },
    { 
      item: "Deluxe Toolset", 
      sku: "DT-3003", 
      current: 220, 
      min: 50, 
      max: 300, 
      status: "In Stock",
      category: "Tools" 
    },
    { 
      item: "Basic Kit", 
      sku: "BK-4004", 
      current: 10, 
      min: 25, 
      max: 200, 
      status: "Critical",
      category: "Accessories" 
    },
    { 
      item: "Professional Bundle", 
      sku: "PB-5005", 
      current: 180, 
      min: 30, 
      max: 250, 
      status: "In Stock",
      category: "Professional" 
    },
  ];

  const stats = [
    { title: "Total Items", value: "945", change: "+12", color: "primary" },
    { title: "Low Stock", value: "23", change: "-5", color: "warning" },
    { title: "Out of Stock", value: "7", change: "+2", color: "error" },
    { title: "Total Value", value: "$245K", change: "+8.5%", color: "success" },
  ];

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header Section */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 3,
          gap: 2 
        }}>
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Inventory Report
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time inventory tracking and stock management
            </Typography>
          </Box>
          
          <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" } }}>
            <Button 
              variant="outlined" 
              size={isMobile ? "small" : "medium"}
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Filter
            </Button>
            <Button 
              variant="contained" 
              size={isMobile ? "small" : "medium"}
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Update Stock
            </Button>
            <IconButton onClick={handleMenuOpen} sx={{ display: { xs: "none", sm: "flex" } }}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Stats Cards - Responsive Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    {stat.title}
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontSize: { xs: "1.25rem", sm: "1.5rem" },
                      fontWeight: 600,
                      mt: 0.5 
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Chip
                    label={stat.change}
                    size="small"
                    color={stat.color}
                    sx={{ 
                      mt: 1,
                      fontSize: { xs: "0.7rem", sm: "0.8rem" }
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Inventory Table - Responsive */}
        <Paper sx={{ 
          p: { xs: 1, sm: 2, md: 3 }, 
          borderRadius: 3,
          overflow: "auto" 
        }}>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            mb: 2 
          }}>
            <Typography variant="h6" fontWeight={600}>
              Current Inventory
            </Typography>
            <Button 
              size="small" 
              startIcon={<TimelineIcon />}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              View Trends
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: { xs: 400, md: 500 } }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell><strong>Item</strong></TableCell>
                  {!isMobile && <TableCell><strong>SKU</strong></TableCell>}
                  <TableCell align="right"><strong>Stock</strong></TableCell>
                  {!isMobile && (
                    <>
                      <TableCell align="right"><strong>Min</strong></TableCell>
                      <TableCell align="right"><strong>Max</strong></TableCell>
                    </>
                  )}
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {inventoryData.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {row.item}
                        </Typography>
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary">
                            {row.sku}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    {!isMobile && <TableCell>{row.sku}</TableCell>}
                    <TableCell align="right">
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "flex-end",
                        gap: 1 
                      }}>
                        {row.current}
                        {isMobile && (
                          <Typography variant="caption" color="text.secondary">
                            /{row.max}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    {!isMobile && (
                      <>
                        <TableCell align="right">{row.min}</TableCell>
                        <TableCell align="right">{row.max}</TableCell>
                      </>
                    )}
                    <TableCell align="center">
                      <Chip
                        icon={row.status === "Critical" ? <WarningIcon /> : <CheckCircleIcon />}
                        label={row.status}
                        size={isMobile ? "small" : "medium"}
                        color={
                          row.status === "In Stock" ? "success" :
                          row.status === "Low Stock" ? "warning" : "error"
                        }
                        sx={{ 
                          minWidth: { xs: 80, sm: 100 },
                          fontSize: { xs: "0.7rem", sm: "0.8rem" }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Mobile Actions */}
          {isMobile && (
            <Box sx={{ display: "flex", gap: 1, mt: 2, justifyContent: "center" }}>
              <Button size="small" variant="outlined" fullWidth>
                View All
              </Button>
              <Button size="small" variant="contained" fullWidth>
                Order Items
              </Button>
            </Box>
          )}
        </Paper>

        {/* Action Cards - Responsive Layout */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <InventoryIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Quick Actions</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button variant="outlined" size="small">
                    Generate Reorder List
                  </Button>
                  <Button variant="outlined" size="small">
                    Export Inventory
                  </Button>
                  <Button variant="outlined" size="small">
                    Set Alerts
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Alerts</Typography>
                </Box>
                <Box sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>
                  <Typography variant="body2" color="error" gutterBottom>
                    • 3 items below minimum stock
                  </Typography>
                  <Typography variant="body2" color="warning" gutterBottom>
                    • 5 items need expiry check
                  </Typography>
                  <Typography variant="body2" color="info" gutterBottom>
                    • Next audit in 7 days
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall inventory health is good. Monitor low-stock items and 
                  consider bulk ordering for fast-moving products.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  size={isMobile ? "small" : "medium"}
                >
                  Generate Full Report
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Menu for larger screens */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Export Report</MenuItem>
        <MenuItem onClick={handleMenuClose}>Print Summary</MenuItem>
        <MenuItem onClick={handleMenuClose}>Email Report</MenuItem>
      </Menu>
    </motion.div>
  );
};

export default Inventory;