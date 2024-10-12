import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import albumRoutes from './routes/album';
import photoRoutes from './routes/photoRoutes';
import { PHOTO_STORAGE_PATH, UPLOADS_BASE_URL } from './config';

config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// 中间件
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(UPLOADS_BASE_URL, express.static(PHOTO_STORAGE_PATH));

// 数据库连接
mongoose.connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// 添加这个中间件来记录所有请求
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 路由
app.use('/api/albums', albumRoutes);
app.use('/api/photos', photoRoutes);

// 添加这个全局错误处理中间件
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
