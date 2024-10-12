import { Request, Response } from 'express';
import Album from '../models/Album';
import Photo from '../models/Photo';

export async function createAlbum(req: Request, res: Response): Promise<void> {
  try {
    console.log('Received create album request:', req.body);
    const { name, description } = req.body;
    const album = new Album({ name, description });
    await album.save();
    console.log('Album created:', album);
    res.status(201).json(album);
  } catch (error: any) {
    console.error('创建相册失败:', error);
    res.status(500).json({ message: '创建相册失败', error: error.message });
  }
}

export async function getAlbums(req: Request, res: Response): Promise<void> {
  try {
    console.log('开始获取相册列表...');
    const albums = await Album.find().sort({ createdAt: -1 });
    console.log('从数据库获取的相册:', albums);
    const albumsWithPhotoCount = await Promise.all(albums.map(async (album) => {
      const photoCount = await Photo.countDocuments({ album: album._id });
      return {
        ...album.toObject(),
        photoCount
      };
    }));
    console.log('带照片数量的相册列表:', albumsWithPhotoCount);
    res.json(albumsWithPhotoCount);
  } catch (error: any) {
    console.error('获取相册列表失败:', error);
    res.status(500).json({ message: '获取相册列表失败', error: error.message });
  }
}

export async function getAlbum(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const album = await Album.findById(id);
    if (!album) {
      res.status(404).json({ message: '相册不存在' });
      return;
    }

    // 如果没有封面，设置第一张照片为封面
    if (!album.coverImage) {
      const firstPhoto = await Photo.findOne({ album: id }).sort({ createdAt: 1 });
      if (firstPhoto) {
        album.coverImage = firstPhoto.path;
        await album.save();
      }
    }

    res.json(album);
  } catch (error: any) {
    console.error('获取相册失败:', error);
    res.status(500).json({ message: '获取相册失败', error: error.message });
  }
}

export async function updateAlbum(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const album = await Album.findByIdAndUpdate(id, { name, description }, { new: true });
    if (!album) {
      res.status(404).json({ message: '相册不存在' });
      return;
    }
    res.json(album);
  } catch (error: any) {
    console.error('更新相册失败:', error);
    res.status(500).json({ message: '更新相册失败', error: error.message });
  }
}

export async function deleteAlbum(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const album = await Album.findByIdAndDelete(id);
    if (!album) {
      res.status(404).json({ message: '相册不存在' });
      return;
    }
    res.json({ message: '相册删除成功' });
  } catch (error: any) {
    console.error('删除相册失败:', error);
    res.status(500).json({ message: '删除相册失败', error: error.message });
  }
}

// 实现其他相册管理功能...

export async function setCoverImage(req: Request, res: Response): Promise<void> {
  try {
    const { albumId, photoId } = req.params;
    const photo = await Photo.findById(photoId);
    if (!photo) {
      res.status(404).json({ message: '照片不存在' });
      return;
    }
    const album = await Album.findByIdAndUpdate(albumId, { coverImage: photo.path }, { new: true });
    if (!album) {
      res.status(404).json({ message: '相册不存在' });
      return;
    }
    res.json(album);
  } catch (error: any) {
    console.error('设置封面图片失败:', error);
    res.status(500).json({ message: '设置封面图片失败', error: error.message });
  }
}

// 添加排序功能
export async function sortPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { albumId } = req.params;
    const { photoIds } = req.body; // 期望接收一个照片ID的数组，表示新的排序顺序
    
    // 这里我们假设Photo模型有一个order字段来表示排序
    for (let i = 0; i < photoIds.length; i++) {
      await Photo.findByIdAndUpdate(photoIds[i], { order: i });
    }
    
    res.json({ message: '照片排序成功' });
  } catch (error: any) {
    console.error('照片排序失败:', error);
    res.status(500).json({ message: '照片排序失败', error: error.message });
  }
}