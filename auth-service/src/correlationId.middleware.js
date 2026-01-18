import { v4 as uuidv4 } from 'uuid';

export function correlationIdMiddleware(req, res, next) {
  let correlationId = req.headers['x-correlation-id'];
  if (!correlationId) {
    correlationId = uuidv4();
    req.headers['x-correlation-id'] = correlationId;
  }
  res.setHeader('x-correlation-id', correlationId);
  req.correlationId = correlationId;
  next();
}