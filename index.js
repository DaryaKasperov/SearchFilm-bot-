require('dotenv').config();
const { Bot, InlineKeyboard } = require('grammy');

// Импорт модулей - ИСПРАВЛЕННЫЕ ПУТИ
const { startRateLimitCleaner, checkRateLimit } = require('./src/utils/rateLimit');
const { movieCache, searchCache } = require('./src/utils/cache');
const { mainKeyboard, getDirectorKeyboard, getYearKeyboard } = require('./src/keyboards/keyboards');
const { getAllDirectors } = require('./src/database/directorsDB');
const { getMovieBrief, getFullMovieInfo, searchMovies } = require('./src/services/movieService');
const { addToFavorites, removeFromFavorites, isFavorite, getUserFavorites } = require('./src/services/favoritesService');
const { goToMainMenu, sendFullMovieInfo, sendBriefMovieInfo } = require('./src/handlers/messageHandler');
const {
    handleTitleSearch,
    handleDirectorSearch,
    handleYearSearch,
    handleRandomMovie,
    handlePopularMovies
} = require('./src/handlers/searchHandler');
const { showFavorites, clearFavorites, confirmClearFavorites } = require('./src/handlers/favoritesHandler');
const { getTrailerLink } = require('./src/utils/helpers');
const { handleMoodSearch, getMoodKeyboard } = require('./src/handlers/moodHandler');
// 🎭 НАСТРОЕНИЯ
const moodKeywords = {
    "Весёлое": ["Comedy"],
    "Грустное": ["Drama"],
    "Напряжённое": ["Thriller"],
};

// Проверка токена
if (!process.env.BOT_API_KEY) {
    console.error('❌ ОШИБКА: BOT_API_KEY не найден в .env файле');
    process.exit(1);
}

const bot = new Bot(process.env.BOT_API_KEY);

bot.catch((err) => {
    console.error('❌ Ошибка бота:', err);
});

// Запуск очистки rate limit
startRateLimitCleaner();

// Очистка кэша каждые 6 часов
setInterval(() => {
    movieCache.cleanExpired();
    searchCache.cleanExpired();
    console.log(`🧹 Очистка кэша. Размер movieCache: ${movieCache.getSize()}, searchCache: ${searchCache.getSize()}`);
}, 6 * 60 * 60 * 1000);

// ================ КОМАНДЫ ================

bot.command('start', goToMainMenu);
bot.command('help', async (ctx) => {
    await ctx.reply("📖 *Помощь*\n\nИспользуйте кнопки меню для навигации.\n\n/start - главное меню\n/favorites - избранное\n/search - поиск", {
        parse_mode: "Markdown",
        reply_markup: mainKeyboard
    });
});
bot.command('favorites', async (ctx) => await showFavorites(ctx, 1));
bot.command('search', async (ctx) => {
    await ctx.reply("🔍 *Введите название фильма:*", {
        parse_mode: "Markdown",
        reply_markup: { keyboard: [[{ text: "🏠 Главное меню" }]], resize_keyboard: true }
    });
    ctx.session = { searchType: 'title' };
});

bot.hears("🎭 По настроению", async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text("😄 Весёлое", "mood_Весёлое").row()
        .text("😢 Грустное", "mood_Грустное").row()
        .text("😱 Напряжённое", "mood_Напряжённое").row()
        .text("🏠 Главное меню", "back_to_start");

    await ctx.reply("🎭 Выбери настроение:", {
        reply_markup: keyboard
    });
});

// ================ ОСНОВНЫЕ ОБРАБОТЧИКИ ================

bot.hears("🏠 Главное меню", goToMainMenu);
bot.hears("🔍 Поиск по названию", async (ctx) => {
    await ctx.reply("🔍 *Введите название фильма:*\n", {
        parse_mode: "Markdown",
        reply_markup: { keyboard: [[{ text: "🏠 Главное меню" }]], resize_keyboard: true }
    });
    ctx.session = { searchType: 'title' };
});

bot.hears("👤 Поиск по режиссёру", async (ctx) => {
    const directors = getAllDirectors();
    await ctx.reply(
        "👤 *Выберите режиссёра из списка:*\n\n📋 *Доступные режиссёры:*",
        { parse_mode: "Markdown", reply_markup: getDirectorKeyboard(directors) }
    );
});

bot.hears("📅 Поиск по году", async (ctx) => {
    await ctx.reply("📅 *Выберите год выпуска фильма:*", {
        parse_mode: "Markdown",
        reply_markup: getYearKeyboard()
    });
});

bot.hears("🏆 Популярное", handlePopularMovies);
bot.hears("🎬 Случайный фильм", handleRandomMovie);
bot.hears("⭐ Моё избранное", async (ctx) => await showFavorites(ctx, 1));

