import { Request, Response } from 'express';
import Photo from '../models/Photo';
import Album from '../models/Album';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { ExifImage } from 'exif';
import { promisify } from 'util';
import mime from 'mime-types'; // 请确保安装了这个包：npm install mime-types @types/mime-types
import { PHOTO_STORAGE_PATH, getPhotoPath, getPhotoUrl } from '../config';

const getExifData = promisify((filepath: string, cb: (error: Error | null, data?: any) => void) => {
  new ExifImage({ image: filepath }, cb);
});

export async function uploadPhotos(req: Request, res: Response) {
  try {
    console.log('Uploading photos...');
    const { albumId } = req.params;
    const files = req.files as Express.Multer.File[] | undefined;
    
    console.log('Album ID:', albumId);
    console.log('Files:', files);

    if (!files || files.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    const album = await Album.findById(albumId);
    if (!album) {
      console.log('Album not found:', albumId);
      return res.status(404).json({ message: '相册不存在' });
    }
    
    const uploadedPhotos = [];
    for (const file of files) {
      console.log('Processing file:', file.originalname);
      
      // 生成缩略图
      const thumbnailFilename = `thumbnail-${file.filename}`;
      const thumbnailPath = getPhotoPath(thumbnailFilename);
      await sharp(file.path)
        .resize(200, 200, { fit: 'cover' })
        .toFile(thumbnailPath);

      // 获取 EXIF 数据
      let takenAt: Date | undefined;
      let modifiedAt: Date | undefined;
      try {
        const exifData = await getExifData(file.path);
        if (exifData && exifData.exif) {
          if (exifData.exif.DateTimeOriginal) {
            takenAt = new Date(exifData.exif.DateTimeOriginal);
          }
          if (exifData.exif.ModifyDate) {
            modifiedAt = new Date(exifData.exif.ModifyDate);
          }
        }
      } catch (error) {
        console.error('Error reading EXIF data:', error);
      }

      // 如果无法从 EXIF 获取时间，则使用文件的修改时间
      if (!takenAt || !modifiedAt) {
        const stats = await fs.promises.stat(file.path);
        takenAt = takenAt || stats.mtime;
        modifiedAt = modifiedAt || stats.mtime;
      }

      // 确保 takenAt 和 modifiedAt 是有效的日期，如果不是，则使用当前时间
      takenAt = (takenAt && !isNaN(takenAt.getTime())) ? takenAt : new Date();
      modifiedAt = (modifiedAt && !isNaN(modifiedAt.getTime())) ? modifiedAt : new Date();

      const photo = new Photo({
        filename: file.originalname,
        path: getPhotoUrl(file.filename),
        thumbnailPath: getPhotoUrl(thumbnailFilename),
        album: albumId,
        takenAt,
        modifiedAt,
        uploadedAt: new Date()
      });
      await photo.save();
      uploadedPhotos.push(photo);
    }
    
    await Album.findByIdAndUpdate(albumId, { $inc: { photoCount: uploadedPhotos.length } });
    
    console.log('Photos uploaded successfully:', uploadedPhotos.length);
    res.status(201).json(uploadedPhotos);
  } catch (error) {
    console.error('上传照片失败:', error);
    res.status(500).json({ message: '上传照片失败', error: (error as Error).message });
  }
}

export async function getPhotos(req: Request, res: Response): Promise<void> {
  try {
    const { albumId } = req.params;
    const { width, height, quality } = req.query;
    console.log('Fetching photos for album:', albumId);
    const photos = await Photo.find({ album: albumId }).sort({ createdAt: -1 });
    console.log('Found photos:', photos.length);
    console.log('Sample photo:', photos[0]); // 打印第一张照片的详细信息
    
    const processedPhotos = await Promise.all(photos.map(async (photo) => {
      const originalPath = getPhotoPath(path.basename(photo.path));
      const imageBuffer = await fs.promises.readFile(originalPath);

      let processedImage = sharp(imageBuffer);

      // 生成缩略图
      processedImage = processedImage.resize({
        width: width ? parseInt(width as string) : 200,
        height: height ? parseInt(height as string) : 200,
        fit: 'cover'
      });

      // 转换为 WebP 格式
      processedImage = processedImage.webp({ quality: quality ? parseInt(quality as string) : 80 });

      const thumbnailBuffer = await processedImage.toBuffer();
      const thumbnailBase64 = thumbnailBuffer.toString('base64');

      return {
        ...photo.toObject(),
        thumbnailBase64: `data:image/webp;base64,${thumbnailBase64}`
      };
    }));

    console.log('Fetched photos:', processedPhotos.length);
    res.json(processedPhotos);
  } catch (error) {
    console.error('获取照片列表失败:', error);
    res.status(500).json({ message: '获取照片列表失败', error });
  }
}

export async function getPhoto(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { width, height, quality } = req.query;
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }

    const originalPath = getPhotoPath(path.basename(photo.path));
    const imageBuffer = await fs.promises.readFile(originalPath);

    let processedImage = sharp(imageBuffer);

    // 根据请求的尺寸调整图片大小
    if (width || height) {
      processedImage = processedImage.resize({
        width: width ? parseInt(width as string) : undefined,
        height: height ? parseInt(height as string) : undefined,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // 如果请求的是高质量图片，使用原始格式；否则转换为 WebP
    if (quality === 'high') {
      processedImage = processedImage.withMetadata();
    } else {
      processedImage = processedImage.webp({ quality: quality ? parseInt(quality as string) : 80 });
    }

    // 设置适当的响应头
    res.setHeader('Content-Type', quality === 'high' ? 'image/jpeg' : 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // 发送处理后的图片
    const processedBuffer = await processedImage.toBuffer();
    res.send(processedBuffer);
  } catch (error) {
    console.error('取照片失败:', error);
    res.status(500).json({ message: '获取照片失败', error });
  }
}

export async function deletePhoto(req: Request, res: Response) {
  try {
    const { id } = req.params;
    console.log('Attempting to delete photo with id:', id);

    const photo = await Photo.findById(id);
    if (!photo) {
      console.log('Photo not found:', id);
      return res.status(404).json({ message: '照片不存在' });
    }

    console.log('Photo found:', photo);

    // 删除数据库中的记录
    await Photo.findByIdAndDelete(id);
    console.log('Photo deleted from database');

    // 更新相册的照片数量
    await Album.findByIdAndUpdate(photo.album, { $inc: { photoCount: -1 } });

    // 删除文件系统中的照片
    const filePath = getPhotoPath(path.basename(photo.path));
    console.log('Attempting to delete file:', filePath);
    await fs.promises.unlink(filePath);
    console.log('File deleted successfully');

    res.json({ message: '照片删除成功' });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.status(500).json({ message: '删除照片失败', error: (error as Error).message });
  }
}

export async function addTag(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { tag } = req.body;
    const photo = await Photo.findByIdAndUpdate(
      id,
      { $addToSet: { tags: tag } },
      { new: true }
    );
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }
    res.json(photo);
  } catch (error) {
    console.error('添加标签失败:', error);
    res.status(500).json({ message: '添加标签失败', error });
  }
}

export async function removeTag(req: Request, res: Response) {
  try {
    const { id, tag } = req.params;
    const photo = await Photo.findByIdAndUpdate(
      id,
      { $pull: { tags: tag } },
      { new: true }
    );
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }
    res.json(photo);
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({ message: '删除标签失败', error });
  }
}

