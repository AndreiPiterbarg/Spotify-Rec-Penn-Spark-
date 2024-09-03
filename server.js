const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const qs = require('querystring');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Spotify API credentials
const CLIENT_ID = '5834606403c944a1b59a339273fc393b';
const CLIENT_SECRET = '911180c35c5d4cc0b3337d0457df45f4';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Spotify API credentials are not set. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
    process.exit(1);
}

// Function to get Spotify access token
async function getSpotifyToken() {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            qs.stringify({
                grant_type: 'client_credentials'
            }), {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Spotify token:', error.response ? error.response.data : error.message);
        throw new Error('Failed to get Spotify access token');
    }
}

// Endpoint to search for songs
app.get('/search', async (req, res) => {
    console.log('Search route hit with query:', req.query.q);
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const token = await getSpotifyToken();
        const response = await axios.get(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Extract relevant track information
        const tracks = response.data.tracks.items.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name
        }));

        res.json(tracks);
    } catch (error) {
        console.error('Error searching Spotify:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            error: 'An error occurred while searching for songs',
            details: error.response ? error.response.data : error.message
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
