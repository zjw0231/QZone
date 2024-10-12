import express from 'express';
import { networkInterfaces } from 'os';

const router = express.Router();

router.get('/ip', (req, res) => {
  const nets = networkInterfaces();
  let ip = '';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // 跳过内部 IP、非 IPv4 地址和虚拟机地址
      if (!net.internal && net.family === 'IPv4' && !net.address.startsWith('192.168.56.')) {
        ip = net.address;
        break;
      }
    }
    if (ip) break;
  }

  res.json({ ip });
});

export default router;