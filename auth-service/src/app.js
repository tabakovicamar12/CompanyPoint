import express from 'express';
import cors from 'cors';
import router from './routes/auth.routes.js';
import swaggerRouter from './config/swagger.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/authService', router);
app.use('/api-docs', swaggerRouter);
app.get('/', (req, res) => {
  res.redirect('/api-docs');
});

export default app;
