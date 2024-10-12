import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PHOTO_STORAGE_PATH } from '../config';

console.log('Photo storage path:', PHOTO_STORAGE_PATH);

// 确保存储目录存在
if (!fs.existsSync(PHOTO_STORAGE_PATH)) {
  console.log('Creating photo storage directory');
  fs.mkdirSync(PHOTO_STORAGE_PATH, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Saving file to:', PHOTO_STORAGE_PATH);
    cb(null, PHOTO_STORAGE_PATH)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Generated filename:', filename);
    cb(null, filename)
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('Filtering file:', file.originalname, file.mimetype);
  // 接受图片和视频文件
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制文件大小为 50MB
  }
});

export default upload;
