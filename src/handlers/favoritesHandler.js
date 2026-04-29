const { getUserFavorites, clearAllFavorites, getFavoritesCount } = require('../services/favoritesService');
const { getMovieBrief } = require('../services/movieService');
const { sendBriefMovieInfo } = require('./messageHandler');
const { mainKeyboard } = require('../keyboards/keyboards');
const { getConfirmKeyboard } = require('../keyboards/keyboards');

async function showFavorites(ctx, page = 1) {
    const userFavorites = getUserFavorites(ctx.from.id);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(userFavorites.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const favoritesToShow = userFavorites.slice(startIndex, endIndex);
    
    if (userFavorites.length === 0) {
        await ctx.reply(
            "⭐ *У вас пока нет избранных фильмов*\n\n🔍 Найдите фильм через поиск и нажмите кнопку '🤍 В избранное'", 
            { parse_mode: "Markdown" }
        );
        return;
    }
    
    let message = `⭐ *Ваши избранные фильмы*\n`;
  
    for (let i = 0; i < favoritesToShow.length; i++) {
        const fav = favoritesToShow[i];
        const number = startIndex + i + 1;
        message += `${number}. *${fav.title}* (${fav.year})\n`;
    }
    
    if (totalPages > 1) {
        message += `\n📄 *Страница ${page} из ${totalPages}*`;
    }
    
    await ctx.reply(message, { parse_mode: "Markdown" });
    
    for (const fav of favoritesToShow) {
        const movieData = await getMovieBrief(fav.imdbID);
        if (movieData) {
            await sendBriefMovieInfo(ctx, {
                imdbID: fav.imdbID,
                Title: movieData.title,
                Year: movieData.year,
                imdbRating: movieData.rating,
                Genre: movieData.genre,
                Runtime: movieData.runtime,
                Poster: movieData.poster
            });
        }
    }
    
    if (totalPages > 1) {
        const { InlineKeyboard } = require('grammy');
        const paginationKeyboard = new InlineKeyboard();
        
        if (page > 1) {
            paginationKeyboard.text("◀️ Назад", `fav_page_${page - 1}`);
        }
        
        paginationKeyboard.text(`${page}/${totalPages}`, "noop");
        
        if (page < totalPages) {
            paginationKeyboard.text("Вперед ▶️", `fav_page_${page + 1}`);
        }
        
        paginationKeyboard.row()
            .text("🗑️ Очистить всё", "clear_all_favorites")
            .text("🏠 Главное меню", "back_to_start");
        
        await ctx.reply("📄 *Навигация по избранному:*", {
            parse_mode: "Markdown",
            reply_markup: paginationKeyboard
        });
    } else {
        const actionKeyboard = new InlineKeyboard()
            .text("🗑️ Очистить всё", "clear_all_favorites")
            .text("🏠 Главное меню", "back_to_start");
        
        await ctx.reply("🔧 *Действия с избранным:*", {
            parse_mode: "Markdown",
            reply_markup: actionKeyboard
        });
    }
}

async function clearFavorites(ctx) {
    const count = getFavoritesCount(ctx.from.id);
    
    if (count === 0) {
        await ctx.answerCallbackQuery("❌ Избранное уже пусто");
        return;
    }
    
    const confirmKeyboard = getConfirmKeyboard("clear");
    await ctx.reply(
        `⚠️ *Внимание!*\n\nВы действительно хотите удалить ВСЕ ${count} фильмов из избранного?\nЭто действие нельзя отменить.`,
        { parse_mode: "Markdown", reply_markup: confirmKeyboard }
    );
}

async function confirmClearFavorites(ctx) {
    const userId = ctx.from.id;
    const count = getFavoritesCount(userId);
    
    clearAllFavorites(userId);
    
    await ctx.answerCallbackQuery(`🗑️ Удалено ${count} фильмов из избранного!`);
    await ctx.deleteMessage();
    await ctx.reply("✅ *Ваше избранное очищено!*", {
        parse_mode: "Markdown",
        reply_markup: mainKeyboard
    });
}

module.exports = {
    showFavorites,
    clearFavorites,
    confirmClearFavorites
};