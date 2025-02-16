import React, { useState, useEffect } from 'react';
import {
  CircularProgress, Container, Typography, AppBar, Toolbar, Button, Dialog,
  DialogTitle, Menu, Drawer, Divider, DialogContent, TextField, DialogActions, MenuItem, Select, InputLabel, FormControl, Box, IconButton, useMediaQuery, Grid, Card, CardMedia, CardContent, Chip, Badge, List, ListItem, ListItemText, Tooltip
} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SortIcon from '@mui/icons-material/Sort';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GridView from './GridView';
import SearchBar from './SearchBar';
import { useMovies } from './hooks/useMovies';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader } from '@zxing/library';
import BarcodeScanner from './BarcodeScanner';
import FilterListIcon from '@mui/icons-material/FilterList';
import SettingsDialog from './SettingsDialog'; 
import config from './config';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Slider from '@mui/material/Slider';



// Define your theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3f51b5' },
    secondary: { main: '#f50057' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    allVariants: { color: 'white' },
  },
});

// Styling components using styled API
const StyledDialogTitle = styled(DialogTitle)({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
});

const StyledDialogContent = styled(DialogContent)({
  padding: theme.spacing(2),
});

const StyledDialogActions = styled(DialogActions)({
  padding: theme.spacing(1),
  justifyContent: 'center',
});

