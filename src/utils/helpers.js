const { GENRES_TRANSLATION } = require('../config/constants');

function truncateText(text, maxLength = 900) {
    if (!text) return "Неизвестно";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
}

function formatRuntime(minutes) {
    if (!minutes || minutes === 'N/A') return 'Неизвестно';
    const mins = parseInt(minutes);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
        return `${hours} ч ${remainingMins} мин`;
    }
    return `${mins} мин`;
}

function translateGenre(genre) {
    if (!genre) return 'Неизвестно';
    return genre.split(', ').map(g => GENRES_TRANSLATION[g] || g).join(', ');
}

function getTrailerLink(title, year) {
    const query = encodeURIComponent(`${title} ${year} трейлер`);
    return `https://www.youtube.com/results?search_query=${query}`;
}

function getKinopoiskLink(title, year) {
    const query = encodeURIComponent(`${title} ${year}`);
    return `https://www.kinopoisk.ru/index.php?kp_query=${query}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'Неизвестно';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

module.exports = {
    truncateText,
    formatRuntime,
    translateGenre,
    getTrailerLink,
    getKinopoiskLink,
    sleep,
    formatDate
};