import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Albums from '../views/Albums.vue';
import AlbumDetail from '../views/AlbumDetail.vue';
import EditAlbum from '../views/EditAlbum.vue';
import MovePhotos from '../views/MovePhotos.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/albums', component: Albums },
  { path: '/albums/:id', component: AlbumDetail, name: 'AlbumDetail' },
  { path: '/albums/:id/edit', component: EditAlbum, name: 'EditAlbum' },
  { path: '/albums/:id/move', component: MovePhotos, name: 'MovePhotos' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;