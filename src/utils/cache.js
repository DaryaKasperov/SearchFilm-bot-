// Кэширование с истечением срока
class TimeoutCache {
    constructor(ttl = 86400000) {
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    set(key, value) {
        this.cache.set(key, {
            value: value,
            expires: Date.now() + this.ttl
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expires) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    delete(key) {
        this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
    
    // Очистка просроченных записей
    cleanExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expires) {
                this.cache.delete(key);
            }
        }
    }
}

// Создаём экземпляры кэшей
const movieCache = new TimeoutCache();
const searchCache = new TimeoutCache();

module.exports = { TimeoutCache, movieCache, searchCache };