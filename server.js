import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todolist';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB 连接成功'))
  .catch(err => console.error('MongoDB 连接失败:', err));

// User Data Schema
const userDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  todos: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({ categories: [] }),
  },
  calendar: {
    events: { type: Array, default: [] },
    selectedDate: { type: String, default: null },
    view: { type: String, default: 'week' }
  },
  theme: {
    isDark: { type: Boolean, default: false }
  },
  share: {
    sharedEvents: { type: Array, default: [] },
    shareLinks: { type: Object, default: {} }
  },
  home: {
    type: Array,
    default: [],
  },
  updatedAt: { type: Date, default: Date.now }
});

const UserData = mongoose.model('UserData', userDataSchema);

// API Routes

// 获取用户数据
app.get('/api/user/:userId/data', async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await UserData.findOne({ userId });
    
    if (!userData) {
      return res.json({ todos: null, calendar: null, theme: null, share: null, home: null });
    }
    
    res.json({
      todos: userData.todos,
      calendar: userData.calendar,
      theme: userData.theme,
      share: userData.share,
      home: userData.home,
    });
  } catch (error) {
    console.error('获取用户数据错误:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 保存用户数据
app.post('/api/user/:userId/data', async (req, res) => {
  try {
    const { userId } = req.params;
    const { todos, calendar, theme, share, home } = req.body;
    
    const userData = await UserData.findOneAndUpdate(
      { userId },
      {
        userId,
        todos: todos || {},
        calendar: calendar || { events: [], selectedDate: null, view: 'week' },
        theme: theme || { isDark: false },
        share: share || { sharedEvents: [], shareLinks: {} },
        home: Array.isArray(home) ? home : (home?.icons ? home.icons : []),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log(`保存用户数据成功: ${userId}`);
    res.json({ success: true, message: '数据保存成功' });
  } catch (error) {
    console.error('保存用户数据错误:', error);
    res.status(500).json({ error: '保存数据失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
