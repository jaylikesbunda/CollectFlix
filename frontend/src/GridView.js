import React from 'react';
import { Grid, Card, CardMedia, CardContent, Typography, IconButton, Chip, List, ListItem, ListItemAvatar, Avatar, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useTheme, useMediaQuery } from '@mui/material';
import DetailView from './DetailView';

function GridView({ movies, selectedMovie, onSelectMovie, onDeleteMovie, onEditMovie, onCloseDetail, onFixMetadata, onLendMovie, onReturnMovie, viewMode, gridDensity }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getMediaIcon = (mediaType) => {
    // Mapping media types to icons
    switch (mediaType) {
      case 'DVD': return 'DVD 📀';
      case 'Blu-ray': return 'Blu-ray 💿';
      case 'Digital': return 'Digital 🌐';
      case 'VHS': return 'VHS 📼';
      case 'LaserDisc': return 'LaserDisc 💽';
      case '4K UHD': return '4K UHD 📺';
      case 'Streaming': return 'Streaming 📡';
      case 'Download': return 'Download ⬇️';
      case 'CD': return 'CD 💿';
      case 'Cassette': return 'Cassette 📼';
      case 'Vinyl': return 'Vinyl 🎵';
      case 'Book': return 'Book 📚';
      case 'Magazine': return 'Magazine 📰';
      case 'AudioBook': return 'Audiobook 🎧';
      case 'Podcast': return 'Podcast 🎙️';
      case 'Game': return 'Game 🎮';
      case 'BoardGame': return 'Board Game 🎲';
      case 'Comic': return 'Comic 📖';
      case 'GraphicNovel': return 'Graphic Novel 📚';
      case 'SheetMusic': return 'Sheet Music 🎼';
      default: return 'Unknown ❓';
    }
  };

  const renderGridItem = (movie) => (
    <Card
      sx={{
        position: 'relative',
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        cursor: 'pointer',
        borderRadius: 3,
        overflow: 'hidden',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: `0 8px 16px ${theme.palette.grey[900]}`,
        },
      }}
      onClick={() => onSelectMovie(movie)}
    >
      <CardMedia
        component="img"
        height="240"
        image={movie.cover_url || '/default-movie-cover.jpg'}
        alt={movie.title}
        sx={{
          objectFit: 'cover',
          width: '100%',
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.1)',
          },
        }}
      />
      <CardContent sx={{ textAlign: 'center', flexGrow: 1, p: 2 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: 600,
            mb: 1,
            color: theme.palette.text.primary,
          }}
        >
          {movie.title}
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
          {movie.genre}
        </Typography>
        <Chip
          label={getMediaIcon(movie.media_type)}
          size="small"
          sx={{
            mt: 1,
            backgroundColor: theme.palette.grey[800],
            color: theme.palette.grey[300],
            fontWeight: 'bold',
            letterSpacing: '0.5px',
            borderRadius: 1,
          }}
        />
        {movie.status === 'Lent' && (
          <Chip
            label="Lent"
            size="small"
            color="secondary"
            sx={{
              mt: 1,
              fontWeight: 'bold',
              borderRadius: 1,
            }}
          />
        )}
      </CardContent>
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 40,
          color: theme.palette.text.primary,
          zIndex: 1,
          p: 0.5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: '50%',
          boxShadow: theme.shadows[3],
          '&:hover': {
            backgroundColor: theme.palette.grey[800],
          },
          '& svg': { fontSize: '18px' },
        }}
        onClick={(e) => {
          e.stopPropagation();
          onEditMovie(movie);
        }}
      >
        <EditIcon />
      </IconButton>
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          color: theme.palette.text.primary,
          zIndex: 1,
          p: 0.5,
          backgroundColor: theme.palette.background.paper,
          borderRadius: '50%',
          boxShadow: theme.shadows[3],
          '&:hover': {
            backgroundColor: theme.palette.grey[800],
          },
          '& svg': { fontSize: '18px' },
        }}
        onClick={(e) => {
          e.stopPropagation();
          onDeleteMovie(movie.id);
        }}
      >
        <DeleteIcon />
      </IconButton>
    </Card>
  );
  

  const renderListItem = (movie) => {
    const truncateSynopsis = (text, maxLength) => {
      if (text.length <= maxLength) return text;
      return `${text.substring(0, maxLength)}...`;
    };

    return (
      <ListItem 
        key={movie.id} 
        sx={{ 
          backgroundColor: theme.palette.background.paper, 
          mb: 1, 
          borderRadius: 2, 
          p: 1.5, 
          display: 'flex', 
          alignItems: 'flex-start' 
        }}
      >
        <ListItemAvatar sx={{ minWidth: 70 }}>
          <Avatar
            src={movie.cover_url || '/default-movie-cover.jpg'}
            variant="square"
            sx={{ width: 60, height: 90, borderRadius: 2 }}
            alt={movie.title}
          />
        </ListItemAvatar>
        <ListItemText
          primary={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ maxWidth: '70%' }}>
                <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary }}>
                  {movie.title}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  {movie.genre} | {movie.release_date || 'Unknown'} | Rating: {movie.rating || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Average Price: {movie.average_price ? `$${movie.average_price} ${movie.currency || ''}` : 'N/A'}
                </Typography>
              </div>
              <div>
                <Chip
                  label={getMediaIcon(movie.media_type)}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300],
                    color: theme.palette.text.primary,
                    height: 24,
                    mb: 1,
                  }}
                />
                {/* Render Lent badge if the movie is lent */}
                {movie.status === 'Lent' && (
                  <Chip
                    label="Lent"
                    size="small"
                    color="secondary"
                    sx={{ fontWeight: 'bold' }}
                  />
                )}
              </div>
            </div>
          }
          secondary={
            <Typography component="span" variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {truncateSynopsis(movie.description, 100)}  {/* Truncate to 100 characters */}
            </Typography>
          }
          sx={{ ml: 2 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <IconButton
            sx={{ color: theme.palette.text.primary, p: 0.5, mb: 0.5 }}
            onClick={() => onEditMovie(movie)}
          >
            <EditIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton
            sx={{ color: theme.palette.text.primary, p: 0.5 }}
            onClick={() => onDeleteMovie(movie.id)}
          >
            <DeleteIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </div>
      </ListItem>
    );
  };

  return (
    <>
      {/* Movie Items (Grid or List) */}
      {viewMode === 'grid' ? (
        <Grid container spacing={isMobile ? 2 : 4}>
          {movies.map((movie, index) => (
            <React.Fragment key={movie.id}>
              {/* Movie Card */}
              <Grid item xs={6} sm={6} md={4} lg={12/gridDensity}>
                {renderGridItem(movie)}
              </Grid>
              
              {/* Detail View - Hidden until activated */}
              {selectedMovie?.id === movie.id && (
                <Grid item xs={12} sx={{ 
                  display: 'contents', // Magic bullet to maintain grid flow
                  '& > *': { width: '100%' } 
                }}>
                  <DetailView
                    movie={selectedMovie}
                    onClose={onCloseDetail}
                    onEdit={onEditMovie}
                    onDelete={onDeleteMovie}
                    onFixMetadata={onFixMetadata}
                    onLendMovie={onLendMovie}
                    onReturnMovie={onReturnMovie}
                  />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>
      ) : (
        <List>
          {movies.map(movie => (
            <React.Fragment key={movie.id}>
              {renderListItem(movie)}
              {selectedMovie?.id === movie.id && (
                <Grid item xs={12}>
                  <DetailView
                    movie={selectedMovie}
                    onClose={onCloseDetail}
                    onEdit={onEditMovie}
                    onDelete={onDeleteMovie}
                    onFixMetadata={onFixMetadata}
                    onLendMovie={onLendMovie}
                    onReturnMovie={onReturnMovie}
                  />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </List>
      )}
    </>
  );
}

export default GridView;
