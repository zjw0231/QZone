import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export async function register(req: Request, res: Response) {
  try {
    console.log('Received registration request:', req.body);
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({ message: '所有字段都是必填的' });
    }

    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log('User already exists:', existingUser);
      if (existingUser.username === username) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: '邮箱已存在' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    console.log('User registered successfully:', user);

    res.status(201).json({ message: '用户注册成功' });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '注册失败，请稍后重试', error: error instanceof Error ? error.message : String(error) });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    res.json({ token });
  } catch (error: unknown) {
    res.status(500).json({ message: '登录失败', error: error instanceof Error ? error.message : String(error) });
  }
}