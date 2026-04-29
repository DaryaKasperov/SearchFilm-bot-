const apiClient = require('../../apiClient');
const { transliterateToLatin, hasRussian } = require('../utils/transliterate');
const { searchCache, movieCache } = require('../utils/cache');
const { MAX_SEARCH_RESULTS, MAX_RETRIES, RETRY_DELAY } = require('../config/constants');
const { sleep } = require('../utils/helpers');

async function searchMovies(query, page = 1, retryCount = 0) {
    try {
        const cacheKey = `search_${query}_${page}`;
        const cachedResult = searchCache.get(cacheKey);
        if (cachedResult) {
            console.log(`✅ Использован кэш для "${query}"`);
            return cachedResult;
        }
        
        let searchQuery = query;
        if (hasRussian(query)) {
            searchQuery = transliterateToLatin(query);
            console.log(`🔄 Транслитерация: "${query}" -> "${searchQuery}"`);
        }
        
        const apiQuery = `&s=${encodeURIComponent(searchQuery)}&type=movie&page=${page}`;
        const data = await apiClient(`?${apiQuery}`);
        
        if (!data.Search || data.Search.length === 0) {
            return null;
        }
        
        const result = {
            movies: data.Search.slice(0, MAX_SEARCH_RESULTS),
            totalResults: parseInt(data.totalResults),
            totalPages: Math.ceil(parseInt(data.totalResults) / 10)
        };
        
        searchCache.set(cacheKey, result);
        return result;
        
    } catch (e) {
        console.error('Ошибка поиска:', e.message);
        
        if (retryCount < MAX_RETRIES) {
            console.log(`🔄 Повторная попытка ${retryCount + 1}/${MAX_RETRIES}`);
            await sleep(RETRY_DELAY);
            return searchMovies(query, page, retryCount + 1);
        }
        
        return null;
    }
}

async function getMovieBrief(imdbID) {
    try {
        const cached = movieCache.get(`movie_${imdbID}`);
        if (cached) {
            return cached;
        }
        
        const data = await apiClient(`?i=${imdbID}`);
        const movieData = {
            title: data.Title,
            year: data.Year,
            imdbID: imdbID,
            director: data.Director,
            genre: data.Genre,
            runtime: data.Runtime,
            rating: data.imdbRating,
            plot: data.Plot,
            poster: data.Poster
        };
        
        movieCache.set(`movie_${imdbID}`, movieData);
        return movieData;
        
    } catch (error) {
        console.error('Ошибка получения фильма:', error);
        return null;
    }
}

async function getFullMovieInfo(imdbID) {
    try {
        const cached = movieCache.get(`movie_full_${imdbID}`);
        if (cached) {
            return cached;
        }
        
        const data = await apiClient(`?i=${imdbID}&plot=full`);
        
        const movieData = {
            title: data.Title,
            year: data.Year,
            imdbID: imdbID,
            released: data.Released,
            runtime: data.Runtime,
            genre: data.Genre,
            director: data.Director,
            writer: data.Writer,
            actors: data.Actors,
            plot: data.Plot,
            country: data.Country,
            boxOffice: data.BoxOffice,
            ratings: data.Ratings,
            poster: data.Poster,
            imdbRating: data.imdbRating,
            imdbVotes: data.imdbVotes
        };
        
        movieCache.set(`movie_full_${imdbID}`, movieData);
        return movieData;
        
    } catch (error) {
        console.error('Ошибка получения полной информации:', error);
        return null;
    }
}

async function getDirectorMoviesList(directorKey, directorMoviesDatabase) {
    const director = directorMoviesDatabase[directorKey];
    if (!director) return null;
    
    const movies = [];
    
    for (const imdbID of director.movies) {
        const movieData = await getMovieBrief(imdbID);
        if (movieData) {
            movies.push({
                imdbID: imdbID,
                Title: movieData.title,
                Year: movieData.year,
                Director: movieData.director,
                Genre: movieData.genre,
                Runtime: movieData.runtime,
                imdbRating: movieData.rating,
                Poster: movieData.poster
            });
        }
    }
    
    return {
        directorName: `${director.name} (${director.nameEn})`,
        movies: movies
    };
}

module.exports = {
    searchMovies,
    getMovieBrief,
    getFullMovieInfo,
    getDirectorMoviesList
};