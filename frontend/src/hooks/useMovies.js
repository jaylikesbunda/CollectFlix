import { useState, useEffect } from 'react';

export function useMovies(baseApiUrl) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lentMovies, setLentMovies] = useState([]);

  const fetchMovies = () => {
    setLoading(true);
    let apiUrl = `${baseApiUrl}/movies?cache=${Date.now()}`;
    if (searchTerm) {
      apiUrl = `${baseApiUrl}/search_movies?title=${encodeURIComponent(searchTerm)}&sort=relevance&order=desc`;
    }

    return fetch(apiUrl)
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        setMovies([...data]);
        setLoading(false);
        return data;
      })
      .catch(err => {
        setError(err);
        setLoading(false);
        throw err;
      });
  };

  const fetchLentMovies = () => {
    setLoading(true);
    fetch(`${baseApiUrl}/lent_movies`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setLentMovies(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMovies();
  }, [searchTerm]); // Refetch when searchTerm changes

  useEffect(() => {
    fetchLentMovies(); // Fetch lent movies separately
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  return { 
    movies, 
    lentMovies, 
    error, 
    loading, 
    reloadMovies: fetchMovies, 
    reloadLentMovies: fetchLentMovies, // Add this to allow reloading of lent movies
    handleSearch 
  };
}