const CloseButton = styled(Button)({
  color: theme.palette.secondary.main,
  '&:hover': {
    backgroundColor: theme.palette.secondary.light,
  },
});

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { movies, error, loading, reloadMovies, handleSearch, reloadLentMovies } = useMovies(config.apiUrl);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortingOption, setSortingOption] = useState('title');
  const [movieTitle, setMovieTitle] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCollectionPriceOpen, setIsCollectionPriceOpen] = useState(false);
  const [metadataMatches, setMetadataMatches] = useState([]);
  const [isMetadataDialogOpen, setIsMetadataDialogOpen] = useState(false);
  const [isLendDialogOpen, setIsLendDialogOpen] = useState(false);
  const [borrowerName, setBorrowerName] = useState('');
  const [lendDate, setLendDate] = useState('');
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [filterOption, setFilterOption] = useState('');
  const [sortedFilteredMovies, setSortedFilteredMovies] = useState([]); // Defined here
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [settings, setSettings] = useState({
    darkMode: false,
    defaultSearchTerm: '',
    gridDensity: parseInt(localStorage.getItem('gridDensity')) || 3
  });
  const [notifications, setNotifications] = useState([]);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);


  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    // Optionally save to localStorage or other persistence layer
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };


  // Load settings from localStorage if available
  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('appSettings'));
    if (savedSettings) {
      setSettings(savedSettings);
    }
  }, []);

  useEffect(() => {
    fetchTotalPrice();
  }, []);

  useEffect(() => {
    applySortingAndFiltering(filterOption, sortingOption);
  }, [movies, filterOption, sortingOption]);

  const fetchTotalPrice = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/calculate_total_collection_price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      const price = parseFloat(data.total_collection_price) || 0;
      setTotalPrice(price);
    } catch (error) {
      console.error('Error fetching total collection price:', error);
      setTotalPrice(0);
    }
  };

  const handleAddMovie = () => {
    setOpen(true);
    setMovieTitle('');
    setMediaType('');
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleSelectMovie = (movie) => {
    setSelectedMovie(prevSelectedMovie => prevSelectedMovie?.id === movie.id ? null : movie);
  };

  const handleEbaySearch = async () => {
    const processingId = addNotification('Updating eBay prices...', 'info');
    try {
      const response = await fetch(`${config.apiUrl}/search_ebay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: null }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      addNotification(`Updated eBay prices`);
    } catch (error) {
      addNotification(`eBay price update failed: ${error.message}`, 'error');
    } finally {
      removeNotification(processingId);
    }
  };

  const handleDeleteMovie = (id) => {
    fetch(`${config.apiUrl}/delete_movie/${id}`, { method: 'DELETE' })
      .then(response => {
        if (!response.ok) throw new Error('Failed to delete movie');
        return response.json();
      })
      .then(() => {
        reloadMovies();
        setSelectedMovie(null);
      })
      .catch(error => console.error('Error deleting movie:', error));
  };

  const handleCloseDetail = () => {
    setSelectedMovie(null);
  };











  
  const handleSave = () => {
    const endpoint = selectedMovie ? `update_movie/${selectedMovie.id}` : 'add_movie';
    const method = selectedMovie ? 'PUT' : 'POST';
  
    const requestData = {
      title: movieTitle,
      media_type: mediaType
    };

    const processingId = addNotification(
      selectedMovie ? `Updating ${movieTitle}...` : `Adding ${movieTitle}...`,
      'processing'
    );

    fetch(`${config.apiUrl}/${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`Failed to ${selectedMovie ? 'update' : 'add'} movie: ${text}`);
          });
        }
        return response.json();
      })
      .then((data) => {
        reloadMovies();
        reloadLentMovies();
        handleCloseDialog();
        removeNotification(processingId);
        addNotification(selectedMovie ? 
          `Updated ${movieTitle}` : 
          `Added ${movieTitle}`, 'success');
      })
      .catch(error => {
        removeNotification(processingId);
        addNotification(`Failed to ${selectedMovie ? 'update' : 'add'} movie: ${error.message}`, 'error');
      });
  };
  
  const handleLendMovie = async (movieId, borrowerName, lendDate) => {
    try {
      const response = await fetch(`${config.apiUrl}/lend_movie/${movieId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ borrower_name: borrowerName, lend_date: lendDate }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      reloadMovies();
      reloadLentMovies();
    } catch (error) {
      console.error('Error lending movie:', error);
    }
  };

  const handleReturnMovie = async (movieId) => {
    try {
      const response = await fetch(`${config.apiUrl}/return_movie/${movieId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      reloadMovies();
      reloadLentMovies();
    } catch (error) {
      console.error('Error returning movie:', error);
    }
  };

  const handleToggleViewMode = () => {
    setViewMode(prevMode => (prevMode === 'grid' ? 'list' : 'grid'));
  };

  const handleChangeSortingOption = (event) => {
    const newSortingOption = event.target.value;
    setSortingOption(newSortingOption);
    applySortingAndFiltering(filterOption, newSortingOption);  // Apply filtering and sorting
  };

  const handleFilterChange = (event) => {
    const newFilterOption = event.target.value;
    setFilterOption(newFilterOption);
    applySortingAndFiltering(newFilterOption, sortingOption);  // Apply filtering and sorting
  };

  const applySortingAndFiltering = (filter, sort) => {
    const filteredMovies = movies.filter(movie => filterMovie(movie, filter));
    const sortedMovies = [...sortMovies([...filteredMovies], sort)]; // Double clone
    setSortedFilteredMovies(sortedMovies);
  };

  const filterMovie = (movie, filter) => {
    if (filter === 'all') return true;
    
    // Status Filters
    if (filter === 'available') return movie.status === 'Available';
    if (filter === 'lent') return movie.status === 'Lent';
    
    // Genre Filters
    if (filter === 'genre_comedy') return movie.genre.includes('Comedy');
    if (filter === 'genre_drama') return movie.genre.includes('Drama');
    if (filter === 'genre_action') return movie.genre.includes('Action');
    if (filter === 'genre_horror') return movie.genre.includes('Horror');
    if (filter === 'genre_scifi') return movie.genre.includes('Sci-Fi');
    
    // Media Type Filters
    if (filter === 'media_dvd') return movie.media_type === 'DVD';
    if (filter === 'media_bluray') return movie.media_type === 'Blu-ray';
    if (filter === 'media_digital') return movie.media_type === 'Digital';
    
    // Year Filters (Subcategory example)
    if (filter === 'year_2020s') return movie.year >= 2020;
    if (filter === 'year_2010s') return movie.year >= 2010 && movie.year < 2020;
    if (filter === 'year_2000s') return movie.year >= 2000 && movie.year < 2010;

    return true;
};


const sortMovies = (movies, sort) => {
  return [...movies].sort((a, b) => { // Create copy first
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'titleDesc') return b.title.localeCompare(a.title);
    if (sort === 'genre') return a.genre.localeCompare(b.genre);
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'ratingDesc') return a.rating - b.rating;
    if (sort === 'mediaType') return a.media_type.localeCompare(b.media_type);
    if (sort === 'releaseDate') return new Date(b.release_date) - new Date(a.release_date);
    if (sort === 'runtime') return b.runtime - a.runtime;
    if (sort === 'status') return a.status.localeCompare(b.status);
    if (sort === 'averagePrice') return b.average_price - a.average_price;
    if (sort === 'addedDate') return new Date(b.added_date) - new Date(a.added_date);
    return 0;
  });
};
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShowCollectionPrice = async () => {
    try {
      const response = await fetch(`${config.apiUrl}/calculate_total_collection_price`, {
        method: 'POST',
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json();
      const currentTotalPrice = parseFloat(data.total_collection_price);
      setTotalPrice(currentTotalPrice || 0);
      setIsCollectionPriceOpen(true);
      
      // Add notification
      addNotification(`Updated prices for ${movies.length} titles`, 'success');
      
    } catch (error) {
      console.error('Error fetching total collection price:', error);
      addNotification(`Price update failed: ${error.message}`, 'error');
    } finally {
      handleMenuClose();
    }
  };
  
  const handleCloseCollectionPrice = () => {
    setIsCollectionPriceOpen(false);
  };
  
  const handleFixMetadata = async (movieId) => {
    try {
      const response = await fetch(`${config.apiUrl}/fix_metadata/${movieId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setMetadataMatches(data.matches);
      setIsMetadataDialogOpen(true);
    } catch (error) {
      console.error('Error fetching metadata matches:', error);
    }
  };

  const handleSelectMetadata = async (selectedMatch) => {
    try {
      const response = await fetch(`${config.apiUrl}/update_metadata/${selectedMovie.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedMatch }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      reloadMovies();
      setIsMetadataDialogOpen(false);
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  const handleBarcodeDetected = async (detectedBarcode) => {
    const processingId = addNotification('Processing barcode scan...', 'info');
    
    try {
      const response = await fetch(`${config.apiUrl}/scan_barcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode: detectedBarcode }),
      });

      const rawResponse = await response.text(); // 👈 First get text
      console.log('Raw response:', rawResponse); // Debug invalid JSON
      const data = JSON.parse(rawResponse);
      removeNotification(processingId);

      if (data.title) {
        addNotification(`Added ${data.title}${data.media_type ? ` (${data.media_type})` : ''}`, 'success');
      } else {
        addNotification('Added item', 'success');
      }
    } catch (error) {
      removeNotification(processingId);
      addNotification(`Barcode scan failed: ${error.message}`, 'error');
    }
  };
  
  const handleInteraction = (action) => {
    let handled = false;
    return (event) => {
      if (!handled) {
        event.preventDefault();
        action(event);
        handled = true;
        setTimeout(() => { handled = false; }, 300);
      }
    };
  };
  
  // Enhanced notification functions
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { 
      id, 
      message, 
      type,
      seen: false,
      timestamp: new Date().toLocaleTimeString() 
    }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('gridDensity', settings.gridDensity);
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
  
      {/* AppBar with Toolbar */}
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box
            component="img"
            src="/icon.png"
            alt="CollectFlix (ALPHA)"
            sx={{
              width: 'auto',
              maxHeight: '50px',
              maxWidth: '150px',
              objectFit: 'contain',
              objectPosition: 'top left',
              display: 'block',
            }}
          />
  
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              color="inherit" 
              onClick={(e) => setNotificationMenuAnchor(e.currentTarget)}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={notifications.length} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
  
            <Tooltip title="Search eBay prices">
              <IconButton 
                color="inherit" 
                onClick={handleInteraction(() => handleEbaySearch(selectedMovie ? selectedMovie.title : 'Shrek 2'))}
                sx={{ 
                  mr: 1,
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } 
                }}
              >
                <PriceCheckIcon />
                <Typography variant="caption" sx={{ ml: 0.5, display: { xs: 'none', sm: 'block' } }}>
                  eBay Prices
                </Typography>
              </IconButton>
            </Tooltip>
  
            <IconButton color="inherit" onClick={handleInteraction(handleMenuOpen)}>
              <MoreVertIcon />
            </IconButton>
            
          {/* Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleInteraction(handleMenuClose)}
          >
            <MenuItem onClick={handleInteraction(handleShowCollectionPrice)}>Collection Price</MenuItem>
            <MenuItem onClick={handleInteraction(handleAddMovie)}>Add Movie</MenuItem>
            <MenuItem onClick={handleInteraction(() => setIsBarcodeScannerOpen(true))}>Add by Barcode</MenuItem>
            <MenuItem onClick={handleInteraction(() => { setIsLendDialogOpen(true); handleMenuClose(); })}>
              Lend Movie
            </MenuItem>
            {selectedMovie?.status === 'Lent' && (
              <MenuItem onClick={handleInteraction(() => { handleReturnMovie(selectedMovie.id); handleMenuClose(); })}>
                Return Movie
              </MenuItem>
            )}
            <MenuItem onClick={handleInteraction(() => { setIsSettingsDialogOpen(true); handleMenuClose(); })}>
              Settings
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      
      {/* Settings Dialog */}
      <SettingsDialog
        open={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        onSave={handleSaveSettings}
        settings={settings}
      />
    </AppBar>
  
      {/* Dialogs */}
      <Dialog 
        open={isCollectionPriceOpen} 
        onClose={handleCloseCollectionPrice}
        PaperProps={{ 
          sx: { 
            background: theme.palette.background.paper,
            borderRadius: '16px',
            minWidth: '400px'
          }
        }}
      >
        <StyledDialogTitle sx={{ 
          py: 1,
          mb: 2,
          borderBottom: `1px solid ${theme.palette.divider}30`,
          '& .MuiTypography-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            letterSpacing: '0.15px'
          }
        }}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <AttachMoneyIcon fontSize="small" sx={{ opacity: 0.8 }} />
            <Typography variant="overline">COLLECTION VALUATION</Typography>
          </Box>
        </StyledDialogTitle>
        
        <StyledDialogContent sx={{ 
          pt: 0,
          pb: 3,
          '& .MuiBox-root': {
            gap: 4
          }
        }}>
          <Box display="flex" flexDirection="column" gap={4}>
            <Box textAlign="center" sx={{ mt: 3, mb: 4 }}>
              <Typography variant="h2" fontWeight="500" color="primary" sx={{ 
                letterSpacing: '-0.05em',
                mb: 1.5
              }}>
                ${totalPrice.toLocaleString('en-US')}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Total Estimated Value
              </Typography>
            </Box>

            <Divider />

            <List dense sx={{ width: '100%' }}>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary="Titles in Collection" 
                  secondary={movies.length} 
                  secondaryTypographyProps={{ color: 'primary' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary="Average Value" 
                  secondary={`$${(totalPrice/movies.length).toFixed(2)}`}
                  secondaryTypographyProps={{ color: 'primary' }}
                />
              </ListItem>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemText 
                  primary="Last Updated" 
                  secondary={new Date().toLocaleDateString()}
                  secondaryTypographyProps={{ color: 'text.secondary' }}
                />
              </ListItem>
            </List>
          </Box>
        </StyledDialogContent>

        <StyledDialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={handleCloseCollectionPrice}
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: '24px',
              px: 4,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: `0 4px 12px ${theme.palette.primary.light}40`,
                backgroundColor: '#000000'
              }
            }}
          >
            Close
          </Button>
        </StyledDialogActions>
      </Dialog>
  
      <Dialog open={isMetadataDialogOpen} onClose={() => setIsMetadataDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Metadata Match</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {metadataMatches.map((match, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card onClick={() => handleSelectMetadata(match)} sx={{ cursor: 'pointer' }}>
                  <CardMedia
                    component="img"
                    image={match.poster_path ? `https://image.tmdb.org/t/p/w200${match.poster_path}` : '/placeholder.jpg'}
                    alt={match.title}
                  />
                  <CardContent>
                    <Typography variant="h6">{match.title}</Typography>
                    <Typography variant="body2" color="textSecondary">{match.release_date}</Typography>
                    <Typography variant="body2" color="textSecondary">{match.overview}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsMetadataDialogOpen(false)} color="primary">Cancel</Button>
        </DialogActions>
      </Dialog>
  
      <Dialog open={isBarcodeScannerOpen} onClose={() => setIsBarcodeScannerOpen(false)}>
      <DialogTitle>Scan Barcode</DialogTitle>
      <DialogContent>
        <BarcodeScanner onDetected={handleBarcodeDetected} />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setIsBarcodeScannerOpen(false)} color="primary">Cancel</Button>
      </DialogActions>
    </Dialog>

  
      {/* Main Container */}
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <SearchBar onSearch={handleSearch} sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: '25px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(63,81,181,0.25)'
            },
            '&.Mui-focused': {
              boxShadow: '0 4px 12px rgba(63,81,181,0.4)',
              '& fieldset': {
                borderWidth: '1px !important'
              }
            }
          } 
        }} />
        
        {/* Sorting, Filtering, and View Mode Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, alignItems: 'center', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ mr: 2 }}>
            <InputLabel>Filter by</InputLabel>
            <Select
              value={filterOption}
              onChange={handleFilterChange}
              displayEmpty
              startAdornment={<FilterListIcon sx={{ mr: 1 }} />}
            >
              {/* Status Filters */}
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="lent">Lent</MenuItem>

              {/* Genre Filters */}
              <MenuItem value="genre_comedy">Comedy</MenuItem>
              <MenuItem value="genre_drama">Drama</MenuItem>
              <MenuItem value="genre_action">Action</MenuItem>
              <MenuItem value="genre_horror">Horror</MenuItem>
              <MenuItem value="genre_scifi">Sci-Fi</MenuItem>

              {/* Media Type Filters */}
              <MenuItem value="media_dvd">DVD</MenuItem>
              <MenuItem value="media_bluray">Blu-ray</MenuItem>
              <MenuItem value="media_digital">Digital</MenuItem>

              {/* Year Filters */}
              <MenuItem value="year_2020s">2020s</MenuItem>
              <MenuItem value="year_2010s">2010s</MenuItem>
              <MenuItem value="year_2000s">2000s</MenuItem>
            </Select>
          </FormControl>
  
          <FormControl variant="outlined" size="small" sx={{ mr: 2 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortingOption}
              onChange={handleChangeSortingOption}
              displayEmpty
              startAdornment={<SortIcon sx={{ mr: 1 }} />}
            >
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="genre">Genre</MenuItem>
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="mediaType">Media Format</MenuItem>
              <MenuItem value="releaseDate">Release Date</MenuItem>
              <MenuItem value="runtime">Runtime</MenuItem>
              <MenuItem value="status">Status</MenuItem>
              <MenuItem value="averagePrice">Average Price</MenuItem>
              <MenuItem value="addedDate">Added Date</MenuItem>
            </Select>
          </FormControl>
  
          <IconButton onClick={handleInteraction(handleToggleViewMode)} color="inherit">
            {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
          </IconButton>
  
          {viewMode === 'grid' && (
            <Box sx={{ width: 150, mr: 2 }}>
              <Typography variant="caption">Grid Density</Typography>
              <Slider
                value={settings.gridDensity}
                onChange={(e, newValue) => setSettings(prev => ({ ...prev, gridDensity: newValue }))}
                min={2}
                max={6}
                step={1}
                marks
                valueLabelDisplay="auto"
              />
            </Box>
          )}
        </Box>
  
        {/* Movie Grid or List View */}
        <div className="App">
          {loading && <CircularProgress color="secondary" />}
          {error && <Typography color="error">{`Error fetching movies: ${error.message}`}</Typography>}
          {!loading && movies.length === 0 && <Typography>No movies available.</Typography>}
          {movies.length > 0 && (
            <GridView
              movies={sortedFilteredMovies.length > 0 ? sortedFilteredMovies : movies}
              selectedMovie={selectedMovie}
              onSelectMovie={handleSelectMovie}
              onCloseDetail={handleCloseDetail}
              onDeleteMovie={handleDeleteMovie}
              onEditMovie={(movie) => {
                setSelectedMovie(movie);
                setMovieTitle(movie.title);
                setMediaType(movie.media_type || '');
                setOpen(true);
              }}
              onFixMetadata={handleFixMetadata}
              onLendMovie={handleLendMovie}
              onReturnMovie={handleReturnMovie}
              viewMode={viewMode}
              gridDensity={settings.gridDensity}
            />
          )}
        </div>
  
        {/* Dialog for Adding/Editing Movies */}
        <Dialog open={open} onClose={handleCloseDialog}>
          <DialogTitle>{selectedMovie ? 'Edit Movie' : 'Add a New Movie'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Movie Title"
              type="text"
              fullWidth
              value={movieTitle}
              onChange={(e) => setMovieTitle(e.target.value)}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="media-type-label">Media Type</InputLabel>
              <Select
                labelId="media-type-label"
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                label="Media Type"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value="DVD">DVD</MenuItem>
                <MenuItem value="Blu-ray">Blu-ray</MenuItem>
                <MenuItem value="Digital">Digital</MenuItem>
                <MenuItem value="VHS">VHS</MenuItem>
                <MenuItem value="4K UHD">4K UHD</MenuItem>
                <MenuItem value="Streaming">Streaming</MenuItem>
                <MenuItem value="CD">CD</MenuItem>
                <MenuItem value="Cassette">Cassette</MenuItem>
                <MenuItem value="Vinyl">Vinyl</MenuItem>
                <MenuItem value="Magazine">Magazine</MenuItem>
                <MenuItem value="AudioBook">Audiobook</MenuItem>
                <MenuItem value="Podcast">Podcast</MenuItem>
                <MenuItem value="Comic">Comic</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">Cancel</Button>
            <Button onClick={handleSave} color="primary">{selectedMovie ? 'Update' : 'Save'}</Button>
          </DialogActions>
        </Dialog>
      </Container>

      {/* Notification Popups */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={!notification.seen}
          autoHideDuration={5000}
          onClose={(event, reason) => {
            if (reason === 'timeout') {
                setNotifications(prev => prev.map(n => 
                    n.id === notification.id ? {...n, seen: true} : n
                ));
            }
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ 
            position: 'fixed',
            top: `${index * 70 + 20}px`,
            right: 20 
          }}
        >
          <Alert severity={notification.type} action={
            <IconButton size="small" onClick={() => removeNotification(notification.id)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }>
            {notification.message}
          </Alert>
        </Snackbar>
      ))}

      {/* Notification menu always shows even when empty */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={() => setNotificationMenuAnchor(null)}
        MenuListProps={{ sx: { minWidth: 300 } }}
      >
        {notifications.length === 0 ? (
          <MenuItem disabled>No notifications</MenuItem>
        ) : notifications.map((notification) => (
          <MenuItem key={notification.id} sx={{ minWidth: 300 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Typography>{notification.message}</Typography>
              <IconButton onClick={() => removeNotification(notification.id)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </ThemeProvider>
  );
  
}  
export default App;
