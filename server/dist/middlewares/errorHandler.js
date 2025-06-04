export function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    console.error(`[ERROR] ${err.message}`);
    if (err.stack) {
        console.error(err.stack);
    }
    res.status(statusCode).json({
        error: {
            message: err.message,
            details: err.details || undefined
        }
    });
}
export function notFoundHandler(req, res) {
    res.status(404).json({
        error: {
            message: `Not found: ${req.method} ${req.path}`
        }
    });
}
