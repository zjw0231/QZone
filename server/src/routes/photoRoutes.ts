import express from 'express';
import * as photoController from '../controllers/photoController';
import upload from '../middlewares/upload';

const router = express.Router();
// 确保这个路由在其他路由之前定义
router.post('/delete', photoController.deletePhotos);
// 现有的路由
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

// 添加下载路由
router.get('/:id/download', photoController.downloadOriginalPhoto);



export default router;
