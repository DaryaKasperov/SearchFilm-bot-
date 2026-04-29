// src/handlers/searchHandler.js
const { searchMovies, getMovieBrief, getFullMovieInfo } = require('../services/movieService');
const { sendBriefMovieInfo } = require('./messageHandler');
const { checkRateLimit } = require('../utils/rateLimit');
const { RANDOM_SEARCH_QUERIES, POPULAR_MOVIES } = require('../config/constants');
const { directorMoviesDatabase } = require('../database/directorsDB');
const { mainKeyboard } = require('../keyboards/keyboards');

// ================ ПОИСК ПО НАЗВАНИЮ ================

async function handleTitleSearch(ctx, text) {
    if (!checkRateLimit(ctx.from.id)) {
        await ctx.reply("⏰ *Слишком много запросов!*\n\nПожалуйста, подождите немного.", {
            parse_mode: "Markdown"
        });
        return;
    }
    
    await ctx.replyWithChatAction("typing");
    await ctx.reply(`🔍 *Ищу:* "${text}"`, { parse_mode: "Markdown" });
    
    const result = await searchMovies(text, 1);
    
    if (!result || result.movies.length === 0) {
        await ctx.reply(
            "❌ *Ничего не найдено*\n\n💡 *Попробуйте:*\n• Ввести название на английском\n• Использовать более короткий запрос\n• Проверить правильность написания", 
            { parse_mode: "Markdown", reply_markup: mainKeyboard }
        );
        return;
    }
    
    await ctx.reply(`✅ *Найдено фильмов:* ${result.movies.length}\n\n📋 *Краткая информация:*`, { parse_mode: "Markdown" });
    
    for (const movie of result.movies.slice(0, 5)) {
        const movieData = await getMovieBrief(movie.imdbID);
        if (movieData) {
            await sendBriefMovieInfo(ctx, {
                imdbID: movie.imdbID,
                Title: movieData.title,
                Year: movieData.year,
                imdbRating: movieData.rating,
                Genre: movieData.genre,
                Runtime: movieData.runtime,
                Poster: movieData.poster
            });
        }
    }
    
    if (result.movies.length > 5) {
        await ctx.reply(`📌 *Показано 5 из ${result.movies.length} фильмов*\nДля более точного поиска уточните запрос.`, { 
            parse_mode: "Markdown" 
        });
    }
}

// ================ ПОИСК ПО РЕЖИССЁРУ ================

async function handleDirectorSearch(ctx, directorKey) {
    if (!checkRateLimit(ctx.from.id)) {
        await ctx.answerCallbackQuery("⏰ Слишком много запросов!");
        return;
    }
    
    await ctx.answerCallbackQuery(`Загружаю фильмы...`);
    
    const sentMessage = await ctx.reply(`👤 *Загружаю фильмы режиссёра...*\n\n⏳ Пожалуйста, подождите`, { 
        parse_mode: "Markdown" 
    });
    
    const director = directorMoviesDatabase[directorKey];
    if (!director) {
        await ctx.reply("❌ *Режиссёр не найден*", { parse_mode: "Markdown", reply_markup: mainKeyboard });
        return;
    }
    
    const movies = [];
    for (const imdbID of director.movies) {
        const movieData = await getMovieBrief(imdbID);
        if (movieData) {
            movies.push({
                imdbID: imdbID,
                Title: movieData.title,
                Year: movieData.year,
                imdbRating: movieData.rating,
                Genre: movieData.genre,
                Runtime: movieData.runtime,
                Poster: movieData.poster
            });
        }
    }
    
    try {
        await ctx.api.deleteMessage(sentMessage.chat.id, sentMessage.message_id);
    } catch (e) {}
    
    try {
        await ctx.deleteMessage();
    } catch (e) {}
    
    if (movies.length > 0) {
        await ctx.reply(`👤 *${director.name}*\n\n🎬 *Фильмов в коллекции:* ${movies.length}\n\n📋 *Краткая информация:*`, { 
            parse_mode: "Markdown" 
        });
        
        for (const movie of movies) {
            await sendBriefMovieInfo(ctx, movie);
        }
    } else {
        await ctx.reply("❌ *Не удалось загрузить фильмы*", { 
            parse_mode: "Markdown",
            reply_markup: mainKeyboard 
        });
    }
}

