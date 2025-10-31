// API 工具函数

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 获取用户数据
export const fetchUserData = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}/data`);
    if (!response.ok) {
      throw new Error('获取数据失败');
    }
    const data = await response.json();
    console.log('从 MongoDB 获取数据:', data);
    return data;
  } catch (error) {
    console.error('获取用户数据错误:', error);
    return { todos: null, calendar: null, theme: null, share: null, home: null };
  }
};

// 保存用户数据
export const saveUserData = async (userId, userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${userId}/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('保存数据失败');
    }
    
    const result = await response.json();
    console.log('保存到 MongoDB 成功:', result);
    return result;
  } catch (error) {
    console.error('保存用户数据错误:', error);
    return { success: false, error: error.message };
  }
};

