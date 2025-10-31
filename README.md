# TO DO
## 功能

- 周视图日历与事件管理
- 任务分类与拖拽排序
- 可自定义桌面图标（支持上传图片）
- 主题色与深浅色模式，主题色全局生效
- 工具页若干实用工具
- 本地存储持久化，可接入后台同步

## 技术栈

- React + Vite
- Tailwind CSS
- Redux Toolkit
- date-fns
- @react-oauth/google

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

3. 生产构建

```bash
npm run build
```

## 目录结构（简要）

```
src/
  components/        主要页面与组件
  store/             Redux store 与 slices
  utils/             工具与本地存储
  main.jsx           应用入口
```

