import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import Photo from './models/Photo';
import { PHOTO_STORAGE_PATH, getPhotoPath, getPhotoUrl } from './config';

dotenv.config();

const OLD_STORAGE_PATH = path.join(__dirname, '../uploads');
const NEW_STORAGE_PATH = PHOTO_STORAGE_PATH;

async function migratePhotos() {
  try {
    // 连接到数据库
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // 确保新的存储目录存在
    await fs.mkdir(NEW_STORAGE_PATH, { recursive: true });

    // 获取所有照片记录
    const photos = await Photo.find();
    console.log(`Found ${photos.length} photos to migrate`);

    for (const photo of photos) {
      const oldPath = path.join(OLD_STORAGE_PATH, path.basename(photo.path));
      const newPath = getPhotoPath(photo.path);

      // 检查文件是否存在
      try {
        await fs.access(oldPath);
      } catch (error) {
        console.error(`File not found: ${oldPath}`);
        continue;
      }

      // 移动文件
      try {
        await fs.copyFile(oldPath, newPath);
        console.log(`Copied: ${oldPath} -> ${newPath}`);

        // 更新数据库中的路径
        photo.path = getPhotoUrl(photo.path);
        await photo.save();
        console.log(`Updated database record for: ${photo._id}`);

        // 处理缩略图
        if (photo.thumbnailPath) {
          const oldThumbPath = path.join(OLD_STORAGE_PATH, path.basename(photo.thumbnailPath));
          const newThumbPath = getPhotoPath(photo.thumbnailPath);

          try {
            await fs.copyFile(oldThumbPath, newThumbPath);
            console.log(`Copied thumbnail: ${oldThumbPath} -> ${newThumbPath}`);

            // 更新数据库中的缩略图路径
            photo.thumbnailPath = getPhotoUrl(photo.thumbnailPath);
            await photo.save();
            console.log(`Updated thumbnail path for: ${photo._id}`);
          } catch (error) {
            console.error(`Error copying thumbnail: ${oldThumbPath}`, error);
          }
        }
      } catch (error) {
        console.error(`Error copying file: ${oldPath}`, error);
      }
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migratePhotos();
