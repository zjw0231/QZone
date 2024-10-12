import express from 'express';
import { createAlbum, getAlbums, getAlbum, updateAlbum, deleteAlbum, setCoverImage, sortPhotos } from '../controllers/albumController';

const router = express.Router();

// 移除 authenticateToken 中间件，因为我们不再使用用户认证
router.get('/', (req, res, next) => {
  getAlbums(req, res).catch(next);
});

router.post('/', (req, res, next) => {
  createAlbum(req, res).catch(next);
});

router.get('/:id', (req, res, next) => {
  getAlbum(req, res).catch(next);
});

router.put('/:id', (req, res, next) => {
  updateAlbum(req, res).catch(next);
});

router.delete('/:id', (req, res, next) => {
  deleteAlbum(req, res).catch(next);
});

router.put('/:albumId/cover/:photoId', (req, res, next) => {
  setCoverImage(req, res).catch(next);
});

router.put('/:albumId/sort', (req, res, next) => {
  sortPhotos(req, res).catch(next);
});

// 删除相册分享路由

export default router;