bot.hears("❓ Помощь", async (ctx) => {
    await ctx.reply(
        "📖 *Как пользоваться ботом*\n\n"
        + "*🔍 Основные функции:*\n"
        + "1️⃣ *Поиск по названию* - введите название на русском или английском\n"
        + "2️⃣ *Поиск по режиссёру* - выберите режиссёра из списка\n"
        + "3️⃣ *Поиск по году* - выберите год выпуска\n"
        + "4️⃣ *Популярное* - топ фильмы всех времён\n"
        + "5️⃣ *Случайный фильм* - случайная рекомендация\n"
        + "6️⃣ *По настроению* - подбор фильмов по вашему настроению\n\n"
        + "*⭐ Избранное:*\n"
        + "• 🤍 *В избранное* - сохранить понравившийся фильм\n"
        + "• ❌ *Удалить* - убрать фильм из избранного (доступно везде)\n"
        + "• 🗑️ *Очистить всё* - удалить все избранные фильмы\n\n"
        + "*📖 У каждого фильма есть кнопки:*\n"
        + "• 📖 *Подробнее* - полная информация о фильме\n"
        + "• 🎥 *Трейлер* - поиск трейлера на YouTube\n"
        + "• 🔍 *Похожие* - рекомендации похожих фильмов\n"
        + "• 🎬 *На Кинопоиске* - найти фильм на Кинопоиске\n"
        + "• ❌ *Удалить из избранного* - если фильм в избранном\n\n"
        + "💡 *Совет:* В любой момент нажмите '🏠 Главное меню' для возврата",
        { parse_mode: "Markdown", reply_markup: mainKeyboard }
    );
});

// ================ ОБНОВЛЁННАЯ ФУНКЦИЯ КЛАВИАТУРЫ С КНОПКОЙ УДАЛЕНИЯ ================

// Функция для создания клавиатуры с кнопкой удаления (если фильм в избранном)
function getMovieKeyboard(imdbID, title, year, isFav = false) {
    const keyboard = new InlineKeyboard();
    
    if (isFav) {
        keyboard.text("❤️ В избранном", "noop");
        keyboard.text("❌ Удалить", `remove_${imdbID}`);
    } else {
        keyboard.text("🤍 В избранное", `add_${imdbID}`);
    }
    
    keyboard.row()
        .text("📖 Подробнее", `details_${imdbID}`)
        .text("🎥 Трейлер", `trailer_${imdbID}`);
    
    keyboard.row()
        .text("🔍 Похожие", `similar_${imdbID}`)
        .text("🏠 Меню", "back_to_start");
    
    keyboard.row()
        .url("🎬 Кинопоиск", `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(`${title} ${year}`)}`);
    
    return keyboard;
}

// ================ ОБНОВЛЁННАЯ ФУНКЦИЯ ОТПРАВКИ ИНФОРМАЦИИ ================

