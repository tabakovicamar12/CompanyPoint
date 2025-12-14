import dotenv from 'dotenv';
import connectDB from './src/config/mongoose.config.js';
import app from './src/app.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server teče na portu ${PORT}`);
  });
});
