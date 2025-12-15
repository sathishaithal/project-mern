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
  TextField,
  Avatar,
  Card,
  CardContent,
  Rating,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import BusinessIcon from "@mui/icons-material/Business";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PaymentIcon from "@mui/icons-material/Payment";
import ContactPhoneIcon from "@mui/icons-material/ContactPhone";

const Vendors = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const vendors = [
    {
      id: 1,
      name: "Tech Supplies Inc.",
      category: "Electronics",
      contact: "Robert Johnson",
      email: "robert@techsupplies.com",
      phone: "+1 (555) 123-7890",
      rating: 4.5,
      status: "Active",
      orders: 45,
    },
    {
      id: 2,
      name: "Global Materials Ltd.",
      category: "Raw Materials",
      contact: "Maria Garcia",
      email: "maria@globalmaterials.com",
      phone: "+1 (555) 234-8901",
      rating: 4.2,
      status: "Active",
      orders: 32,
    },
    {
      id: 3,
      name: "Precision Tools Co.",
      category: "Tools",
      contact: "James Wilson",
      email: "james@precisiontools.com",
      phone: "+1 (555) 345-9012",
      rating: 4.8,
      status: "Preferred",
      orders: 67,
    },
    {
      id: 4,
      name: "Packaging Solutions",
      category: "Packaging",
      contact: "Lisa Chen",
      email: "lisa@packagingsolutions.com",
      phone: "+1 (555) 456-0123",
      rating: 3.9,
      status: "Active",
      orders: 28,
    },
    {
      id: 5,
      name: "Office Supplies Pro",
      category: "Office",
      contact: "David Miller",
      email: "david@officesupplies.com",
      phone: "+1 (555) 567-1234",
      rating: 4.1,
      status: "Inactive",
      orders: 12,
    },
  ];

  const stats = [
    { icon: <BusinessIcon />, label: "Total Vendors", value: "24", color: "primary" },
    { icon: <LocalShippingIcon />, label: "Active Orders", value: "18", color: "success" },
    { icon: <PaymentIcon />, label: "Pending Payments", value: "7", color: "warning" },
    { icon: <ContactPhoneIcon />, label: "New This Month", value: "3", color: "info" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Vendor Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage vendor relationships, track orders, and monitor performance
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ 
                  p: { xs: 1.5, sm: 2 }, 
                  textAlign: "center" 
                }}>
                  <Box sx={{ 
                    color: `${stat.color}.main`, 
                    mb: 1,
                    display: "flex",
                    justifyContent: "center"
                  }}>
                    {stat.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    fontWeight={700}
                    sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" } }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}
                  >
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Action Bar */}
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { xs: "stretch", sm: "center" }
        }}>
          <TextField
            placeholder="Search vendors..."
            size="small"
            sx={{ flex: 1 }}
            fullWidth={isMobile}
          />
          <Box sx={{ 
            display: "flex", 
            gap: 1,
            width: { xs: "100%", sm: "auto" }
          }}>
            <Button 
              variant="outlined" 
              size="small"
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Filter
            </Button>
            <Button 
              variant="contained" 
              size="small"
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Add Vendor
            </Button>
          </Box>
        </Paper>

        {/* Vendors Table */}
        <Paper sx={{ borderRadius: 3, overflow: "auto" }}>
          <TableContainer>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow sx={{ bgcolor: "action.hover" }}>
                  <TableCell><strong>Vendor</strong></TableCell>
                  {!isMobile && <TableCell><strong>Category</strong></TableCell>}
                  <TableCell><strong>Rating</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: "primary.light" }}>
                          <BusinessIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {vendor.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {vendor.contact}
                          </Typography>
                          {isMobile && (
                            <Typography variant="caption" display="block">
                              {vendor.category}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {!isMobile && (
                      <TableCell>
                        <Chip label={vendor.category} size="small" />
                      </TableCell>
                    )}
                    
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Rating 
                          value={vendor.rating} 
                          precision={0.5} 
                          size="small" 
                          readOnly 
                        />
                        <Typography variant="body2">
                          {vendor.rating}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={vendor.status}
                        size="small"
                        color={
                          vendor.status === "Active" ? "success" :
                          vendor.status === "Preferred" ? "primary" : "default"
                        }
                      />
                    </TableCell>
                    
                    <TableCell align="right">
                      <Box sx={{ 
                        display: "flex", 
                        gap: 1, 
                        justifyContent: { xs: "center", sm: "flex-end" }
                      }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            minWidth: { xs: "auto", sm: 80 },
                            px: { xs: 1, sm: 2 }
                          }}
                        >
                          View
                        </Button>
                        {!isMobile && (
                          <Button size="small" variant="contained">
                            Order
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Mobile Order Button */}
          {isMobile && (
            <Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
              <Button variant="contained" fullWidth>
                Place New Order
              </Button>
            </Box>
          )}
        </Paper>

        {/* Vendor Performance */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vendor Performance
                </Typography>
                <Box sx={{ 
                  display: "flex", 
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  alignItems: "center"
                }}>
                  {vendors.slice(0, 3).map((vendor) => (
                    <Paper 
                      key={vendor.id} 
                      sx={{ 
                        p: 2, 
                        flex: 1, 
                        textAlign: "center",
                        width: { xs: "100%", sm: "auto" }
                      }}
                    >
                      <Typography variant="body2" fontWeight={500} gutterBottom>
                        {vendor.name}
                      </Typography>
                      <Chip 
                        label={`${vendor.orders} orders`} 
                        size="small" 
                        color="primary"
                      />
                      <Box sx={{ mt: 1 }}>
                        <Rating value={vendor.rating} size="small" readOnly />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Stats
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Avg. Delivery Time</Typography>
                    <Typography variant="body2" fontWeight={600}>2.5 days</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">On-Time Delivery</Typography>
                    <Typography variant="body2" fontWeight={600}>94%</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">Quality Rating</Typography>
                    <Typography variant="body2" fontWeight={600}>4.3/5</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2">New Vendors</Typography>
                    <Typography variant="body2" fontWeight={600}>3 this month</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default Vendors;