// 实现其他照片管理功能...

export async function updatePhoto(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { editedImageData } = req.body;

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }

    // 将 base64 图片数据转换为文件并保存
    const base64Data = editedImageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `edited-${Date.now()}-${path.basename(photo.path)}`;
    const filePath = getPhotoPath(filename);

    await fs.promises.writeFile(filePath, buffer);

    // 更新数据库中的照片信息
    photo.path = getPhotoUrl(filename);
    await photo.save();

    // 删除旧的照片文件
    await fs.promises.unlink(getPhotoPath(path.basename(photo.path)));

    res.json(photo);
  } catch (error) {
    console.error('更新照片失败:', error);
    res.status(500).json({ message: '更新照片失败', error });
  }
}

export async function renamePhoto(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { filename } = req.body;
    const photo = await Photo.findByIdAndUpdate(id, { filename }, { new: true });
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }
    res.json(photo);
  } catch (error) {
    console.error('重命名照片失败:', error);
    res.status(500).json({ message: '重命名照片失败', error });
  }
}

export async function movePhotos(req: Request, res: Response) {
  try {
    console.log('Received move photos request:', req.body);
    const { photoIds, targetAlbumId } = req.body;
    
    console.log('Moving photos:', { photoIds, targetAlbumId });

    // 验证请求数据
    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0 || !targetAlbumId) {
      console.log('Invalid request data:', { photoIds, targetAlbumId });
      return res.status(400).json({ message: '无效的请求数据' });
    }

    // 验证目标相册是否存在
    const targetAlbum = await Album.findById(targetAlbumId);
    if (!targetAlbum) {
      console.log('Target album not found:', targetAlbumId);
      return res.status(404).json({ message: '目标相册不存在' });
    }

    // 获取所有要移动的照片
    const photos = await Photo.find({ _id: { $in: photoIds } });
    console.log('Found photos:', photos);

    if (photos.length === 0) {
      console.log('No photos found to move');
      return res.status(404).json({ message: '未找到要移动的照片' });
    }

    console.log('Found photos to move:', photos.length);

    // 记原始相册ID
    const originalAlbumIds = new Set(photos.map(photo => photo.album.toString()));
    console.log('Original album IDs:', Array.from(originalAlbumIds));

    // 更新照片的 album 字段
    const updatePromises = photos.map(photo => 
      Photo.findByIdAndUpdate(photo._id, { album: targetAlbumId }, { new: true })
    );
    const updatedPhotos = await Promise.all(updatePromises);
    console.log('Updated photos:', updatedPhotos);

    // 更新相册和目标相册的 photoCount 和封面
    for (const albumId of originalAlbumIds) {
      const count = photos.filter(photo => photo.album.toString() === albumId).length;
      const updatedAlbum = await Album.findByIdAndUpdate(albumId, { $inc: { photoCount: -count } }, { new: true });
      
      if (updatedAlbum) {
        // 如果移动的照片包含封面照片，更新封面
        if (updatedAlbum.coverImage && photos.some(photo => photo.path === updatedAlbum.coverImage)) {
          const newCoverPhoto = await Photo.findOne({ album: albumId }).sort({ createdAt: -1 });
          if (newCoverPhoto) {
            updatedAlbum.coverImage = newCoverPhoto.path;
            await updatedAlbum.save();
          }
        }
        
        console.log(`Updated source album ${albumId} count: -${count}`, updatedAlbum);
      } else {
        console.log(`Failed to update source album ${albumId}`);
      }
    }

    // 更新目标相册的 photoCount
    const updatedTargetAlbum = await Album.findByIdAndUpdate(targetAlbumId, { $inc: { photoCount: photos.length } }, { new: true });
    console.log(`Updated target album ${targetAlbumId} count: +${photos.length}`, updatedTargetAlbum);

    console.log('Photos moved successfully');
    res.json({ message: '照片移动成功', movedCount: photos.length });
  } catch (error) {
    console.error('移动照片失败:', error);
    res.status(500).json({ message: '移动照片失败', error: (error as Error).message });
  }
}