// ================ ПОИСК ПО ГОДУ ================

// Функция для получения списка годов с фильмами
async function getYearsWithMovies() {
    const yearsWithMovies = new Set();
    
    // Список популярных поисковых запросов для сбора годов
    const searchTerms = ['movie', 'film', 'action', 'comedy', 'drama', 'love', 'best', '2024', '2023'];
    
    for (const term of searchTerms) {
        try {
            const result = await searchMovies(term, 1);
            if (result && result.movies) {
                result.movies.forEach(movie => {
                    if (movie.Year && !isNaN(parseInt(movie.Year)) && parseInt(movie.Year) > 1900) {
                        yearsWithMovies.add(movie.Year);
                    }
                });
            }
        } catch (e) {
            console.log(`Ошибка поиска для ${term}:`, e.message);
        }
    }
    
    // Сортируем года от новых к старым
    return Array.from(yearsWithMovies).sort((a, b) => parseInt(b) - parseInt(a)).slice(0, 15);
}

// Функция для проверки, есть ли фильмы в указанном году
async function hasMoviesInYear(year) {
    const searchTerms = ['movie', 'film', 'action', 'comedy', 'drama'];
    
    for (const term of searchTerms) {
        try {
            const result = await searchMovies(term, 1);
            if (result && result.movies) {
                const hasMovie = result.movies.some(movie => movie.Year === year);
                if (hasMovie) return true;
            }
        } catch (e) {
            console.log(`Ошибка проверки года ${year}:`, e.message);
        }
    }
    return false;
}

// Основной обработчик поиска по году
async function handleYearSearch(ctx, year) {
    if (!checkRateLimit(ctx.from.id)) {
        await ctx.reply("⏰ *Слишком много запросов!*", { parse_mode: "Markdown" });
        return;
    }
    
    if (ctx.match && ctx.match[0] && ctx.match[0].startsWith('year_')) {
        await ctx.answerCallbackQuery(`Ищу фильмы ${year} года...`);
    }
    
    const loadingMsg = await ctx.reply(`🔍 *Ищу фильмы ${year} года...*\n\n⏳ Пожалуйста, подождите`, { parse_mode: "Markdown" });
    
    // Ищем фильмы за указанный год
    const searchTerms = ['movie', 'film', 'action', 'comedy', 'drama', 'thriller', 'love', 'best', '2024', '2023'];
    let allMovies = [];
    let seen = new Set();
    
    for (const term of searchTerms) {
        try {
            const result = await searchMovies(term, 1);
            if (result && result.movies) {
                const yearMovies = result.movies.filter(m => m.Year === year);
                for (const movie of yearMovies) {
                    if (!seen.has(movie.imdbID)) {
                        seen.add(movie.imdbID);
                        allMovies.push(movie);
                    }
                }
            }
        } catch (e) {
            console.log(`Ошибка поиска для ${term}:`, e.message);
        }
        
        if (allMovies.length >= 10) break;
    }
    
    try {
        await ctx.api.deleteMessage(loadingMsg.chat.id, loadingMsg.message_id);
    } catch (e) {}
    
    if (allMovies.length > 0) {
        try {
            await ctx.deleteMessage().catch(() => {});
        } catch (e) {}
        
        await ctx.reply(`📅 *Фильмы ${year} года*\n\n✅ *Найдено:* ${allMovies.length} фильмов\n\n📋 *Краткая информация:*`, { 
            parse_mode: "Markdown" 
        });
        
        for (const movie of allMovies.slice(0, 10)) {
            const movieData = await getMovieBrief(movie.imdbID);
            if (movieData) {
                await sendBriefMovieInfo(ctx, {
                    imdbID: movie.imdbID,
                    Title: movieData.title,
                    Year: movieData.year,
                    imdbRating: movieData.rating,
                    Genre: movieData.genre,
                    Runtime: movieData.runtime,
                    Poster: movieData.poster
                });
            }
        }
    } else {
        await ctx.reply(`❌ *Фильмы ${year} года не найдены*\n\n💡 *Попробуйте:*\n• Выбрать другой год\n• Воспользоваться поиском по названию\n• Ввести год вручную через кнопку "Другой год"`, { 
            parse_mode: "Markdown", 
            reply_markup: mainKeyboard 
        });
    }
}

