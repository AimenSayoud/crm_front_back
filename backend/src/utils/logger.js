/**
 * Simple logger utility for the application
 */

const logLevels = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL || 'INFO';

class Logger {
    constructor() {
        this.level = logLevels[currentLogLevel] || logLevels.INFO;
    }

    _log(level, message, ...args) {
        if (logLevels[level] <= this.level) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level}] ${message}`;

            if (level === 'ERROR') {
                console.error(logMessage, ...args);
            } else if (level === 'WARN') {
                console.warn(logMessage, ...args);
            } else if (level === 'INFO') {
                console.info(logMessage, ...args);
            } else {
                console.log(logMessage, ...args);
            }
        }
    }

    error(message, ...args) {
        this._log('ERROR', message, ...args);
    }

    warn(message, ...args) {
        this._log('WARN', message, ...args);
    }

    info(message, ...args) {
        this._log('INFO', message, ...args);
    }

    debug(message, ...args) {
        this._log('DEBUG', message, ...args);
    }
}

module.exports = new Logger();
