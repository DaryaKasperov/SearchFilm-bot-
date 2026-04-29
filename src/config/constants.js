// Конфигурация и настройки
module.exports = {
    MAX_SEARCH_RESULTS: 5,
    CACHE_TTL: 86400000, // 24 часа
    SEARCH_CACHE_TTL: 3600000, // 1 час
    RATE_LIMIT: 5, // максимум запросов
    RATE_LIMIT_WINDOW: 60000, // за 60 секунд
    MAX_FAVORITES: 50,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    
    POPULAR_MOVIES: ['tt0111161', 'tt0068646', 'tt0468569', 'tt1375666', 'tt0133093'],
    RANDOM_SEARCH_QUERIES: ['love', 'action', 'comedy', 'drama', 'best', 'movie', 'film'],
    

    MOOD_CONFIG: {
        "Весёлое": {
            emoji: "😄",
            keywords: ["comedy", "animation", "family", "comédie", "комедия"],
            description: "Комедии и лёгкие фильмы"
        },
        "Грустное": {
            emoji: "😢",
            keywords: ["drama", "romance", "biography", "drame", "драма"],
            description: "Драмы и трогательные истории"
        },
        "Напряжённое": {
            emoji: "😱",
            keywords: ["thriller", "action", "crime", "thriller", "триллер"],
            description: "Триллеры и боевики"
        }
    },

    GENRES_TRANSLATION: {
        'Action': 'Боевик', 'Adventure': 'Приключения', 'Animation': 'Мультфильм',
        'Biography': 'Биография', 'Comedy': 'Комедия', 'Crime': 'Криминал',
        'Documentary': 'Документальный', 'Drama': 'Драма', 'Family': 'Семейный',
        'Fantasy': 'Фэнтези', 'Film-Noir': 'Нуар', 'History': 'История',
        'Horror': 'Ужасы', 'Music': 'Музыка', 'Musical': 'Мюзикл',
        'Mystery': 'Детектив', 'Romance': 'Мелодрама', 'Sci-Fi': 'Фантастика',
        'Sport': 'Спорт', 'Thriller': 'Триллер', 'War': 'Военный', 'Western': 'Вестерн'
    }
};
