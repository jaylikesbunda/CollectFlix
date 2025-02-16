import React, { useState } from 'react';
import {
  Button, Card, CardMedia, CardContent, Typography, Grid, IconButton, Menu, MenuItem, Divider,
  useTheme, useMediaQuery, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Box, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';

function DetailView({ movie, onClose, onEdit, onDelete, onFixMetadata, onLendMovie, onReturnMovie }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLendDialogOpen, setIsLendDialogOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [lendDate, setLendDate] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    console.log('Menu opened');
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    console.log('Menu closed');
  };

  const handleLendMovieClick = () => {
    setIsLendDialogOpen(true);
    handleMenuClose();
    console.log('Lend Movie dialog opened');
  };

  const handleLendMovieSubmit = () => {
    console.log('Lend Movie button clicked');
    console.log('Movie ID:', movie.id);
    console.log('Borrower Name:', borrowerName);
    console.log('Lend Date:', lendDate);
    if (onLendMovie) {
      onLendMovie(movie.id, borrowerName, lendDate);
    } else {
      console.error('onLendMovie function is not defined');
    }
    setIsLendDialogOpen(false);
    console.log('Lend Movie dialog closed');
  };

  return (
    <Grid item xs={12} component={Card} raised sx={{
      background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, #1a1a1a 100%)`,
      color: theme.palette.text.primary,
      mt: 4,
      p: 3,
      borderRadius: 4,
      boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
      position: 'relative',
      overflow: 'visible',
      '&:before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 4,
        background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.05))',
        zIndex: 0
      }
    }}>
      <Grid container spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
        {/* Header Section */}
        <Grid item xs={12} sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          position: 'relative'
        }}>
          <Button variant="contained" color="primary" onClick={onClose} sx={{
            borderRadius: 20,
            px: 3,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${theme.palette.primary.light}40`
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            Close
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => onEdit(movie)} sx={{
              backgroundColor: theme.palette.background.default,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              <EditIcon fontSize="small" />
            </IconButton>
            
            <IconButton onClick={handleMenuOpen} sx={{
              backgroundColor: theme.palette.background.default,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Grid>

        {/* Menu Section */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          sx={{ 
            '& .MuiPaper-root': {
              background: theme.palette.background.paper,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              borderRadius: 2
            }
          }}
        >
          <MenuItem onClick={() => { onDelete(movie.id); handleMenuClose(); }}>
            Delete Movie
          </MenuItem>
          <MenuItem onClick={() => { 
            onFixMetadata(movie.id);
            handleMenuClose();
          }}>
            Fix Metadata
          </MenuItem>
          {movie.status === 'Lent' ? (
            <MenuItem onClick={() => { 
              onReturnMovie(movie.id);
              handleMenuClose();
            }}>
              Return Loan
            </MenuItem>
          ) : (
            <MenuItem onClick={() => { 
              handleLendMovieClick();
              handleMenuClose();
            }}>
              Lend Movie
            </MenuItem>
          )}
        </Menu>

        {/* Media Section */}
        {!isMobile && (
          <Grid item xs={12} md={4} sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'visible',
            '&:after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(180deg, transparent 60%, ${theme.palette.background.paper} 100%)`
            }
          }}>
            <CardMedia
              component="img"
              image={movie.cover_url || '/placeholder.jpg'}
              alt={movie.title}
              sx={{
                borderRadius: 3,
                width: '100%',
                height: 'auto',
                maxHeight: 'unset',
                objectFit: 'contain',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                transform: 'translateY(0)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}
            />
          </Grid>
        )}

        {/* Content Section */}
        <Grid item xs={12} md={8} sx={{
          pr: isMobile ? 0 : 4,
          pl: isMobile ? 0 : 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}>
          <Typography variant="h3" sx={{
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
            mb: 1,
            background: `linear-gradient(45deg, ${theme.palette.text.primary}, ${theme.palette.text.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {movie.title}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={movie.genre} variant="outlined" sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary,
              fontWeight: 500
            }} />
            <Chip label={movie.media_type || 'Unknown format'} sx={{
              background: theme.palette.action.selected,
              color: theme.palette.text.primary,
              fontWeight: 500
            }} />
            {movie.status === 'Lent' && (
              <Chip label="On Loan" color="warning" sx={{
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(255,167,38,0.2)'
              }} />
            )}
          </Box>

          <Typography variant="body1" sx={{
            color: theme.palette.text.secondary,
            lineHeight: 1.6,
            mb: 3,
            opacity: 0.9
          }}>
            {movie.description}
          </Typography>

          <Divider sx={{ borderColor: theme.palette.divider, my: 2 }} />

          <Grid container spacing={2}>
            <DetailItem label="Release Date" value={movie.release_date ? 
              new Date(movie.release_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'N/A'} />
            <DetailItem label="Runtime" value={movie.runtime ? `${movie.runtime} mins` : 'N/A'} />
            <DetailItem label="Rating" value={movie.rating ? `${movie.rating}/10 ★` : 'Not rated'} />
            <DetailItem label="Price Estimate" 
              value={movie.average_price ? `${movie.currency}${movie.average_price}` : 'N/A'} 
              highlight />
            
            {movie.status === 'Lent' && (
              <>
                <DetailItem label="Borrower" value={movie.borrower_name} />
                <DetailItem label="Loan Date" value={movie.lend_date} />
              </>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Lend Movie Dialog - Updated styling */}
      <Dialog open={isLendDialogOpen} onClose={() => setIsLendDialogOpen(false)} PaperProps={{
        sx: {
          background: theme.palette.background.paper,
          borderRadius: 4,
          boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
          }
        }
      }}>
        <DialogTitle sx={{ 
          py: 2,
          background: theme.palette.background.default,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          Lend Movie
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            label="Borrower Name"
            variant="filled"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
          <TextField
            fullWidth
            type="date"
            label="Lend Date"
            variant="filled"
            value={lendDate}
            onChange={(e) => setLendDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              sx: { borderRadius: 2 }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={() => setIsLendDialogOpen(false)}
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleLendMovieSubmit}
            sx={{ 
              borderRadius: 2,
              px: 3,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${theme.palette.primary.light}40`
              }
            }}
          >
            Confirm Loan
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

// Helper component for detail items
const DetailItem = ({ label, value, highlight }) => {
  const theme = useTheme();
  
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2" sx={{ 
        color: highlight ? theme.palette.primary.main : theme.palette.text.secondary,
        fontWeight: highlight ? 600 : 400,
        mb: 0.5
      }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ 
        fontWeight: 500,
        color: theme.palette.text.primary,
        opacity: 0.95
      }}>
        {value || '—'}
      </Typography>
    </Grid>
  );
};

export default DetailView;
