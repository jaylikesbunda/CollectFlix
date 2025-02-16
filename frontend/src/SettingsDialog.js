import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControlLabel,
  Switch, TextField, Box, InputLabel, MenuItem, FormControl, Select, Divider, Typography,
} from '@mui/material';
import axios from 'axios';
import { saveAs } from 'file-saver';
import config from './config';

const SettingsDialog = ({ open, onClose, onSave, settings }) => {
  const [newSettings, setNewSettings] = useState(settings);
  const [importExportFormat, setImportExportFormat] = useState('json');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${config.apiUrl}/load_settings`);
        setNewSettings(response.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await axios.post(`${config.apiUrl}/save_settings`, newSettings);
      onSave(newSettings);
      onClose();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    }
  };

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setNewSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFormatChange = (event) => {
    setImportExportFormat(event.target.value);
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/export_movies?format=${importExportFormat}`, { responseType: 'blob' });
      const filename = `movies.${importExportFormat}`;
      saveAs(response.data, filename);
    } catch (error) {
      console.error('Error exporting movies:', error);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      await axios.post(`${config.apiUrl}/import_movies?format=${importExportFormat}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Movies imported successfully!');
    } catch (error) {
      console.error('Error importing movies:', error);
      alert('Failed to import movies.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <FormControlLabel
            control={<Switch checked={newSettings.darkMode} onChange={handleChange} name="darkMode" />}
            label="Dark Mode"
          />
          <TextField
            label="Search Term"
            name="defaultSearchTerm"
            value={newSettings.defaultSearchTerm}
            onChange={handleChange}
            size="small"
          />

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle1">Import/Export</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel id="import-export-format-label">Format</InputLabel>
            <Select
              labelId="import-export-format-label"
              value={importExportFormat}
              onChange={handleFormatChange}
              label="Format"
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Button variant="outlined" color="primary" onClick={handleExport} sx={{ width: '49%' }}>
              Export
            </Button>
            <Button variant="outlined" color="secondary" component="label" sx={{ width: '49%' }}>
              Import
              <input type="file" hidden onChange={handleImport} />
            </Button>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} color="primary">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
