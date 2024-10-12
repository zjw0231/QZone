import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  filename: string;
  path: string;
  thumbnailPath: string;
  album: mongoose.Types.ObjectId;
  tags: string[];
  description?: string;
  takenAt: Date; // 拍照时间
  modifiedAt: Date; // 修改时间
  uploadedAt: Date; // 上传时间
  createdAt: Date;
  updatedAt: Date;
}

const PhotoSchema: Schema = new Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  thumbnailPath: { type: String, required: true },
  album: { type: Schema.Types.ObjectId, ref: 'Album', required: true },
  tags: [{ type: String }],
  description: { type: String },
  takenAt: { type: Date }, // 新增字段
  modifiedAt: { type: Date }, // 新增字段
  uploadedAt: { type: Date, default: Date.now }, // 新增字段
}, { timestamps: true });

export default mongoose.model<IPhoto>('Photo', PhotoSchema);