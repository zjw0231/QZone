# QZone 相册管理系统

QZone 是一个功能丰富的相册管理系统，允许用户上传、组织和分享他们的照片。

## 主要功能

1. 相册管理
   - 创建、编辑和删除相册
   - 设置相册封面
   - 相册排序

2. 照片管理
   - 上传照片（支持多张同时上传）
   - 查看照片（支持全屏查看和滑动切换）
   - 编辑照片信息（如描述、标签）
   - 移动照片到其他相册
   - 删除照片
   - 下载原始照片

3. 照片浏览
   - 缩略图预览
   - 全屏查看模式
   - 支持触摸滑动和手势操作
   - 照片缩放和旋转

4. 批量操作
   - 批量选择照片
   - 批量移动照片
   - 批量下载照片
   - 批量删除照片

5. 性能优化
   - 照片懒加载
   - 照片预加载
   - 响应式设计，适配不同设备

## 服务器端 (Node.js + Express + MongoDB)

- `app.ts`: 主应用文件，设置 Express 服务器
- `config.ts`: 配置文件，包含全局设置
- `controllers/`: 
  - `photoController.ts`: 处理照片相关的请求
  - `albumController.ts`: 处理相册相关的请求
- `models/`: 
  - `Photo.ts`: 照片数据模型
  - `Album.ts`: 相册数据模型
- `routes/`: 
  - `photoRoutes.ts`: 照片相关的路由
  - `albumRoutes.ts`: 相册相关的路由
- `middlewares/`:
  - `upload.ts`: 处理文件上传的中间件
- `migratePhotos.ts`: 照片迁移脚本

## 客户端 (Vue 3 + TypeScript)

- `src/`:
  - `components/`:
    - `PhotoViewer.vue`: 照片查看器组件
    - `AlbumList.vue`: 相册列表组件
    - `PhotoGrid.vue`: 照片网格组件
  - `views/`:
    - `AlbumDetail.vue`: 相册详情页面
    - `Albums.vue`: 相册列表页面
  - `store/`:
    - `photo.ts`: 照片状态管理
    - `album.ts`: 相册状态管理
  - `composables/`:
    - `usePhotoViewer.ts`: 照片查看器逻辑
    - `usePhotoSelection.ts`: 照片选择逻辑
    - `useBatchOperations.ts`: 批量操作逻辑
  - `utils/`:
    - `photoUtils.ts`: 照片相关的工具函数
  - `styles/`:
    - `albumDetail.scss`: 相册详情页面样式

## 如何运行

1. 克隆仓库
2. 在 `server` 目录下运行 `npm install` 安装服务器依赖
3. 在 `client` 目录下运行 `npm install` 安装客户端依赖
4. 在 `server` 目录下运行 `npm run dev` 启动服务器
5. 在 `client` 目录下运行 `npm run dev` 启动客户端
6. 在浏览器中访问 `http://localhost:5173` 即可使用应用

注意：确保已经正确配置了 MongoDB 连接和照片存储路径。