// 删除 detectFaces 函数
// 其他函数保持不变

export async function updatePhotoDescription(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const photo = await Photo.findByIdAndUpdate(id, { description }, { new: true });
    if (!photo) {
      return res.status(404).json({ message: '照片不存在' });
    }
    res.json(photo);
  } catch (error) {
    console.error('更新照片描述失败:', error);
    res.status(500).json({ message: '更新照片描述失败', error });
  }
}

export const downloadOriginalPhoto = async (req: Request, res: Response) => {
  console.log('Entering downloadOriginalPhoto function');
  try {
    let id;
    if (req.method === 'POST') {
      id = req.body.photoId; // 假设 POST 请求中的 photoId 在请求体中
    } else {
      id = req.params.id; // GET 请求中的 id 在 URL 参数中
    }
    console.log('Downloading photo with id:', id);
    const photo = await Photo.findById(id);
    if (!photo) {
      console.log('Photo not found:', id);
      return res.status(404).json({ message: '照片不存在' });
    }

    const filePath = getPhotoPath(path.basename(photo.path));
    console.log('File path:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File does not exist:', filePath);
      return res.status(404).json({ message: '照片文件不存在' });
    }

    const stat = fs.statSync(filePath);
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(photo.filename)}`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('文件流错误:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: '文件读取失败', error: error.message });
      }
    });

    fileStream.on('end', () => {
      console.log('文件下载完成');
    });

  } catch (error) {
    console.error('下载原始照片失败:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: '下载原始照片失败', error: (error as Error).message });
    }
  }
};

export async function deletePhotos(req: Request, res: Response) {
  try {
    console.log('Deleting photos, request body:', req.body);
    const { photoIds } = req.body;

    console.log('Extracted photoIds:', photoIds);

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      console.log('Invalid request data:', req.body);
      return res.status(400).json({ message: '无效的请求数据' });
    }

    console.log('Attempting to delete photos with IDs:', photoIds);

    const deletedPhotos = await Photo.find({ _id: { $in: photoIds } });
    console.log('Found photos to delete:', deletedPhotos);
    
    // 删除数据库中的记录
    const deleteResult = await Photo.deleteMany({ _id: { $in: photoIds } });
    console.log('Delete result:', deleteResult);

    // 删除文件系统中的照片和缩略图
    for (const photo of deletedPhotos) {
      const filePath = getPhotoPath(path.basename(photo.path));
      const thumbnailPath = getPhotoPath(path.basename(photo.thumbnailPath));

      try {
        await fs.promises.unlink(filePath);
        console.log('Deleted file:', filePath);
        await fs.promises.unlink(thumbnailPath);
        console.log('Deleted thumbnail:', thumbnailPath);
      } catch (error) {
        console.error(`Error deleting file: ${filePath}`, error);
      }
    }

    // 更新相册的照片数量
    const albumIds = [...new Set(deletedPhotos.map(photo => photo.album))];
    for (const albumId of albumIds) {
      const count = deletedPhotos.filter(p => p.album.toString() === albumId.toString()).length;
      const updatedAlbum = await Album.findByIdAndUpdate(albumId, { $inc: { photoCount: -count } }, { new: true });
      console.log(`Updated album ${albumId} photo count: -${count}`, updatedAlbum);
    }

    console.log('Photos deleted successfully');
    res.json({ message: '照片删除成功', deletedCount: deletedPhotos.length });
  } catch (error) {
    console.error('删除照片失败:', error);
    res.status(500).json({ message: '删除照片失败', error: (error as Error).message });
  }
}
