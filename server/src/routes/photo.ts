import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import { uploadPhotos, getPhotos, getPhoto, deletePhoto, addTag, removeTag, updatePhoto, renamePhoto, movePhotos, updatePhotoDescription } from '../controllers/photoController';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 确保 movePhotos 路由在其他路由之前定义，并且不使用 multer 中间件
router.post('/move', (req: Request, res: Response, next: NextFunction) => {
  movePhotos(req, res).catch(next);
});

router.post('/:albumId', upload.array('photos', 100), (req: Request, res: Response, next: NextFunction) => {
  uploadPhotos(req, res).catch(next);
});

router.get('/:albumId', (req: Request, res: Response, next: NextFunction) => {
  getPhotos(req, res).catch(next);
});

router.get('/single/:id', (req: Request, res: Response, next: NextFunction) => {
  getPhoto(req, res).catch(next);
});

router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  deletePhoto(req, res).catch(next);
});

router.post('/:id/tags', (req: Request, res: Response, next: NextFunction) => {
  addTag(req, res).catch(next);
});

router.delete('/:id/tags/:tag', (req: Request, res: Response, next: NextFunction) => {
  removeTag(req, res).catch(next);
});

router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  updatePhoto(req, res).catch(next);
});

router.put('/:id/rename', (req: Request, res: Response, next: NextFunction) => {
  renamePhoto(req, res).catch(next);
});

router.put('/:id/description', (req: Request, res: Response, next: NextFunction) => {
  updatePhotoDescription(req, res).catch(next);
});

export default router;