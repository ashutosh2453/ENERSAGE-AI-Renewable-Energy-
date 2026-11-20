// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
    if (statusCode >= 500) console.error(err.stack);
    res.status(statusCode).json({
        // Never expose internals unless explicitly running in development.
        message: statusCode >= 500 && process.env.NODE_ENV !== 'development' ? 'Internal server error' : err.message,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
};

module.exports = errorHandler;
