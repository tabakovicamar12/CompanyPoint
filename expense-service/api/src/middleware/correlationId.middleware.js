const { v4: uuidv4 } = require('uuid');

module.exports = function correlationIdMiddleware(req, res, next) {
  const incoming = req.header('X-Correlation-Id');
  const correlationId = incoming && String(incoming).trim() ? incoming.trim() : uuidv4();

  req.correlationId = correlationId;

  // vrni nazaj v response
  res.setHeader('X-Correlation-Id', correlationId);

  next();
};