// Отправка краткой информации с кнопкой удаления
async function sendBriefMovieInfoWithDelete(ctx, movieData) {
    const userId = ctx.from.id;
    const isFav = isFavorite(userId, movieData.imdbID);
    
    const caption = `🎬 *${movieData.title}* (${movieData.year})\n` +
        `⭐ Рейтинг: ${movieData.rating || 'Нет'}\n` +
        `🎭 Жанр: ${movieData.genre || 'Неизвестно'}\n` +
        `⏱️ Длительность: ${movieData.runtime || 'Неизвестно'}`;

    let posterUrl = movieData.poster;
    if (posterUrl && posterUrl.startsWith('http://')) {
        posterUrl = posterUrl.replace('http://', 'https://');
    }
    
    const hasPoster = posterUrl && posterUrl !== 'N/A';

    const keyboard = getMovieKeyboard(movieData.imdbID, movieData.title, movieData.year, isFav);

    if (hasPoster) {
        await ctx.replyWithPhoto(posterUrl, {
            caption: caption,
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    } else {
        await ctx.reply(caption, {
            parse_mode: "Markdown",
            reply_markup: keyboard
        });
    }
}

// ================ ТЕКСТОВЫЙ ПОИСК ================

bot.on("msg:text", async (ctx) => {
    const text = ctx.msg.text;

    const ignore = ["🏠 Главное меню", "🎭 По настроению", "⭐ Моё избранное", "🔍 Поиск по названию",
                    "👤 Поиск по режиссёру", "📅 Поиск по году", "🏆 Популярное",
                    "🎬 Случайный фильм", "❓ Помощь"];

    if (text.startsWith('/') || ignore.includes(text)) return;
    if (!ctx.session) ctx.session = {};

    const searchType = ctx.session.searchType || 'title';

    if (searchType === 'title') {
        await handleTitleSearch(ctx, text);
    }

    if (searchType === 'year') {
        const year = parseInt(text);
        if (!isNaN(year) && year >= 1888 && year <= new Date().getFullYear()) {
            await handleYearSearch(ctx, year.toString());
        } else {
            await ctx.reply("❌ *Некорректный год*\n\nВведите год от 1888 до текущего", {
                parse_mode: "Markdown"
            });
        }
        ctx.session.searchType = null;
    }

    ctx.session.searchType = null;
});

// ================= 🎭 ЛОГИКА НАСТРОЕНИЯ =================

bot.callbackQuery(/^mood_(.+)$/, async (ctx) => {
    const mood = ctx.match[1];

    await ctx.answerCallbackQuery(`🎭 ${mood}`);

    try {
        const moodSearchMap = {
            "Весёлое": ["comedy", "animation", "family"],
            "Грустное": ["drama", "romance", "biography"],
            "Напряжённое": ["thriller", "action", "crime"]
        };

        const queries = moodSearchMap[mood] || ["movie"];
        let result = null;

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
            return ctx.reply("❌ Не удалось подобрать фильмы");
        }

        const detailedMovies = await Promise.all(
            result.movies.slice(0, 5).map(async (m) => {
                try {
                    return await getFullMovieInfo(m.imdbID);
                } catch {
                    return null;
                }
            })
        );

        const validMovies = detailedMovies.filter(Boolean);

        const filtered = validMovies.filter(movie => {
            if (!movie.genre) return false;
            const genreLower = movie.genre.toLowerCase();
            return queries.some(q => genreLower.includes(q.toLowerCase()));
        });

        if (filtered.length === 0) {
            return ctx.reply("😔 Не нашёл фильмов под это настроение");
        }

        for (const movie of filtered.slice(0, 5)) {
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
});

// ================ ОБРАБОТЧИК УДАЛЕНИЯ ИЗ ИЗБРАННОГО (РАБОТАЕТ ВЕЗДЕ) ================

bot.callbackQuery(/^remove_(.+)$/, async (ctx) => {
    const imdbID = ctx.match[1];
    const userId = ctx.from.id;
    
    // Получаем данные фильма для ответа
    const movieData = await getMovieBrief(imdbID);
    const removed = removeFromFavorites(userId, imdbID);
    
    if (removed) {
        await ctx.answerCallbackQuery(`✅ "${movieData?.title || 'Фильм'}" удалён из избранного!`);
        
        // Обновляем клавиатуру - меняем кнопку "Удалить" на "В избранное"
        try {
            const newKeyboard = new InlineKeyboard()
                .text("🤍 В избранное", `add_${imdbID}`)
                .row()
                .text("📖 Подробнее", `details_${imdbID}`)
                .text("🎥 Трейлер", `trailer_${imdbID}`)
                .row()
                .text("🔍 Похожие", `similar_${imdbID}`)
                .text("🏠 Меню", "back_to_start")
                .row()
                .url("🎬 Кинопоиск", `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(`${movieData?.title} ${movieData?.year}`)}`);
            
            await ctx.editMessageReplyMarkup({ reply_markup: newKeyboard });
        } catch (e) {
            // Если не удалось обновить клавиатуру (сообщение могло быть удалено)
            console.log('Не удалось обновить клавиатуру:', e.message);
        }
    } else {
        await ctx.answerCallbackQuery("❌ Фильм не найден в избранном!");
    }
});

// ================ ОСТАЛЬНЫЕ CALLBACK ОБРАБОТЧИКИ ================

// Поиск по режиссёру
bot.callbackQuery(/^director_(.+)$/, async (ctx) => {
    await handleDirectorSearch(ctx, ctx.match[1]);
});

// Поиск по году
bot.callbackQuery(/^year_(\d+)$/, async (ctx) => {
    await handleYearSearch(ctx, ctx.match[1]);
});

// Случайный год
bot.callbackQuery("random_year", async (ctx) => {
    const currentYear = new Date().getFullYear();
    const randomYear = Math.floor(Math.random() * (currentYear - 1970 + 1) + 1970);
    await ctx.answerCallbackQuery(`🎲 Выбран случайный год: ${randomYear}`);
    await handleYearSearch(ctx, randomYear.toString());
});

// Обработчик для ручного ввода года
bot.callbackQuery("other_year", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
        "📅 *Введите год в цифровом формате*\n\nНапример: 1994, 2020, 2024\n\nГод должен быть от 1888 до текущего",
        {
            parse_mode: "Markdown",
            reply_markup: {
                keyboard: [[{ text: "🏠 Главное меню" }]],
                resize_keyboard: true
            }
        }
    );
    ctx.session = { searchType: 'year' };
});

// Добавление в избранное
bot.callbackQuery(/^add_(.+)$/, async (ctx) => {
    const imdbID = ctx.match[1];
    const movieData = await getMovieBrief(imdbID);
    const added = addToFavorites(ctx.from.id, imdbID, movieData);

    if (added) {
        await ctx.answerCallbackQuery(`✅ "${movieData?.title}" добавлен в избранное!`);
        try {
            const newKeyboard = new InlineKeyboard()
                .text("❤️ В избранном", "noop")
                .text("❌ Удалить", `remove_${imdbID}`)
                .row()
                .text("📖 Подробнее", `details_${imdbID}`)
                .text("🎥 Трейлер", `trailer_${imdbID}`)
                .row()
                .text("🔍 Похожие", `similar_${imdbID}`)
                .text("🏠 Меню", "back_to_start")
                .row()
                .url("🎬 Кинопоиск", `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(`${movieData?.title} ${movieData?.year}`)}`);
            
            await ctx.editMessageReplyMarkup({ reply_markup: newKeyboard });
        } catch (e) {}
    } else if (isFavorite(ctx.from.id, imdbID)) {
        await ctx.answerCallbackQuery("❌ Уже в избранном!");
    } else {
        await ctx.answerCallbackQuery("❌ Достигнут лимит избранного (50)!");
    }
});

// Детали фильма - показываем полную информацию с кнопкой удаления
bot.callbackQuery(/^details_(.+)$/, async (ctx) => {
    const imdbID = ctx.match[1];
    await ctx.answerCallbackQuery("📖 Загружаю подробную информацию...");

    const movieData = await getFullMovieInfo(imdbID);
    const inFavorites = isFavorite(ctx.from.id, imdbID);

    if (movieData) {
        await sendFullMovieInfo(ctx, movieData, inFavorites);
    } else {
        await ctx.reply("❌ Не удалось получить информацию о фильме.");
    }
});

// Трейлер
bot.callbackQuery(/^trailer_(.+)$/, async (ctx) => {
    const imdbID = ctx.match[1];
    const movieData = await getMovieBrief(imdbID);

    if (movieData) {
        await ctx.answerCallbackQuery();
        await ctx.reply(
            `🎥 *Трейлер "${movieData.title}"*\n\n[Смотреть на YouTube](${getTrailerLink(movieData.title, movieData.year)})`,
            { parse_mode: "Markdown" }
        );
    } else {
        await ctx.answerCallbackQuery("❌ Данные не найдены");
    }
});

// Похожие фильмы
bot.callbackQuery(/^similar_(.+)$/, async (ctx) => {
    const imdbID = ctx.match[1];
    const movieData = await getMovieBrief(imdbID);

    if (!movieData) {
        await ctx.answerCallbackQuery("❌ Данные не найдены");
        return;
    }

    await ctx.answerCallbackQuery("🔍 Ищу похожие фильмы...");

    const result = await searchMovies(movieData.title, 1);

    if (result && result.movies.length > 1) {
        const similar = result.movies.slice(1, 4);
        let message = "🔍 *Похожие фильмы:*\n\n";
        for (const movie of similar) {
            const isFav = isFavorite(ctx.from.id, movie.imdbID);
            message += `• ${isFav ? '❤️' : '🤍'} *${movie.Title}* (${movie.Year})\n`;
        }
        message += "\n📖 Нажмите на кнопку '📖 Подробнее' у любого фильма для полной информации";
        await ctx.reply(message, { parse_mode: "Markdown" });
    } else {
        await ctx.reply("❌ Похожие фильмы не найдены\n\nПопробуйте поискать по названию", { parse_mode: "Markdown" });
    }
});

// Пагинация избранного
bot.callbackQuery(/fav_page_(\d+)/, async (ctx) => {
    const page = parseInt(ctx.match[1]);
    await ctx.answerCallbackQuery();
    await showFavorites(ctx, page);
    await ctx.deleteMessage();
});

// Очистка избранного
bot.callbackQuery("clear_all_favorites", async (ctx) => {
    await clearFavorites(ctx);
});

bot.callbackQuery("confirm_clear", async (ctx) => {
    await confirmClearFavorites(ctx);
});

// Возврат в меню
bot.callbackQuery("back_to_start", async (ctx) => {
    await ctx.answerCallbackQuery("Возврат в главное меню...");
    try {
        await ctx.deleteMessage();
    } catch (e) {}
    await goToMainMenu(ctx);
});

// Пустая кнопка
bot.callbackQuery("noop", async (ctx) => {
    await ctx.answerCallbackQuery();
});

// ================ ЗАПУСК ================

bot.start()
    .then(() => {
        console.log("\n✅ ===================================== ✅");
        console.log("🎬 Бот успешно запущен!");
        console.log("✅ Кнопка '❌ Удалить из избранного' доступна везде!");
        console.log("✅ ===================================== ✅\n");
    })
    .catch((err) => {
        console.error("❌ Ошибка запуска:", err);
        process.exit(1);
    });