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

## 技术栈

### 服务器端 (Node.js + Express + MongoDB)

- TypeScript
- Express.js
- MongoDB 与 Mongoose
- Multer 用于文件上传
- Sharp 用于图像处理

### 客户端 (Vue 3 + TypeScript)

- Vue 3 with Composition API
- TypeScript
- Pinia 用于状态管理
- Vue Router
- Axios 用于 HTTP 请求
- Element Plus 用于 UI 组件
- Tailwind CSS 用于样式

## 项目结构

### 服务器端

- `src/app.ts`: 主应用文件，设置 Express 服务器
- `src/config.ts`: 配置文件，包含全局设置
- `src/controllers/`: 包含所有控制器文件
- `src/models/`: 包含所有数据模型
- `src/routes/`: 包含所有路由定义
- `src/middlewares/`: 包含中间件，如文件上传处理
- `src/utils/`: 包含工具函数

### 客户端

- `src/components/`: Vue 组件
- `src/views/`: 页面级 Vue 组件
- `src/store/`: Pinia store 定义
- `src/composables/`: 可复用的组合式函数
- `src/utils/`: 工具函数
- `src/styles/`: 全局样式文件

## 最近更新

- 修复了照片下载功能，现在使用 GET 请求正确下载原始照片
- 优化了批量下载照片的逻辑
- 改进了相册和照片的排序功能
- 增强了移动端的用户体验，包括触摸滑动和手势操作

## 如何运行

1. 克隆仓库
2. 在 `server` 目录下运行 `npm install` 安装服务器依赖
3. 在 `client` 目录下运行 `npm install` 安装客户端依赖
4. 在 `server` 目录下运行 `npm run dev` 启动服务器
5. 在 `client` 目录下运行 `npm run dev` 启动客户端
6. 在浏览器中访问 `http://localhost:5173` 即可使用应用

注意：确保已经正确配置了 MongoDB 连接和照片存储路径。

## 未来计划

- 实现用户认证和授权系统
- 添加照片编辑功能（如裁剪、滤镜等）
- 实现照片分享功能
- 添加照片位置信息和地图展示
- 优化大规模相册的性能
