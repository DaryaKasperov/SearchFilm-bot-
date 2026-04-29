const { MAX_FAVORITES } = require('../config/constants');

const favorites = new Map();

function addToFavorites(userId, imdbID, movieData) {
    if (!movieData) return false;
    
    if (!favorites.has(userId)) {
        favorites.set(userId, []);
    }
    
    const userFavorites = favorites.get(userId);
    
    if (userFavorites.length >= MAX_FAVORITES) {
        return false;
    }
    
    const exists = userFavorites.some(fav => fav.imdbID === imdbID);
    
    if (!exists) {
        userFavorites.push({
            imdbID,
            title: movieData.title,
            year: movieData.year,
            addedAt: new Date().toISOString()
        });
        return true;
    }
    return false;
}

function removeFromFavorites(userId, imdbID) {
    if (favorites.has(userId)) {
        const userFavorites = favorites.get(userId);
        const index = userFavorites.findIndex(fav => fav.imdbID === imdbID);
        if (index !== -1) {
            userFavorites.splice(index, 1);
            return true;
        }
    }
    return false;
}

function isFavorite(userId, imdbID) {
    if (favorites.has(userId)) {
        return favorites.get(userId).some(fav => fav.imdbID === imdbID);
    }
    return false;
}

function getUserFavorites(userId) {
    return favorites.get(userId) || [];
}

function clearAllFavorites(userId) {
    if (favorites.has(userId)) {
        favorites.set(userId, []);
        return true;
    }
    return false;
}

function getFavoritesCount(userId) {
    return favorites.get(userId)?.length || 0;
}

function getFavoriteByIndex(userId, index) {
    const userFavorites = favorites.get(userId);
    if (userFavorites && index >= 0 && index < userFavorites.length) {
        return userFavorites[index];
    }
    return null;
}

module.exports = {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getUserFavorites,
    clearAllFavorites,
    getFavoritesCount,
    getFavoriteByIndex
};