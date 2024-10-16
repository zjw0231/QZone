import express from 'express';
import * as photoController from '../controllers/photoController';
import upload from '../middlewares/upload';

const router = express.Router();

// 修改下载路由为 GET 方法
router.get('/:id/download', photoController.downloadOriginalPhoto);

// 其他路由保持不变
router.post('/delete', photoController.deletePhotos);
router.post('/:albumId', upload.array('photos'), photoController.uploadPhotos);
router.get('/:albumId', photoController.getPhotos);
router.get('/:id', photoController.getPhoto);
router.delete('/:id', photoController.deletePhoto);
router.post('/:id/tags', photoController.addTag);
router.delete('/:id/tags/:tag', photoController.removeTag);
router.put('/:id', photoController.updatePhoto);
router.put('/:id/rename', photoController.renamePhoto);
router.post('/move', photoController.movePhotos);
router.put('/:id/description', photoController.updatePhotoDescription);

export default router;
