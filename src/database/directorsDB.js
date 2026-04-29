// База данных режиссёров
const directorMoviesDatabase = {
    'nolan': {
        name: 'Кристофер Нолан',
        nameEn: 'Christopher Nolan',
        movies: ['tt0468569', 'tt1375666', 'tt1345836', 'tt0816692', 'tt1856101']
    },
    'tarantino': {
        name: 'Квентин Тарантино',
        nameEn: 'Quentin Tarantino',
        movies: ['tt0110912', 'tt0105323', 'tt0256460', 'tt0361748', 'tt1853728']
    },
    'scorsese': {
        name: 'Мартин Скорсезе',
        nameEn: 'Martin Scorsese',
        movies: ['tt0109830', 'tt0112641', 'tt0407887', 'tt0993846', 'tt1302006']
    },
    'spielberg': {
        name: 'Стивен Спилберг',
        nameEn: 'Steven Spielberg',
        movies: ['tt0073195', 'tt0088247', 'tt0109830', 'tt0405159', 'tt0361748']
    },
    'cameron': {
        name: 'Джеймс Кэмерон',
        nameEn: 'James Cameron',
        movies: ['tt0499549', 'tt1630029', 'tt0090605', 'tt0103064', 'tt0120338']
    },
    'fincher': {
        name: 'Дэвид Финчер',
        nameEn: 'David Fincher',
        movies: ['tt0137523', 'tt0421715', 'tt1564346', 'tt0144084', 'tt0443706']
    },
    'villeneuve': {
        name: 'Дени Вильнёв',
        nameEn: 'Denis Villeneuve',
        movies: ['tt1856101', 'tt0369339', 'tt2543164', 'tt1160419', 'tt1524930']
    },
    'jackson': {
        name: 'Питер Джексон',
        nameEn: 'Peter Jackson',
        movies: ['tt0120737', 'tt0167261', 'tt0167262', 'tt0327597', 'tt0386585']
    }
};

function getAllDirectors() {
    return Object.entries(directorMoviesDatabase).map(([key, value]) => ({
        key,
        name: value.name,
        nameEn: value.nameEn,
        moviesCount: value.movies.length
    }));
}

function getDirectorMovies(key) {
    return directorMoviesDatabase[key];
}

function searchDirector(query) {
    const searchLower = query.toLowerCase();
    return Object.entries(directorMoviesDatabase)
        .filter(([key, value]) => 
            key.includes(searchLower) || 
            value.name.toLowerCase().includes(searchLower) ||
            value.nameEn.toLowerCase().includes(searchLower)
        )
        .map(([key, value]) => ({
            key,
            name: value.name,
            nameEn: value.nameEn
        }));
}

module.exports = {
    directorMoviesDatabase,
    getAllDirectors,
    getDirectorMovies,
    searchDirector
};