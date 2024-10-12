import mongoose, { Document, Schema } from 'mongoose';

interface IAlbum extends Document {
  name: string;
  description: string;
  coverImage: string;
  photoCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const albumSchema = new Schema<IAlbum>({
  name: { type: String, required: true },
  description: { type: String },
  coverImage: { type: String, default: '/default-album-cover.jpg' }, // 添加默认封面
  photoCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IAlbum>('Album', albumSchema);