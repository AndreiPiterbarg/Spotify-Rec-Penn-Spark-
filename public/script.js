document.addEventListener('DOMContentLoaded', () => {
    const songInput = document.getElementById('song-input');
    const getRecommendationsButton = document.getElementById('get-recommendations');
    const songsList = document.getElementById('songs');
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    const closeNotificationButton = document.getElementById('close-notification');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const popularitySwitch = document.getElementById('popularity-switch');
    const recommendationsContainer = document.getElementById('recommended-songs');
    const clearSongsButton = document.getElementById('clear-songs');
    let songs = [];
    let debounceTimer;



    function showNotification(message, isError = false) {
        notificationText.textContent = message;
        notification.classList.add('show');
        if (isError) {
            notification.classList.add('error');
        } else {
            notification.classList.remove('error');
        }
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.remove('error');
        }, 5000);
    }

    function updateRecommendationsButton() {
        getRecommendationsButton.disabled = songs.length < 3;
    }

    function addSong(song) {
        if (songs.length < 5) {
            songs.push(song);
            const listItem = document.createElement('li');
            listItem.textContent = `${song.name} by ${song.artist}`;
            songsList.appendChild(listItem);
            songInput.value = '';
            updateRecommendationsButton();
            suggestionsContainer.innerHTML = '';
        } else {
            showNotification('You can only add up to 5 songs.', true);
        }
    }

    function searchSongs(query) {
        suggestionsContainer.innerHTML = '<li class="suggestion">Searching...</li>';
        fetch(`/search?q=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(tracks => {
                console.log('Tracks:', tracks); // Log the tracks to ensure data is being received
                suggestionsContainer.innerHTML = '';
                if (tracks.length === 0) {
                    suggestionsContainer.innerHTML = '<li class="suggestion">No songs found</li>';
                } else {
                    tracks.forEach(track => {
                        const suggestion = document.createElement('li');
                        suggestion.classList.add('list-group-item');
                        suggestion.innerHTML = `
                            <div class="track-info">
                                <span class="track-name">${track.name}</span>
                                <span class="track-artist">${track.artist}</span>
                            </div>
                        `;
                        suggestion.addEventListener('click', () => addSong(track));
                        suggestionsContainer.appendChild(suggestion);
                    });
                }
            })
            .catch(error => {
                console.error('Error searching for songs:', error);
                suggestionsContainer.innerHTML = '<li class="suggestion error">Error searching for songs</li>';
                showNotification(`An error occurred while you were searching for songs: ${error.message}`, true);
            });
    }

    songInput.addEventListener('input', (event) => {
        clearTimeout(debounceTimer);
        const query = event.target.value.trim();
        if (query) {
            debounceTimer = setTimeout(() => searchSongs(query), 300);
        } else {
            suggestionsContainer.innerHTML = '';
        }
    });

    getRecommendationsButton.addEventListener('click', () => {
        if (songs.length < 3) {
            showNotification('Please add at least 3 songs to get recommendations.', true);
        } else {
            console.log('Getting recommendations for:', songs);
            fetch('/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    songs,
                    includePopularity: popularitySwitch.checked
                })
            })
                .then(response => response.json())
                .then(recommendations => {
                    displayRecommendations(recommendations);
                })
                .catch(error => {
                    console.error('Error getting recommendations:', error);
                    showNotification('Error getting recommendations. Please try again later.', true);
                });
        }
    });
    clearSongsButton.addEventListener('click', () => {
        // Clear the songs array
        songs = [];

        // Clear the inputted songs list in the DOM
        songsList.innerHTML = '';

        // Clear the recommendations list in the DOM
        recommendationsContainer.innerHTML = '';

        // Optionally, disable the Get Recommendations button after clearing
        updateRecommendationsButton();

        // Show a notification if needed
        showNotification('Songs and recommendations have been cleared.');
    });

    closeNotificationButton.addEventListener('click', () => {
        notification.classList.remove('show');
        notification.classList.remove('error');
    });

    popularitySwitch.addEventListener('change', () => {
        if (popularitySwitch.checked) {
            getRecommendationsButton.classList.add('green-button');
        } else {
            getRecommendationsButton.classList.remove('green-button');
        }
    });


    function displayRecommendations(tracks) {
        recommendationsContainer.innerHTML = '';

        tracks.forEach(track => {
            const listItem = document.createElement('li');
            const trackUrl = `https://open.spotify.com/track/${track.id}`; // Generate the track URL

            listItem.innerHTML = `
                <div class="track-info">
                    <a href="${trackUrl}" target="_blank" class="track-link">
                        <div class="track-name">${track.name}</div>
                    </a>
                    <div class="track-artist">${track.artist}</div>
                </div>
            `;

            recommendationsContainer.appendChild(listItem);
        });
    }



    updateRecommendationsButton();
});
