// Rate limiting для защиты от спама
const userRequests = new Map();

function checkRateLimit(userId, limit = 5, window = 60000) {
    const now = Date.now();
    const userData = userRequests.get(userId);
    
    if (!userData) {
        userRequests.set(userId, { count: 1, resetTime: now + window });
        return true;
    }
    
    if (now > userData.resetTime) {
        userData.count = 1;
        userData.resetTime = now + window;
        userRequests.set(userId, userData);
        return true;
    }
    
    if (userData.count >= limit) {
        return false;
    }
    
    userData.count++;
    userRequests.set(userId, userData);
    return true;
}

function getRemainingRequests(userId) {
    const userData = userRequests.get(userId);
    if (!userData) return 5;
    if (Date.now() > userData.resetTime) return 5;
    return Math.max(0, 5 - userData.count);
}

function getResetTime(userId) {
    const userData = userRequests.get(userId);
    if (!userData) return 0;
    return userData.resetTime;
}

function startRateLimitCleaner(interval = 60000) {
    setInterval(() => {
        const now = Date.now();
        for (const [userId, data] of userRequests.entries()) {
            if (now > data.resetTime) {
                userRequests.delete(userId);
            }
        }
    }, interval);
}

module.exports = { 
    checkRateLimit, 
    startRateLimitCleaner,
    getRemainingRequests,
    getResetTime
};