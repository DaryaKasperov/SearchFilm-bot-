const { mainKeyboard, getBriefMovieKeyboard } = require('../keyboards/keyboards');
const { truncateText, translateGenre, formatRuntime, getTrailerLink } = require('../utils/helpers');
const { isFavorite } = require('../services/favoritesService');

async function sendBriefMovieInfo(ctx, movie) {
    const userId = ctx.from.id;
    const inFavorites = isFavorite(userId, movie.imdbID);
    
    const caption = `🎬 *${movie.Title || movie.title}* (${movie.Year || movie.year})\n` +
        `⭐ Рейтинг: ${movie.imdbRating || movie.rating || 'Нет'}\n` +
        `🎭 Жанр: ${translateGenre(movie.Genre || movie.genre || 'Неизвестно')}\n` +
        `⏱️ Длительность: ${formatRuntime(movie.Runtime || movie.runtime)}`;

    let posterUrl = movie.Poster || movie.poster;
    if (posterUrl && posterUrl.startsWith('http://')) {
        posterUrl = posterUrl.replace('http://', 'https://');
    }
    
    const hasPoster = posterUrl && posterUrl !== 'N/A';

    try {
        if (hasPoster) {
            await ctx.replyWithPhoto(posterUrl, {
                caption: caption,
                parse_mode: "Markdown",
                reply_markup: getBriefMovieKeyboard(
                    movie.imdbID, 
                    movie.Title || movie.title, 
                    movie.Year || movie.year, 
                    inFavorites
                )
            });
        } else {
            await ctx.reply(caption, {
                parse_mode: "Markdown",
                reply_markup: getBriefMovieKeyboard(
                    movie.imdbID, 
                    movie.Title || movie.title, 
                    movie.Year || movie.year, 
                    inFavorites
                )
            });
        }
    } catch (error) {
        console.error(`Ошибка отправки постера:`, error.message);
        await ctx.reply(caption, {
            parse_mode: "Markdown",
            reply_markup: getBriefMovieKeyboard(
                movie.imdbID, 
                movie.Title || movie.title, 
                movie.Year || movie.year, 
                inFavorites
            )
        });
    }
}

async function sendFullMovieInfo(ctx, movieData, inFavorites) {
    const ratings = movieData.ratings?.map(r => `⭐ ${r.Source}: ${r.Value}`).join("\n") || "Нет данных";
    
    const message = `🎬 *${movieData.title}* (${movieData.year})

📅 *Дата выхода:* ${movieData.released || "Неизвестно"}
⏱️ *Длительность:* ${formatRuntime(movieData.runtime)}
🎭 *Жанр:* ${translateGenre(movieData.genre || "Неизвестно")}
👤 *Режиссёр:* ${movieData.director || "Неизвестно"}
✍️ *Сценарий:* ${truncateText(movieData.writer || "Неизвестно", 150)}
🎭 *Актёры:* ${truncateText(movieData.actors || "Неизвестно", 150)}
📝 *Сюжет:* ${truncateText(movieData.plot || "Неизвестно", 350)}
🌍 *Страна:* ${movieData.country || "Неизвестно"}
💰 *Бюджет:* ${movieData.boxOffice || "Неизвестно"}

🏆 *Рейтинги:*
${ratings}

🔗 *IMDb ID:* ${movieData.imdbID}`;

    let posterUrl = movieData.poster;
    if (posterUrl && posterUrl.startsWith('http://')) {
        posterUrl = posterUrl.replace('http://', 'https://');
    }
    
    const hasPoster = posterUrl && posterUrl !== 'N/A';

    const { getFullMovieKeyboard } = require('../keyboards/keyboards');
    
    if (hasPoster) {
        await ctx.replyWithPhoto(posterUrl, {
            caption: truncateText(message, 1000),
            parse_mode: "Markdown",
            reply_markup: getFullMovieKeyboard(movieData.imdbID, movieData.title, movieData.year, inFavorites)
        });
    } else {
        await ctx.reply(truncateText(message, 4000), {
            parse_mode: "Markdown",
            reply_markup: getFullMovieKeyboard(movieData.imdbID, movieData.title, movieData.year, inFavorites)
        });
    }
}

async function goToMainMenu(ctx) {
    await ctx.reply(
        "🎬 *Добро пожаловать в SearchFilm[bot]*\n\n"
        + "Я помогу тебе найти информацию о фильмах.\n\n"
        + "🔍 *Что я умею:*\n"
        + "• Искать фильмы по названию \n"
        + "• Показывать фильмы известных режиссёров\n"
        + "• Искать фильмы по году выпуска\n"
        + "• Сохранять понравившиеся фильмы в избранное\n\n"
        + "👇 *Используй кнопки ниже:*",
        { parse_mode: "Markdown", reply_markup: mainKeyboard }
    );
}

module.exports = {
    sendBriefMovieInfo,
    sendFullMovieInfo,
    goToMainMenu
};