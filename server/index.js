import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoute from './routes/AuthRoute.js';

dotenv.config();

export function createServer(){
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(cookieParser());
  app.use(cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));

  // MongoDB connection (connect once)
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(()=> console.log('MongoDB connected'))
    .catch(err=> console.error(err));
  }

  // Routes
  app.use('/api/auth', authRoute);

  return app;
}

// If this file is executed directly (production), start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createServer();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
}
