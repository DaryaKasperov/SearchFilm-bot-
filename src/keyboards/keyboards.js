const { Keyboard, InlineKeyboard } = require('grammy');
const { getKinopoiskLink } = require('../utils/helpers');

// Главная клавиатура
const mainKeyboard = new Keyboard()
    .text("🔍 Поиск по названию")
    .row()
    .text("👤 Поиск по режиссёру")
    .text("📅 Поиск по году")
    .row()
    .text("🏆 Популярное")
    .text("🎬 Случайный фильм")
    .row()
    .text("⭐ Моё избранное")
    .text("🏠 Главное меню")
    .row()
    .text("❓ Помощь")
    .resized()
    .persistent()
    .text ("🎭 По настроению");

// Клавиатура для краткой информации
function getBriefMovieKeyboard(imdbID, title, year, isFav = false) {
    const keyboard = new InlineKeyboard();
    
    if (isFav) {
        keyboard.text("❤️ В избранном", "noop");
    } else {
        keyboard.text("🤍 В избранное", `add_${imdbID}`);
    }
    
    keyboard.row()
        .text("📖 Подробнее", `details_${imdbID}`)
        .text("🎥 Трейлер", `trailer_${imdbID}`);
    
    keyboard.row()
        .url("🎬 На Кинопоиске", getKinopoiskLink(title, year));
    
    return keyboard;
}


// Клавиатура для полной информации
function getFullMovieKeyboard(imdbID, title, year, isFav = false) {
    const keyboard = new InlineKeyboard();
    
    if (isFav) {
        keyboard.text("❤️ В избранном", "noop");
        keyboard.text("❌ Удалить", `remove_${imdbID}`);
    } else {
        keyboard.text("🤍 В избранное", `add_${imdbID}`);
    }
    
    keyboard.row()
        .text("🎥 Трейлер", `trailer_${imdbID}`)
        .text("🔍 Похожие", `similar_${imdbID}`);
    
    keyboard.row()
        .url("🎬 Смотреть на Кинопоиске", getKinopoiskLink(title, year))
        .text("🏠 Главное меню", "back_to_start");
    
    return keyboard;
}

// Клавиатура выбора режиссёра
function getDirectorKeyboard(directors) {
    const keyboard = new InlineKeyboard();
    let count = 0;
    
    for (const director of directors) {
        keyboard.text(director.name, `director_${director.key}`);
        count++;
        if (count % 2 === 0 && count < directors.length) {
            keyboard.row();
        }
    }
    
    keyboard.row().text("🏠 Главное меню", "back_to_start");
    return keyboard;
}

// Клавиатура выбора года
function getYearKeyboard() {
    const currentYear = new Date().getFullYear();
    const keyboard = new InlineKeyboard();
    
    for (let i = currentYear; i >= currentYear - 10; i--) {
        keyboard.text(i.toString(), `year_${i}`);
        if ((currentYear - i + 1) % 3 === 0 && i > currentYear - 10) {
            keyboard.row();
        }
    }
    
    keyboard.row().text("🎲 Случайный год", "random_year");
    keyboard.row().text("🏠 Главное меню", "back_to_start");
    return keyboard;
}

// Клавиатура подтверждения
function getConfirmKeyboard(action) {
    return new InlineKeyboard()
        .text("✅ Да", `confirm_${action}`)
        .text("❌ Нет", "back_to_start");
}

module.exports = {
    mainKeyboard,
    getBriefMovieKeyboard,
    getFullMovieKeyboard,
    getDirectorKeyboard,
    getYearKeyboard,
    getConfirmKeyboard
};