// ================ СЛУЧАЙНЫЙ ФИЛЬМ ================

async function handleRandomMovie(ctx) {
    if (!checkRateLimit(ctx.from.id)) {
        await ctx.reply("⏰ *Слишком много запросов!*\n\nПожалуйста, подождите немного.", {
            parse_mode: "Markdown"
        });
        return;
    }
    
    await ctx.replyWithChatAction("typing");
    await ctx.reply("🎲 *Ищу случайный фильм для вас...*\n\n⏳ Пожалуйста, подождите", { parse_mode: "Markdown" });
    
    let result = null;
    let attempts = 0;
    const maxAttempts = 5;
    
    while (!result && attempts < maxAttempts) {
        const randomQuery = RANDOM_SEARCH_QUERIES[Math.floor(Math.random() * RANDOM_SEARCH_QUERIES.length)];
        result = await searchMovies(randomQuery, 1);
        attempts++;
    }
    
    if (result && result.movies && result.movies.length > 0) {
        const randomMovie = result.movies[Math.floor(Math.random() * result.movies.length)];
        const movieData = await getMovieBrief(randomMovie.imdbID);
        if (movieData) {
            await sendBriefMovieInfo(ctx, {
                imdbID: randomMovie.imdbID,
                Title: movieData.title,
                Year: movieData.year,
                imdbRating: movieData.rating,
                Genre: movieData.genre,
                Runtime: movieData.runtime,
                Poster: movieData.poster
            });
        } else {
            await ctx.reply("❌ *Не удалось получить информацию о фильме*\n\nПопробуйте ещё раз", { 
                parse_mode: "Markdown", 
                reply_markup: mainKeyboard 
            });
        }
    } else {
        await ctx.reply("❌ *Не удалось найти случайный фильм*\n\nПопробуйте ещё раз позже", { 
            parse_mode: "Markdown", 
            reply_markup: mainKeyboard 
        });
    }
}

// ================ ПОПУЛЯРНЫЕ ФИЛЬМЫ ================

async function handlePopularMovies(ctx) {
    await ctx.replyWithChatAction("typing");
    await ctx.reply("🏆 *Самые популярные фильмы всех времён*\n", { 
        parse_mode: "Markdown" 
    });
    
    for (const imdbID of POPULAR_MOVIES) {
        const movieData = await getMovieBrief(imdbID);
        if (movieData) {
            await sendBriefMovieInfo(ctx, {
                imdbID: imdbID,
                Title: movieData.title,
                Year: movieData.year,
                imdbRating: movieData.rating,
                Genre: movieData.genre,
                Runtime: movieData.runtime,
                Poster: movieData.poster
            });
        }
    }
}

// ================ ПОЛУЧЕНИЕ КЛАВИАТУРЫ С ГОДАМИ ================

// Функция для создания клавиатуры с годами (только те, где есть фильмы)
async function getYearKeyboardWithMovies() {
    const { InlineKeyboard } = require('grammy');
    const yearsWithMovies = await getYearsWithMovies();
    const keyboard = new InlineKeyboard();
    
    if (yearsWithMovies.length > 0) {
        // Показываем только года с фильмами
        for (let i = 0; i < Math.min(yearsWithMovies.length, 12); i++) {
            const year = yearsWithMovies[i];
            keyboard.text(year.toString(), `year_${year}`);
            
            if ((i + 1) % 3 === 0 && i < yearsWithMovies.length - 1) {
                keyboard.row();
            }
        }
    } else {
        // Если не удалось получить года с фильмами, показываем последние 10 лет
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= currentYear - 10; i--) {
            keyboard.text(i.toString(), `year_${i}`);
            if ((currentYear - i + 1) % 3 === 0 && i > currentYear - 10) {
                keyboard.row();
            }
        }
    }
    
    keyboard.row()
        .text("🎲 Случайный год", "random_year")
        .text("📝 Другой год", "other_year");
    
    keyboard.row().text("🏠 Главное меню", "back_to_start");
    return keyboard;
}

// Экспорт функций
module.exports = {
    handleTitleSearch,
    handleDirectorSearch,
    handleYearSearch,
    handleRandomMovie,
    handlePopularMovies,
    getYearsWithMovies,
    hasMoviesInYear,
    getYearKeyboardWithMovies
};