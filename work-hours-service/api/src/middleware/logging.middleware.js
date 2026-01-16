const { publishLog } = require('../rabbitmq');

module.exports = function loggingMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;

    const level =
      res.statusCode >= 500 ? 'ERROR' :
      res.statusCode >= 400 ? 'WARN'  :
      'INFO';

    const log = {
      timestamp: new Date().toISOString(),
      logType: level,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      method: req.method,
      status: res.statusCode,
      correlationId: req.correlationId,
      app: process.env.SERVICE_NAME || 'workhours-service',
      message: `HTTP ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`,
      meta: {
        userId: req.user?.id || null,
        role: req.user?.role || null,
        durationMs: ms,
      },
    };

    publishLog(log);
  });

  next();
};
