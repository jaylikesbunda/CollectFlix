import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Card, CardHeader, CardContent, Typography, Grid, 
  IconButton, Collapse, Alert, useTheme, Box, TextField 
} from '@mui/material';
import CameraEnhanceIcon from '@mui/icons-material/CameraEnhance';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

const BarcodeScanner = ({ onDetected = () => {} }) => {
  const theme = useTheme();
  const [scannedData, setScannedData] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  const scannerStyles = {
    container: {
      padding: theme.spacing(3),
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.shape.borderRadius,
    },
    scannerView: {
      border: `2px dashed ${theme.palette.primary.main}`,
      borderRadius: '8px',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.palette.action.hover
    },
    instructionText: {
      color: theme.palette.text.secondary,
      marginTop: theme.spacing(2)
    },
    iconContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
      margin: theme.spacing(2, 0)
    }
  };

  useEffect(() => {
    const config = {
      fps: 15, // Increase FPS for smoother webcam experience
      qrbox: { width: 300, height: 150 }, // Adjust as needed for better framing
      formatsToSupport: [
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ],
      aspectRatio: 1.777778, // Standard 16:9 aspect ratio for webcams
      disableFlip: false, // Useful if the webcam mirrors the image
    };

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader", config, false
    );

    const onScanSuccess = (decodedText, decodedResult) => {
      setScannedData(decodedText);
      setScanSuccess(true);
      onDetected(decodedText);
      setTimeout(() => setScanSuccess(false), 2000); // Reset after 2sec
    };

    const onScanFailure = (errorMessage) => {
      console.warn(`Scanning failed: ${errorMessage}`);
      // Keep scanning even after a failure
    };

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
        setScanSuccess(true);
        setTimeout(() => {
          onDetected(scannedData);
          setScannedData('');
          setScanSuccess(false);
        }, 500);
      } else {
        setScannedData(prev => prev + event.key);
      }
    };

    // Add event listener for keypress events to capture USB scanner input
    window.addEventListener('keypress', handleKeyPress);

    return () => {
      html5QrcodeScanner.clear(); // Cleanup when component is unmounted
      window.removeEventListener('keypress', handleKeyPress); // Cleanup the event listener
    };

  }, [onDetected, scannedData]);

  return (
    <Card sx={scannerStyles.container}>
      <CardHeader 
        title="Scan Barcode"
        avatar={<CameraEnhanceIcon color="primary" />}
        subheader="Use webcam or USB barcode scanner"
      />
      <CardContent>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={scannerStyles.scannerView}>
              <div id="reader" style={{ width: '100%', height: '100%' }}></div>
              <Collapse in={scanSuccess} sx={{ position: 'absolute' }}>
                <CheckCircleIcon 
                  sx={{ 
                    fontSize: 80, 
                    color: theme.palette.success.main,
                    background: theme.palette.background.paper,
                    borderRadius: '50%'
                  }} 
                />
              </Collapse>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={scannerStyles.iconContainer}>
              <KeyboardIcon color="primary" />
              <Typography variant="h6">USB Scanner Instructions</Typography>
            </Box>
            <Typography variant="body1" sx={scannerStyles.instructionText}>
              1. Click in the field below
              <br />
              2. Scan your barcode
              <br />
              3. Press Enter to confirm
            </Typography>
            
            <TextField
              fullWidth
              label="Scanned Data"
              value={scannedData}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton 
                    onClick={() => setScannedData('')}
                    edge="end"
                  >
                    <CloseIcon />
                  </IconButton>
                )
              }}
              sx={{ marginTop: 2 }}
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              Webcam scanning works best in well-lit environments
            </Alert>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BarcodeScanner;
