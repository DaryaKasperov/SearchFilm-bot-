// src/handlers/moodHandler.js
const { InlineKeyboard } = require('grammy');
const { MOOD_CONFIG } = require('../config/constants');
const { searchMovies, getFullMovieInfo } = require('../services/movieService');
const { isFavorite } = require('../services/favoritesService');
const { getMovieKeyboard } = require('../keyboards/keyboards');

async function handleMoodSearch(ctx, mood) {
    await ctx.answerCallbackQuery(`🎭 ${mood}`);
    
    const config = MOOD_CONFIG[mood];
    if (!config) {
        return ctx.reply("❌ Неизвестное настроение");
    }
    
    try {
        const queries = config.keywords;
        let result = null;
        
        // Поиск фильмов
        for (let i = 0; i < 5; i++) {
            const randomQuery = queries[Math.floor(Math.random() * queries.length)];
            try {
                result = await searchMovies(randomQuery, 1);
                if (result && result.movies && result.movies.length > 0) {
                    break;
                }
            } catch (e) {
                console.log(`Ошибка поиска: ${e.message}`);
            }
        }
        
        if (!result || !result.movies) {
            return ctx.reply(`❌ Не удалось найти ${config.description.toLowerCase()}`);
        }
        
        // Получаем детали фильмов
        const movies = await Promise.all(
            result.movies.slice(0, 5).map(async (m) => {
                try {
                    return await getFullMovieInfo(m.imdbID);
                } catch {
                    return null;
                }
            })
        );
        
        const validMovies = movies.filter(Boolean);
        
        if (validMovies.length === 0) {
            return ctx.reply(`😔 Не нашёл фильмов под настроение "${mood}"`);
        }
        
        // Отправляем фильмы
        for (const movie of validMovies.slice(0, 5)) {
            const isFav = isFavorite(ctx.from.id, movie.imdbID);
            const keyboard = getMovieKeyboard(movie.imdbID, movie.title, movie.year, isFav);
            
            const info = `🎬 *${movie.title}* (${movie.year})\n⭐ Рейтинг: ${movie.imdbRating || 'Нет'}\n🎭 ${movie.genre || 'Неизвестно'}`;
            
            await ctx.reply(info, {
                parse_mode: "Markdown",
                reply_markup: keyboard
            });
        }
        
    } catch (e) {
        console.error(e);
        await ctx.reply("❌ Ошибка при подборе фильмов");
    }
}

function getMoodKeyboard() {
    const keyboard = new InlineKeyboard();
    
    for (const [mood, config] of Object.entries(MOOD_CONFIG)) {
        keyboard.text(`${config.emoji} ${mood}`, `mood_${mood}`).row();
    }
    
    keyboard.row().text("🏠 Главное меню", "back_to_start");
    return keyboard;
}

module.exports = {
    handleMoodSearch,
    getMoodKeyboard
};