import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Select,
  MenuItem,
  Divider,
  Alert,
  useMediaQuery,
  useTheme,
  Chip,
  InputAdornment,
} from "@mui/material";
import { motion } from "framer-motion";
import SaveIcon from "@mui/icons-material/Save";
import RestoreIcon from "@mui/icons-material/Restore";
import SecurityIcon from "@mui/icons-material/Security";
import BackupIcon from "@mui/icons-material/Backup";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LanguageIcon from "@mui/icons-material/Language";
import StorageIcon from "@mui/icons-material/Storage";

const SystemSettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [settings, setSettings] = useState({
    // General Settings
    siteName: "Sri Bhagyalaksmi Dashboard",
    timezone: "UTC+05:30",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    
    // Security Settings
    require2FA: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    ipWhitelist: false,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dailyReports: true,
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: "daily",
    backupRetention: 30,
    cloudBackup: false,
  });

  const [changesMade, setChangesMade] = useState(false);

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
    setChangesMade(true);
  };

  const handleSave = () => {
    // Save to backend
    setChangesMade(false);
    alert("Settings saved successfully!");
  };

  const handleReset = () => {
    // Reset to defaults
    setChangesMade(false);
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
          mb: 4,
          gap: 2 
        }}>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              System Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Configure system-wide preferences and security settings
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: "flex", 
            gap: 1,
            width: { xs: "100%", sm: "auto" }
          }}>
            <Button
              variant="outlined"
              startIcon={<RestoreIcon />}
              onClick={handleReset}
              size={isMobile ? "small" : "medium"}
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!changesMade}
              size={isMobile ? "small" : "medium"}
              sx={{ flex: { xs: 1, sm: "none" } }}
            >
              Save Changes
            </Button>
          </Box>
        </Box>

        {changesMade && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You have unsaved changes. Click "Save Changes" to apply them.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* General Settings */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1, 
                  mb: 3 
                }}>
                  <LanguageIcon color="primary" />
                  <Typography variant="h6">General Settings</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Site Name"
                      value={settings.siteName}
                      onChange={(e) => handleChange("siteName", e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Timezone"
                      value={settings.timezone}
                      onChange={(e) => handleChange("timezone", e.target.value)}
                      size="small"
                    >
                      <MenuItem value="UTC+05:30">UTC+05:30 (IST)</MenuItem>
                      <MenuItem value="UTC+00:00">UTC+00:00 (GMT)</MenuItem>
                      <MenuItem value="UTC-05:00">UTC-05:00 (EST)</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Language"
                      value={settings.language}
                      onChange={(e) => handleChange("language", e.target.value)}
                      size="small"
                    >
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="es">Spanish</MenuItem>
                      <MenuItem value="fr">French</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Date Format"
                      value={settings.dateFormat}
                      onChange={(e) => handleChange("dateFormat", e.target.value)}
                      size="small"
                    >
                      <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                      <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                      <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Settings */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1, 
                  mb: 3 
                }}>
                  <SecurityIcon color="primary" />
                  <Typography variant="h6">Security Settings</Typography>
                </Box>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.require2FA}
                        onChange={(e) => handleChange("require2FA", e.target.checked)}
                      />
                    }
                    label="Require Two-Factor Authentication"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.ipWhitelist}
                        onChange={(e) => handleChange("ipWhitelist", e.target.checked)}
                      />
                    }
                    label="Enable IP Whitelist"
                  />
                  
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Session Timeout (minutes)
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={settings.localStorageTimeout}
                      onChange={(e) => handleChange("sessionTimeout", e.target.value)}
                      size="small"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">min</InputAdornment>,
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Maximum Login Attempts
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) => handleChange("maxLoginAttempts", e.target.value)}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1, 
                  mb: 3 
                }}>
                  <NotificationsIcon color="primary" />
                  <Typography variant="h6">Notification Settings</Typography>
                </Box>
                
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={(e) => handleChange("emailNotifications", e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.smsNotifications}
                        onChange={(e) => handleChange("smsNotifications", e.target.checked)}
                      />
                    }
                    label="SMS Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.pushNotifications}
                        onChange={(e) => handleChange("pushNotifications", e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.dailyReports}
                        onChange={(e) => handleChange("dailyReports", e.target.checked)}
                      />
                    }
                    label="Daily Report Emails"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Backup Settings */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1, 
                  mb: 3 
                }}>
                  <BackupIcon color="primary" />
                  <Typography variant="h6">Backup Settings</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.autoBackup}
                          onChange={(e) => handleChange("autoBackup", e.target.checked)}
                        />
                      }
                      label="Auto Backup"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.cloudBackup}
                          onChange={(e) => handleChange("cloudBackup", e.target.checked)}
                        />
                      }
                      label="Cloud Backup"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      select
                      label="Backup Frequency"
                      value={settings.backupFrequency}
                      onChange={(e) => handleChange("backupFrequency", e.target.value)}
                      size="small"
                    >
                      <MenuItem value="hourly">Hourly</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Retention (days)"
                      value={settings.backupRetention}
                      onChange={(e) => handleChange("backupRetention", e.target.value)}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* System Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 1, 
                  mb: 3 
                }}>
                  <StorageIcon color="primary" />
                  <Typography variant="h6">System Information</Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        System Version
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        2.4.1
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        15 Jan 2024
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Database Size
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        2.4 GB
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 2, textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Uptime
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        99.8%
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: "flex", gap: 1 }}>
                  <Button variant="outlined" size="small">
                    Check for Updates
                  </Button>
                  <Button variant="outlined" size="small" color="error">
                    Clear Cache
                  </Button>
                  <Button variant="outlined" size="small">
                    View Logs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

export default SystemSettings;