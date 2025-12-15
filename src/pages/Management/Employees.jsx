import React, { useState } from "react";
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
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  MenuItem 
} from "@mui/material";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

const Employees = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openDialog, setOpenDialog] = useState(false);

  const employees = [
    {
      id: 1,
      name: "John Smith",
      position: "Production Manager",
      department: "Production",
      email: "john@company.com",
      phone: "+1 (555) 123-4567",
      status: "Active",
      joinDate: "2022-03-15",
      avatarColor: "#1976d2",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      position: "Sales Executive",
      department: "Sales",
      email: "sarah@company.com",
      phone: "+1 (555) 234-5678",
      status: "Active",
      joinDate: "2021-08-22",
      avatarColor: "#2e7d32",
    },
    {
      id: 3,
      name: "Michael Chen",
      position: "Inventory Supervisor",
      department: "Warehouse",
      email: "michael@company.com",
      phone: "+1 (555) 345-6789",
      status: "On Leave",
      joinDate: "2020-11-30",
      avatarColor: "#ed6c02",
    },
    {
      id: 4,
      name: "Emma Wilson",
      position: "Quality Analyst",
      department: "Quality Control",
      email: "emma@company.com",
      phone: "+1 (555) 456-7890",
      status: "Active",
      joinDate: "2023-01-10",
      avatarColor: "#9c27b0",
    },
    {
      id: 5,
      name: "David Brown",
      position: "Maintenance Tech",
      department: "Maintenance",
      email: "david@company.com",
      phone: "+1 (555) 567-8901",
      status: "Active",
      joinDate: "2022-06-18",
      avatarColor: "#d32f2f",
    },
  ];

  const stats = [
    { label: "Total Employees", value: "48", change: "+5" },
    { label: "Active Now", value: "42", change: "96%" },
    { label: "On Leave", value: "6", change: "4%" },
    { label: "New This Month", value: "3", change: "+2" },
  ];

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 3,
          gap: 2 
        }}>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              Employee Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage employee records and department assignments
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setOpenDialog(true)}
            size={isMobile ? "small" : "medium"}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Add Employee
          </Button>
        </Box>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: "center" }}>
                  <Typography 
                    variant="h4" 
                    fontWeight={700}
                    sx={{ fontSize: { xs: "1.5rem", sm: "2rem" } }}
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
                  <Chip
                    label={stat.change}
                    size="small"
                    color="success"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Search and Filter */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={8}>
              <TextField
                fullWidth
                placeholder="Search employees..."
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterListIcon />}
                size="small"
              >
                Filter
              </Button>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => setOpenDialog(true)}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Employees Table */}
        <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
          <TableContainer sx={{ maxHeight: { xs: 500, md: 600 } }}>
            <Table size={isMobile ? "small" : "medium"}>
              <TableHead>
                <TableRow sx={{ bgcolor: "primary.light" }}>
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>Employee</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Department</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: 600 }}>Contact</TableCell>
                    </>
                  )}
                  <TableCell sx={{ color: "white", fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar sx={{ bgcolor: employee.avatarColor }}>
                          {getInitials(employee.name)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {employee.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employee.position}
                          </Typography>
                          {isMobile && (
                            <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                              <Typography variant="caption">{employee.department}</Typography>
                              <Chip
                                label={employee.status}
                                size="small"
                                color={employee.status === "Active" ? "success" : "warning"}
                              />
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    
                    {!isMobile && (
                      <>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <EmailIcon fontSize="small" />
                              <Typography variant="caption">{employee.email}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                              <PhoneIcon fontSize="small" />
                              <Typography variant="caption">{employee.phone}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </>
                    )}
                    
                    {!isMobile && (
                      <TableCell>
                        <Chip
                          label={employee.status}
                          color={employee.status === "Active" ? "success" : "warning"}
                          size="small"
                        />
                      </TableCell>
                    )}
                    
                    <TableCell align="right">
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <IconButton size="small" color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Department Distribution */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Department Distribution
                </Typography>
                {["Production", "Sales", "Warehouse", "Quality Control", "Maintenance"].map(
                  (dept, index) => (
                    <Box
                      key={dept}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 1,
                        borderBottom: index < 4 ? "1px solid #eee" : "none",
                      }}
                    >
                      <Typography variant="body2">{dept}</Typography>
                      <Chip label={`${8 + index * 2} employees`} size="small" />
                    </Box>
                  )
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Button variant="outlined" size="small">
                    Export Employee Data
                  </Button>
                  <Button variant="outlined" size="small">
                    View Attendance Report
                  </Button>
                  <Button variant="outlined" size="small">
                    Generate Payroll
                  </Button>
                  <Button variant="outlined" size="small">
                    Schedule Training
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Add Employee Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Department" size="small" select>
                <MenuItem value="production">Production</MenuItem>
                <MenuItem value="sales">Sales</MenuItem>
                <MenuItem value="warehouse">Warehouse</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Position" size="small" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setOpenDialog(false)}>
            Add Employee
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default Employees;